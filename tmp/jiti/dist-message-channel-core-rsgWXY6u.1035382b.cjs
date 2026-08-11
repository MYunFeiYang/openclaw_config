"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.i = isInternalNonDeliveryChannel;exports.n = normalizeMessageChannel;exports.r = void 0;exports.t = isDeliverableMessageChannel;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
var _idsCRqUrRLW = require("./ids-CRqUrRLW.js");
var _registryNormalizeD0S8ReSJ = require("./registry-normalize-D0S8ReSJ.js");
//#region src/utils/message-channel-constants.ts
const INTERNAL_MESSAGE_CHANNEL = exports.r = "webchat";
const INTERNAL_NON_DELIVERY_CHANNELS = [
"heartbeat",
"cron",
"webhook",
"voice"];

function isInternalNonDeliveryChannel(value) {
  return INTERNAL_NON_DELIVERY_CHANNELS.includes(value);
}
//#endregion
//#region src/utils/message-channel-core.ts
function normalizeMessageChannel(raw) {
  const normalized = (0, _stringCoerceLndEvhRk.s)(raw);
  if (!normalized) return;
  if (normalized === "webchat") return INTERNAL_MESSAGE_CHANNEL;
  const builtIn = (0, _idsCRqUrRLW.r)(normalized);
  if (builtIn) return builtIn;
  return (0, _registryNormalizeD0S8ReSJ.t)(normalized) ?? normalized;
}
function isDeliverableMessageChannel(value) {
  const normalized = normalizeMessageChannel(value);
  return normalized !== void 0 && normalized !== "webchat" && normalized === value;
}
//#endregion /* v9-be23bfdc728dc572 */
