"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.t = resolveAgentHarnessPolicy;var _modelRuntimePolicyC_Wm7X2Y = require("./model-runtime-policy-C_Wm7X2Y.js");
var _runtimeT2SzTsE = require("./runtime-t2SzTsE9.js");
var _openaiCodexRoutingQYpDQzyG = require("./openai-codex-routing-qYpDQzyG.js");
//#region src/agents/harness/policy.ts
function resolveAgentHarnessPolicy(params) {
  const configured = (0, _modelRuntimePolicyC_Wm7X2Y.t)({
    config: params.config,
    provider: params.provider,
    modelId: params.modelId,
    agentId: params.agentId,
    sessionKey: params.sessionKey
  });
  const configuredRuntime = configured.policy?.id?.trim();
  const runtimeSource = configured.source ?? "implicit";
  const runtime = configuredRuntime && configuredRuntime !== "default" ? (0, _runtimeT2SzTsE.t)(configuredRuntime) : "auto";
  if ((0, _openaiCodexRoutingQYpDQzyG.s)({
    provider: params.provider,
    config: params.config
  })) {
    if (runtime === "auto") return {
      runtime: "codex",
      runtimeSource
    };
    return {
      runtime,
      runtimeSource
    };
  }
  if ((0, _openaiCodexRoutingQYpDQzyG.r)(params.provider)) {
    if (runtime === "auto") return {
      runtime: "codex",
      runtimeSource
    };
    return {
      runtime,
      runtimeSource
    };
  }
  return {
    runtime,
    runtimeSource
  };
}
//#endregion /* v9-b67fd490be1a435e */
