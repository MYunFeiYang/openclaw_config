"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = listProfilesForProvider;exports.t = dedupeProfileIds;var _providerAuthAliasesDEhinO0g = require("./provider-auth-aliases-DEhinO0g.js");
//#region src/agents/auth-profiles/profile-list.ts
function dedupeProfileIds(profileIds) {
  return [...new Set(profileIds)];
}
function listProfilesForProvider(store, provider) {
  const providerKey = (0, _providerAuthAliasesDEhinO0g.r)(provider);
  return Object.entries(store.profiles).filter(([, cred]) => (0, _providerAuthAliasesDEhinO0g.r)(cred.provider) === providerKey).map(([id]) => id);
}
//#endregion /* v9-b9a2c5203d1e25fc */
