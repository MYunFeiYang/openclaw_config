"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = normalizeInputProvenance;exports.i = isInterSessionInputProvenance;exports.n = applyInputProvenanceToUserMessage;exports.r = hasInterSessionUserProvenance;exports.t = void 0;var _stringCoerceBje8XVt = require("./string-coerce-Bje8XVt9.js");
//#region src/sessions/input-provenance.ts
const INPUT_PROVENANCE_KIND_VALUES = exports.t = [
"external_user",
"inter_session",
"internal_system"];

function isInputProvenanceKind(value) {
  return typeof value === "string" && INPUT_PROVENANCE_KIND_VALUES.includes(value);
}
function normalizeInputProvenance(value) {
  if (!value || typeof value !== "object") return;
  const record = value;
  if (!isInputProvenanceKind(record.kind)) return;
  return {
    kind: record.kind,
    originSessionId: (0, _stringCoerceBje8XVt.c)(record.originSessionId),
    sourceSessionKey: (0, _stringCoerceBje8XVt.c)(record.sourceSessionKey),
    sourceChannel: (0, _stringCoerceBje8XVt.c)(record.sourceChannel),
    sourceTool: (0, _stringCoerceBje8XVt.c)(record.sourceTool)
  };
}
function applyInputProvenanceToUserMessage(message, inputProvenance) {
  if (!inputProvenance) return message;
  if (message.role !== "user") return message;
  if (normalizeInputProvenance(message.provenance)) return message;
  return {
    ...message,
    provenance: inputProvenance
  };
}
function isInterSessionInputProvenance(value) {
  return normalizeInputProvenance(value)?.kind === "inter_session";
}
function hasInterSessionUserProvenance(message) {
  if (!message || message.role !== "user") return false;
  return isInterSessionInputProvenance(message.provenance);
}
//#endregion /* v9-2c3ace977837f4e0 */
