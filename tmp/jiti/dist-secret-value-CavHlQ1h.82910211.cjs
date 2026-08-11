"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = hasConfiguredPlaintextSecretValue;exports.r = isExpectedResolvedSecretValue;exports.t = assertExpectedResolvedSecretValue;var _utilsDvkbxKCZ = require("./utils-DvkbxKCZ.js");
var _sharedC9ga15VD = require("./shared-C9ga15VD.js");
//#region src/secrets/secret-value.ts
function isExpectedResolvedSecretValue(value, expected) {
  if (expected === "string") return (0, _sharedC9ga15VD.n)(value);
  return (0, _sharedC9ga15VD.n)(value) || (0, _utilsDvkbxKCZ.c)(value);
}
function hasConfiguredPlaintextSecretValue(value, expected) {
  if (expected === "string") return (0, _sharedC9ga15VD.n)(value);
  return (0, _sharedC9ga15VD.n)(value) || (0, _utilsDvkbxKCZ.c)(value) && Object.keys(value).length > 0;
}
function assertExpectedResolvedSecretValue(params) {
  if (!isExpectedResolvedSecretValue(params.value, params.expected)) throw new Error(params.errorMessage);
}
//#endregion /* v9-1b8bd79f7cdd4b63 */
