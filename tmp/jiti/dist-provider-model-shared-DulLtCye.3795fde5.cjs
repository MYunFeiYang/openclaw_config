"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports._ = buildStrictAnthropicReplayPolicy;exports.a = buildProviderReplayFamilyHooks;exports.b = shouldPreserveThinkingBlocks;exports.c = resolveClaudeThinkingProfile;exports.d = buildAnthropicReplayPolicyForModel;exports.f = buildGoogleGeminiReplayPolicy;exports.g = buildPassthroughGeminiSanitizingReplayPolicy;exports.h = buildOpenAICompatibleReplayPolicy;exports.i = void 0;exports.l = cloneFirstTemplateModel;exports.m = buildNativeAnthropicReplayPolicyForModel;exports.n = void 0;exports.o = isClaudeAdaptiveThinkingDefaultModelId;exports.p = buildHybridAnthropicOrOpenAIReplayPolicy;exports.r = void 0;exports.s = isProxyReasoningUnsupportedModelHint;exports.t = void 0;exports.u = matchesExactOrPrefix;exports.v = resolveTaggedReasoningOutputMode;exports.y = sanitizeGoogleGeminiReplayHistory;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
require("./gpt5-prompt-overlay-CGcbgK_z.js");
require("./provider-attribution-DWAuHLb9.js");
var _providerModelCompat2_jl3w5h = require("./provider-model-compat-2_jl3w5h.js");
var _googleModelsJXQyQzVQ = require("./google-models-jXQyQzVQ.js");
require("./moonshot-thinking-stream-wrappers-CPpXRm84.js");
//#region src/plugins/provider-replay-helpers.ts
/** @deprecated Provider replay helper; prefer provider-local replay hooks. */
function buildOpenAICompatibleReplayPolicy(modelApi, options = {}) {
  if (modelApi !== "openai-completions" && modelApi !== "openai-responses" && modelApi !== "openai-codex-responses" && modelApi !== "azure-openai-responses") return;
  const sanitizeToolCallIds = options.sanitizeToolCallIds ?? true;
  const dropReasoningFromHistory = options.dropReasoningFromHistory ?? true;
  const isResponsesFamily = modelApi === "openai-responses" || modelApi === "openai-codex-responses" || modelApi === "azure-openai-responses";
  return {
    ...(sanitizeToolCallIds ? {
      sanitizeToolCallIds: true,
      toolCallIdMode: "strict"
    } : {}),
    ...(isResponsesFamily ? { allowSyntheticToolResults: true } : {}),
    ...(modelApi === "openai-completions" ? {
      applyAssistantFirstOrderingFix: true,
      validateGeminiTurns: true,
      validateAnthropicTurns: true
    } : {
      applyAssistantFirstOrderingFix: false,
      validateGeminiTurns: false,
      validateAnthropicTurns: false
    }),
    ...(modelApi === "openai-completions" && (dropReasoningFromHistory || (0, _googleModelsJXQyQzVQ.t)(options.modelId)) ? { dropReasoningFromHistory: true } : {})
  };
}
/** @deprecated Anthropic-family provider replay helper; prefer provider-local replay hooks. */
function buildStrictAnthropicReplayPolicy(options = {}) {
  return {
    sanitizeMode: "full",
    ...(options.sanitizeToolCallIds ?? true ? {
      sanitizeToolCallIds: true,
      toolCallIdMode: "strict",
      ...(options.preserveNativeAnthropicToolUseIds ? { preserveNativeAnthropicToolUseIds: true } : {})
    } : {}),
    preserveSignatures: true,
    repairToolUseResultPairing: true,
    validateAnthropicTurns: true,
    allowSyntheticToolResults: true,
    ...(options.dropThinkingBlocks ? { dropThinkingBlocks: true } : {})
  };
}
/**
* Returns true for Claude models that preserve thinking blocks in context
* natively (Opus 4.5+, Sonnet 4.5+, Haiku 4.5+). For these models, dropping
* thinking blocks from prior turns breaks prompt cache prefix matching.
*
* See: https://platform.claude.com/docs/en/build-with-claude/extended-thinking#differences-in-thinking-across-model-versions
*
* @deprecated Anthropic-family provider replay helper; prefer provider-local replay hooks.
*/
function shouldPreserveThinkingBlocks(modelId) {
  const id = (0, _stringCoerceLndEvhRk.a)(modelId);
  if (!id.includes("claude")) return false;
  if (id.includes("opus-4") || id.includes("sonnet-4") || id.includes("haiku-4")) return true;
  if (/claude-[5-9]/.test(id) || /claude-\d{2,}/.test(id)) return true;
  return false;
}
/** @deprecated Anthropic-family provider replay helper; prefer provider-local replay hooks. */
function buildAnthropicReplayPolicyForModel(modelId) {
  return buildStrictAnthropicReplayPolicy({ dropThinkingBlocks: (0, _stringCoerceLndEvhRk.a)(modelId).includes("claude") && !shouldPreserveThinkingBlocks(modelId) });
}
/** @deprecated Anthropic-family provider replay helper; prefer provider-local replay hooks. */
function buildNativeAnthropicReplayPolicyForModel(modelId) {
  return buildStrictAnthropicReplayPolicy({
    dropThinkingBlocks: (0, _stringCoerceLndEvhRk.a)(modelId).includes("claude") && !shouldPreserveThinkingBlocks(modelId),
    sanitizeToolCallIds: true,
    preserveNativeAnthropicToolUseIds: true
  });
}
/** @deprecated Provider replay helper; prefer provider-local replay hooks. */
function buildHybridAnthropicOrOpenAIReplayPolicy(ctx, options = {}) {
  if (ctx.modelApi === "anthropic-messages" || ctx.modelApi === "bedrock-converse-stream") {
    const isClaude = (0, _stringCoerceLndEvhRk.a)(ctx.modelId).includes("claude");
    return buildStrictAnthropicReplayPolicy({ dropThinkingBlocks: options.anthropicModelDropThinkingBlocks && isClaude && !shouldPreserveThinkingBlocks(ctx.modelId) });
  }
  return buildOpenAICompatibleReplayPolicy(ctx.modelApi, { modelId: ctx.modelId });
}
const GOOGLE_TURN_ORDERING_CUSTOM_TYPE = "google-turn-ordering-bootstrap";
function hasGoogleTurnOrderingMarker(sessionState) {
  return sessionState.getCustomEntries().some((entry) => entry.customType === GOOGLE_TURN_ORDERING_CUSTOM_TYPE);
}
function markGoogleTurnOrderingMarker(sessionState) {
  sessionState.appendCustomEntry(GOOGLE_TURN_ORDERING_CUSTOM_TYPE, { timestamp: Date.now() });
}
/** @deprecated Google provider replay helper; prefer provider-local replay hooks. */
function buildGoogleGeminiReplayPolicy() {
  return {
    sanitizeMode: "full",
    sanitizeToolCallIds: true,
    toolCallIdMode: "strict",
    sanitizeThoughtSignatures: {
      allowBase64Only: true,
      includeCamelCase: true
    },
    repairToolUseResultPairing: true,
    applyAssistantFirstOrderingFix: true,
    validateGeminiTurns: true,
    validateAnthropicTurns: false,
    allowSyntheticToolResults: true
  };
}
/** @deprecated Google provider replay helper; prefer provider-local replay hooks. */
function buildPassthroughGeminiSanitizingReplayPolicy(modelId) {
  return {
    applyAssistantFirstOrderingFix: false,
    validateGeminiTurns: false,
    validateAnthropicTurns: false,
    ...((0, _stringCoerceLndEvhRk.a)(modelId).includes("gemini") ? { sanitizeThoughtSignatures: {
        allowBase64Only: true,
        includeCamelCase: true
      } } : {})
  };
}
/** @deprecated Google provider replay helper; prefer provider-local replay hooks. */
function sanitizeGoogleGeminiReplayHistory(ctx) {
  const messages = (0, _googleModelsJXQyQzVQ.n)(ctx.messages);
  if (messages !== ctx.messages && ctx.sessionState && !hasGoogleTurnOrderingMarker(ctx.sessionState)) markGoogleTurnOrderingMarker(ctx.sessionState);
  return messages;
}
/** @deprecated Provider replay helper; prefer provider-local replay hooks. */
function resolveTaggedReasoningOutputMode() {
  return "tagged";
}
//#endregion
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
    return (0, _providerModelCompat2_jl3w5h.a)({
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
        return { buildReplayPolicy: (ctx) => buildOpenAICompatibleReplayPolicy(ctx.modelApi, {
            ...policyOptions,
            modelId: ctx.modelId
          }) };
      }
    case "anthropic-by-model":return { buildReplayPolicy: ({ modelId }) => buildAnthropicReplayPolicyForModel(modelId) };
    case "native-anthropic-by-model":return { buildReplayPolicy: ({ modelId }) => buildNativeAnthropicReplayPolicyForModel(modelId) };
    case "google-gemini":return {
        buildReplayPolicy: () => buildGoogleGeminiReplayPolicy(),
        sanitizeReplayHistory: (ctx) => sanitizeGoogleGeminiReplayHistory(ctx),
        resolveReasoningOutputMode: (_ctx) => resolveTaggedReasoningOutputMode()
      };
    case "passthrough-gemini":return { buildReplayPolicy: ({ modelId }) => buildPassthroughGeminiSanitizingReplayPolicy(modelId) };
    case "hybrid-anthropic-openai":return { buildReplayPolicy: (ctx) => buildHybridAnthropicOrOpenAIReplayPolicy(ctx, { anthropicModelDropThinkingBlocks: options.anthropicModelDropThinkingBlocks }) };
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
//#endregion /* v9-3417da858f3c009f */
