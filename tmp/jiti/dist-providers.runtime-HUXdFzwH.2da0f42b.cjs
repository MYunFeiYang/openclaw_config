"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = resolvePluginProviders;exports.r = resolveProviderConfigApiOwnerHint;exports.t = isPluginProvidersLoadInFlight;var _providerIdCz7K6wgK = require("./provider-id-Cz7K6wgK.js");
var _pluginScopeCEsy4RJw = require("./plugin-scope-CEsy4RJw.js");
var _pluginAutoEnableCa3CdPro = require("./plugin-auto-enable-Ca3CdPro.js");
var _activationContextD2jW_eS_ = require("./activation-context-D2jW_eS_.js");
var _activationPlannerBPlWGPj = require("./activation-planner-BPlWGPj-.js");
var _loaderCZB9kQVT = require("./loader-CZB9kQVT.js");
var _runtimeOTX8N6Lz = require("./runtime-OTX8N6Lz.js");
var _activeRuntimeRegistryBuS8FQfM = require("./active-runtime-registry-BuS8FQfM.js");
var _loadContextCDm_CIm = require("./load-context-CDm_-cIm.js");
//#region src/plugins/provider-config-owner.ts
function resolveProviderConfigApiOwnerHint(params) {
  const providers = params.config?.models?.providers;
  if (!providers) return;
  const normalizedProvider = (0, _providerIdCz7K6wgK.r)(params.provider);
  if (!normalizedProvider) return;
  const providerConfig = providers[params.provider] ?? Object.entries(providers).find(([candidateId]) => (0, _providerIdCz7K6wgK.r)(candidateId) === normalizedProvider)?.[1];
  const api = typeof providerConfig?.api === "string" ? (0, _providerIdCz7K6wgK.r)(providerConfig.api) : "";
  if (!api || api === normalizedProvider) return;
  return api;
}
//#endregion
//#region src/plugins/providers.runtime.ts
function dedupeSortedPluginIds(values) {
  return [...new Set(values)].toSorted((left, right) => left.localeCompare(right));
}
function resolveExplicitProviderOwnerPluginIds(params) {
  return dedupeSortedPluginIds(params.providerRefs.flatMap((provider) => {
    const plannedPluginIds = (0, _activationPlannerBPlWGPj.t)({
      trigger: {
        kind: "provider",
        provider
      },
      config: params.config,
      workspaceDir: params.workspaceDir,
      env: params.env,
      manifestRecords: params.pluginMetadataSnapshot?.manifestRegistry.plugins
    });
    if (plannedPluginIds.length > 0) return plannedPluginIds;
    const apiOwnerHint = resolveProviderConfigApiOwnerHint({
      provider,
      config: params.config
    });
    if (apiOwnerHint) {
      const apiOwnerPluginIds = (0, _activationPlannerBPlWGPj.t)({
        trigger: {
          kind: "provider",
          provider: apiOwnerHint
        },
        config: params.config,
        workspaceDir: params.workspaceDir,
        env: params.env,
        manifestRecords: params.pluginMetadataSnapshot?.manifestRegistry.plugins
      });
      if (apiOwnerPluginIds.length > 0) return apiOwnerPluginIds;
      const legacyApiOwnerPluginIds = (0, _pluginAutoEnableCa3CdPro.h)({
        provider: apiOwnerHint,
        config: params.config,
        workspaceDir: params.workspaceDir,
        env: params.env,
        manifestRegistry: params.pluginMetadataSnapshot?.manifestRegistry
      });
      if (legacyApiOwnerPluginIds?.length) return legacyApiOwnerPluginIds;
    }
    return (0, _pluginAutoEnableCa3CdPro.h)({
      provider,
      config: params.config,
      workspaceDir: params.workspaceDir,
      env: params.env,
      manifestRegistry: params.pluginMetadataSnapshot?.manifestRegistry
    }) ?? [];
  }));
}
function mergeExplicitOwnerPluginIds(providerPluginIds, explicitOwnerPluginIds) {
  if (explicitOwnerPluginIds.length === 0) return [...providerPluginIds];
  return dedupeSortedPluginIds([...providerPluginIds, ...explicitOwnerPluginIds]);
}
function resolvePluginProviderLoadBase(params) {
  const env = params.env ?? process.env;
  const workspaceDir = params.workspaceDir ?? (0, _runtimeOTX8N6Lz.c)();
  const providerOwnedPluginIds = params.providerRefs?.length ? resolveExplicitProviderOwnerPluginIds({
    providerRefs: params.providerRefs,
    config: params.config,
    workspaceDir,
    env,
    pluginMetadataSnapshot: params.pluginMetadataSnapshot
  }) : [];
  const modelOwnedPluginIds = params.modelRefs?.length ? (0, _pluginAutoEnableCa3CdPro.m)({
    models: params.modelRefs,
    config: params.config,
    workspaceDir,
    env,
    manifestRegistry: params.pluginMetadataSnapshot?.manifestRegistry
  }) : [];
  return {
    env,
    workspaceDir,
    requestedPluginIds: (0, _pluginScopeCEsy4RJw.n)(params.onlyPluginIds) || params.providerRefs?.length || params.modelRefs?.length || providerOwnedPluginIds.length > 0 || modelOwnedPluginIds.length > 0 ? [...new Set([
    ...(params.onlyPluginIds ?? []),
    ...providerOwnedPluginIds,
    ...modelOwnedPluginIds]
    )].toSorted((left, right) => left.localeCompare(right)) : void 0,
    explicitOwnerPluginIds: dedupeSortedPluginIds([...providerOwnedPluginIds, ...modelOwnedPluginIds]),
    rawConfig: params.config
  };
}
function resolveSetupProviderPluginLoadState(params, base) {
  const setupPluginIds = mergeExplicitOwnerPluginIds((0, _pluginAutoEnableCa3CdPro.u)({
    config: params.config,
    workspaceDir: base.workspaceDir,
    env: base.env,
    onlyPluginIds: base.requestedPluginIds,
    includeUntrustedWorkspacePlugins: params.includeUntrustedWorkspacePlugins,
    registry: params.pluginMetadataSnapshot?.index,
    manifestRegistry: params.pluginMetadataSnapshot?.manifestRegistry
  }), (0, _pluginAutoEnableCa3CdPro.l)({
    pluginIds: base.explicitOwnerPluginIds,
    config: params.config,
    workspaceDir: base.workspaceDir,
    env: base.env,
    includeUntrustedWorkspacePlugins: params.includeUntrustedWorkspacePlugins,
    registry: params.pluginMetadataSnapshot?.index,
    manifestRegistry: params.pluginMetadataSnapshot?.manifestRegistry
  }));
  if (setupPluginIds.length === 0) return;
  const setupConfig = (0, _activationContextD2jW_eS_.r)({
    config: base.rawConfig,
    pluginIds: setupPluginIds
  });
  return { loadOptions: (0, _loadContextCDm_CIm.n)({
      config: setupConfig,
      activationSourceConfig: setupConfig,
      autoEnabledReasons: {},
      workspaceDir: base.workspaceDir,
      env: base.env,
      logger: (0, _loadContextCDm_CIm.r)()
    }, {
      onlyPluginIds: setupPluginIds,
      pluginSdkResolution: params.pluginSdkResolution,
      cache: params.cache ?? false,
      activate: params.activate ?? false
    }) };
}
function resolveRuntimeProviderPluginLoadState(params, base) {
  const explicitOwnerPluginIds = (0, _pluginAutoEnableCa3CdPro.o)({
    pluginIds: base.explicitOwnerPluginIds,
    config: base.rawConfig,
    workspaceDir: base.workspaceDir,
    env: base.env,
    includeUntrustedWorkspacePlugins: params.includeUntrustedWorkspacePlugins,
    registry: params.pluginMetadataSnapshot?.index,
    manifestRegistry: params.pluginMetadataSnapshot?.manifestRegistry
  });
  const runtimeRequestedPluginIds = base.requestedPluginIds !== void 0 ? dedupeSortedPluginIds([...(params.onlyPluginIds ?? []), ...explicitOwnerPluginIds]) : void 0;
  const activation = (0, _activationContextD2jW_eS_.t)({
    rawConfig: (0, _activationContextD2jW_eS_.r)({
      config: base.rawConfig,
      pluginIds: explicitOwnerPluginIds
    }),
    env: base.env,
    workspaceDir: base.workspaceDir,
    onlyPluginIds: runtimeRequestedPluginIds,
    applyAutoEnable: params.applyAutoEnable ?? true,
    compatMode: {
      allowlist: params.bundledProviderAllowlistCompat,
      enablement: "allowlist",
      vitest: params.bundledProviderVitestCompat
    },
    resolveCompatPluginIds: (compatParams) => (0, _pluginAutoEnableCa3CdPro.s)({
      ...compatParams,
      manifestRegistry: params.pluginMetadataSnapshot?.manifestRegistry
    })
  });
  const config = params.bundledProviderVitestCompat ? (0, _pluginAutoEnableCa3CdPro.g)({
    config: activation.config,
    pluginIds: activation.compatPluginIds,
    env: base.env
  }) : activation.config;
  const providerPluginIds = mergeExplicitOwnerPluginIds((0, _pluginAutoEnableCa3CdPro.d)({
    config,
    workspaceDir: base.workspaceDir,
    env: base.env,
    onlyPluginIds: runtimeRequestedPluginIds,
    registry: params.pluginMetadataSnapshot?.index,
    manifestRegistry: params.pluginMetadataSnapshot?.manifestRegistry
  }), explicitOwnerPluginIds);
  return { loadOptions: (0, _loadContextCDm_CIm.n)({
      config,
      activationSourceConfig: activation.activationSourceConfig,
      autoEnabledReasons: activation.autoEnabledReasons,
      workspaceDir: base.workspaceDir,
      env: base.env,
      logger: (0, _loadContextCDm_CIm.r)()
    }, {
      onlyPluginIds: providerPluginIds,
      pluginSdkResolution: params.pluginSdkResolution,
      cache: params.cache ?? true,
      activate: params.activate ?? false
    }) };
}
function isPluginProvidersLoadInFlight(params) {
  const base = resolvePluginProviderLoadBase(params);
  const loadState = params.mode === "setup" ? resolveSetupProviderPluginLoadState(params, base) : resolveRuntimeProviderPluginLoadState(params, base);
  if (!loadState) return false;
  return (0, _loaderCZB9kQVT.o)(loadState.loadOptions);
}
function resolvePluginProviders(params) {
  const base = resolvePluginProviderLoadBase(params);
  if (params.mode === "setup") {
    const loadState = resolveSetupProviderPluginLoadState(params, base);
    if (!loadState) return [];
    return (0, _loaderCZB9kQVT.c)(loadState.loadOptions).providers.map((entry) => Object.assign({}, entry.provider, { pluginId: entry.pluginId }));
  }
  const loadState = resolveRuntimeProviderPluginLoadState(params, base);
  const registry = loadState.loadOptions.onlyPluginIds?.length === 0 ? void 0 : (0, _activeRuntimeRegistryBuS8FQfM.n)({
    env: base.env,
    loadOptions: loadState.loadOptions,
    workspaceDir: base.workspaceDir,
    requiredPluginIds: loadState.loadOptions.onlyPluginIds
  }) ?? (0, _loaderCZB9kQVT.a)(loadState.loadOptions);
  if (!registry) return [];
  return registry.providers.map((entry) => Object.assign({}, entry.provider, { pluginId: entry.pluginId }));
}
//#endregion /* v9-e13769832d1332ba */
