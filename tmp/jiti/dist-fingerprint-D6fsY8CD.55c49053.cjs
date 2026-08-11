"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.t = normalizeFingerprint;var _stringCoerceBje8XVt = require("./string-coerce-Bje8XVt9.js");
//#region src/infra/tls/fingerprint.ts
function normalizeFingerprint(input) {
  return (0, _stringCoerceBje8XVt.a)(input.trim().replace(/^sha-?256\s*:?\s*/i, "").replace(/[^a-fA-F0-9]/g, ""));
}
//#endregion /* v9-72bd0dcad053b9f9 */
