"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = setAuthProfileOrder;exports.i = removeProviderAuthProfilesWithLock;exports.n = markAuthProfileSuccess;exports.o = upsertAuthProfile;exports.r = promoteAuthProfileInOrder;exports.s = upsertAuthProfileWithLock;exports.t = clearLastGoodProfileWithLock;var _providerIdCz7K6wgK = require("./provider-id-Cz7K6wgK.js");
var _stringNormalizationDgUPESoD = require("./string-normalization-DgUPESoD.js");
var _providerAuthAliasesDEhinO0g = require("./provider-auth-aliases-DEhinO0g.js");
var _storeCMBbDiib = require("./store-CMBbDiib.js");
var _normalizeSecretInputCH0hjbpb = require("./normalize-secret-input-CH0hjbpb.js");
var _profileListU8pxO = require("./profile-list-U8pxO857.js");
//#region src/agents/auth-profiles/profiles.ts
function resetSuccessfulUsageStats(existing, lastUsed) {
  return {
    ...existing,
    errorCount: 0,
    blockedUntil: void 0,
    blockedReason: void 0,
    blockedSource: void 0,
    blockedModel: void 0,
    cooldownUntil: void 0,
    cooldownReason: void 0,
    cooldownModel: void 0,
    disabledUntil: void 0,
    disabledReason: void 0,
    failureCounts: void 0,
    lastUsed
  };
}
function updateSuccessfulUsageStatsEntry(store, profileId, lastUsed) {
  store.usageStats = store.usageStats ?? {};
  store.usageStats[profileId] = resetSuccessfulUsageStats(store.usageStats[profileId], lastUsed);
}
async function setAuthProfileOrder(params) {
  const providerKey = (0, _providerIdCz7K6wgK.r)(params.provider);
  const deduped = (0, _profileListU8pxO.t)(params.order && Array.isArray(params.order) ? (0, _stringNormalizationDgUPESoD.s)(params.order) : []);
  return await (0, _storeCMBbDiib.p)({
    agentDir: params.agentDir,
    updater: (store) => {
      store.order = store.order ?? {};
      if (deduped.length === 0) {
        if (!store.order[providerKey]) return false;
        delete store.order[providerKey];
        if (Object.keys(store.order).length === 0) store.order = void 0;
        return true;
      }
      store.order[providerKey] = deduped;
      return true;
    }
  });
}
async function promoteAuthProfileInOrder(params) {
  const providerKey = (0, _providerAuthAliasesDEhinO0g.r)(params.provider);
  return await (0, _storeCMBbDiib.p)({
    agentDir: params.agentDir,
    updater: (store) => {
      const profile = store.profiles[params.profileId];
      if (!profile || (0, _providerAuthAliasesDEhinO0g.r)(profile.provider) !== providerKey) return false;
      const orderKey = (0, _providerIdCz7K6wgK.t)(store.order, providerKey) ?? (0, _providerIdCz7K6wgK.r)(providerKey);
      const existing = store.order?.[orderKey];
      if (!existing || existing.length === 0) return false;
      const next = (0, _profileListU8pxO.t)([params.profileId, ...existing.filter((profileId) => profileId !== params.profileId)]);
      if (next.length === existing.length && next.every((profileId, idx) => profileId === existing[idx])) return false;
      store.order = {
        ...store.order,
        [orderKey]: next
      };
      return true;
    }
  });
}
function normalizeAuthProfileCredential(credential) {
  if (credential.type === "api_key") {
    if (typeof credential.key !== "string") return credential;
    const { key: _key, ...rest } = credential;
    const key = (0, _normalizeSecretInputCH0hjbpb.n)(credential.key);
    return {
      ...rest,
      ...(key ? { key } : {})
    };
  }
  if (credential.type === "token") {
    if (typeof credential.token !== "string") return credential;
    const { token: _token, ...rest } = credential;
    const token = (0, _normalizeSecretInputCH0hjbpb.n)(credential.token);
    return {
      ...rest,
      ...(token ? { token } : {})
    };
  }
  return credential;
}
function upsertAuthProfile(params) {
  const credential = normalizeAuthProfileCredential(params.credential);
  const store = (0, _storeCMBbDiib.r)(params.agentDir);
  store.profiles[params.profileId] = credential;
  (0, _storeCMBbDiib.f)(store, params.agentDir, {
    filterExternalAuthProfiles: false,
    syncExternalCli: false
  });
}
async function upsertAuthProfileWithLock(params) {
  const credential = normalizeAuthProfileCredential(params.credential);
  return await (0, _storeCMBbDiib.p)({
    agentDir: params.agentDir,
    saveOptions: {
      filterExternalAuthProfiles: false,
      syncExternalCli: false
    },
    updater: (store) => {
      store.profiles[params.profileId] = credential;
      return true;
    }
  });
}
async function removeProviderAuthProfilesWithLock(params) {
  const providerKey = (0, _providerAuthAliasesDEhinO0g.r)(params.provider);
  const storeOrderKey = (0, _providerIdCz7K6wgK.r)(params.provider);
  return await (0, _storeCMBbDiib.p)({
    agentDir: params.agentDir,
    updater: (store) => {
      const profileIds = (0, _profileListU8pxO.n)(store, params.provider);
      let changed = false;
      for (const profileId of profileIds) {
        if (store.profiles[profileId]) {
          delete store.profiles[profileId];
          changed = true;
        }
        if (store.usageStats?.[profileId]) {
          delete store.usageStats[profileId];
          changed = true;
        }
      }
      if (store.order?.[storeOrderKey]) {
        delete store.order[storeOrderKey];
        changed = true;
        if (Object.keys(store.order).length === 0) store.order = void 0;
      }
      if (store.lastGood?.[providerKey]) {
        delete store.lastGood[providerKey];
        changed = true;
        if (Object.keys(store.lastGood).length === 0) store.lastGood = void 0;
      }
      if (store.usageStats && Object.keys(store.usageStats).length === 0) store.usageStats = void 0;
      return changed;
    }
  });
}
async function clearLastGoodProfileWithLock(params) {
  const providerKey = (0, _providerAuthAliasesDEhinO0g.r)(params.provider);
  return await (0, _storeCMBbDiib.p)({
    agentDir: params.agentDir,
    updater: (store) => {
      if (store.lastGood?.[providerKey] !== params.profileId) return false;
      delete store.lastGood[providerKey];
      if (Object.keys(store.lastGood).length === 0) store.lastGood = void 0;
      return true;
    }
  });
}
async function markAuthProfileSuccess(params) {
  const { store, provider, profileId, agentDir } = params;
  const providerKey = (0, _providerAuthAliasesDEhinO0g.r)(provider);
  const lastUsed = Date.now();
  const updated = await (0, _storeCMBbDiib.p)({
    agentDir,
    updater: (freshStore) => {
      const profile = freshStore.profiles[profileId];
      if (!profile || (0, _providerAuthAliasesDEhinO0g.r)(profile.provider) !== providerKey) return false;
      freshStore.lastGood = {
        ...freshStore.lastGood,
        [providerKey]: profileId
      };
      updateSuccessfulUsageStatsEntry(freshStore, profileId, lastUsed);
      return true;
    }
  });
  if (updated) {
    store.lastGood = updated.lastGood;
    store.usageStats = updated.usageStats;
    return;
  }
  const profile = store.profiles[profileId];
  if (!profile || (0, _providerAuthAliasesDEhinO0g.r)(profile.provider) !== providerKey) return;
  store.lastGood = {
    ...store.lastGood,
    [providerKey]: profileId
  };
  updateSuccessfulUsageStatsEntry(store, profileId, lastUsed);
  (0, _storeCMBbDiib.f)(store, agentDir);
}
//#endregion /* v9-3b9513350d8d73b6 */
