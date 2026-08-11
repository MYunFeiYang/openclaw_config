"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = buildProviderReplayFamilyHooks;exports.c = resolveClaudeThinkingProfile;exports.i = void 0;exports.l = cloneFirstTemplateModel;exports.n = void 0;exports.o = isClaudeAdaptiveThinkingDefaultModelId;exports.r = void 0;exports.s = isProxyReasoningUnsupportedModelHint;exports.t = void 0;exports.u = matchesExactOrPrefix;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
require("./gpt5-prompt-overlay-CGcbgK_z.js");
require("./provider-attribution-civBbTY2.js");
var _providerModelCompatBnQ6Bi = require("./provider-model-compat-BnQ6Bi72.js");
var _providerReplayHelpersCspW0bHG = require("./provider-replay-helpers-CspW0bHG.js");
require("./moonshot-thinking-stream-wrappers-CcZJ6E9I.js");
//#region src/plugins/provider-model-helpers.ts
function matchesExactOrPrefix(id, values) {
  const normalizedId = (0, _stringCoerceLndEvhRk.a)(id);
  return values.some((value) => {
    const normalizedValue = (0, _stringCoerceLndEvhRk.a)(value);
    return normalizedId === normalizedValue || normalizedId.startsWith(normalizedValue);
  });
}
function cloneFirstTemplateModel(params) {
  const trimmedModelId = params.modelId.trim();
  for (const templateId of [...new Set(params.templateIds)].filter(Boolean)) {
    const template = params.ctx.modelRegistry.find(params.providerId, templateId);
    if (!template) continue;
    return (0, _providerModelCompatBnQ6Bi.a)({
      ...template,
      id: trimmedModelId,
      name: trimmedModelId,
      ...params.patch
    });
  }
}
//#endregion
//#region src/plugin-sdk/provider-model-shared.ts
const CLAUDE_OPUS_47_MODEL_PREFIXES = ["claude-opus-4-7", "claude-opus-4.7"];
const CLAUDE_ADAPTIVE_THINKING_DEFAULT_MODEL_PREFIXES = [
"claude-opus-4-6",
"claude-opus-4.6",
"claude-sonnet-4-6",
"claude-sonnet-4.6"];

const BASE_CLAUDE_THINKING_LEVELS = [
{ id: "off" },
{ id: "minimal" },
{ id: "low" },
{ id: "medium" },
{ id: "high" }];

function getModelProviderHint(modelId) {
  const trimmed = (0, _stringCoerceLndEvhRk.s)(modelId);
  if (!trimmed) return null;
  const slashIndex = trimmed.indexOf("/");
  if (slashIndex <= 0) return null;
  return trimmed.slice(0, slashIndex) || null;
}
/** @deprecated Proxy provider-owned model helper; do not use from third-party plugins. */
function isProxyReasoningUnsupportedModelHint(modelId) {
  return getModelProviderHint(modelId) === "x-ai";
}
function matchesClaudeModelPrefix(modelId, prefixes) {
  const lower = (0, _stringCoerceLndEvhRk.s)(modelId);
  return Boolean(lower && prefixes.some((prefix) => lower.startsWith(prefix)));
}
function isClaudeOpus47ModelId(modelId) {
  return matchesClaudeModelPrefix(modelId, CLAUDE_OPUS_47_MODEL_PREFIXES);
}
/** @deprecated Anthropic provider-owned model helper; do not use from third-party plugins. */
function isClaudeAdaptiveThinkingDefaultModelId(modelId) {
  return matchesClaudeModelPrefix(modelId, CLAUDE_ADAPTIVE_THINKING_DEFAULT_MODEL_PREFIXES);
}
/** @deprecated Anthropic provider-owned model helper; do not use from third-party plugins. */
function resolveClaudeThinkingProfile(modelId) {
  if (isClaudeOpus47ModelId(modelId)) return {
    levels: [
    ...BASE_CLAUDE_THINKING_LEVELS,
    { id: "xhigh" },
    { id: "adaptive" },
    { id: "max" }],

    defaultLevel: "off"
  };
  if (isClaudeAdaptiveThinkingDefaultModelId(modelId)) return {
    levels: [...BASE_CLAUDE_THINKING_LEVELS, { id: "adaptive" }],
    defaultLevel: "adaptive"
  };
  return { levels: BASE_CLAUDE_THINKING_LEVELS };
}
function buildProviderReplayFamilyHooks(options) {
  switch (options.family) {
    case "openai-compatible":{
        const policyOptions = {
          sanitizeToolCallIds: options.sanitizeToolCallIds,
          dropReasoningFromHistory: options.dropReasoningFromHistory
        };
        return { buildReplayPolicy: (ctx) => (0, _providerReplayHelpersCspW0bHG.a)(ctx.modelApi, {
            ...policyOptions,
            modelId: ctx.modelId
          }) };
      }
    case "anthropic-by-model":return { buildReplayPolicy: ({ modelId }) => (0, _providerReplayHelpersCspW0bHG.t)(modelId) };
    case "native-anthropic-by-model":return { buildReplayPolicy: ({ modelId }) => (0, _providerReplayHelpersCspW0bHG.i)(modelId) };
    case "google-gemini":return {
        buildReplayPolicy: () => (0, _providerReplayHelpersCspW0bHG.n)(),
        sanitizeReplayHistory: (ctx) => (0, _providerReplayHelpersCspW0bHG.l)(ctx),
        resolveReasoningOutputMode: (_ctx) => (0, _providerReplayHelpersCspW0bHG.c)()
      };
    case "passthrough-gemini":return { buildReplayPolicy: ({ modelId }) => (0, _providerReplayHelpersCspW0bHG.o)(modelId) };
    case "hybrid-anthropic-openai":return { buildReplayPolicy: (ctx) => (0, _providerReplayHelpersCspW0bHG.r)(ctx, { anthropicModelDropThinkingBlocks: options.anthropicModelDropThinkingBlocks }) };
  }
  throw new Error("Unsupported provider replay family");
}
/** @deprecated Provider-owned replay hook shortcut; use local provider hooks instead. */
const OPENAI_COMPATIBLE_REPLAY_HOOKS = exports.r = buildProviderReplayFamilyHooks({ family: "openai-compatible" });
/** @deprecated Anthropic provider-owned replay hook shortcut; use local provider hooks instead. */
const ANTHROPIC_BY_MODEL_REPLAY_HOOKS = exports.t = buildProviderReplayFamilyHooks({ family: "anthropic-by-model" });
/** @deprecated Anthropic provider-owned replay hook shortcut; use local provider hooks instead. */
const NATIVE_ANTHROPIC_REPLAY_HOOKS = exports.n = buildProviderReplayFamilyHooks({ family: "native-anthropic-by-model" });
/** @deprecated Google provider-owned replay hook shortcut; use local provider hooks instead. */
const PASSTHROUGH_GEMINI_REPLAY_HOOKS = exports.i = buildProviderReplayFamilyHooks({ family: "passthrough-gemini" });
//#endregion /* v9-f245ec1967e86761 */
