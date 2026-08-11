"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.i = resolveActiveTalkProviderConfig;exports.n = normalizeTalkConfig;exports.r = normalizeTalkSection;exports.t = buildTalkConfigResponse;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
var _utilsCKsuXgDI = require("./utils-CKsuXgDI.js");
var _typesSecretsCJS3n8Im = require("./types.secrets-CJS3n8Im.js");
var _thinkingUKUPba = require("./thinking-uKUPba90.js");
//#region src/config/talk.ts
function normalizeTalkSecretInput(value) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : void 0;
  }
  return (0, _typesSecretsCJS3n8Im.o)(value) ?? void 0;
}
function normalizeSilenceTimeoutMs(value) {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) return;
  return value;
}
function buildLegacyTalkProviderCompat(value) {
  const provider = {};
  for (const key of [
  "voiceId",
  "voiceAliases",
  "modelId",
  "outputFormat"])
  if (value[key] !== void 0) provider[key] = value[key];
  const apiKey = normalizeTalkSecretInput(value.apiKey);
  if (apiKey !== void 0) provider.apiKey = apiKey;
  return Object.keys(provider).length > 0 ? provider : void 0;
}
function normalizeTalkProviderConfig(value) {
  if (!(0, _utilsCKsuXgDI.c)(value)) return;
  const provider = {};
  for (const [key, raw] of Object.entries(value)) {
    if (raw === void 0) continue;
    if (key === "apiKey") {
      const normalized = normalizeTalkSecretInput(raw);
      if (normalized !== void 0) provider.apiKey = normalized;
      continue;
    }
    provider[key] = raw;
  }
  return Object.keys(provider).length > 0 ? provider : void 0;
}
function normalizeTalkProviders(value) {
  if (!(0, _utilsCKsuXgDI.c)(value)) return;
  const providers = {};
  for (const [rawProviderId, providerConfig] of Object.entries(value)) {
    const providerId = (0, _stringCoerceLndEvhRk.c)(rawProviderId);
    if (!providerId) continue;
    const normalizedProvider = normalizeTalkProviderConfig(providerConfig);
    if (!normalizedProvider) continue;
    providers[providerId] = {
      ...providers[providerId],
      ...normalizedProvider
    };
  }
  return Object.keys(providers).length > 0 ? providers : void 0;
}
function normalizeTalkRealtimeConfig(value) {
  if (!(0, _utilsCKsuXgDI.c)(value)) return;
  const source = value;
  const normalized = {};
  const provider = (0, _stringCoerceLndEvhRk.c)(source.provider);
  if (provider) normalized.provider = provider;
  const providers = normalizeTalkProviders(source.providers);
  if (providers) normalized.providers = providers;
  const model = (0, _stringCoerceLndEvhRk.c)(source.model);
  if (model) normalized.model = model;
  const voice = (0, _stringCoerceLndEvhRk.c)(source.voice);
  if (voice) normalized.voice = voice;
  const instructions = (0, _stringCoerceLndEvhRk.c)(source.instructions);
  if (instructions) normalized.instructions = instructions;
  if (source.mode === "realtime" || source.mode === "stt-tts" || source.mode === "transcription") normalized.mode = source.mode;
  if (source.transport === "webrtc" || source.transport === "provider-websocket" || source.transport === "gateway-relay" || source.transport === "managed-room") normalized.transport = source.transport;
  if (source.brain === "agent-consult" || source.brain === "direct-tools" || source.brain === "none") normalized.brain = source.brain;
  return Object.keys(normalized).length > 0 ? normalized : void 0;
}
function activeProviderFromTalk(talk) {
  const provider = (0, _stringCoerceLndEvhRk.c)(talk.provider);
  const providers = talk.providers;
  if (provider) {
    if (providers && !(provider in providers)) return;
    return provider;
  }
  const providerIds = providers ? Object.keys(providers) : [];
  return providerIds.length === 1 ? providerIds[0] : void 0;
}
function normalizeTalkSection(value) {
  if (!(0, _utilsCKsuXgDI.c)(value)) return;
  const source = value;
  const normalized = {};
  const speechLocale = (0, _stringCoerceLndEvhRk.c)(source.speechLocale);
  if (speechLocale) normalized.speechLocale = speechLocale;
  if (typeof source.interruptOnSpeech === "boolean") normalized.interruptOnSpeech = source.interruptOnSpeech;
  const consultThinkingLevel = (0, _thinkingUKUPba.p)((0, _stringCoerceLndEvhRk.c)(source.consultThinkingLevel));
  if (consultThinkingLevel) normalized.consultThinkingLevel = consultThinkingLevel;
  const rawConsultFastMode = source.consultFastMode;
  const consultFastMode = typeof rawConsultFastMode === "boolean" || typeof rawConsultFastMode === "string" ? (0, _stringCoerceLndEvhRk.i)(rawConsultFastMode) : void 0;
  if (consultFastMode !== void 0) normalized.consultFastMode = consultFastMode;
  const silenceTimeoutMs = normalizeSilenceTimeoutMs(source.silenceTimeoutMs);
  if (silenceTimeoutMs !== void 0) normalized.silenceTimeoutMs = silenceTimeoutMs;
  const providers = normalizeTalkProviders(source.providers);
  const realtime = normalizeTalkRealtimeConfig(source.realtime);
  const provider = (0, _stringCoerceLndEvhRk.c)(source.provider);
  if (providers) normalized.providers = providers;
  if (realtime) normalized.realtime = realtime;
  if (provider) normalized.provider = provider;
  return Object.keys(normalized).length > 0 ? normalized : void 0;
}
function normalizeTalkConfig(config) {
  if (!config.talk) return config;
  const normalizedTalk = normalizeTalkSection(config.talk);
  if (!normalizedTalk) return config;
  return {
    ...config,
    talk: normalizedTalk
  };
}
function resolveActiveTalkProviderConfig(talk) {
  const normalizedTalk = normalizeTalkSection(talk);
  if (!normalizedTalk) return;
  const provider = activeProviderFromTalk(normalizedTalk);
  if (!provider) return;
  return {
    provider,
    config: normalizedTalk.providers?.[provider] ?? {}
  };
}
function buildTalkConfigResponse(value) {
  if (!(0, _utilsCKsuXgDI.c)(value)) return;
  const normalized = normalizeTalkSection(value);
  const legacyCompat = buildLegacyTalkProviderCompat(value);
  if (!normalized && !legacyCompat) return;
  const payload = {};
  if (typeof normalized?.interruptOnSpeech === "boolean") payload.interruptOnSpeech = normalized.interruptOnSpeech;
  if (typeof normalized?.silenceTimeoutMs === "number") payload.silenceTimeoutMs = normalized.silenceTimeoutMs;
  if (typeof normalized?.consultThinkingLevel === "string") payload.consultThinkingLevel = normalized.consultThinkingLevel;
  if (typeof normalized?.consultFastMode === "boolean") payload.consultFastMode = normalized.consultFastMode;
  if (typeof normalized?.speechLocale === "string") payload.speechLocale = normalized.speechLocale;
  if (normalized?.providers && Object.keys(normalized.providers).length > 0) payload.providers = normalized.providers;
  if (normalized?.realtime && Object.keys(normalized.realtime).length > 0) payload.realtime = normalized.realtime;
  const resolved = resolveActiveTalkProviderConfig(normalized) ?? (legacyCompat ? {
    provider: "elevenlabs",
    config: legacyCompat
  } : void 0);
  const activeProvider = resolved?.provider;
  if (activeProvider) payload.provider = activeProvider;
  if (resolved) payload.resolved = resolved;
  return Object.keys(payload).length > 0 ? payload : void 0;
}
//#endregion /* v9-f5b097fe495e7ced */
