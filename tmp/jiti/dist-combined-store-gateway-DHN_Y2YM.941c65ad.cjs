"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = resolveSessionStoreKey;exports.i = resolveSessionStoreAgentId;exports.n = canonicalizeSessionKeyForAgent;exports.o = resolveStoredSessionKeyForAgentStore;exports.r = canonicalizeSpawnedByForAgent;exports.s = resolveStoredSessionOwnerAgentId;exports.t = loadCombinedSessionStoreForGateway;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
require("./agent-scope-DMMelGwC.js");
var _sessionKeyUtilsCJRKuBJA = require("./session-key-utils-CJRKuBJA.js");
var _sessionKeyCQewiu8n = require("./session-key-CQewiu8n.js");
var _agentScopeConfigDCRwWQZy = require("./agent-scope-config-DCRwWQZy.js");
var _mainSessionBIlePcj = require("./main-session-BIlePcj4.js");
var _pathsRbVDOqFp = require("./paths-RbVDOqFp.js");
var _storeLoadBzczsLeI = require("./store-load-BzczsLeI.js");
var _targetsB3qI57M = require("./targets-b-3qI57M.js");
//#region src/gateway/session-store-key.ts
function canonicalizeSessionKeyForAgent(agentId, key) {
  const lowered = (0, _stringCoerceLndEvhRk.a)(key);
  if (lowered === "global" || lowered === "unknown") return lowered;
  const normalized = (0, _sessionKeyUtilsCJRKuBJA.o)(key);
  if (normalized.startsWith("agent:")) return normalized;
  return `agent:${(0, _sessionKeyCQewiu8n.c)(agentId)}:${normalized}`;
}
function resolveDefaultStoreAgentId(cfg) {
  return (0, _sessionKeyCQewiu8n.c)((0, _agentScopeConfigDCRwWQZy.c)(cfg));
}
function shouldRemapLegacyDefaultMainAlias(cfg, parsed, options) {
  if ((0, _sessionKeyCQewiu8n.c)(parsed.agentId) !== "main" || (0, _agentScopeConfigDCRwWQZy.n)(cfg).includes("main")) return false;
  const defaultAgentId = resolveDefaultStoreAgentId(cfg);
  if (options?.storeAgentId && (0, _sessionKeyCQewiu8n.c)(options.storeAgentId) !== defaultAgentId) return false;
  const rest = (0, _stringCoerceLndEvhRk.a)(parsed.rest);
  const mainKey = (0, _sessionKeyCQewiu8n.l)(cfg.session?.mainKey);
  return rest === "main" || rest === mainKey;
}
function resolveParsedSessionStoreKey(cfg, raw, parsed, options) {
  if (!shouldRemapLegacyDefaultMainAlias(cfg, parsed, options)) return {
    agentId: (0, _sessionKeyCQewiu8n.c)(parsed.agentId),
    sessionKey: (0, _sessionKeyUtilsCJRKuBJA.o)(raw)
  };
  const agentId = resolveDefaultStoreAgentId(cfg);
  return {
    agentId,
    sessionKey: `agent:${agentId}:${(0, _stringCoerceLndEvhRk.a)(parsed.rest)}`
  };
}
function resolveSessionStoreKey(params) {
  const raw = (0, _stringCoerceLndEvhRk.c)(params.sessionKey) ?? "";
  if (!raw) return raw;
  const rawLower = (0, _stringCoerceLndEvhRk.a)(raw);
  if (rawLower === "global" || rawLower === "unknown") return rawLower;
  const parsed = (0, _sessionKeyUtilsCJRKuBJA.c)(raw);
  if (parsed) {
    const resolved = resolveParsedSessionStoreKey(params.cfg, raw, parsed, { storeAgentId: params.storeAgentId });
    const canonical = (0, _mainSessionBIlePcj.t)({
      cfg: params.cfg,
      agentId: resolved.agentId,
      sessionKey: resolved.sessionKey
    });
    if (canonical !== resolved.sessionKey) return canonical;
    return resolved.sessionKey;
  }
  const lowered = (0, _stringCoerceLndEvhRk.a)(raw);
  const rawMainKey = (0, _sessionKeyCQewiu8n.l)(params.cfg.session?.mainKey);
  if (lowered === "main" || lowered === rawMainKey) return (0, _mainSessionBIlePcj.i)(params.cfg);
  return canonicalizeSessionKeyForAgent(resolveDefaultStoreAgentId(params.cfg), raw);
}
function resolveSessionStoreAgentId(cfg, canonicalKey) {
  if (canonicalKey === "global" || canonicalKey === "unknown") return resolveDefaultStoreAgentId(cfg);
  const parsed = (0, _sessionKeyUtilsCJRKuBJA.c)(canonicalKey);
  if (parsed?.agentId) return (0, _sessionKeyCQewiu8n.c)(parsed.agentId);
  return resolveDefaultStoreAgentId(cfg);
}
function resolveStoredSessionKeyForAgentStore(params) {
  const raw = (0, _stringCoerceLndEvhRk.c)(params.sessionKey) ?? "";
  if (!raw) return raw;
  const lowered = (0, _stringCoerceLndEvhRk.a)(raw);
  if (lowered === "global" || lowered === "unknown") return lowered;
  const key = (0, _sessionKeyUtilsCJRKuBJA.c)(raw) ? raw : canonicalizeSessionKeyForAgent(params.agentId, raw);
  return resolveSessionStoreKey({
    cfg: params.cfg,
    sessionKey: key,
    storeAgentId: params.agentId
  });
}
function resolveStoredSessionOwnerAgentId(params) {
  const canonicalKey = resolveStoredSessionKeyForAgentStore(params);
  if (canonicalKey === "global" || canonicalKey === "unknown") return null;
  return resolveSessionStoreAgentId(params.cfg, canonicalKey);
}
function canonicalizeSpawnedByForAgent(cfg, agentId, spawnedBy) {
  const raw = (0, _stringCoerceLndEvhRk.c)(spawnedBy) ?? "";
  if (!raw) return;
  const lower = (0, _stringCoerceLndEvhRk.a)(raw);
  if (lower === "global" || lower === "unknown") return lower;
  let result;
  const normalized = (0, _sessionKeyUtilsCJRKuBJA.o)(raw);
  if (normalized.startsWith("agent:")) result = normalized;else
  result = `agent:${(0, _sessionKeyCQewiu8n.c)(agentId)}:${normalized}`;
  const parsed = (0, _sessionKeyUtilsCJRKuBJA.c)(result);
  return (0, _mainSessionBIlePcj.t)({
    cfg,
    agentId: parsed?.agentId ? (0, _sessionKeyCQewiu8n.c)(parsed.agentId) : agentId,
    sessionKey: result
  });
}
//#endregion
//#region src/config/sessions/combined-store-gateway.ts
function isStorePathTemplate(store) {
  return typeof store === "string" && store.includes("{agentId}");
}
function mergeSessionEntryIntoCombined(params) {
  const { cfg, combined, entry, agentId, canonicalKey } = params;
  const existing = combined[canonicalKey];
  if (existing && (existing.updatedAt ?? 0) > (entry.updatedAt ?? 0)) {
    const spawnedBy = canonicalizeSpawnedByForAgent(cfg, agentId, existing.spawnedBy ?? entry.spawnedBy);
    combined[canonicalKey] = {
      ...entry,
      ...existing,
      spawnedBy
    };
    return;
  }
  const spawnedBy = canonicalizeSpawnedByForAgent(cfg, agentId, entry.spawnedBy ?? existing?.spawnedBy);
  if (!existing && entry.spawnedBy === spawnedBy) combined[canonicalKey] = entry;else
  combined[canonicalKey] = {
    ...existing,
    ...entry,
    spawnedBy
  };
}
function loadCombinedSessionStoreForGateway(cfg, opts = {}) {
  const storeConfig = cfg.session?.store;
  if (storeConfig && !isStorePathTemplate(storeConfig)) {
    const storePath = (0, _pathsRbVDOqFp.u)(storeConfig);
    const defaultAgentId = (0, _sessionKeyCQewiu8n.c)((0, _agentScopeConfigDCRwWQZy.c)(cfg));
    const store = (0, _storeLoadBzczsLeI.t)(storePath, { clone: false });
    const combined = {};
    for (const [key, entry] of Object.entries(store)) mergeSessionEntryIntoCombined({
      cfg,
      combined,
      entry,
      agentId: defaultAgentId,
      canonicalKey: resolveStoredSessionKeyForAgentStore({
        cfg,
        agentId: defaultAgentId,
        sessionKey: key
      })
    });
    return {
      storePath,
      store: combined
    };
  }
  const requestedAgentId = typeof opts.agentId === "string" && opts.agentId.trim() ? (0, _sessionKeyCQewiu8n.c)(opts.agentId) : void 0;
  const targets = requestedAgentId ? (0, _targetsB3qI57M.n)(cfg, requestedAgentId) : opts.configuredAgentsOnly === true ? (0, _targetsB3qI57M.a)(cfg, { allAgents: true }) : (0, _targetsB3qI57M.i)(cfg);
  const combined = {};
  for (const target of targets) {
    const agentId = target.agentId;
    const storePath = target.storePath;
    const store = (0, _storeLoadBzczsLeI.t)(storePath, { clone: false });
    for (const [key, entry] of Object.entries(store)) mergeSessionEntryIntoCombined({
      cfg,
      combined,
      entry,
      agentId,
      canonicalKey: resolveStoredSessionKeyForAgentStore({
        cfg,
        agentId,
        sessionKey: key
      })
    });
  }
  return {
    storePath: targets.length === 1 ? targets[0].storePath : typeof storeConfig === "string" && storeConfig.trim() ? storeConfig.trim() : "(multiple)",
    store: combined
  };
}
//#endregion /* v9-ee495cc0063060cf */
