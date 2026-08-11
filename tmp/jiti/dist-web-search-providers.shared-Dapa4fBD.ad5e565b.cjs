"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = sortWebFetchProviders;exports.c = mapRegistryProviders;exports.i = resolveBundledWebFetchResolutionConfig;exports.l = resolveManifestDeclaredWebProviderCandidatePluginIds;exports.n = sortWebSearchProviders;exports.o = sortWebFetchProvidersForAutoDetect;exports.r = sortWebSearchProvidersForAutoDetect;exports.s = buildWebProviderSnapshotCacheKey;exports.t = resolveBundledWebSearchResolutionConfig;exports.u = resolveManifestDeclaredWebProviderCandidates;var _pluginRegistryBjn9rPwy = require("./plugin-registry-Bjn9rPwy.js");
var _pluginScopeD4tjovmo = require("./plugin-scope-D4tjovmo.js");
var _activationContextBgRMjXFt = require("./activation-context-BgRMjXFt.js");
//#region src/plugins/web-provider-resolution-shared.ts
function comparePluginProvidersAlphabetically(left, right) {
  return left.id.localeCompare(right.id) || left.pluginId.localeCompare(right.pluginId);
}
function sortPluginProviders(providers) {
  return providers.toSorted(comparePluginProvidersAlphabetically);
}
function sortPluginProvidersForAutoDetect(providers) {
  return providers.toSorted((left, right) => {
    const leftOrder = left.autoDetectOrder ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = right.autoDetectOrder ?? Number.MAX_SAFE_INTEGER;
    if (leftOrder !== rightOrder) return leftOrder - rightOrder;
    return comparePluginProvidersAlphabetically(left, right);
  });
}
function pluginManifestDeclaresProviderConfig(record, configKey, contract) {
  if ((record.contracts?.[contract]?.length ?? 0) > 0) return true;
  if (Object.keys(record.configUiHints ?? {}).some((key) => key === configKey || key.startsWith(`${configKey}.`))) return true;
  const properties = record.configSchema?.properties;
  return typeof properties === "object" && properties !== null && configKey in properties;
}
function loadInstalledWebProviderManifestRecords(params) {
  return (0, _pluginRegistryBjn9rPwy.n)({
    config: params.config,
    workspaceDir: params.workspaceDir,
    env: params.env,
    pluginIds: params.pluginIds,
    includeDisabled: true
  }).plugins;
}
function resolveManifestDeclaredWebProviderCandidatePluginIds(params) {
  return resolveManifestDeclaredWebProviderCandidates(params).pluginIds;
}
function resolveManifestDeclaredWebProviderCandidates(params) {
  const scopedPluginIds = (0, _pluginScopeD4tjovmo.i)(params.onlyPluginIds);
  if (scopedPluginIds?.length === 0) return { pluginIds: [] };
  const onlyPluginIdSet = (0, _pluginScopeD4tjovmo.t)(scopedPluginIds);
  const manifestRecords = params.manifestRecords ?? loadInstalledWebProviderManifestRecords({
    config: params.config,
    workspaceDir: params.workspaceDir,
    env: params.env,
    pluginIds: scopedPluginIds
  });
  const ids = manifestRecords.filter((plugin) => (!params.origin || plugin.origin === params.origin) && (!onlyPluginIdSet || onlyPluginIdSet.has(plugin.id)) && pluginManifestDeclaresProviderConfig(plugin, params.configKey, params.contract)).map((plugin) => plugin.id).toSorted((left, right) => left.localeCompare(right));
  if (ids.length > 0) return {
    pluginIds: ids,
    manifestRecords
  };
  if (params.origin || scopedPluginIds !== void 0) return {
    pluginIds: [],
    manifestRecords
  };
  return {
    pluginIds: void 0,
    manifestRecords
  };
}
function resolveBundledWebProviderCompatPluginIds(params) {
  return loadInstalledWebProviderManifestRecords(params).filter((plugin) => plugin.origin === "bundled" && (plugin.contracts?.[params.contract]?.length ?? 0) > 0).map((plugin) => plugin.id).toSorted((left, right) => left.localeCompare(right));
}
function resolveBundledWebProviderResolutionConfig(params) {
  const activation = (0, _activationContextBgRMjXFt.n)({
    rawConfig: params.config,
    env: params.env,
    workspaceDir: params.workspaceDir,
    applyAutoEnable: true,
    compatMode: {
      allowlist: params.bundledAllowlistCompat,
      enablement: "always",
      vitest: true
    },
    resolveCompatPluginIds: (compatParams) => resolveBundledWebProviderCompatPluginIds({
      contract: params.contract,
      ...compatParams
    })
  });
  return {
    config: activation.config,
    activationSourceConfig: activation.activationSourceConfig,
    autoEnabledReasons: activation.autoEnabledReasons
  };
}
function buildWebProviderSnapshotCacheKey(params) {
  const envKey = typeof params.envKey === "string" ? params.envKey : Object.entries(params.envKey).toSorted(([left], [right]) => left.localeCompare(right));
  const onlyPluginIds = (0, _pluginScopeD4tjovmo.i)(params.onlyPluginIds);
  return JSON.stringify({
    workspaceDir: params.workspaceDir ?? "",
    bundledAllowlistCompat: params.bundledAllowlistCompat === true,
    origin: params.origin ?? "",
    onlyPluginIds: (0, _pluginScopeD4tjovmo.a)(onlyPluginIds),
    env: envKey
  });
}
function mapRegistryProviders(params) {
  const onlyPluginIdSet = (0, _pluginScopeD4tjovmo.t)((0, _pluginScopeD4tjovmo.i)(params.onlyPluginIds));
  return params.sortProviders(params.entries.filter((entry) => !onlyPluginIdSet || onlyPluginIdSet.has(entry.pluginId)).map((entry) => Object.assign({}, entry.provider, { pluginId: entry.pluginId })));
}
//#endregion
//#region src/plugins/web-fetch-providers.shared.ts
function sortWebFetchProviders(providers) {
  return sortPluginProviders(providers);
}
function sortWebFetchProvidersForAutoDetect(providers) {
  return sortPluginProvidersForAutoDetect(providers);
}
function resolveBundledWebFetchResolutionConfig(params) {
  return resolveBundledWebProviderResolutionConfig({
    contract: "webFetchProviders",
    config: params.config,
    workspaceDir: params.workspaceDir,
    env: params.env,
    bundledAllowlistCompat: params.bundledAllowlistCompat
  });
}
//#endregion
//#region src/plugins/web-search-providers.shared.ts
function sortWebSearchProviders(providers) {
  return sortPluginProviders(providers);
}
function sortWebSearchProvidersForAutoDetect(providers) {
  return sortPluginProvidersForAutoDetect(providers);
}
function resolveBundledWebSearchResolutionConfig(params) {
  return resolveBundledWebProviderResolutionConfig({
    contract: "webSearchProviders",
    config: params.config,
    workspaceDir: params.workspaceDir,
    env: params.env,
    bundledAllowlistCompat: params.bundledAllowlistCompat
  });
}
//#endregion /* v9-cc399c69ec49850e */
