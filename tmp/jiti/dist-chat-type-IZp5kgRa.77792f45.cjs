"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.t = normalizeChatType;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
//#region src/channels/chat-type.ts
function normalizeChatType(raw) {
  const value = (0, _stringCoerceLndEvhRk.s)(raw);
  if (!value) return;
  if (value === "direct" || value === "dm") return "direct";
  if (value === "group") return "group";
  if (value === "channel") return "channel";
}
//#endregion /* v9-f9d7c664796c3b20 */
