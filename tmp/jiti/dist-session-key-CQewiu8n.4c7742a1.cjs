"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = buildGroupHistoryKey;exports.c = normalizeAgentId;exports.d = resolveEventSessionKey;exports.f = resolveThreadSessionKeys;exports.g = toAgentStoreSessionKey;exports.h = toAgentRequestSessionKey;exports.i = buildAgentPeerSessionKey;exports.l = normalizeMainKey;exports.m = scopedHeartbeatWakeOptions;exports.n = void 0;exports.o = classifySessionKeyShape;exports.p = sanitizeAgentId;exports.r = buildAgentMainSessionKey;exports.s = isValidAgentId;exports.t = void 0;exports.u = resolveAgentIdFromSessionKey;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
var _sessionKeyUtilsCJRKuBJA = require("./session-key-utils-CJRKuBJA.js");
var _accountId9_btbLFO = require("./account-id-9_btbLFO.js");
//#region src/routing/session-key.ts
const DEFAULT_AGENT_ID = exports.t = "main";
const DEFAULT_MAIN_KEY = exports.n = "main";
const VALID_ID_RE = /^[a-z0-9][a-z0-9_-]{0,63}$/i;
const INVALID_CHARS_RE = /[^a-z0-9_-]+/g;
const LEADING_DASH_RE = /^-+/;
const TRAILING_DASH_RE = /-+$/;
function normalizeToken(value) {
  return (0, _stringCoerceLndEvhRk.a)(value);
}
function scopedHeartbeatWakeOptions(sessionKey, wakeOptions, mainKey, scope) {
  const parsed = (0, _sessionKeyUtilsCJRKuBJA.c)(sessionKey);
  if (!parsed) return wakeOptions;
  if ((0, _sessionKeyUtilsCJRKuBJA.r)(sessionKey)) {
    if (scope === "global") return {
      ...wakeOptions,
      agentId: parsed.agentId
    };
    return {
      ...wakeOptions,
      sessionKey: buildAgentMainSessionKey({
        agentId: parsed.agentId,
        mainKey
      })
    };
  }
  return {
    ...wakeOptions,
    sessionKey
  };
}
function resolveEventSessionKey(sessionKey, mainKey, scope) {
  const parsed = (0, _sessionKeyUtilsCJRKuBJA.c)(sessionKey);
  if (!parsed || !(0, _sessionKeyUtilsCJRKuBJA.r)(sessionKey)) return sessionKey;
  if (scope === "global") return "global";
  return buildAgentMainSessionKey({
    agentId: parsed.agentId,
    mainKey
  });
}
function normalizeMainKey(value) {
  return (0, _stringCoerceLndEvhRk.a)(value) || "main";
}
function toAgentRequestSessionKey(storeKey) {
  const raw = (storeKey ?? "").trim();
  if (!raw) return;
  return (0, _sessionKeyUtilsCJRKuBJA.c)(raw)?.rest ?? raw;
}
function toAgentStoreSessionKey(params) {
  const raw = (params.requestKey ?? "").trim();
  const lowered = (0, _stringCoerceLndEvhRk.a)(raw);
  if (!raw || lowered === "main") return buildAgentMainSessionKey({
    agentId: params.agentId,
    mainKey: params.mainKey
  });
  const parsed = (0, _sessionKeyUtilsCJRKuBJA.c)(raw);
  if (parsed) return `agent:${parsed.agentId}:${parsed.rest}`;
  const normalized = (0, _sessionKeyUtilsCJRKuBJA.o)(raw);
  if (lowered.startsWith("agent:")) return normalized;
  return `agent:${normalizeAgentId(params.agentId)}:${normalized}`;
}
function resolveAgentIdFromSessionKey(sessionKey) {
  return normalizeAgentId((0, _sessionKeyUtilsCJRKuBJA.c)(sessionKey)?.agentId ?? "main");
}
function classifySessionKeyShape(sessionKey) {
  const raw = (sessionKey ?? "").trim();
  if (!raw) return "missing";
  if ((0, _sessionKeyUtilsCJRKuBJA.c)(raw)) return "agent";
  return (0, _stringCoerceLndEvhRk.a)(raw).startsWith("agent:") ? "malformed_agent" : "legacy_or_alias";
}
function normalizeAgentId(value) {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return DEFAULT_AGENT_ID;
  const normalized = (0, _stringCoerceLndEvhRk.a)(trimmed);
  if (VALID_ID_RE.test(trimmed)) return normalized;
  return normalized.replace(INVALID_CHARS_RE, "-").replace(LEADING_DASH_RE, "").replace(TRAILING_DASH_RE, "").slice(0, 64) || "main";
}
function isValidAgentId(value) {
  const trimmed = (value ?? "").trim();
  return Boolean(trimmed) && VALID_ID_RE.test(trimmed);
}
function sanitizeAgentId(value) {
  return normalizeAgentId(value);
}
function buildAgentMainSessionKey(params) {
  return `agent:${normalizeAgentId(params.agentId)}:${normalizeMainKey(params.mainKey)}`;
}
function buildAgentPeerSessionKey(params) {
  const peerKind = params.peerKind ?? "direct";
  if (peerKind === "direct") {
    const dmScope = params.dmScope ?? "main";
    let peerId = (params.peerId ?? "").trim();
    const linkedPeerId = dmScope === "main" ? null : resolveLinkedPeerId({
      identityLinks: params.identityLinks,
      channel: params.channel,
      peerId
    });
    if (linkedPeerId) peerId = linkedPeerId;
    peerId = (0, _stringCoerceLndEvhRk.a)(peerId);
    if (dmScope === "per-account-channel-peer" && peerId) {
      const channel = (0, _stringCoerceLndEvhRk.a)(params.channel) || "unknown";
      const accountId = (0, _accountId9_btbLFO.n)(params.accountId);
      return `agent:${normalizeAgentId(params.agentId)}:${channel}:${accountId}:direct:${peerId}`;
    }
    if (dmScope === "per-channel-peer" && peerId) {
      const channel = (0, _stringCoerceLndEvhRk.a)(params.channel) || "unknown";
      return `agent:${normalizeAgentId(params.agentId)}:${channel}:direct:${peerId}`;
    }
    if (dmScope === "per-peer" && peerId) return `agent:${normalizeAgentId(params.agentId)}:direct:${peerId}`;
    return buildAgentMainSessionKey({
      agentId: params.agentId,
      mainKey: params.mainKey
    });
  }
  const channel = (0, _stringCoerceLndEvhRk.a)(params.channel) || "unknown";
  const peerId = (0, _sessionKeyUtilsCJRKuBJA.s)({
    channel: params.channel,
    peerKind,
    peerId: params.peerId
  }) || "unknown";
  return `agent:${normalizeAgentId(params.agentId)}:${channel}:${peerKind}:${peerId}`;
}
function resolveLinkedPeerId(params) {
  const identityLinks = params.identityLinks;
  if (!identityLinks) return null;
  const peerId = params.peerId.trim();
  if (!peerId) return null;
  const candidates = /* @__PURE__ */new Set();
  const rawCandidate = normalizeToken(peerId);
  if (rawCandidate) candidates.add(rawCandidate);
  const channel = normalizeToken(params.channel);
  if (channel) {
    const scopedCandidate = normalizeToken(`${channel}:${peerId}`);
    if (scopedCandidate) candidates.add(scopedCandidate);
  }
  if (candidates.size === 0) return null;
  for (const [canonical, ids] of Object.entries(identityLinks)) {
    const canonicalName = canonical.trim();
    if (!canonicalName) continue;
    if (!Array.isArray(ids)) continue;
    for (const id of ids) {
      const normalized = normalizeToken(id);
      if (normalized && candidates.has(normalized)) return canonicalName;
    }
  }
  return null;
}
function buildGroupHistoryKey(params) {
  const channel = normalizeToken(params.channel) || "unknown";
  const accountId = (0, _accountId9_btbLFO.n)(params.accountId);
  const peerId = (0, _sessionKeyUtilsCJRKuBJA.s)({
    channel,
    peerKind: params.peerKind,
    peerId: params.peerId
  }) || "unknown";
  return `${channel}:${accountId}:${params.peerKind}:${peerId}`;
}
function resolveThreadSessionKeys(params) {
  const threadId = (params.threadId ?? "").trim();
  if (!threadId) return {
    sessionKey: params.baseSessionKey,
    parentSessionKey: void 0
  };
  const normalizedThread = params.normalizeThreadId?.(threadId) ?? (0, _stringCoerceLndEvhRk.a)(threadId);
  return {
    sessionKey: params.useSuffix ?? true ? `${params.baseSessionKey}:thread:${normalizedThread}` : params.baseSessionKey,
    parentSessionKey: params.parentSessionKey
  };
}
//#endregion /* v9-c059a1444b24f5ec */
