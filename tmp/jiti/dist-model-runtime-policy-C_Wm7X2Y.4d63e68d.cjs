"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.t = resolveModelRuntimePolicy;var _providerIdCz7K6wgK = require("./provider-id-Cz7K6wgK.js");
var _agentScopeDMMelGwC = require("./agent-scope-DMMelGwC.js");
var _sessionKeyCQewiu8n = require("./session-key-CQewiu8n.js");
var _agentScopeConfigDCRwWQZy = require("./agent-scope-config-DCRwWQZy.js");
//#region src/agents/model-runtime-policy.ts
function hasRuntimePolicy(value) {
  return Boolean(value?.id?.trim());
}
function resolveProviderConfig(config, provider) {
  if (!config?.models?.providers || !provider?.trim()) return;
  const providers = config.models.providers;
  const direct = providers[provider];
  if (direct) return direct;
  const normalizedProvider = (0, _providerIdCz7K6wgK.r)(provider);
  for (const [candidateProvider, providerConfig] of Object.entries(providers)) if ((0, _providerIdCz7K6wgK.r)(candidateProvider) === normalizedProvider) return providerConfig;
}
function normalizeModelIdForProvider(provider, modelId) {
  const trimmed = modelId?.trim();
  if (!trimmed) return;
  const slash = trimmed.indexOf("/");
  if (slash <= 0) return trimmed;
  const modelProvider = (0, _providerIdCz7K6wgK.r)(trimmed.slice(0, slash));
  const expectedProvider = (0, _providerIdCz7K6wgK.r)(provider ?? "");
  if (expectedProvider && modelProvider !== expectedProvider) return;
  return trimmed.slice(slash + 1).trim() || void 0;
}
function modelEntryMatches(params) {
  return modelEntryMatchKind(params) === "exact";
}
function modelEntryMatchKind(params) {
  const entryId = params.entry.id.trim();
  if (entryId === params.modelId) return "exact";
  const slash = entryId.indexOf("/");
  if (slash <= 0) return "none";
  if ((0, _providerIdCz7K6wgK.r)(entryId.slice(0, slash)) !== (0, _providerIdCz7K6wgK.r)(params.provider ?? "")) return "none";
  const entryModelId = entryId.slice(slash + 1).trim();
  if (entryModelId === params.modelId) return "exact";
  if (entryModelId === "*") return "provider-wildcard";
  return "none";
}
function modelKeyMatchKind(params) {
  return modelEntryMatchKind({
    entry: { id: params.key },
    provider: params.provider,
    modelId: params.modelId
  });
}
function modelKeyIsProviderWildcard(params) {
  const slash = params.key.indexOf("/");
  if (slash <= 0) return false;
  if ((0, _providerIdCz7K6wgK.r)(params.key.slice(0, slash)) !== (0, _providerIdCz7K6wgK.r)(params.provider ?? "")) return false;
  return params.key.slice(slash + 1).trim() === "*";
}
function resolveAgentModelEntryRuntimePolicy(params) {
  const modelId = normalizeModelIdForProvider(params.provider, params.modelId);
  if (!params.config || !modelId && params.matchKind !== "provider-wildcard") return {};
  const { sessionAgentId } = (0, _agentScopeDMMelGwC.v)({
    config: params.config,
    agentId: params.agentId,
    sessionKey: params.sessionKey
  });
  const modelMaps = [(0, _agentScopeConfigDCRwWQZy.t)(params.config).find((entry) => (0, _sessionKeyCQewiu8n.c)(entry.id) === sessionAgentId)?.models, params.config.agents?.defaults?.models];
  for (const models of modelMaps) for (const [key, entry] of Object.entries(models ?? {})) if ((modelId ? modelKeyMatchKind({
    key,
    provider: params.provider,
    modelId
  }) === params.matchKind : modelKeyIsProviderWildcard({
    key,
    provider: params.provider
  })) && hasRuntimePolicy(entry?.agentRuntime)) return {
    policy: entry.agentRuntime,
    source: "model"
  };
  return {};
}
function resolveModelConfig(params) {
  const modelId = normalizeModelIdForProvider(params.provider, params.modelId);
  if (!modelId || !Array.isArray(params.providerConfig?.models)) return;
  return params.providerConfig.models.find((entry) => modelEntryMatches({
    entry,
    provider: params.provider,
    modelId
  }));
}
function resolveModelRuntimePolicy(params) {
  if (process.env.OPENCLAW_BUILD_PRIVATE_QA === "1") {
    const forcedRuntime = process.env.OPENCLAW_QA_FORCE_RUNTIME?.trim().toLowerCase();
    if (forcedRuntime === "pi" || forcedRuntime === "codex") return {
      policy: { id: forcedRuntime },
      source: "model"
    };
  }
  const agentModelPolicy = resolveAgentModelEntryRuntimePolicy({
    ...params,
    matchKind: "exact"
  });
  if (agentModelPolicy.policy) return agentModelPolicy;
  const providerConfig = resolveProviderConfig(params.config, params.provider);
  const modelConfig = resolveModelConfig({
    providerConfig,
    provider: params.provider,
    modelId: params.modelId
  });
  if (hasRuntimePolicy(modelConfig?.agentRuntime)) return {
    policy: modelConfig?.agentRuntime,
    source: "model"
  };
  const agentWildcardModelPolicy = resolveAgentModelEntryRuntimePolicy({
    ...params,
    matchKind: "provider-wildcard"
  });
  if (agentWildcardModelPolicy.policy) return agentWildcardModelPolicy;
  if (hasRuntimePolicy(providerConfig?.agentRuntime)) return {
    policy: providerConfig?.agentRuntime,
    source: "provider"
  };
  return {};
}
//#endregion /* v9-c8d350dfa8ed228a */
