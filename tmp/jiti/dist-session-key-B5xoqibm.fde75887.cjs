"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = resolveSessionKey;exports.t = deriveSessionKey;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
var _utilsCKsuXgDI = require("./utils-CKsuXgDI.js");
var _sessionKeyUtilsCJRKuBJA = require("./session-key-utils-CJRKuBJA.js");
var _sessionKeyCQewiu8n = require("./session-key-CQewiu8n.js");
var _messageChannelJqYBZqnL = require("./message-channel-JqYBZqnL.js");
var _registryOCFvwkK = require("./registry-OCFvwkK7.js");
var _storeCmwzJ9N = require("./store-CmwzJ9N6.js");
require("./plugins-Cs-ACH2d.js");
//#region src/config/sessions/explicit-session-key-normalization.ts
function resolveExplicitSessionKeyNormalizerCandidates(sessionKey, ctx) {
  const normalizedProvider = (0, _stringCoerceLndEvhRk.s)(ctx.Provider);
  const normalizedSurface = (0, _stringCoerceLndEvhRk.s)(ctx.Surface);
  const normalizedFrom = (0, _stringCoerceLndEvhRk.a)(ctx.From);
  const candidates = /* @__PURE__ */new Set();
  const maybeAdd = (value) => {
    const normalized = (0, _messageChannelJqYBZqnL.u)(value);
    if (normalized) candidates.add(normalized);
  };
  maybeAdd(normalizedSurface);
  maybeAdd(normalizedProvider);
  maybeAdd(normalizedFrom.split(":", 1)[0]);
  for (const plugin of (0, _registryOCFvwkK.i)()) {
    const pluginId = (0, _messageChannelJqYBZqnL.u)(plugin.id);
    if (!pluginId) continue;
    if (sessionKey.startsWith(`${pluginId}:`) || sessionKey.includes(`:${pluginId}:`)) candidates.add(pluginId);
  }
  return [...candidates];
}
function normalizeExplicitSessionKey(sessionKey, ctx) {
  const normalized = (0, _sessionKeyUtilsCJRKuBJA.o)(sessionKey);
  for (const channelId of resolveExplicitSessionKeyNormalizerCandidates(normalized, ctx)) {
    const normalize = (0, _registryOCFvwkK.n)(channelId)?.messaging?.normalizeExplicitSessionKey;
    const next = normalize?.({
      sessionKey: normalized,
      ctx
    });
    if (typeof next === "string" && next.trim()) return (0, _sessionKeyUtilsCJRKuBJA.o)(next);
  }
  return normalized;
}
//#endregion
//#region src/config/sessions/session-key.ts
function deriveSessionKey(scope, ctx) {
  if (scope === "global") return "global";
  const resolvedGroup = (0, _storeCmwzJ9N.g)(ctx);
  if (resolvedGroup) return resolvedGroup.key;
  return (ctx.From ? (0, _utilsCKsuXgDI.l)(ctx.From) : "") || "unknown";
}
/**
* Resolve the session key with a canonical direct-chat bucket (default: "main").
* All non-group direct chats collapse to this bucket; groups stay isolated.
*/
function resolveSessionKey(scope, ctx, mainKey, agentId = _sessionKeyCQewiu8n.t) {
  const explicit = ctx.SessionKey?.trim();
  if (explicit) return normalizeExplicitSessionKey(explicit, ctx);
  const raw = deriveSessionKey(scope, ctx);
  if (scope === "global") return raw;
  const canonicalAgentId = (0, _sessionKeyCQewiu8n.c)(agentId);
  const canonical = (0, _sessionKeyCQewiu8n.r)({
    agentId: canonicalAgentId,
    mainKey: (0, _sessionKeyCQewiu8n.l)(mainKey)
  });
  if (!(raw.includes(":group:") || raw.includes(":channel:"))) return canonical;
  return `agent:${canonicalAgentId}:${raw}`;
}
//#endregion /* v9-24f8dc02eadd6c3b */
