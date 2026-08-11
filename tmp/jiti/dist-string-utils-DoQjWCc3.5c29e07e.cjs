"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = normalizeOptionalLowercaseString;exports.r = normalizeOptionalString;exports.t = normalizeLowercaseStringOrEmpty; //#region packages/memory-host-sdk/src/host/string-utils.ts
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
//#endregion /* v9-b2e9e9b39122bfe9 */
