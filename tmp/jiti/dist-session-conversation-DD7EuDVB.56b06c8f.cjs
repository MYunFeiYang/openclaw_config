"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.i = resolveSessionThreadInfo;exports.n = resolveSessionConversationRef;exports.r = resolveSessionParentSessionKey;exports.t = resolveSessionConversation;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
var _sessionKeyUtilsCJRKuBJA = require("./session-key-utils-CJRKuBJA.js");
var _runtimeSnapshotCXpARQsx = require("./runtime-snapshot-CXpARQsx.js");
var _registryOM2UOqu = require("./registry-O-m2UOqu.js");
var _facadeRuntimeBXENi1db = require("./facade-runtime-BXENi1db.js");
var _registryCvAJRtd = require("./registry-Cv-AJRtd.js");
//#region src/channels/plugins/session-conversation.ts
const SESSION_KEY_API_ARTIFACT_BASENAME = "session-key-api.js";
function normalizeResolvedChannel(channel) {
  return (0, _registryCvAJRtd.a)(channel) ?? (0, _registryOM2UOqu.o)(channel) ?? (0, _stringCoerceLndEvhRk.s)(channel) ?? "";
}
function getMessagingAdapter(channel) {
  const normalizedChannel = normalizeResolvedChannel(channel);
  try {
    return (0, _registryCvAJRtd.n)(normalizedChannel)?.messaging;
  } catch {
    return;
  }
}
function dedupeConversationIds(values) {
  const seen = /* @__PURE__ */new Set();
  const resolved = [];
  for (const value of values) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    resolved.push(trimmed);
  }
  return resolved;
}
function buildGenericConversationResolution(rawId) {
  const trimmed = rawId.trim();
  if (!trimmed) return null;
  const parsed = (0, _sessionKeyUtilsCJRKuBJA.u)(trimmed);
  const id = (parsed.baseSessionKey ?? trimmed).trim();
  if (!id) return null;
  return {
    id,
    threadId: parsed.threadId,
    baseConversationId: id,
    parentConversationCandidates: dedupeConversationIds(parsed.threadId ? [parsed.baseSessionKey] : [])
  };
}
function normalizeSessionConversationResolution(resolved) {
  if (!resolved?.id?.trim()) return null;
  return {
    id: resolved.id.trim(),
    threadId: (0, _stringCoerceLndEvhRk.c)(resolved.threadId),
    baseConversationId: (0, _stringCoerceLndEvhRk.c)(resolved.baseConversationId) ?? dedupeConversationIds(resolved.parentConversationCandidates ?? []).at(-1) ?? resolved.id.trim(),
    parentConversationCandidates: dedupeConversationIds(resolved.parentConversationCandidates ?? []),
    hasExplicitParentConversationCandidates: Object.hasOwn(resolved, "parentConversationCandidates")
  };
}
function resolveBundledSessionConversationFallback(params) {
  if (isBundledSessionConversationFallbackDisabled(params.channel)) return null;
  const dirName = normalizeResolvedChannel(params.channel);
  let loaded = null;
  try {
    loaded = (0, _facadeRuntimeBXENi1db.a)({
      dirName,
      artifactBasename: SESSION_KEY_API_ARTIFACT_BASENAME
    });
  } catch {
    return null;
  }
  const resolveSessionConversation = loaded?.resolveSessionConversation;
  if (typeof resolveSessionConversation !== "function") return null;
  return normalizeSessionConversationResolution(resolveSessionConversation({
    kind: params.kind,
    rawId: params.rawId
  }));
}
function isBundledSessionConversationFallbackDisabled(channel) {
  const snapshot = (0, _runtimeSnapshotCXpARQsx.i)();
  if (!snapshot?.plugins) return false;
  if (snapshot.plugins.enabled === false) return true;
  const entry = snapshot.plugins.entries?.[normalizeResolvedChannel(channel)];
  return !!entry && typeof entry === "object" && entry.enabled === false;
}
function shouldProbeBundledSessionConversationFallback(rawId) {
  return rawId.includes(":");
}
function resolveSessionConversationResolution(params) {
  const rawId = params.rawId.trim();
  if (!rawId) return null;
  const messaging = getMessagingAdapter(params.channel);
  const pluginResolved = normalizeSessionConversationResolution(messaging?.resolveSessionConversation?.({
    kind: params.kind,
    rawId
  }));
  const shouldTryBundledFallback = params.bundledFallback !== false && !messaging && shouldProbeBundledSessionConversationFallback(rawId);
  const resolved = pluginResolved ?? (shouldTryBundledFallback ? resolveBundledSessionConversationFallback({
    channel: params.channel,
    kind: params.kind,
    rawId
  }) : null) ?? buildGenericConversationResolution(rawId);
  if (!resolved) return null;
  const parentConversationCandidates = dedupeConversationIds(pluginResolved?.hasExplicitParentConversationCandidates ? resolved.parentConversationCandidates : messaging?.resolveParentConversationCandidates?.({
    kind: params.kind,
    rawId
  }) ?? resolved.parentConversationCandidates);
  const baseConversationId = parentConversationCandidates.at(-1) ?? resolved.baseConversationId ?? resolved.id;
  return {
    ...resolved,
    baseConversationId,
    parentConversationCandidates
  };
}
function resolveSessionConversation(params) {
  return resolveSessionConversationResolution(params);
}
function buildBaseSessionKey(raw, id) {
  return `${raw.prefix}:${id}`;
}
function resolveSessionConversationRef(sessionKey, opts = {}) {
  const raw = (0, _sessionKeyUtilsCJRKuBJA.l)(sessionKey);
  if (!raw) return null;
  const resolved = resolveSessionConversation({
    ...raw,
    bundledFallback: opts.bundledFallback
  });
  if (!resolved) return null;
  return {
    channel: normalizeResolvedChannel(raw.channel),
    kind: raw.kind,
    rawId: raw.rawId,
    id: resolved.id,
    threadId: resolved.threadId,
    baseSessionKey: buildBaseSessionKey(raw, resolved.id),
    baseConversationId: resolved.baseConversationId,
    parentConversationCandidates: resolved.parentConversationCandidates
  };
}
function resolveSessionThreadInfo(sessionKey, opts = {}) {
  const resolved = resolveSessionConversationRef(sessionKey, opts);
  if (!resolved) return (0, _sessionKeyUtilsCJRKuBJA.u)(sessionKey);
  return {
    baseSessionKey: resolved.threadId ? resolved.baseSessionKey : (0, _stringCoerceLndEvhRk.c)(sessionKey),
    threadId: resolved.threadId
  };
}
function resolveSessionParentSessionKey(sessionKey) {
  const { baseSessionKey, threadId } = resolveSessionThreadInfo(sessionKey);
  if (!threadId) return null;
  return baseSessionKey ?? null;
}
//#endregion /* v9-41e1b0c553a27bf6 */
