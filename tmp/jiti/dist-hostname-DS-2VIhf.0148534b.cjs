"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.t = normalizeHostname;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
//#region src/infra/net/hostname.ts
function normalizeHostname(hostname) {
  const normalized = (0, _stringCoerceLndEvhRk.a)(hostname).replace(/\.$/, "");
  if (normalized.startsWith("[") && normalized.endsWith("]")) return normalized.slice(1, -1);
  return normalized;
}
//#endregion /* v9-8a0379aea63e03f1 */
