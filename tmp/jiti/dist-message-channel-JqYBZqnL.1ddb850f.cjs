"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = isOperatorUiClient;exports.c = isGatewayMessageChannel;exports.d = resolveGatewayMessageChannel;exports.f = resolveMessageChannel;exports.i = isMarkdownCapableMessageChannel;exports.l = void 0;exports.n = isGatewayCliClient;exports.o = isWebchatClient;exports.r = isInternalMessageChannel;exports.s = isDeliverableMessageChannel;exports.t = isBrowserOperatorUiClient;exports.u = normalizeMessageChannel;var _idsCRqUrRLW = require("./ids-CRqUrRLW.js");
var _chatMetaBtJ8Pxrm = require("./chat-meta-BtJ8Pxrm.js");
var _registryOM2UOqu = require("./registry-O-m2UOqu.js");
var _clientInfoWu8nEST = require("./client-info-wu-8nEST.js");
var _messageChannelCoreRsgWXY6u = require("./message-channel-core-rsgWXY6u.js");
//#region src/utils/message-channel-normalize.ts
function normalizeMessageChannel(raw) {
  return (0, _messageChannelCoreRsgWXY6u.n)(raw);
}
const listPluginChannelIds = () => {
  return (0, _registryOM2UOqu.i)();
};
const listDeliverableMessageChannels = () => Array.from(new Set([..._idsCRqUrRLW.t, ...listPluginChannelIds()]));exports.l = listDeliverableMessageChannels;
const listGatewayMessageChannels = () => [...listDeliverableMessageChannels(), _messageChannelCoreRsgWXY6u.r];
function isGatewayMessageChannel(value) {
  return listGatewayMessageChannels().includes(value);
}
function isDeliverableMessageChannel(value) {
  return listDeliverableMessageChannels().includes(value);
}
function resolveGatewayMessageChannel(raw) {
  const normalized = normalizeMessageChannel(raw);
  if (!normalized) return;
  return isGatewayMessageChannel(normalized) ? normalized : void 0;
}
function resolveMessageChannel(primary, fallback) {
  return normalizeMessageChannel(primary) ?? normalizeMessageChannel(fallback);
}
//#endregion
//#region src/utils/message-channel.ts
function isGatewayCliClient(client) {
  return (0, _clientInfoWu8nEST.s)(client?.mode) === _clientInfoWu8nEST.r.CLI;
}
function isOperatorUiClient(client) {
  const clientId = (0, _clientInfoWu8nEST.c)(client?.id);
  return clientId === _clientInfoWu8nEST.i.CONTROL_UI || clientId === _clientInfoWu8nEST.i.TUI;
}
function isBrowserOperatorUiClient(client) {
  return (0, _clientInfoWu8nEST.c)(client?.id) === _clientInfoWu8nEST.i.CONTROL_UI;
}
function isInternalMessageChannel(raw) {
  return normalizeMessageChannel(raw) === _messageChannelCoreRsgWXY6u.r;
}
function isWebchatClient(client) {
  if ((0, _clientInfoWu8nEST.s)(client?.mode) === _clientInfoWu8nEST.r.WEBCHAT) return true;
  return (0, _clientInfoWu8nEST.c)(client?.id) === _clientInfoWu8nEST.i.WEBCHAT_UI;
}
function isMarkdownCapableMessageChannel(raw) {
  const channel = normalizeMessageChannel(raw);
  if (!channel) return false;
  if (channel === "webchat" || channel === "tui") return true;
  const builtInChannel = (0, _idsCRqUrRLW.r)(channel);
  if (builtInChannel) return (0, _chatMetaBtJ8Pxrm.t)(builtInChannel).markdownCapable === true;
  return (0, _registryOM2UOqu.r)(channel)?.markdownCapable === true;
}
//#endregion /* v9-005e96ba1e2b4d24 */
