"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = listProfilesForProvider;exports.t = dedupeProfileIds;var _providerAuthAliasesCljpontN = require("./provider-auth-aliases-CljpontN.js");
//#region src/agents/auth-profiles/profile-list.ts
function dedupeProfileIds(profileIds) {
  return [...new Set(profileIds)];
}
function listProfilesForProvider(store, provider) {
  const providerKey = (0, _providerAuthAliasesCljpontN.r)(provider);
  return Object.entries(store.profiles).filter(([, cred]) => (0, _providerAuthAliasesCljpontN.r)(cred.provider) === providerKey).map(([id]) => id);
}
//#endregion /* v9-838d40f2c4a86564 */
