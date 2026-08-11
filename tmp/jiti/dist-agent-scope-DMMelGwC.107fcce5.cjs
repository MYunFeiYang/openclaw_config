"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.C = hasSessionAutoModelFallbackProvenance;exports.S = setAgentEffectiveModelPrimary;exports._ = resolveSessionAgentId;exports.a = resolveAgentEffectiveModelPrimary;exports.b = resolveSubagentModelConfigSelectionResult;exports.c = resolveAgentIdByWorkspacePath;exports.d = resolveAgentModelPrimary;exports.f = resolveAgentSkillsFilter;exports.g = resolveRunModelFallbacksOverride;exports.h = resolveFallbackAgentId;exports.i = markAutoFallbackPrimaryProbe;exports.l = resolveAgentIdsByWorkspacePath;exports.m = resolveEffectiveModelFallbacks;exports.n = entryMatchesAutoFallbackPrimaryProbe;exports.o = resolveAgentExecutionContract;exports.p = resolveAutoFallbackPrimaryProbe;exports.r = hasConfiguredModelFallbacks;exports.s = resolveAgentExplicitModelPrimary;exports.t = clearAutoFallbackPrimaryProbeSelection;exports.u = resolveAgentModelFallbacksOverride;exports.v = resolveSessionAgentIds;exports.x = resolveSubagentModelFallbacksOverride;exports.y = resolveSubagentModelConfigSelection;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
var _pathB5B_oAT = require("./path-B5B-_oAT.js");
var _utilsCKsuXgDI = require("./utils-CKsuXgDI.js");
var _modelInputB9pBobB = require("./model-input-B9p-bobB.js");
require("./path-guards-BptIujoz.js");
var _sessionKeyUtilsCJRKuBJA = require("./session-key-utils-CJRKuBJA.js");
var _sessionKeyCQewiu8n = require("./session-key-CQewiu8n.js");
var _agentScopeConfigDCRwWQZy = require("./agent-scope-config-DCRwWQZy.js");
var _agentFilter3newIxFX = require("./agent-filter-3newIxFX.js");
var _nodeFs = _interopRequireDefault(require("node:fs"));
var _nodePath = _interopRequireDefault(require("node:path"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}
//#region src/config/sessions/model-override-provenance.ts
function hasSessionAutoModelFallbackProvenance(entry) {
  const hasActiveOverride = Boolean((0, _stringCoerceLndEvhRk.c)(entry?.providerOverride) || (0, _stringCoerceLndEvhRk.c)(entry?.modelOverride));
  return Boolean(hasActiveOverride && (0, _stringCoerceLndEvhRk.c)(entry?.modelOverrideFallbackOriginProvider) && (0, _stringCoerceLndEvhRk.c)(entry?.modelOverrideFallbackOriginModel));
}
//#endregion
//#region src/agents/agent-scope.ts
/** Strip null bytes from paths to prevent ENOTDIR errors. */
function stripNullBytes(s) {
  return s.replace(/\0/g, "");
}
const AUTO_FALLBACK_PRIMARY_PROBE_INTERVAL_MS = 300 * 1e3;
const AUTO_FALLBACK_PRIMARY_PROBE_MAX_KEYS = 4096;
const autoFallbackPrimaryProbeState = /* @__PURE__ */new Map();
function autoFallbackPrimaryProbeStateKey(params) {
  return [(0, _stringCoerceLndEvhRk.c)(params.sessionKey) ?? "", `${params.primaryProvider}/${params.primaryModel}`].join("\0");
}
function pruneAutoFallbackPrimaryProbeState(params) {
  const maxKeys = Math.max(1, Math.trunc(params.maxKeys ?? AUTO_FALLBACK_PRIMARY_PROBE_MAX_KEYS));
  const staleBefore = params.now - params.minIntervalMs;
  for (const [key, lastProbeAt] of params.state) if (!Number.isFinite(lastProbeAt) || lastProbeAt < staleBefore) params.state.delete(key);
  if (params.state.size <= maxKeys) return;
  const removeCount = params.state.size - maxKeys;
  let removed = 0;
  for (const key of params.state.keys()) {
    params.state.delete(key);
    removed += 1;
    if (removed >= removeCount) break;
  }
}
function resolveAutoFallbackPrimaryProbe(params) {
  const entry = params.entry;
  if (!entry) return;
  const recoveredAutoFallbackOverride = entry.modelOverrideSource === void 0 && hasSessionAutoModelFallbackProvenance(entry);
  if (entry.modelOverrideSource !== "auto" && !recoveredAutoFallbackOverride) return;
  const originProvider = (0, _stringCoerceLndEvhRk.c)(entry.modelOverrideFallbackOriginProvider);
  const originModel = (0, _stringCoerceLndEvhRk.c)(entry.modelOverrideFallbackOriginModel);
  const overrideProvider = (0, _stringCoerceLndEvhRk.c)(entry.providerOverride);
  const overrideModel = (0, _stringCoerceLndEvhRk.c)(entry.modelOverride);
  const primaryProvider = (0, _stringCoerceLndEvhRk.c)(params.primaryProvider);
  const primaryModel = (0, _stringCoerceLndEvhRk.c)(params.primaryModel);
  if (!originProvider || !originModel || !overrideProvider || !overrideModel) return;
  if (!primaryProvider || !primaryModel) return;
  if (originProvider !== primaryProvider || originModel !== primaryModel) return;
  if (overrideProvider === originProvider && overrideModel === originModel) return;
  const now = params.now ?? Date.now();
  const minIntervalMs = params.minIntervalMs ?? AUTO_FALLBACK_PRIMARY_PROBE_INTERVAL_MS;
  const state = params.probeState ?? autoFallbackPrimaryProbeState;
  pruneAutoFallbackPrimaryProbeState({
    state,
    now,
    minIntervalMs,
    maxKeys: params.maxTrackedProbeKeys
  });
  const key = autoFallbackPrimaryProbeStateKey({
    sessionKey: params.sessionKey,
    primaryProvider: originProvider,
    primaryModel: originModel
  });
  const lastProbeAt = state.get(key);
  if (typeof lastProbeAt === "number" && Number.isFinite(lastProbeAt) && now - lastProbeAt < minIntervalMs) return;
  const fallbackAuthProfileId = (0, _stringCoerceLndEvhRk.c)(entry.authProfileOverride);
  const fallbackAuthProfileIdSource = entry.authProfileOverrideSource ?? (entry.authProfileOverrideCompactionCount !== void 0 ? "auto" : void 0);
  return {
    provider: originProvider,
    model: originModel,
    fallbackProvider: overrideProvider,
    fallbackModel: overrideModel,
    ...(fallbackAuthProfileId ? {
      fallbackAuthProfileId,
      ...(fallbackAuthProfileIdSource ? { fallbackAuthProfileIdSource } : {})
    } : {})
  };
}
function markAutoFallbackPrimaryProbe(params) {
  const now = params.now ?? Date.now();
  const minIntervalMs = params.minIntervalMs ?? AUTO_FALLBACK_PRIMARY_PROBE_INTERVAL_MS;
  const state = params.probeState ?? autoFallbackPrimaryProbeState;
  pruneAutoFallbackPrimaryProbeState({
    state,
    now,
    minIntervalMs,
    maxKeys: params.maxTrackedProbeKeys
  });
  const key = autoFallbackPrimaryProbeStateKey({
    sessionKey: params.sessionKey,
    primaryProvider: params.probe.provider,
    primaryModel: params.probe.model
  });
  state.set(key, now);
  pruneAutoFallbackPrimaryProbeState({
    state,
    now,
    minIntervalMs,
    maxKeys: params.maxTrackedProbeKeys
  });
}
function entryMatchesAutoFallbackPrimaryProbe(entry, probe) {
  if (!entry) return false;
  const recoveredAutoFallbackOverride = entry.modelOverrideSource === void 0 && hasSessionAutoModelFallbackProvenance(entry);
  if (entry.modelOverrideSource !== "auto" && !recoveredAutoFallbackOverride) return false;
  return (0, _stringCoerceLndEvhRk.c)(entry.providerOverride) === probe.fallbackProvider && (0, _stringCoerceLndEvhRk.c)(entry.modelOverride) === probe.fallbackModel && (0, _stringCoerceLndEvhRk.c)(entry.modelOverrideFallbackOriginProvider) === probe.provider && (0, _stringCoerceLndEvhRk.c)(entry.modelOverrideFallbackOriginModel) === probe.model;
}
function clearAutoFallbackPrimaryProbeSelection(entry, now = Date.now()) {
  delete entry.providerOverride;
  delete entry.modelOverride;
  delete entry.modelOverrideSource;
  delete entry.modelOverrideFallbackOriginProvider;
  delete entry.modelOverrideFallbackOriginModel;
  if (entry.authProfileOverrideSource === "auto" || entry.authProfileOverrideSource === void 0 && entry.authProfileOverrideCompactionCount !== void 0) {
    delete entry.authProfileOverride;
    delete entry.authProfileOverrideSource;
    delete entry.authProfileOverrideCompactionCount;
  }
  delete entry.fallbackNoticeSelectedModel;
  delete entry.fallbackNoticeActiveModel;
  delete entry.fallbackNoticeReason;
  entry.updatedAt = now;
}
function resolveSessionAgentIds(params) {
  const defaultAgentId = (0, _agentScopeConfigDCRwWQZy.c)(params.config ?? {});
  const explicitAgentIdRaw = (0, _stringCoerceLndEvhRk.a)(params.agentId);
  const explicitAgentId = explicitAgentIdRaw ? (0, _sessionKeyCQewiu8n.c)(explicitAgentIdRaw) : null;
  const sessionKey = params.sessionKey?.trim();
  const normalizedSessionKey = sessionKey ? (0, _stringCoerceLndEvhRk.a)(sessionKey) : void 0;
  const parsed = normalizedSessionKey ? (0, _sessionKeyUtilsCJRKuBJA.c)(normalizedSessionKey) : null;
  return {
    defaultAgentId,
    sessionAgentId: explicitAgentId ?? (parsed?.agentId ? (0, _sessionKeyCQewiu8n.c)(parsed.agentId) : defaultAgentId)
  };
}
function resolveSessionAgentId(params) {
  return resolveSessionAgentIds(params).sessionAgentId;
}
function resolveAgentExecutionContract(cfg, agentId) {
  const defaultContract = cfg?.agents?.defaults?.embeddedPi?.executionContract;
  if (!cfg || !agentId) return defaultContract;
  return (0, _agentScopeConfigDCRwWQZy.r)(cfg, agentId)?.embeddedPi?.executionContract ?? defaultContract;
}
function resolveAgentSkillsFilter(cfg, agentId) {
  return (0, _agentFilter3newIxFX.t)(cfg, agentId);
}
function resolveAgentExplicitModelPrimary(cfg, agentId) {
  const raw = (0, _agentScopeConfigDCRwWQZy.r)(cfg, agentId)?.model;
  return (0, _stringCoerceLndEvhRk.p)(raw);
}
function resolveAgentEffectiveModelPrimary(cfg, agentId) {
  return resolveAgentExplicitModelPrimary(cfg, agentId) ?? (0, _stringCoerceLndEvhRk.p)(cfg.agents?.defaults?.model);
}
function findMutableAgentEntry(cfg, agentId) {
  const id = (0, _sessionKeyCQewiu8n.c)(agentId);
  return cfg.agents?.list?.find((entry) => (0, _sessionKeyCQewiu8n.c)(entry?.id) === id);
}
function updateAgentModelPrimary(existing, primary) {
  if (existing && typeof existing === "object" && !Array.isArray(existing)) return {
    ...existing,
    primary
  };
  return primary;
}
function setAgentEffectiveModelPrimary(cfg, agentId, primary) {
  const id = (0, _sessionKeyCQewiu8n.c)(agentId);
  if (resolveAgentExplicitModelPrimary(cfg, id)) {
    const entry = findMutableAgentEntry(cfg, id);
    if (entry) {
      entry.model = updateAgentModelPrimary(entry.model, primary);
      return "agent";
    }
  }
  cfg.agents ??= {};
  cfg.agents.defaults ??= {};
  cfg.agents.defaults.model = updateAgentModelPrimary(cfg.agents.defaults.model, primary);
  return "defaults";
}
/** @deprecated Prefer explicit/effective helpers at new call sites. */
function resolveAgentModelPrimary(cfg, agentId) {
  return resolveAgentExplicitModelPrimary(cfg, agentId);
}
function resolveAgentModelFallbacksOverride(cfg, agentId) {
  return resolveSelectedModelFallbacksOverride((0, _agentScopeConfigDCRwWQZy.r)(cfg, agentId)?.model);
}
function resolveSelectedModelFallbacksOverride(raw) {
  if (!raw) return;
  if (typeof raw === "string") return (0, _stringCoerceLndEvhRk.p)(raw) ? [] : void 0;
  if (!Object.hasOwn(raw, "fallbacks")) return Object.hasOwn(raw, "primary") && (0, _stringCoerceLndEvhRk.p)(raw) ? [] : void 0;
  return Array.isArray(raw.fallbacks) ? raw.fallbacks : void 0;
}
function resolveFirstModelFallbacksOverride(candidates) {
  for (const candidate of candidates) {
    const fallbackOverride = resolveSelectedModelFallbacksOverride(candidate);
    if (fallbackOverride !== void 0) return fallbackOverride;
  }
}
function resolveSubagentModelConfigSelectionResult(params) {
  const agentConfig = params.agentConfigOverride ?? (params.agentId ? (0, _agentScopeConfigDCRwWQZy.r)(params.cfg, params.agentId) : void 0);
  return [
  ...(agentConfig?.subagents?.model ? [{
    raw: agentConfig.subagents.model,
    source: "subagent"
  }] : []),
  ...(agentConfig?.model ? [{
    raw: agentConfig.model,
    source: "agent"
  }] : []),
  ...(params.cfg.agents?.defaults?.subagents?.model ? [{
    raw: params.cfg.agents.defaults.subagents.model,
    source: "default-subagent"
  }] : [])].
  find((candidate) => (0, _stringCoerceLndEvhRk.p)(candidate.raw));
}
function resolveSubagentModelConfigSelection(params) {
  return resolveSubagentModelConfigSelectionResult(params)?.raw;
}
function resolveSubagentModelFallbacksOverride(cfg, agentId) {
  const agentConfig = (0, _agentScopeConfigDCRwWQZy.r)(cfg, agentId);
  const subagentFallbacks = resolveSelectedModelFallbacksOverride(agentConfig?.subagents?.model);
  if (subagentFallbacks !== void 0) return subagentFallbacks;
  const selection = resolveSubagentModelConfigSelectionResult({
    cfg,
    agentId
  });
  if (selection?.source === "agent") return resolveSelectedModelFallbacksOverride(agentConfig?.model);
  if (selection?.source === "default-subagent") return resolveSelectedModelFallbacksOverride(cfg.agents?.defaults?.subagents?.model);
}
function resolveSubagentSpawnModelFallbacksOverride(cfg, agentId) {
  const agentConfig = (0, _agentScopeConfigDCRwWQZy.r)(cfg, agentId);
  return resolveFirstModelFallbacksOverride([
  agentConfig?.subagents?.model,
  cfg.agents?.defaults?.subagents?.model,
  agentConfig?.model]
  );
}
function resolveFallbackAgentId(params) {
  const explicitAgentId = (0, _stringCoerceLndEvhRk.c)(params.agentId) ?? "";
  if (explicitAgentId) return (0, _sessionKeyCQewiu8n.c)(explicitAgentId);
  return (0, _sessionKeyCQewiu8n.u)(params.sessionKey);
}
function resolveRunModelFallbacksOverride(params) {
  if (!params.cfg) return;
  return resolveAgentModelFallbacksOverride(params.cfg, resolveFallbackAgentId({
    agentId: params.agentId,
    sessionKey: params.sessionKey
  }));
}
function hasConfiguredModelFallbacks(params) {
  const fallbacksOverride = resolveRunModelFallbacksOverride(params);
  const defaultFallbacks = (0, _modelInputB9pBobB.r)(params.cfg?.agents?.defaults?.model);
  return (fallbacksOverride ?? defaultFallbacks).length > 0;
}
function resolveEffectiveModelFallbacks(params) {
  const agentFallbacksOverride = resolveAgentModelFallbacksOverride(params.cfg, params.agentId);
  if (!params.hasSessionModelOverride) return agentFallbacksOverride;
  if (!(params.modelOverrideSource === "auto" || params.modelOverrideSource === void 0 && params.hasAutoFallbackProvenance === true)) return [];
  const subagentFallbacksOverride = (0, _sessionKeyUtilsCJRKuBJA.a)(params.sessionKey) ? resolveSubagentSpawnModelFallbacksOverride(params.cfg, params.agentId) : void 0;
  if (subagentFallbacksOverride !== void 0) return subagentFallbacksOverride;
  const defaultFallbacks = (0, _modelInputB9pBobB.r)(params.cfg.agents?.defaults?.model);
  return agentFallbacksOverride ?? defaultFallbacks;
}
function normalizePathForComparison(input) {
  const resolved = _nodePath.default.resolve(stripNullBytes((0, _utilsCKsuXgDI.p)(input)));
  let normalized = resolved;
  try {
    normalized = _nodeFs.default.realpathSync.native(resolved);
  } catch {}
  if (process.platform === "win32") return (0, _stringCoerceLndEvhRk.r)(normalized);
  return normalized;
}
function resolveAgentIdsByWorkspacePath(cfg, workspacePath) {
  const normalizedWorkspacePath = normalizePathForComparison(workspacePath);
  const ids = (0, _agentScopeConfigDCRwWQZy.n)(cfg);
  const matches = [];
  for (let index = 0; index < ids.length; index += 1) {
    const id = ids[index];
    const workspaceDir = normalizePathForComparison((0, _agentScopeConfigDCRwWQZy.o)(cfg, id));
    if (!(0, _pathB5B_oAT.i)(workspaceDir, normalizedWorkspacePath)) continue;
    matches.push({
      id,
      workspaceDir,
      order: index
    });
  }
  matches.sort((left, right) => {
    const workspaceLengthDelta = right.workspaceDir.length - left.workspaceDir.length;
    if (workspaceLengthDelta !== 0) return workspaceLengthDelta;
    return left.order - right.order;
  });
  return matches.map((entry) => entry.id);
}
function resolveAgentIdByWorkspacePath(cfg, workspacePath) {
  return resolveAgentIdsByWorkspacePath(cfg, workspacePath)[0];
}
//#endregion /* v9-f0f35fd31cb59385 */
