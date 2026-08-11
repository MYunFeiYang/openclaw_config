"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.t = collectConfiguredAgentHarnessRuntimes;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
var _utilsCKsuXgDI = require("./utils-CKsuXgDI.js");
var _providerIdCz7K6wgK = require("./provider-id-Cz7K6wgK.js");
var _runtimeT2SzTsE = require("./runtime-t2SzTsE9.js");
var _policyB5E74dCu = require("./policy-B5E74dCu.js");
//#region src/agents/harness-runtimes.ts
function normalizeRuntimeId(value) {
  if (typeof value !== "string") return;
  const lower = (0, _stringCoerceLndEvhRk.s)(value);
  if (!lower) return;
  return (0, _stringCoerceLndEvhRk.s)((0, _runtimeT2SzTsE.t)(lower));
}
function listAgentModelRefs(value) {
  if (typeof value === "string") return [value];
  if (!(0, _utilsCKsuXgDI.c)(value)) return [];
  const refs = [];
  if (typeof value.primary === "string") refs.push(value.primary);
  if (Array.isArray(value.fallbacks)) {
    for (const fallback of value.fallbacks) if (typeof fallback === "string") refs.push(fallback);
  }
  return refs;
}
function pushAgentModelRefs(refs, value) {
  for (const ref of listAgentModelRefs(value)) refs.push(ref);
}
function parseConfiguredModelRef(value) {
  if (typeof value !== "string") return;
  const trimmed = value.trim();
  const slash = trimmed.indexOf("/");
  if (slash <= 0 || slash >= trimmed.length - 1) return;
  return {
    provider: (0, _providerIdCz7K6wgK.r)(trimmed.slice(0, slash)),
    modelId: trimmed.slice(slash + 1).trim()
  };
}
function resolveConfiguredModelHarnessRuntime(params) {
  const parsed = parseConfiguredModelRef(params.modelRef);
  if (!parsed) return;
  const policy = (0, _policyB5E74dCu.t)({
    config: params.config,
    provider: parsed.provider,
    modelId: parsed.modelId,
    agentId: params.agentId
  });
  if (!params.includeImplicitRuntimePreferences && policy.runtimeSource === "implicit") return;
  const runtime = normalizeRuntimeId(policy.runtime);
  return runtime && runtime !== "auto" && runtime !== "pi" ? runtime : void 0;
}
function pushConfiguredModelRuntimeIds(config, runtimes) {
  for (const providerConfig of Object.values(config.models?.providers ?? {})) {
    const providerRuntime = normalizeRuntimeId(providerConfig?.agentRuntime?.id);
    if (providerRuntime && providerRuntime !== "auto" && providerRuntime !== "pi") runtimes.add(providerRuntime);
    for (const modelConfig of providerConfig?.models ?? []) {
      const modelRuntime = normalizeRuntimeId(modelConfig?.agentRuntime?.id);
      if (modelRuntime && modelRuntime !== "auto" && modelRuntime !== "pi") runtimes.add(modelRuntime);
    }
  }
  const pushModelMapRuntimeIds = (models) => {
    if (!(0, _utilsCKsuXgDI.c)(models)) return;
    for (const entry of Object.values(models)) {
      if (!(0, _utilsCKsuXgDI.c)(entry)) continue;
      const runtime = normalizeRuntimeId((0, _utilsCKsuXgDI.c)(entry.agentRuntime) ? entry.agentRuntime.id : void 0);
      if (runtime && runtime !== "auto" && runtime !== "pi") runtimes.add(runtime);
    }
  };
  pushModelMapRuntimeIds(config.agents?.defaults?.models);
  const agents = Array.isArray(config.agents?.list) ? config.agents.list : [];
  for (const agent of agents) pushModelMapRuntimeIds((0, _utilsCKsuXgDI.c)(agent) ? agent.models : void 0);
}
function pushConfiguredAgentModelRuntimeIds(config, runtimes, includeImplicitRuntimePreferences) {
  const pushModelRefs = (modelRefs, agentId) => {
    for (const modelRef of modelRefs) {
      const runtime = resolveConfiguredModelHarnessRuntime({
        config,
        includeImplicitRuntimePreferences,
        modelRef,
        agentId
      });
      if (runtime) runtimes.add(runtime);
    }
  };
  const pushModelMapRefs = (models, agentId) => {
    if (!(0, _utilsCKsuXgDI.c)(models)) return;
    pushModelRefs(Object.keys(models), agentId);
  };
  const defaultsModel = config.agents?.defaults?.model;
  const defaultsModelRefs = [];
  pushAgentModelRefs(defaultsModelRefs, defaultsModel);
  pushModelRefs(defaultsModelRefs);
  pushModelMapRefs(config.agents?.defaults?.models);
  if (!Array.isArray(config.agents?.list)) return;
  for (const agent of config.agents.list) {
    if (!(0, _utilsCKsuXgDI.c)(agent)) continue;
    const agentId = typeof agent.id === "string" ? agent.id : void 0;
    const selectedModelRefs = [];
    pushAgentModelRefs(selectedModelRefs, agent.model ?? defaultsModel);
    pushModelRefs(selectedModelRefs, agentId);
    pushModelMapRefs(agent.models, agentId);
  }
}
function pushLegacyAgentRuntimeIds(config, runtimes) {
  const pushRuntimeId = (value) => {
    const runtime = normalizeRuntimeId(value);
    if (runtime && runtime !== "auto" && runtime !== "pi") runtimes.add(runtime);
  };
  pushRuntimeId(config.agents?.defaults?.agentRuntime?.id);
  const agents = Array.isArray(config.agents?.list) ? config.agents.list : [];
  for (const agent of agents) pushRuntimeId(agent.agentRuntime?.id);
}
function collectConfiguredAgentHarnessRuntimes(config, env, options = {}) {
  const runtimes = /* @__PURE__ */new Set();
  const includeEnvRuntime = options.includeEnvRuntime ?? true;
  const includeImplicitRuntimePreferences = options.includeImplicitRuntimePreferences ?? true;
  const includeLegacyAgentRuntimes = options.includeLegacyAgentRuntimes ?? true;
  if (includeEnvRuntime) {
    const envRuntime = normalizeRuntimeId(env.OPENCLAW_AGENT_RUNTIME);
    if (envRuntime && envRuntime !== "auto" && envRuntime !== "pi") runtimes.add(envRuntime);
  }
  pushConfiguredModelRuntimeIds(config, runtimes);
  if (includeLegacyAgentRuntimes) pushLegacyAgentRuntimeIds(config, runtimes);
  pushConfiguredAgentModelRuntimeIds(config, runtimes, includeImplicitRuntimePreferences);
  return [...runtimes].toSorted((left, right) => left.localeCompare(right));
}
//#endregion /* v9-eadf9c2725661f8c */
