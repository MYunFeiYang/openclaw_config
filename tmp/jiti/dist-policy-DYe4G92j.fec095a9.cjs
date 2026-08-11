"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.t = resolveAgentHarnessPolicy;var _modelRuntimePolicyDrAnRzI = require("./model-runtime-policy-DrAnRzI3.js");
var _runtimeT2SzTsE = require("./runtime-t2SzTsE9.js");
var _openaiCodexRouting17ICsBr_ = require("./openai-codex-routing-17ICsBr_.js");
//#region src/agents/harness/policy.ts
function resolveAgentHarnessPolicy(params) {
  const configured = (0, _modelRuntimePolicyDrAnRzI.t)({
    config: params.config,
    provider: params.provider,
    modelId: params.modelId,
    agentId: params.agentId,
    sessionKey: params.sessionKey
  });
  const configuredRuntime = configured.policy?.id?.trim();
  const runtimeSource = configured.source ?? "implicit";
  const runtime = configuredRuntime && configuredRuntime !== "default" ? (0, _runtimeT2SzTsE.t)(configuredRuntime) : "auto";
  if ((0, _openaiCodexRouting17ICsBr_.s)({
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
  if ((0, _openaiCodexRouting17ICsBr_.r)(params.provider)) {
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
//#endregion /* v9-9188c5fa8c3e5033 */
