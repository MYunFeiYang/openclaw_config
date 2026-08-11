"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = listChatChannels;exports.r = buildChatChannelMetaById;exports.t = getChatChannelMeta;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
var _idsCRqUrRLW = require("./ids-CRqUrRLW.js");
var _channelMetaDac3KOpV = require("./channel-meta-Dac3KOpV.js");
//#region src/channels/chat-meta-shared.ts
const CHAT_CHANNEL_ID_SET = new Set(_idsCRqUrRLW.n);
function toChatChannelMeta(params) {
  const label = (0, _stringCoerceLndEvhRk.c)(params.channel.label);
  if (!label) throw new Error(`Missing label for bundled chat channel "${params.id}"`);
  return (0, _channelMetaDac3KOpV.t)({
    id: params.id,
    channel: params.channel,
    label,
    selectionLabel: (0, _stringCoerceLndEvhRk.c)(params.channel.selectionLabel) || label,
    docsPath: (0, _stringCoerceLndEvhRk.c)(params.channel.docsPath) || `/channels/${params.id}`,
    docsLabel: (0, _stringCoerceLndEvhRk.c)(params.channel.docsLabel),
    blurb: (0, _stringCoerceLndEvhRk.c)(params.channel.blurb) || "",
    detailLabel: (0, _stringCoerceLndEvhRk.c)(params.channel.detailLabel),
    systemImage: (0, _stringCoerceLndEvhRk.c)(params.channel.systemImage),
    arrayFieldMode: "non-empty",
    selectionDocsPrefixMode: "defined"
  });
}
function buildChatChannelMetaById() {
  const entries = /* @__PURE__ */new Map();
  for (const entry of (0, _idsCRqUrRLW.i)()) {
    const rawId = (0, _stringCoerceLndEvhRk.c)(entry.id);
    if (!rawId || !CHAT_CHANNEL_ID_SET.has(rawId)) continue;
    const id = rawId;
    entries.set(id, toChatChannelMeta({
      id,
      channel: entry.channel
    }));
  }
  return Object.freeze(Object.fromEntries(entries));
}
//#endregion
//#region src/channels/chat-meta.ts
const CHAT_CHANNEL_META = buildChatChannelMetaById();
function listChatChannels() {
  return _idsCRqUrRLW.n.map((id) => CHAT_CHANNEL_META[id]);
}
function getChatChannelMeta(id) {
  return CHAT_CHANNEL_META[id];
}
//#endregion /* v9-d3855af62d4f2a78 */
