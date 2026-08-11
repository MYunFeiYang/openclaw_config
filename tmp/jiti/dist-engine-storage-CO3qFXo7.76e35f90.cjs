"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = ensureMemoryIndexSchema;exports.i = loadSqliteVecExtension;exports.n = configureMemorySqliteWalMaintenance;exports.r = requireNodeSqlite;exports.t = closeMemorySqliteWalMaintenance;var _stringUtilsDoQjWCc = require("./string-utils-DoQjWCc3.js");
var _errorUtilsBO7VfQAm = require("./error-utils-BO7VfQAm.js");
require("./internal-BhQAXls3.js");
require("./backend-config-DGhc9Ni_.js");
var _nodeModule = require("node:module");function _interopRequireWildcard(e, t) {if ("function" == typeof WeakMap) var r = new WeakMap(),n = new WeakMap();return (_interopRequireWildcard = function (e, t) {if (!t && e && e.__esModule) return e;var o,i,f = { __proto__: null, default: e };if (null === e || "object" != typeof e && "function" != typeof e) return f;if (o = t ? n : r) {if (o.has(e)) return o.get(e);o.set(e, f);}for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]);return f;})(e, t);}
//#region packages/memory-host-sdk/src/host/memory-schema.ts
function ensureMemoryIndexSchema(params) {
  params.db.exec(`
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  params.db.exec(`
    CREATE TABLE IF NOT EXISTS files (
      path TEXT PRIMARY KEY,
      source TEXT NOT NULL DEFAULT 'memory',
      hash TEXT NOT NULL,
      mtime INTEGER NOT NULL,
      size INTEGER NOT NULL
    );
  `);
  params.db.exec(`
    CREATE TABLE IF NOT EXISTS chunks (
      id TEXT PRIMARY KEY,
      path TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'memory',
      start_line INTEGER NOT NULL,
      end_line INTEGER NOT NULL,
      hash TEXT NOT NULL,
      model TEXT NOT NULL,
      text TEXT NOT NULL,
      embedding TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
  if (params.cacheEnabled) {
    params.db.exec(`
      CREATE TABLE IF NOT EXISTS ${params.embeddingCacheTable} (
        provider TEXT NOT NULL,
        model TEXT NOT NULL,
        provider_key TEXT NOT NULL,
        hash TEXT NOT NULL,
        embedding TEXT NOT NULL,
        dims INTEGER,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY (provider, model, provider_key, hash)
      );
    `);
    params.db.exec(`CREATE INDEX IF NOT EXISTS idx_embedding_cache_updated_at ON ${params.embeddingCacheTable}(updated_at);`);
  }
  let ftsAvailable = false;
  let ftsError;
  if (params.ftsEnabled) try {
    const tokenizeClause = (params.ftsTokenizer ?? "unicode61") === "trigram" ? `, tokenize='trigram case_sensitive 0'` : "";
    params.db.exec(`CREATE VIRTUAL TABLE IF NOT EXISTS ${params.ftsTable} USING fts5(\n  text,\n  id UNINDEXED,\n  path UNINDEXED,\n  source UNINDEXED,\n  model UNINDEXED,\n  start_line UNINDEXED,\n  end_line UNINDEXED\n${tokenizeClause});`);
    ftsAvailable = true;
  } catch (err) {
    const message = (0, _errorUtilsBO7VfQAm.t)(err);
    ftsAvailable = false;
    ftsError = message;
  }
  ensureColumn(params.db, "files", "source", "TEXT NOT NULL DEFAULT 'memory'");
  ensureColumn(params.db, "chunks", "source", "TEXT NOT NULL DEFAULT 'memory'");
  params.db.exec(`CREATE INDEX IF NOT EXISTS idx_chunks_path ON chunks(path);`);
  params.db.exec(`CREATE INDEX IF NOT EXISTS idx_chunks_source ON chunks(source);`);
  return {
    ftsAvailable,
    ...(ftsError ? { ftsError } : {})
  };
}
function ensureColumn(db, table, column, definition) {
  if (db.prepare(`PRAGMA table_info(${table})`).all().some((row) => row.name === column)) return;
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}
//#endregion
//#region packages/memory-host-sdk/src/host/sqlite-vec.ts
const SQLITE_VEC_MODULE_ID = "sqlite-vec";
async function loadSqliteVecModule() {
  return ((specifier) => new Promise((r) => r(`${specifier}`)).then((s) => jitiImport(s).then((m) => _interopRequireWildcard(m))))(SQLITE_VEC_MODULE_ID);
}
async function loadSqliteVecExtension(params) {
  try {
    const sqliteVec = await loadSqliteVecModule();
    const resolvedPath = (0, _stringUtilsDoQjWCc.r)(params.extensionPath);
    const extensionPath = resolvedPath ?? sqliteVec.getLoadablePath();
    params.db.enableLoadExtension(true);
    if (resolvedPath) params.db.loadExtension(extensionPath);else
    sqliteVec.load(params.db);
    return {
      ok: true,
      extensionPath
    };
  } catch (err) {
    return {
      ok: false,
      error: (0, _errorUtilsBO7VfQAm.t)(err)
    };
  }
}
//#endregion
//#region packages/memory-host-sdk/src/host/sqlite-wal.ts
const DEFAULT_SQLITE_WAL_AUTOCHECKPOINT_PAGES = 1e3;
const DEFAULT_SQLITE_WAL_TRUNCATE_INTERVAL_MS = 1800 * 1e3;
function normalizeNonNegativeInteger(value, label) {
  if (!Number.isInteger(value) || value < 0) throw new Error(`${label} must be a non-negative integer`);
  return value;
}
function configureSqliteWalMaintenance(db, options = {}) {
  const autoCheckpointPages = normalizeNonNegativeInteger(options.autoCheckpointPages ?? DEFAULT_SQLITE_WAL_AUTOCHECKPOINT_PAGES, "autoCheckpointPages");
  const checkpointIntervalMs = normalizeNonNegativeInteger(options.checkpointIntervalMs ?? DEFAULT_SQLITE_WAL_TRUNCATE_INTERVAL_MS, "checkpointIntervalMs");
  const checkpointMode = options.checkpointMode ?? "TRUNCATE";
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec(`PRAGMA wal_autocheckpoint = ${autoCheckpointPages};`);
  const checkpoint = () => {
    try {
      db.exec(`PRAGMA wal_checkpoint(${checkpointMode});`);
      return true;
    } catch (error) {
      options.onCheckpointError?.(error);
      return false;
    }
  };
  let timer = null;
  if (checkpointIntervalMs > 0) {
    timer = setInterval(checkpoint, checkpointIntervalMs);
    timer.unref?.();
  }
  return {
    checkpoint,
    close: () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      return checkpoint();
    }
  };
}
//#endregion
//#region packages/memory-host-sdk/src/host/warning-filter.ts
const warningFilterKey = Symbol.for("openclaw.warning-filter");
function resolveWarningFilterState() {
  const globalStore = globalThis;
  if (Object.prototype.hasOwnProperty.call(globalStore, warningFilterKey)) return globalStore[warningFilterKey];
  const state = { installed: false };
  globalStore[warningFilterKey] = state;
  return state;
}
function shouldIgnoreWarning(warning) {
  if (warning.code === "DEP0040" && warning.message?.includes("punycode")) return true;
  if (warning.code === "DEP0060" && warning.message?.includes("util._extend")) return true;
  if (warning.name === "ExperimentalWarning" && warning.message?.includes("SQLite is an experimental feature")) return true;
  return false;
}
function normalizeWarningArgs(args) {
  const warningArg = args[0];
  const secondArg = args[1];
  const thirdArg = args[2];
  let name;
  let code;
  let message;
  if (warningArg instanceof Error) {
    name = warningArg.name;
    message = warningArg.message;
    code = warningArg.code;
  } else if (typeof warningArg === "string") message = warningArg;
  if (secondArg && typeof secondArg === "object" && !Array.isArray(secondArg)) {
    const options = secondArg;
    if (typeof options.type === "string") name = options.type;
    if (typeof options.code === "string") code = options.code;
  } else {
    if (typeof secondArg === "string") name = secondArg;
    if (typeof thirdArg === "string") code = thirdArg;
  }
  return {
    name,
    code,
    message
  };
}
function installProcessWarningFilter() {
  const state = resolveWarningFilterState();
  if (state.installed) return;
  const originalEmitWarning = process.emitWarning.bind(process);
  const wrappedEmitWarning = (...args) => {
    if (shouldIgnoreWarning(normalizeWarningArgs(args))) return;
    if (args[0] instanceof Error && args[1] && typeof args[1] === "object" && !Array.isArray(args[1])) {
      const warning = args[0];
      const emitted = Object.assign(new Error(warning.message), {
        name: warning.name,
        code: warning.code
      });
      process.emit("warning", emitted);
      return;
    }
    Reflect.apply(originalEmitWarning, process, args);
  };
  process.emitWarning = wrappedEmitWarning;
  state.installed = true;
}
//#endregion
//#region packages/memory-host-sdk/src/host/sqlite.ts
const _require = (0, _nodeModule.createRequire)("file:///Users/thinkway/.openclaw/plugin-runtime-deps/openclaw-2026.4.27-ee15c164b378/dist/engine-storage-CO3qFXo7.js");
const sqliteWalMaintenanceByDb = /* @__PURE__ */new WeakMap();
function requireNodeSqlite() {
  installProcessWarningFilter();
  try {
    return _require("node:sqlite");
  } catch (err) {
    const message = (0, _errorUtilsBO7VfQAm.t)(err);
    throw new Error(`SQLite support is unavailable in this Node runtime (missing node:sqlite). ${message}`, { cause: err });
  }
}
function configureMemorySqliteWalMaintenance(db, options) {
  const existing = sqliteWalMaintenanceByDb.get(db);
  if (existing) return existing;
  const maintenance = configureSqliteWalMaintenance(db, options);
  sqliteWalMaintenanceByDb.set(db, maintenance);
  return maintenance;
}
function closeMemorySqliteWalMaintenance(db) {
  const maintenance = sqliteWalMaintenanceByDb.get(db);
  if (!maintenance) return true;
  sqliteWalMaintenanceByDb.delete(db);
  return maintenance.close();
}
//#endregion /* v9-97b24ff61e1acb3d */
