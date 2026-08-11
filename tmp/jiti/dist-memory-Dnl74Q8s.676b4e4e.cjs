"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = getMemorySearchManager;exports.t = closeAllMemorySearchManagers;var _errorsG8SYDTCe = require("./errors-g8SYDTCe.js");
var _globalSingletonCOlWgaGc = require("./global-singleton-COlWgaGc.js");
var _subsystemIzrDYZz = require("./subsystem-Izr-DYZz.js");
var _sessionKeyC6FNnIG = require("./session-key-C6F-NnIG.js");
var _agentScopeRNt6KatQ = require("./agent-scope-RNt6KatQ.js");
var _memorySearchCwVTNndi = require("./memory-search-CwVTNndi.js");
require("./routing-TLYJLD5I.js");
require("./error-runtime-BSkJRsKu.js");
require("./memory-core-host-engine-foundation-4lY2oygE.js");
var _engineQmdBLLUNP_T = require("./engine-qmd-BLLUNP_T.js");
require("./memory-core-host-engine-qmd-pqGSGtPW.js");
var _backendConfigDGhc9Ni_ = require("./backend-config-DGhc9Ni_.js");
require("./memory-core-host-engine-storage-CvdPsuqZ.js");
require("./manager-jzSMQjEt.js");
var _promises = _interopRequireDefault(require("node:fs/promises"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}function _interopRequireWildcard(e, t) {if ("function" == typeof WeakMap) var r = new WeakMap(),n = new WeakMap();return (_interopRequireWildcard = function (e, t) {if (!t && e && e.__esModule) return e;var o,i,f = { __proto__: null, default: e };if (null === e || "object" != typeof e && "function" != typeof e) return f;if (o = t ? n : r) {if (o.has(e)) return o.get(e);o.set(e, f);}for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]);return f;})(e, t);}
//#region extensions/memory-core/src/memory/search-manager.ts
const MEMORY_SEARCH_MANAGER_CACHE_KEY = Symbol.for("openclaw.memorySearchManagerCache");
const QMD_MANAGER_OPEN_FAILURE_COOLDOWN_MS = 6e4;
function createMemorySearchManagerCacheStore() {
  return {
    qmdManagerCache: /* @__PURE__ */new Map(),
    pendingQmdManagerCreates: /* @__PURE__ */new Map(),
    qmdManagerOpenFailures: /* @__PURE__ */new Map()
  };
}
function getMemorySearchManagerCacheStore() {
  const resolved = (0, _globalSingletonCOlWgaGc.n)(MEMORY_SEARCH_MANAGER_CACHE_KEY, createMemorySearchManagerCacheStore);
  if (typeof resolved === "object" && resolved !== null && resolved.qmdManagerCache instanceof Map && resolved.pendingQmdManagerCreates instanceof Map) {
    const cacheStore = resolved;
    if (!(cacheStore.qmdManagerOpenFailures instanceof Map)) cacheStore.qmdManagerOpenFailures = /* @__PURE__ */new Map();
    return cacheStore;
  }
  const repaired = createMemorySearchManagerCacheStore();
  globalThis[MEMORY_SEARCH_MANAGER_CACHE_KEY] = repaired;
  return repaired;
}
const log = (0, _subsystemIzrDYZz.t)("memory");
const { qmdManagerCache: QMD_MANAGER_CACHE, pendingQmdManagerCreates: PENDING_QMD_MANAGER_CREATES, qmdManagerOpenFailures: QMD_MANAGER_OPEN_FAILURES } = getMemorySearchManagerCacheStore();
let managerRuntimePromise = null;
let qmdManagerModulePromise = null;
function loadManagerRuntime() {
  managerRuntimePromise ??= Promise.resolve().then(() => jitiImport("./extensions/memory-core/manager-runtime.js").then((m) => _interopRequireWildcard(m)));
  return managerRuntimePromise;
}
function loadQmdManagerModule() {
  qmdManagerModulePromise ??= Promise.resolve().then(() => jitiImport("./qmd-manager-BCC9vRXM.js").then((m) => _interopRequireWildcard(m)));
  return qmdManagerModulePromise;
}
function getActiveQmdManagerOpenFailure(scopeKey, identityKey, nowMs = Date.now()) {
  const failure = QMD_MANAGER_OPEN_FAILURES.get(scopeKey);
  if (!failure) return null;
  if (failure.identityKey !== identityKey || failure.retryAfterMs <= nowMs) {
    QMD_MANAGER_OPEN_FAILURES.delete(scopeKey);
    return null;
  }
  return failure;
}
function recordQmdManagerOpenFailure(scopeKey, identityKey, reason, nowMs = Date.now()) {
  QMD_MANAGER_OPEN_FAILURES.set(scopeKey, {
    identityKey,
    reason,
    retryAfterMs: nowMs + QMD_MANAGER_OPEN_FAILURE_COOLDOWN_MS
  });
}
function clearQmdManagerOpenFailure(scopeKey, identityKey) {
  if (QMD_MANAGER_OPEN_FAILURES.get(scopeKey)?.identityKey === identityKey) QMD_MANAGER_OPEN_FAILURES.delete(scopeKey);
}
async function getMemorySearchManager(params) {
  const resolved = (0, _backendConfigDGhc9Ni_.t)(params);
  if (resolved.backend === "qmd" && resolved.qmd) {
    const qmdResolved = resolved.qmd;
    const normalizedAgentId = (0, _sessionKeyC6FNnIG.c)(params.agentId);
    const runtimeConfig = resolveQmdManagerRuntimeConfig(params.cfg, normalizedAgentId);
    const { workspaceDir } = runtimeConfig;
    const transient = params.purpose === "status" || params.purpose === "cli";
    const scopeKey = buildQmdManagerScopeKey(normalizedAgentId);
    const identityKey = buildQmdManagerIdentityKey(normalizedAgentId, qmdResolved, runtimeConfig);
    const createPrimaryQmdManager = async (mode) => {
      try {
        await _promises.default.mkdir(workspaceDir, { recursive: true });
      } catch (err) {
        const message = (0, _errorsG8SYDTCe.i)(err);
        log.warn(`qmd workspace unavailable (${workspaceDir}); falling back to builtin: ${message}`);
        return {
          manager: null,
          failureReason: `qmd workspace unavailable (${workspaceDir}): ${message}`
        };
      }
      const qmdBinary = await (0, _engineQmdBLLUNP_T.t)({
        command: qmdResolved.command,
        env: process.env,
        cwd: workspaceDir
      });
      if (!qmdBinary.available) {
        const message = qmdBinary.error ?? "unknown error";
        log.warn(`qmd binary unavailable (${qmdResolved.command}); falling back to builtin: ${message}`);
        return {
          manager: null,
          failureReason: `qmd binary unavailable (${qmdResolved.command}): ${message}`
        };
      }
      try {
        const { QmdMemoryManager } = await loadQmdManagerModule();
        const primary = await QmdMemoryManager.create({
          cfg: params.cfg,
          agentId: normalizedAgentId,
          resolved: {
            ...resolved,
            qmd: qmdResolved
          },
          mode,
          runtimeConfig
        });
        if (primary) {
          clearQmdManagerOpenFailure(scopeKey, identityKey);
          return { manager: primary };
        }
      } catch (err) {
        const message = (0, _errorsG8SYDTCe.i)(err);
        log.warn(`qmd memory unavailable; falling back to builtin: ${message}`);
        return {
          manager: null,
          failureReason: `qmd memory unavailable: ${message}`
        };
      }
      return {
        manager: null,
        failureReason: "qmd memory unavailable: no manager returned"
      };
    };
    const createFullQmdManager = async (expectedIdentityKey) => {
      const { manager: primary, failureReason } = await createPrimaryQmdManager("full");
      if (!primary) return {
        entry: null,
        failureReason
      };
      let cacheEntry;
      cacheEntry = {
        identityKey: expectedIdentityKey,
        manager: new FallbackMemoryManager({
          primary,
          fallbackFactory: async () => {
            const { MemoryIndexManager } = await loadManagerRuntime();
            return await MemoryIndexManager.get(params);
          }
        }, () => {
          if (QMD_MANAGER_CACHE.get(scopeKey) === cacheEntry) QMD_MANAGER_CACHE.delete(scopeKey);
        })
      };
      return { entry: cacheEntry };
    };
    while (true) {
      const cached = QMD_MANAGER_CACHE.get(scopeKey);
      if (cached?.identityKey === identityKey) {
        if (params.purpose === "status") return { manager: new BorrowedMemoryManager(cached.manager) };
        if (params.purpose !== "cli") return { manager: cached.manager };
      }
      if (transient) {
        const { manager } = await createPrimaryQmdManager(params.purpose === "cli" ? "cli" : "status");
        return manager ? { manager } : await getBuiltinMemorySearchManager(params);
      }
      const recentFailure = getActiveQmdManagerOpenFailure(scopeKey, identityKey);
      if (recentFailure) {
        log.debug?.(`qmd memory unavailable; using builtin during cooldown: ${recentFailure.reason}`);
        return await getBuiltinMemorySearchManager(params);
      }
      const pending = PENDING_QMD_MANAGER_CREATES.get(scopeKey);
      if (pending) {
        await pending.promise;
        continue;
      }
      const pendingCreate = {
        identityKey,
        promise: (async () => {
          const created = await createFullQmdManager(identityKey);
          if (!created.entry) {
            recordQmdManagerOpenFailure(scopeKey, identityKey, created.failureReason ?? "qmd memory unavailable");
            return null;
          }
          QMD_MANAGER_CACHE.set(scopeKey, created.entry);
          if (cached) await closeQmdManagerForReplacement(cached.manager).catch((err) => {
            log.warn(`failed to retire replaced qmd memory manager: ${(0, _errorsG8SYDTCe.i)(err)}`);
          });
          return created.entry.manager;
        })().finally(() => {
          if (PENDING_QMD_MANAGER_CREATES.get(scopeKey) === pendingCreate) PENDING_QMD_MANAGER_CREATES.delete(scopeKey);
        })
      };
      PENDING_QMD_MANAGER_CREATES.set(scopeKey, pendingCreate);
      const manager = await pendingCreate.promise;
      return manager ? { manager } : await getBuiltinMemorySearchManager(params);
    }
  }
  return await getBuiltinMemorySearchManager(params);
}
async function getBuiltinMemorySearchManager(params) {
  try {
    const { MemoryIndexManager } = await loadManagerRuntime();
    return { manager: await MemoryIndexManager.get(params) };
  } catch (err) {
    return {
      manager: null,
      error: (0, _errorsG8SYDTCe.i)(err)
    };
  }
}
var BorrowedMemoryManager = class {
  constructor(inner) {
    this.inner = inner;
  }
  async search(query, opts) {
    return await this.inner.search(query, opts);
  }
  async readFile(params) {
    return await this.inner.readFile(params);
  }
  status() {
    return this.inner.status();
  }
  async sync(params) {
    await this.inner.sync?.(params);
  }
  async probeEmbeddingAvailability() {
    return await this.inner.probeEmbeddingAvailability();
  }
  getCachedEmbeddingAvailability() {
    return this.inner.getCachedEmbeddingAvailability?.() ?? null;
  }
  async probeVectorAvailability() {
    return await this.inner.probeVectorAvailability();
  }
  async close() {}
};
async function closeAllMemorySearchManagers() {
  const pendingCreates = Array.from(PENDING_QMD_MANAGER_CREATES.values(), (entry) => entry.promise);
  await Promise.allSettled(pendingCreates);
  const managers = Array.from(QMD_MANAGER_CACHE.values(), (entry) => entry.manager);
  PENDING_QMD_MANAGER_CREATES.clear();
  QMD_MANAGER_CACHE.clear();
  QMD_MANAGER_OPEN_FAILURES.clear();
  for (const manager of managers) try {
    await manager.close?.();
  } catch (err) {
    log.warn(`failed to close qmd memory manager: ${String(err)}`);
  }
  if (managerRuntimePromise !== null) {
    const { closeAllMemoryIndexManagers } = await loadManagerRuntime();
    await closeAllMemoryIndexManagers();
  }
}
var FallbackMemoryManager = class {
  constructor(deps, onClose) {
    this.deps = deps;
    this.onClose = onClose;
    this.fallback = null;
    this.primaryFailed = false;
    this.cacheEvicted = false;
    this.closed = false;
    this.closeReason = "memory search manager is closed";
  }
  async search(query, opts) {
    this.ensureOpen();
    if (!this.primaryFailed) try {
      return await this.deps.primary.search(query, opts);
    } catch (err) {
      this.primaryFailed = true;
      this.lastError = (0, _errorsG8SYDTCe.i)(err);
      log.warn(`qmd memory failed; switching to builtin index: ${this.lastError}`);
      await this.deps.primary.close?.().catch(() => {});
      this.evictCacheEntry();
    }
    const fallback = await this.ensureFallback();
    if (fallback) return await fallback.search(query, opts);
    throw new Error(this.lastError ?? "memory search unavailable");
  }
  async readFile(params) {
    this.ensureOpen();
    if (!this.primaryFailed) return await this.deps.primary.readFile(params);
    const fallback = await this.ensureFallback();
    if (fallback) return await fallback.readFile(params);
    throw new Error(this.lastError ?? "memory read unavailable");
  }
  status() {
    this.ensureOpen();
    if (!this.primaryFailed) return this.deps.primary.status();
    const fallbackStatus = this.fallback?.status();
    const fallbackInfo = {
      from: "qmd",
      reason: this.lastError ?? "unknown"
    };
    if (fallbackStatus) {
      const custom = fallbackStatus.custom ?? {};
      return {
        ...fallbackStatus,
        fallback: fallbackInfo,
        custom: {
          ...custom,
          fallback: {
            disabled: true,
            reason: this.lastError ?? "unknown"
          }
        }
      };
    }
    const primaryStatus = this.deps.primary.status();
    const custom = primaryStatus.custom ?? {};
    return {
      ...primaryStatus,
      fallback: fallbackInfo,
      custom: {
        ...custom,
        fallback: {
          disabled: true,
          reason: this.lastError ?? "unknown"
        }
      }
    };
  }
  async sync(params) {
    this.ensureOpen();
    if (!this.primaryFailed) {
      await this.deps.primary.sync?.(params);
      return;
    }
    await (await this.ensureFallback())?.sync?.(params);
  }
  async probeEmbeddingAvailability() {
    this.ensureOpen();
    if (!this.primaryFailed) return await this.deps.primary.probeEmbeddingAvailability();
    const fallback = await this.ensureFallback();
    if (fallback) return await fallback.probeEmbeddingAvailability();
    return {
      ok: false,
      error: this.lastError ?? "memory embeddings unavailable"
    };
  }
  getCachedEmbeddingAvailability() {
    this.ensureOpen();
    if (!this.primaryFailed) return this.deps.primary.getCachedEmbeddingAvailability?.() ?? null;
    return this.fallback?.getCachedEmbeddingAvailability?.() ?? null;
  }
  async probeVectorAvailability() {
    this.ensureOpen();
    if (!this.primaryFailed) return await this.deps.primary.probeVectorAvailability();
    return (await (await this.ensureFallback())?.probeVectorAvailability()) ?? false;
  }
  async close() {
    if (this.closed) return;
    this.closed = true;
    await this.deps.primary.close?.();
    await this.fallback?.close?.();
    this.evictCacheEntry();
  }
  async invalidate(reason) {
    this.closeReason = reason;
    await this.close();
  }
  async ensureFallback() {
    if (this.fallback) return this.fallback;
    let fallback;
    try {
      fallback = await this.deps.fallbackFactory();
      if (!fallback) {
        log.warn("memory fallback requested but builtin index is unavailable");
        return null;
      }
    } catch (err) {
      const message = (0, _errorsG8SYDTCe.i)(err);
      log.warn(`memory fallback unavailable: ${message}`);
      return null;
    }
    this.fallback = fallback;
    return this.fallback;
  }
  ensureOpen() {
    if (this.closed) throw new Error(this.closeReason);
  }
  evictCacheEntry() {
    if (this.cacheEvicted) return;
    this.cacheEvicted = true;
    this.onClose?.();
  }
};
async function closeQmdManagerForReplacement(manager) {
  if (manager instanceof FallbackMemoryManager) {
    await manager.invalidate("memory search manager was replaced by a newer qmd manager");
    return;
  }
  await manager.close?.();
}
function buildQmdManagerScopeKey(agentId) {
  return agentId;
}
function buildQmdManagerIdentityKey(agentId, config, runtimeConfig) {
  return `${agentId}:${JSON.stringify(config)}:${JSON.stringify(runtimeConfig.syncSettings ?? null)}:${JSON.stringify(runtimeConfig.contextLimits ?? null)}:${runtimeConfig.workspaceDir}`;
}
function resolveQmdManagerRuntimeConfig(cfg, agentId) {
  return {
    workspaceDir: (0, _agentScopeRNt6KatQ.x)(cfg, agentId),
    syncSettings: (0, _memorySearchCwVTNndi.n)(cfg, agentId),
    contextLimits: (0, _agentScopeRNt6KatQ.y)(cfg, agentId)
  };
}
//#endregion /* v9-c3d2958b75d2db14 */
