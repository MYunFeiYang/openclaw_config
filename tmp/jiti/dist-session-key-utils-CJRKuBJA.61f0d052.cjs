"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = isSubagentSessionKey;exports.c = parseAgentSessionKey;exports.i = isCronSessionKey;exports.l = parseRawSessionConversationRef;exports.n = isAcpSessionKey;exports.o = normalizeSessionKeyPreservingOpaquePeerIds;exports.r = isCronRunSessionKey;exports.s = normalizeSessionPeerId;exports.t = getSubagentDepth;exports.u = parseThreadSessionSuffix;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
//#region src/sessions/session-key-utils.ts
function normalizeSessionPeerId(params) {
  const peerId = (params.peerId ?? "").trim();
  if (!peerId) return "";
  const channel = (0, _stringCoerceLndEvhRk.a)(params.channel);
  const peerKind = (0, _stringCoerceLndEvhRk.a)(params.peerKind);
  return channel === "signal" && peerKind === "group" ? peerId : (0, _stringCoerceLndEvhRk.a)(peerId);
}
const SIGNAL_GROUP_SESSION_SEGMENT_RE = /(^|:)signal:group:([^:]+)/gi;
function normalizeSessionKeyPreservingOpaquePeerIds(sessionKey) {
  const raw = (0, _stringCoerceLndEvhRk.c)(sessionKey);
  if (!raw) return "";
  let normalized = "";
  let cursor = 0;
  for (const match of raw.matchAll(SIGNAL_GROUP_SESSION_SEGMENT_RE)) {
    const matchIndex = match.index ?? 0;
    const matched = match[0] ?? "";
    const peerId = match[2] ?? "";
    const peerStart = matchIndex + matched.length - peerId.length;
    normalized += (0, _stringCoerceLndEvhRk.a)(raw.slice(cursor, peerStart));
    normalized += peerId.trim();
    cursor = matchIndex + matched.length;
  }
  normalized += (0, _stringCoerceLndEvhRk.a)(raw.slice(cursor));
  return normalized;
}
/**
* Parse agent-scoped session keys in a canonical, case-insensitive way.
* Returned values are canonicalized for stable comparisons/routing while
* preserving provider-owned opaque peer IDs.
*/
function parseAgentSessionKey(sessionKey) {
  const raw = normalizeSessionKeyPreservingOpaquePeerIds(sessionKey);
  if (!raw) return null;
  const parts = raw.split(":").filter(Boolean);
  if (parts.length < 3) return null;
  if (parts[0] !== "agent") return null;
  const agentId = (0, _stringCoerceLndEvhRk.c)(parts[1]);
  const rest = parts.slice(2).join(":");
  if (!agentId || !rest) return null;
  return {
    agentId,
    rest
  };
}
function isCronRunSessionKey(sessionKey) {
  const parsed = parseAgentSessionKey(sessionKey);
  if (!parsed) return false;
  return /^cron:[^:]+:run:[^:]+(?::|$)/.test(parsed.rest);
}
function isCronSessionKey(sessionKey) {
  const parsed = parseAgentSessionKey(sessionKey);
  if (!parsed) return false;
  return (0, _stringCoerceLndEvhRk.s)(parsed.rest)?.startsWith("cron:") === true;
}
function isSubagentSessionKey(sessionKey) {
  const raw = (0, _stringCoerceLndEvhRk.c)(sessionKey);
  if (!raw) return false;
  if ((0, _stringCoerceLndEvhRk.s)(raw)?.startsWith("subagent:")) return true;
  return (0, _stringCoerceLndEvhRk.s)(parseAgentSessionKey(raw)?.rest)?.startsWith("subagent:") === true;
}
function getSubagentDepth(sessionKey) {
  const raw = (0, _stringCoerceLndEvhRk.s)(sessionKey);
  if (!raw) return 0;
  return raw.split(":subagent:").length - 1;
}
function isAcpSessionKey(sessionKey) {
  const raw = (0, _stringCoerceLndEvhRk.c)(sessionKey);
  if (!raw) return false;
  if ((0, _stringCoerceLndEvhRk.a)(raw).startsWith("acp:")) return true;
  return (0, _stringCoerceLndEvhRk.s)(parseAgentSessionKey(raw)?.rest)?.startsWith("acp:") === true;
}
function parseThreadSessionSuffix(sessionKey) {
  const raw = (0, _stringCoerceLndEvhRk.c)(sessionKey);
  if (!raw) return {
    baseSessionKey: void 0,
    threadId: void 0
  };
  const markerIndex = (0, _stringCoerceLndEvhRk.a)(raw).lastIndexOf(":thread:");
  return {
    baseSessionKey: markerIndex === -1 ? raw : raw.slice(0, markerIndex),
    threadId: (0, _stringCoerceLndEvhRk.c)(markerIndex === -1 ? void 0 : raw.slice(markerIndex + 8))
  };
}
function parseRawSessionConversationRef(sessionKey) {
  const raw = (0, _stringCoerceLndEvhRk.c)(sessionKey);
  if (!raw) return null;
  const rawParts = raw.split(":").filter(Boolean);
  const bodyStartIndex = rawParts.length >= 3 && (0, _stringCoerceLndEvhRk.s)(rawParts[0]) === "agent" ? 2 : 0;
  const parts = rawParts.slice(bodyStartIndex);
  if (parts.length < 3) return null;
  const channel = (0, _stringCoerceLndEvhRk.s)(parts[0]);
  const kind = (0, _stringCoerceLndEvhRk.s)(parts[1]);
  if (!channel || kind !== "group" && kind !== "channel") return null;
  const rawId = (0, _stringCoerceLndEvhRk.c)(parts.slice(2).join(":"));
  const prefix = (0, _stringCoerceLndEvhRk.c)(rawParts.slice(0, bodyStartIndex + 2).join(":"));
  if (!rawId || !prefix) return null;
  return {
    channel,
    kind,
    rawId,
    prefix
  };
}
//#endregion /* v9-a6035b30b09006bb */
