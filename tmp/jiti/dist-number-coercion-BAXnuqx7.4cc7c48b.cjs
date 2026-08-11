"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = asPositiveSafeInteger;exports.t = asFiniteNumber; //#region src/shared/number-coercion.ts
function asFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : void 0;
}
function asPositiveSafeInteger(value) {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : void 0;
}
//#endregion /* v9-907415f6fd5e833b */
