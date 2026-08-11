"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = readJsonSync;exports.c = readRootStructuredFileSync;exports.d = writeJson;exports.f = writeJsonSync;exports.i = readJsonIfExists;exports.l = tryReadJson;exports.n = void 0;exports.o = readRootJsonObjectSync;exports.r = readJson;exports.s = readRootJsonSync;exports.t = writeTextAtomic;exports.u = tryReadJsonSync;require("./fs-safe-defaults-azXCfv92.js");
var _rootFileCqMcFM3J = require("./root-file-CqMcFM3J.js");
var _regularFile6GdZVPgG = require("./regular-file-6GdZVPgG.js");
var _replaceFileDfT5iHv = require("./replace-file-DfT5iHv1.js");
var _nodeFs = _interopRequireDefault(require("node:fs"));
var _nodePath = _interopRequireDefault(require("node:path"));
var _nodeCrypto = require("node:crypto");function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}
//#region node_modules/@openclaw/fs-safe/dist/text-atomic.js
async function writeTextAtomic$1(filePath, content, options) {
  const payload = options?.trailingNewline && !content.endsWith("\n") ? `${content}\n` : content;
  const durable = options?.durable ?? true;
  await (0, _replaceFileDfT5iHv.r)({
    filePath,
    content: payload,
    mode: options?.mode ?? 384,
    dirMode: options?.dirMode ?? 511 & ~process.umask(),
    copyFallbackOnPermissionError: true,
    syncTempFile: durable,
    syncParentDir: durable
  });
}
//#endregion
//#region node_modules/@openclaw/fs-safe/dist/json.js
const JSON_FILE_MODE = 384;
const JSON_DIR_MODE = 448;
const SUPPORTS_SYNC_NOFOLLOW = process.platform !== "win32" && "O_NOFOLLOW" in _nodeFs.default.constants;
function getErrorCode(err) {
  return err instanceof Error ? err.code : void 0;
}
function trySetSecureMode(pathname) {
  let fd;
  try {
    fd = _nodeFs.default.openSync(pathname, _nodeFs.default.constants.O_RDONLY | (SUPPORTS_SYNC_NOFOLLOW ? _nodeFs.default.constants.O_NOFOLLOW : 0));
    _nodeFs.default.fchmodSync(fd, JSON_FILE_MODE);
  } catch {} finally {
    if (fd !== void 0) try {
      _nodeFs.default.closeSync(fd);
    } catch {}
  }
}
function trySyncDirectory(pathname) {
  let fd;
  try {
    fd = _nodeFs.default.openSync(_nodePath.default.dirname(pathname), "r");
    _nodeFs.default.fsyncSync(fd);
  } catch {} finally {
    if (fd !== void 0) try {
      _nodeFs.default.closeSync(fd);
    } catch {}
  }
}
function renameJsonFileWithFallback(tmpPath, pathname) {
  try {
    _nodeFs.default.renameSync(tmpPath, pathname);
    return;
  } catch (error) {
    const code = error.code;
    if (code === "EPERM" || code === "EEXIST") {
      if ((() => {
        try {
          return _nodeFs.default.lstatSync(pathname);
        } catch (lstatError) {
          if (lstatError.code === "ENOENT") return null;
          throw lstatError;
        }
      })()?.isSymbolicLink()) {
        _nodeFs.default.rmSync(pathname, { force: true });
        _nodeFs.default.renameSync(tmpPath, pathname);
        return;
      }
      _nodeFs.default.rmSync(pathname, { force: true });
      _nodeFs.default.renameSync(tmpPath, pathname);
      return;
    }
    throw error;
  }
}
function writeTempJsonFile(pathname, payload) {
  const fd = _nodeFs.default.openSync(pathname, "wx", JSON_FILE_MODE);
  try {
    _nodeFs.default.writeFileSync(fd, payload, "utf8");
    _nodeFs.default.fsyncSync(fd);
  } finally {
    _nodeFs.default.closeSync(fd);
  }
}
function tryReadJsonSync(pathname) {
  try {
    const raw = (0, _regularFile6GdZVPgG.i)({ filePath: pathname }).buffer.toString("utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
function writeJsonSync(pathname, data) {
  const targetPath = pathname;
  const tmpPath = `${targetPath}.${(0, _nodeCrypto.randomUUID)()}.tmp`;
  const payload = `${JSON.stringify(data, null, 2)}\n`;
  _nodeFs.default.mkdirSync(_nodePath.default.dirname(targetPath), {
    recursive: true,
    mode: JSON_DIR_MODE
  });
  try {
    writeTempJsonFile(tmpPath, payload);
    trySetSecureMode(tmpPath);
    renameJsonFileWithFallback(tmpPath, targetPath);
    trySetSecureMode(targetPath);
    trySyncDirectory(targetPath);
  } finally {
    try {
      _nodeFs.default.rmSync(tmpPath, { force: true });
    } catch {}
  }
}
var JsonFileReadError = class extends Error {
  filePath;
  reason;
  constructor(filePath, reason, cause) {
    super(`Failed to ${reason} JSON file: ${filePath}`, { cause });
    this.name = "JsonFileReadError";
    this.filePath = filePath;
    this.reason = reason;
  }
};exports.n = JsonFileReadError;
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function resolveInvalidMessage(invalidMessage, relativePath) {
  if (typeof invalidMessage === "function") return invalidMessage(relativePath);
  return invalidMessage ?? `${relativePath} has an unexpected shape`;
}
function readRootStructuredFileSync(options) {
  const opened = (0, _rootFileCqMcFM3J.i)({
    absolutePath: _nodePath.default.resolve(options.rootDir, options.relativePath),
    rootPath: options.rootDir,
    ...(options.rootRealPath !== void 0 ? { rootRealPath: options.rootRealPath } : {}),
    boundaryLabel: options.boundaryLabel,
    rejectHardlinks: options.rejectHardlinks,
    maxBytes: options.maxBytes,
    allowedType: "file"
  });
  if (!opened.ok) return {
    ok: false,
    reason: "open",
    failure: opened
  };
  try {
    const parsed = options.parse(_nodeFs.default.readFileSync(opened.fd, "utf8"));
    if (options.validate && !options.validate(parsed)) return {
      ok: false,
      reason: "invalid",
      error: resolveInvalidMessage(options.invalidMessage, options.relativePath)
    };
    return {
      ok: true,
      value: parsed,
      stat: opened.stat,
      path: opened.path,
      rootRealPath: opened.rootRealPath
    };
  } catch (error) {
    return {
      ok: false,
      reason: "parse",
      error: `failed to parse ${options.relativePath}: ${String(error)}`
    };
  } finally {
    _nodeFs.default.closeSync(opened.fd);
  }
}
function readRootJsonSync(options) {
  return readRootStructuredFileSync({
    ...options,
    parse: (raw) => JSON.parse(raw)
  });
}
function readRootJsonObjectSync(options) {
  return readRootStructuredFileSync({
    ...options,
    parse: (raw) => JSON.parse(raw),
    validate: isRecord,
    invalidMessage: (relativePath) => `${relativePath} must contain a JSON object`
  });
}
async function tryReadJson(filePath) {
  try {
    const raw = (await (0, _regularFile6GdZVPgG.r)({ filePath })).buffer.toString("utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
async function readJson(filePath) {
  let raw;
  try {
    raw = (await (0, _regularFile6GdZVPgG.r)({ filePath })).buffer.toString("utf8");
  } catch (err) {
    throw new JsonFileReadError(filePath, "read", err);
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new JsonFileReadError(filePath, "parse", err);
  }
}
async function readJsonIfExists(filePath) {
  let raw;
  try {
    raw = (await (0, _regularFile6GdZVPgG.r)({ filePath })).buffer.toString("utf8");
  } catch (err) {
    if (getErrorCode(err) === "ENOENT") return null;
    throw new JsonFileReadError(filePath, "read", err);
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new JsonFileReadError(filePath, "parse", err);
  }
}
function readJsonSync(filePath) {
  let raw;
  try {
    raw = (0, _regularFile6GdZVPgG.i)({ filePath }).buffer.toString("utf8");
  } catch (err) {
    throw new JsonFileReadError(filePath, "read", err);
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new JsonFileReadError(filePath, "parse", err);
  }
}
async function writeJson(filePath, value, options) {
  await writeTextAtomic$1(filePath, JSON.stringify(value, null, 2), {
    mode: options?.mode,
    dirMode: options?.dirMode,
    trailingNewline: options?.trailingNewline,
    durable: options?.durable
  });
}
//#endregion
//#region src/infra/json-files.ts
async function writeTextAtomic(filePath, content, options) {
  await (0, _replaceFileDfT5iHv.n)({
    filePath,
    content: options?.trailingNewline && !content.endsWith("\n") ? `${content}\n` : content,
    mode: options?.mode ?? 384,
    dirMode: options?.dirMode ?? 511 & ~process.umask(),
    copyFallbackOnPermissionError: true,
    syncTempFile: options?.durable !== false,
    syncParentDir: options?.durable !== false
  });
}
//#endregion /* v9-138609a57dbc6358 */
