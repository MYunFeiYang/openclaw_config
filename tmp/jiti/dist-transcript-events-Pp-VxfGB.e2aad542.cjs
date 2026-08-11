"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = onSessionTranscriptUpdate;exports.t = emitSessionTranscriptUpdate;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
var _numberCoercionBAXnuqx = require("./number-coercion-BAXnuqx7.js");
//#region src/sessions/transcript-events.ts
const SESSION_TRANSCRIPT_LISTENERS = /* @__PURE__ */new Set();
function onSessionTranscriptUpdate(listener) {
  SESSION_TRANSCRIPT_LISTENERS.add(listener);
  return () => {
    SESSION_TRANSCRIPT_LISTENERS.delete(listener);
  };
}
function emitSessionTranscriptUpdate(update) {
  const normalized = typeof update === "string" ? { sessionFile: update } : {
    sessionFile: update.sessionFile,
    sessionKey: update.sessionKey,
    message: update.message,
    messageId: update.messageId,
    messageSeq: update.messageSeq
  };
  const trimmed = (0, _stringCoerceLndEvhRk.c)(normalized.sessionFile);
  if (!trimmed) return;
  const messageSeq = (0, _numberCoercionBAXnuqx.n)(normalized.messageSeq);
  const nextUpdate = {
    sessionFile: trimmed,
    ...((0, _stringCoerceLndEvhRk.c)(normalized.sessionKey) ? { sessionKey: (0, _stringCoerceLndEvhRk.c)(normalized.sessionKey) } : {}),
    ...(normalized.message !== void 0 ? { message: normalized.message } : {}),
    ...((0, _stringCoerceLndEvhRk.c)(normalized.messageId) ? { messageId: (0, _stringCoerceLndEvhRk.c)(normalized.messageId) } : {}),
    ...(messageSeq !== void 0 ? { messageSeq } : {})
  };
  for (const listener of SESSION_TRANSCRIPT_LISTENERS) try {
    listener(nextUpdate);
  } catch {}
}
//#endregion /* v9-92b0afa379c6524e */
