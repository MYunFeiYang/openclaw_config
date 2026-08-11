"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.t = normalizeAnyChannelId;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
var _registryLookup5ZKa5BSl = require("./registry-lookup-5ZKa5BSl.js");
//#region src/channels/registry-normalize.ts
function normalizeAnyChannelId(raw) {
  const key = (0, _stringCoerceLndEvhRk.s)(raw);
  if (!key) return null;
  return (0, _registryLookup5ZKa5BSl.t)(key)?.plugin.id ?? null;
}
//#endregion /* v9-aab8af75c31c3f81 */
