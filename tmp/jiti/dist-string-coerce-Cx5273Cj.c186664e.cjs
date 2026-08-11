"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = normalizeOptionalString;exports.t = normalizeLowercaseStringOrEmpty; //#region node_modules/@openclaw/fs-safe/dist/string-coerce.js
function normalizeNullableString(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
function normalizeOptionalString(value) {
  return normalizeNullableString(value) ?? void 0;
}
function normalizeOptionalLowercaseString(value) {
  return normalizeOptionalString(value)?.toLowerCase();
}
function normalizeLowercaseStringOrEmpty(value) {
  return normalizeOptionalLowercaseString(value) ?? "";
}
//#endregion /* v9-f90446e265793b1a */
