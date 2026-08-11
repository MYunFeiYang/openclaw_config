"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = resolveAuthProfileMetadata;exports.t = buildAuthProfileId;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
//#region src/agents/auth-profiles/identity.ts
function resolveStoredMetadata(store, profileId) {
  const profile = store?.profiles[profileId];
  if (!profile) return {};
  return {
    displayName: "displayName" in profile ? (0, _stringCoerceLndEvhRk.c)(profile.displayName) : void 0,
    email: "email" in profile ? (0, _stringCoerceLndEvhRk.c)(profile.email) : void 0
  };
}
function buildAuthProfileId(params) {
  return `${(0, _stringCoerceLndEvhRk.c)(params.profilePrefix) ?? params.providerId}:${(0, _stringCoerceLndEvhRk.c)(params.profileName) ?? "default"}`;
}
function resolveAuthProfileMetadata(params) {
  const configured = params.cfg?.auth?.profiles?.[params.profileId];
  const stored = resolveStoredMetadata(params.store, params.profileId);
  return {
    displayName: (0, _stringCoerceLndEvhRk.c)(configured?.displayName) ?? stored.displayName,
    email: (0, _stringCoerceLndEvhRk.c)(configured?.email) ?? stored.email
  };
}
//#endregion /* v9-1ed240d465d8c6f3 */
