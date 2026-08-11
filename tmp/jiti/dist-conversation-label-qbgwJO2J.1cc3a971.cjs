"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.t = resolveConversationLabel;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
var _chatTypeIZp5kgRa = require("./chat-type-IZp5kgRa.js");
//#region src/channels/conversation-label.ts
function extractConversationId(from) {
  const trimmed = (0, _stringCoerceLndEvhRk.c)(from);
  if (!trimmed) return;
  const parts = trimmed.split(":").filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : trimmed;
}
function shouldAppendId(id) {
  if (/^[0-9]+$/.test(id)) return true;
  if (/^[^\s:@]+@[^\s:@]+$/.test(id)) return true;
  return false;
}
function resolveConversationLabel(ctx) {
  const explicit = (0, _stringCoerceLndEvhRk.c)(ctx.ConversationLabel);
  if (explicit) return explicit;
  const threadLabel = (0, _stringCoerceLndEvhRk.c)(ctx.ThreadLabel);
  if (threadLabel) return threadLabel;
  if ((0, _chatTypeIZp5kgRa.t)(ctx.ChatType) === "direct") return (0, _stringCoerceLndEvhRk.c)(ctx.SenderName) ?? (0, _stringCoerceLndEvhRk.c)(ctx.From);
  const base = (0, _stringCoerceLndEvhRk.c)(ctx.GroupChannel) || (0, _stringCoerceLndEvhRk.c)(ctx.GroupSubject) || (0, _stringCoerceLndEvhRk.c)(ctx.GroupSpace) || (0, _stringCoerceLndEvhRk.c)(ctx.From) || "";
  if (!base) return;
  const id = extractConversationId(ctx.From);
  if (!id) return base;
  if (!shouldAppendId(id)) return base;
  if (base === id) return base;
  if (base.includes(id)) return base;
  if ((0, _stringCoerceLndEvhRk.a)(base).includes(" id:")) return base;
  if (base.startsWith("#") || base.startsWith("@")) return base;
  return `${base} id:${id}`;
}
//#endregion /* v9-10dfc15144521e3c */
