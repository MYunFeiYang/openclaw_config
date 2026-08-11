"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.i = streamWithPayloadPatch;exports.n = resolveMoonshotThinkingKeep;exports.r = resolveMoonshotThinkingType;exports.t = createMoonshotThinkingWrapper;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
var _lazyPromiseSFT4i6yI = require("./lazy-promise-SFT4i6yI.js");function _interopRequireWildcard(e, t) {if ("function" == typeof WeakMap) var r = new WeakMap(),n = new WeakMap();return (_interopRequireWildcard = function (e, t) {if (!t && e && e.__esModule) return e;var o,i,f = { __proto__: null, default: e };if (null === e || "object" != typeof e && "function" != typeof e) return f;if (o = t ? n : r) {if (o.has(e)) return o.get(e);o.set(e, f);}for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]);return f;})(e, t);}
//#region src/agents/pi-embedded-runner/stream-payload-utils.ts
function streamWithPayloadPatch(underlying, model, context, options, patchPayload) {
  const originalOnPayload = options?.onPayload;
  return underlying(model, context, {
    ...options,
    onPayload: (payload) => {
      if (payload && typeof payload === "object") patchPayload(payload);
      return originalOnPayload?.(payload, model);
    }
  });
}
//#endregion
//#region src/agents/pi-embedded-runner/moonshot-thinking-stream-wrappers.ts
const MOONSHOT_THINKING_KEEP_MODEL_ID = "kimi-k2.6";
const piAiRuntimeLoader = (0, _lazyPromiseSFT4i6yI.t)(() => Promise.resolve().then(() => jitiImport("@earendil-works/pi-ai").then((m) => _interopRequireWildcard(m))));
async function loadDefaultStreamFn() {
  return (await piAiRuntimeLoader.load()).streamSimple;
}
function normalizeMoonshotThinkingType(value) {
  if (typeof value === "boolean") return value ? "enabled" : "disabled";
  if (typeof value === "string") {
    const normalized = (0, _stringCoerceLndEvhRk.s)(value);
    if (!normalized) return;
    if ([
    "enabled",
    "enable",
    "on",
    "true"].
    includes(normalized)) return "enabled";
    if ([
    "disabled",
    "disable",
    "off",
    "false"].
    includes(normalized)) return "disabled";
    return;
  }
  if (value && typeof value === "object" && !Array.isArray(value)) return normalizeMoonshotThinkingType(value.type);
}
function normalizeMoonshotThinkingKeep(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  const keepValue = value.keep;
  if (typeof keepValue !== "string") return;
  return (0, _stringCoerceLndEvhRk.s)(keepValue) === "all" ? "all" : void 0;
}
function isMoonshotToolChoiceCompatible(toolChoice) {
  if (toolChoice == null || toolChoice === "auto" || toolChoice === "none") return true;
  if (typeof toolChoice === "object" && !Array.isArray(toolChoice)) {
    const typeValue = toolChoice.type;
    return typeValue === "auto" || typeValue === "none";
  }
  return false;
}
function isPinnedToolChoice(toolChoice) {
  if (!toolChoice || typeof toolChoice !== "object" || Array.isArray(toolChoice)) return false;
  const typeValue = toolChoice.type;
  return typeValue === "tool" || typeValue === "function";
}
/** @deprecated Moonshot provider-owned stream helper; do not use from third-party plugins. */
function resolveMoonshotThinkingType(params) {
  const configured = normalizeMoonshotThinkingType(params.configuredThinking);
  if (configured) return configured;
  if (!params.thinkingLevel) return;
  return params.thinkingLevel === "off" ? "disabled" : "enabled";
}
/** @deprecated Moonshot provider-owned stream helper; do not use from third-party plugins. */
function resolveMoonshotThinkingKeep(params) {
  return normalizeMoonshotThinkingKeep(params.configuredThinking);
}
/** @deprecated Moonshot provider-owned stream helper; do not use from third-party plugins. */
function createMoonshotThinkingWrapper(baseStreamFn, thinkingType, thinkingKeep) {
  return async (model, context, options) => {
    return streamWithPayloadPatch(baseStreamFn ?? (await loadDefaultStreamFn()), model, context, options, (payloadObj) => {
      let effectiveThinkingType = normalizeMoonshotThinkingType(payloadObj.thinking);
      if (thinkingType) {
        payloadObj.thinking = { type: thinkingType };
        effectiveThinkingType = thinkingType;
      }
      if (effectiveThinkingType === "enabled" && !isMoonshotToolChoiceCompatible(payloadObj.tool_choice)) {
        if (payloadObj.tool_choice === "required") payloadObj.tool_choice = "auto";else
        if (isPinnedToolChoice(payloadObj.tool_choice)) {
          payloadObj.thinking = { type: "disabled" };
          effectiveThinkingType = "disabled";
        }
      }
      const isKeepCapableModel = payloadObj.model === MOONSHOT_THINKING_KEEP_MODEL_ID;
      if (payloadObj.thinking && typeof payloadObj.thinking === "object") {
        const thinkingObj = payloadObj.thinking;
        if (isKeepCapableModel && effectiveThinkingType === "enabled" && thinkingKeep === "all") thinkingObj.keep = "all";else
        if ("keep" in thinkingObj) delete thinkingObj.keep;
      }
    });
  };
}
//#endregion /* v9-6dbb320eb019092d */
