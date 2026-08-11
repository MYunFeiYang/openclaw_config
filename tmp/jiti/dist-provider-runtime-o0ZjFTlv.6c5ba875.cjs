"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.$ = resolveProviderRuntimePlugin;exports.A = resolveProviderReplayPolicyWithPlugin;exports.B = resolveProviderXHighThinking;exports.C = resolveExternalOAuthProfilesWithPlugins;exports.D = resolveProviderDefaultThinkingLevel;exports.E = resolveProviderConfigApiKeyWithPlugin;exports.F = resolveProviderThinkingProfile;exports.G = void 0;exports.H = sanitizeProviderReplayHistoryWithPlugin;exports.I = resolveProviderTransportTurnStateWithPlugin;exports.J = resolveRuntimeTextTransforms;exports.K = transformProviderSystemPrompt;exports.L = resolveProviderUsageAuthWithPlugin;exports.M = resolveProviderSyntheticAuthWithPlugin;exports.N = resolveProviderSystemPromptContribution;exports.O = resolveProviderModernModelRef;exports.P = resolveProviderTextTransforms;exports.Q = resolveProviderFollowupFallbackRoute;exports.R = resolveProviderUsageSnapshotWithPlugin;exports.S = resolveExternalAuthProfilesWithPlugins;exports.T = resolveProviderCacheTtlEligibility;exports.U = shouldDeferProviderSyntheticProfileAuthWithPlugin;exports.V = runProviderDynamicModel;exports.W = shouldPreferProviderRuntimeResolvedModel;exports.X = resolveProviderAuthProfileId;exports.Y = prepareProviderExtraParams;exports.Z = resolveProviderExtraParamsForTransport;exports._ = normalizeProviderToolSchemasWithPlugin;exports.a = augmentModelCatalogWithProviderPlugins;exports.b = prepareProviderRuntimeAuth;exports.c = buildProviderUnknownModelHintWithPlugin;exports.d = formatProviderAuthProfileApiKeyWithPlugin;exports.et = resolveProviderRuntimePluginHandle;exports.f = inspectProviderToolSchemasWithPlugin;exports.g = normalizeProviderResolvedModelWithPlugin;exports.h = normalizeProviderModelIdWithPlugin;exports.i = applyProviderResolvedTransportWithPlugin;exports.j = resolveProviderStreamFn;exports.k = resolveProviderReasoningOutputModeWithPlugin;exports.l = classifyProviderFailoverReasonWithPlugin;exports.m = normalizeProviderConfigWithPlugin;exports.n = applyProviderNativeStreamingUsageCompatWithPlugin;exports.o = buildProviderAuthDoctorHintWithPlugin;exports.p = matchesProviderContextOverflowWithPlugin;exports.q = validateProviderReplayTurnsWithPlugin;exports.r = applyProviderResolvedModelCompatWithPlugins;exports.s = buildProviderMissingAuthMessageWithPlugin;exports.t = applyProviderConfigDefaultsWithPlugin;exports.tt = wrapProviderStreamFn;exports.u = createProviderEmbeddingProvider;exports.v = normalizeProviderTransportWithPlugin;exports.w = resolveProviderBinaryThinking;exports.x = refreshProviderOAuthCredentialWithPlugin;exports.y = prepareProviderDynamicModel;exports.z = resolveProviderWebSocketSessionPolicyWithPlugin;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
var _ansiBk0Jp_0O = require("./ansi-Bk0Jp_0O.js");
var _providerIdCz7K6wgK = require("./provider-id-Cz7K6wgK.js");
var _pluginCachePrimitivesM9JN_JCw = require("./plugin-cache-primitives-M9JN_JCw.js");
var _pluginRegistryBZohWtpt = require("./plugin-registry-BZohWtpt.js");
var _subsystemCH8Q21Y = require("./subsystem-C-H8Q21Y.js");
var _runtimeStateD14rXNRL = require("./runtime-state-D14rXNRL.js");
var _modelRefSharedYYG_idXj = require("./model-ref-shared-yYG_idXj.js");
var _thinkingUKUPba = require("./thinking-uKUPba90.js");
var _gpt5PromptOverlayCGcbgK_z = require("./gpt5-prompt-overlay-CGcbgK_z.js");
var _pluginTextTransformsBJZ8iszG = require("./plugin-text-transforms-BJZ8iszG.js");
var _pluginAutoEnableCa3CdPro = require("./plugin-auto-enable-Ca3CdPro.js");
var _activeRuntimeRegistryBuS8FQfM = require("./active-runtime-registry-BuS8FQfM.js");
var _providersRuntimeHUXdFzwH = require("./providers.runtime-HUXdFzwH.js");
var _providerDiscoveryRuntime = require("./provider-discovery.runtime.js");
//#region src/plugins/provider-hook-runtime.ts
const providerRuntimePluginCache = /* @__PURE__ */new WeakMap();
const PREPARED_PROVIDER_RUNTIME_SURFACES = ["channel"];
function matchesProviderId(provider, providerId) {
  const normalized = (0, _providerIdCz7K6wgK.r)(providerId);
  if (!normalized) return false;
  if ((0, _providerIdCz7K6wgK.r)(provider.id) === normalized) return true;
  return [...(provider.aliases ?? []), ...(provider.hookAliases ?? [])].some((alias) => (0, _providerIdCz7K6wgK.r)(alias) === normalized);
}
function resolveProviderRuntimePluginCacheKey(params) {
  return JSON.stringify({
    provider: (0, _stringCoerceLndEvhRk.a)(params.provider),
    pluginControlPlane: (0, _pluginRegistryBZohWtpt.C)({
      config: params.config,
      env: params.env,
      workspaceDir: params.workspaceDir
    }),
    plugins: params.config?.plugins,
    models: params.config?.models?.providers,
    workspaceDir: params.workspaceDir ?? "",
    applyAutoEnable: params.applyAutoEnable ?? null,
    bundledProviderAllowlistCompat: params.bundledProviderAllowlistCompat ?? null,
    bundledProviderVitestCompat: params.bundledProviderVitestCompat ?? null
  });
}
function matchesProviderLiteralId(provider, providerId) {
  const normalized = (0, _stringCoerceLndEvhRk.a)(providerId);
  return !!normalized && (0, _stringCoerceLndEvhRk.a)(provider.id) === normalized;
}
function findProviderRuntimePluginInLoadedRegistries(params) {
  const activeRegistry = (0, _activeRuntimeRegistryBuS8FQfM.n)({
    env: params.lookup.env,
    workspaceDir: params.lookup.workspaceDir
  });
  const activePlugin = activeRegistry ? findProviderRuntimePluginInRegistry({
    registry: activeRegistry,
    provider: params.lookup.provider,
    apiOwnerHint: params.apiOwnerHint
  }) : void 0;
  if (activePlugin) return activePlugin;
  for (const surface of PREPARED_PROVIDER_RUNTIME_SURFACES) {
    const registry = (0, _activeRuntimeRegistryBuS8FQfM.n)({
      env: params.lookup.env,
      workspaceDir: params.lookup.workspaceDir,
      surface
    });
    const plugin = registry ? findProviderRuntimePluginInRegistry({
      registry,
      provider: params.lookup.provider,
      apiOwnerHint: params.apiOwnerHint
    }) : void 0;
    if (plugin) return plugin;
  }
}
function findProviderRuntimePluginInRegistry(params) {
  return params.registry.providers.map((entry) => Object.assign({}, entry.provider, { pluginId: entry.pluginId })).find((plugin) => {
    if (params.apiOwnerHint) return matchesProviderLiteralId(plugin, params.provider) || matchesProviderId(plugin, params.apiOwnerHint);
    return matchesProviderId(plugin, params.provider);
  });
}
function resolveProviderPluginsForHooks(params) {
  const env = params.env ?? process.env;
  const workspaceDir = params.workspaceDir ?? (0, _runtimeStateD14rXNRL.n)();
  if ((0, _providersRuntimeHUXdFzwH.t)({
    ...params,
    workspaceDir,
    env,
    activate: false,
    applyAutoEnable: params.applyAutoEnable,
    bundledProviderAllowlistCompat: params.bundledProviderAllowlistCompat ?? true,
    bundledProviderVitestCompat: params.bundledProviderVitestCompat ?? true
  })) return [];
  return (0, _providersRuntimeHUXdFzwH.n)({
    ...params,
    workspaceDir,
    env,
    activate: false,
    applyAutoEnable: params.applyAutoEnable,
    bundledProviderAllowlistCompat: params.bundledProviderAllowlistCompat ?? true,
    bundledProviderVitestCompat: params.bundledProviderVitestCompat ?? true
  });
}
function resolveProviderRuntimePlugin(params) {
  const apiOwnerHint = (0, _providersRuntimeHUXdFzwH.r)({
    provider: params.provider,
    config: params.config
  });
  const loadedPlugin = findProviderRuntimePluginInLoadedRegistries({
    lookup: params,
    apiOwnerHint
  });
  if (loadedPlugin) return loadedPlugin;
  return (0, _pluginCachePrimitivesM9JN_JCw.i)({
    cache: providerRuntimePluginCache,
    config: params.env && params.env !== process.env ? void 0 : params.config,
    key: resolveProviderRuntimePluginCacheKey(params),
    load: () => {
      return resolveProviderPluginsForHooks({
        config: params.config,
        workspaceDir: params.workspaceDir ?? (0, _runtimeStateD14rXNRL.n)(),
        env: params.env,
        providerRefs: apiOwnerHint ? [params.provider, apiOwnerHint] : [params.provider],
        applyAutoEnable: params.applyAutoEnable,
        bundledProviderAllowlistCompat: params.bundledProviderAllowlistCompat,
        bundledProviderVitestCompat: params.bundledProviderVitestCompat
      }).find((plugin) => {
        if (apiOwnerHint) return matchesProviderLiteralId(plugin, params.provider) || matchesProviderId(plugin, apiOwnerHint);
        return matchesProviderId(plugin, params.provider);
      }) ?? null;
    }
  }) ?? void 0;
}
function resolveLoadedProviderRuntimePlugin(params) {
  return findProviderRuntimePluginInLoadedRegistries({
    lookup: params,
    apiOwnerHint: (0, _providersRuntimeHUXdFzwH.r)({
      provider: params.provider,
      config: params.config
    })
  });
}
function resolveProviderHookPlugin(params) {
  return resolveProviderRuntimePlugin(params) ?? resolveProviderPluginsForHooks({
    config: params.config,
    workspaceDir: params.workspaceDir,
    env: params.env
  }).find((candidate) => matchesProviderId(candidate, params.provider));
}
function resolveProviderRuntimePluginHandle(params) {
  const workspaceDir = params.workspaceDir ?? (0, _runtimeStateD14rXNRL.n)();
  const env = params.env;
  const runtimePlugin = resolveProviderRuntimePlugin({
    ...params,
    workspaceDir,
    env
  });
  return {
    ...params,
    workspaceDir,
    env,
    plugin: runtimePlugin
  };
}
function ensureProviderRuntimePluginHandle(params) {
  return params.runtimeHandle ?? resolveProviderRuntimePluginHandle(params);
}
function prepareProviderExtraParams(params) {
  return ensureProviderRuntimePluginHandle(params).plugin?.prepareExtraParams?.(params.context) ?? void 0;
}
function resolveProviderExtraParamsForTransport(params) {
  return ensureProviderRuntimePluginHandle(params).plugin?.extraParamsForTransport?.(params.context) ?? void 0;
}
function resolveProviderAuthProfileId(params) {
  const resolved = ensureProviderRuntimePluginHandle(params).plugin?.resolveAuthProfileId?.(params.context);
  return typeof resolved === "string" && resolved.trim() ? resolved.trim() : void 0;
}
function resolveProviderFollowupFallbackRoute(params) {
  return ensureProviderRuntimePluginHandle(params).plugin?.followupFallbackRoute?.(params.context) ?? void 0;
}
function wrapProviderStreamFn(params) {
  return ensureProviderRuntimePluginHandle(params).plugin?.wrapStreamFn?.(params.context) ?? void 0;
}
//#endregion
//#region src/plugins/text-transforms.runtime.ts
function resolveRuntimeTextTransforms() {
  const registry = (0, _activeRuntimeRegistryBuS8FQfM.t)();
  return (0, _pluginTextTransformsBJZ8iszG.n)(...(Array.isArray(registry?.textTransforms) ? registry.textTransforms.map((entry) => entry.transforms) : []));
}
//#endregion
//#region src/plugins/provider-runtime.ts
const log = (0, _subsystemCH8Q21Y.t)("plugins/provider-runtime");
const warnedExternalAuthFallbackPluginIds = /* @__PURE__ */new Set();
function matchesProviderPluginRef(provider, providerId) {
  const normalized = (0, _providerIdCz7K6wgK.r)(providerId);
  if (!normalized) return false;
  if ((0, _providerIdCz7K6wgK.r)(provider.id) === normalized) return true;
  return [...(provider.aliases ?? []), ...(provider.hookAliases ?? [])].some((alias) => (0, _providerIdCz7K6wgK.r)(alias) === normalized);
}
function resolveProviderHookRefs(provider, providerConfig) {
  const refs = [provider];
  const apiRef = (0, _stringCoerceLndEvhRk.c)(providerConfig?.api);
  if (apiRef && (0, _providerIdCz7K6wgK.r)(apiRef) !== (0, _providerIdCz7K6wgK.r)(provider)) refs.push(apiRef);
  return [...new Set(refs)];
}
function matchesAnyProviderPluginRef(provider, providerRefs) {
  return providerRefs.some((providerRef) => matchesProviderPluginRef(provider, providerRef));
}
function hasExplicitProviderRuntimePluginActivation(params) {
  if (!params.config) return true;
  const ownerPluginIds = (0, _pluginAutoEnableCa3CdPro.h)({
    provider: params.provider,
    config: params.config,
    workspaceDir: params.workspaceDir,
    env: params.env
  }) ?? [];
  if (ownerPluginIds.length === 0) return false;
  const allow = new Set(params.config.plugins?.allow ?? []);
  const entries = params.config.plugins?.entries ?? {};
  return ownerPluginIds.some((pluginId) => allow.has(pluginId) || entries[pluginId] !== void 0);
}
function resetExternalAuthFallbackWarningCacheForTest() {
  warnedExternalAuthFallbackPluginIds.clear();
}
const testing = exports.G = { resetExternalAuthFallbackWarningCacheForTest };
function resolveProviderPluginsForCatalogHooks(params) {
  const workspaceDir = params.workspaceDir ?? (0, _runtimeStateD14rXNRL.n)();
  const env = params.env ?? process.env;
  const onlyPluginIds = (0, _pluginAutoEnableCa3CdPro.c)({
    config: params.config,
    workspaceDir,
    env
  });
  if (onlyPluginIds.length === 0) return [];
  return resolveProviderPluginsForHooks({
    ...params,
    workspaceDir,
    env,
    onlyPluginIds
  });
}
function runProviderDynamicModel(params) {
  return resolveProviderRuntimePlugin(params)?.resolveDynamicModel?.(params.context) ?? void 0;
}
function resolveProviderSystemPromptContribution(params) {
  const plugin = ensureProviderRuntimePluginHandle(params).plugin;
  const baseOverlay = (0, _gpt5PromptOverlayCGcbgK_z.l)({
    config: params.context.config ?? params.config,
    providerId: params.context.provider ?? params.provider,
    modelId: params.context.modelId,
    trigger: params.context.trigger
  });
  return mergeProviderSystemPromptContributions(mergeProviderSystemPromptContributions(baseOverlay, plugin?.resolvePromptOverlay?.({
    ...params.context,
    baseOverlay
  }) ?? void 0), plugin?.resolveSystemPromptContribution?.(params.context) ?? void 0);
}
function mergeProviderSystemPromptContributions(base, override) {
  if (!base) return override;
  if (!override) return base;
  const stablePrefix = mergeUniquePromptSections(base.stablePrefix, override.stablePrefix);
  const dynamicSuffix = mergeUniquePromptSections(base.dynamicSuffix, override.dynamicSuffix);
  return {
    ...(stablePrefix ? { stablePrefix } : {}),
    ...(dynamicSuffix ? { dynamicSuffix } : {}),
    sectionOverrides: {
      ...base.sectionOverrides,
      ...override.sectionOverrides
    }
  };
}
function mergeUniquePromptSections(...sections) {
  const uniqueSections = [...new Set(sections.filter((section) => section?.trim()))];
  return uniqueSections.length > 0 ? uniqueSections.join("\n\n") : void 0;
}
function transformProviderSystemPrompt(params) {
  const plugin = ensureProviderRuntimePluginHandle(params).plugin;
  const textTransforms = (0, _pluginTextTransformsBJZ8iszG.n)(resolveRuntimeTextTransforms(), plugin?.textTransforms);
  return (0, _pluginTextTransformsBJZ8iszG.t)(plugin?.transformSystemPrompt?.(params.context) ?? params.context.systemPrompt, textTransforms?.input);
}
function resolveProviderTextTransforms(params) {
  return (0, _pluginTextTransformsBJZ8iszG.n)(resolveRuntimeTextTransforms(), ensureProviderRuntimePluginHandle(params).plugin?.textTransforms);
}
async function prepareProviderDynamicModel(params) {
  await resolveProviderRuntimePlugin(params)?.prepareDynamicModel?.(params.context);
}
function shouldPreferProviderRuntimeResolvedModel(params) {
  return resolveProviderRuntimePlugin(params)?.preferRuntimeResolvedModel?.(params.context) ?? false;
}
function normalizeProviderResolvedModelWithPlugin(params) {
  return resolveProviderRuntimePlugin(params)?.normalizeResolvedModel?.(params.context) ?? void 0;
}
function resolveProviderCompatHookPlugins(params) {
  const candidates = resolveProviderPluginsForHooks(params);
  const owner = resolveProviderRuntimePlugin(params);
  if (!owner) return candidates;
  const ordered = [owner, ...candidates];
  const seen = /* @__PURE__ */new Set();
  return ordered.filter((candidate) => {
    const key = `${candidate.pluginId ?? ""}:${candidate.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function applyCompatPatchToModel(model, patch) {
  const compat = model.compat && typeof model.compat === "object" ? model.compat : void 0;
  if (Object.entries(patch).every(([key, value]) => compat?.[key] === value)) return model;
  return {
    ...model,
    compat: {
      ...compat,
      ...patch
    }
  };
}
function applyProviderResolvedModelCompatWithPlugins(params) {
  let nextModel = params.context.model;
  let changed = false;
  for (const plugin of resolveProviderCompatHookPlugins(params)) {
    const patch = plugin.contributeResolvedModelCompat?.({
      ...params.context,
      model: nextModel
    });
    if (!patch || typeof patch !== "object") continue;
    const patchedModel = applyCompatPatchToModel(nextModel, patch);
    if (patchedModel === nextModel) continue;
    nextModel = patchedModel;
    changed = true;
  }
  return changed ? nextModel : void 0;
}
function applyProviderResolvedTransportWithPlugin(params) {
  const normalized = normalizeProviderTransportWithPlugin({
    provider: params.provider,
    config: params.config,
    workspaceDir: params.workspaceDir,
    env: params.env,
    context: {
      provider: params.context.provider,
      api: params.context.model.api,
      baseUrl: params.context.model.baseUrl
    }
  });
  if (!normalized) return;
  const nextApi = normalized.api ?? params.context.model.api;
  const nextBaseUrl = normalized.baseUrl ?? params.context.model.baseUrl;
  if (nextApi === params.context.model.api && nextBaseUrl === params.context.model.baseUrl) return;
  return {
    ...params.context.model,
    api: nextApi,
    baseUrl: nextBaseUrl
  };
}
function normalizeProviderModelIdWithPlugin(params) {
  return (0, _stringCoerceLndEvhRk.c)(resolveProviderHookPlugin(params)?.normalizeModelId?.(params.context)) ?? (0, _modelRefSharedYYG_idXj.o)(params);
}
function normalizeProviderTransportWithPlugin(params) {
  const hasTransportChange = (normalized) => (normalized.api ?? params.context.api) !== params.context.api || (normalized.baseUrl ?? params.context.baseUrl) !== params.context.baseUrl;
  const matchedPlugin = resolveProviderHookPlugin(params);
  const normalizedMatched = matchedPlugin?.normalizeTransport?.(params.context);
  if (normalizedMatched && hasTransportChange(normalizedMatched)) return normalizedMatched;
  for (const candidate of resolveProviderPluginsForHooks(params)) {
    if (!candidate.normalizeTransport || candidate === matchedPlugin) continue;
    const normalized = candidate.normalizeTransport(params.context);
    if (normalized && hasTransportChange(normalized)) return normalized;
  }
}
function normalizeProviderConfigWithPlugin(params) {
  const hasConfigChange = (normalized) => normalized !== params.context.providerConfig;
  const bundledSurface = (0, _thinkingUKUPba.v)(params.provider);
  if (bundledSurface?.normalizeConfig) {
    const normalized = bundledSurface.normalizeConfig(params.context);
    return normalized && hasConfigChange(normalized) ? normalized : void 0;
  }
  if (!hasExplicitProviderRuntimePluginActivation(params)) return;
  if (params.allowRuntimePluginLoad === false) return;
  const normalizedMatched = resolveProviderRuntimePlugin(params)?.normalizeConfig?.(params.context);
  return normalizedMatched && hasConfigChange(normalizedMatched) ? normalizedMatched : void 0;
}
function applyProviderNativeStreamingUsageCompatWithPlugin(params) {
  if (params.allowRuntimePluginLoad === false) return;
  return resolveProviderRuntimePlugin(params)?.applyNativeStreamingUsageCompat?.(params.context) ?? void 0;
}
function resolveProviderConfigApiKeyWithPlugin(params) {
  const bundledSurface = (0, _thinkingUKUPba.v)(params.provider);
  if (bundledSurface?.resolveConfigApiKey) return (0, _stringCoerceLndEvhRk.c)(bundledSurface.resolveConfigApiKey(params.context));
  if (params.allowRuntimePluginLoad === false) return;
  return (0, _stringCoerceLndEvhRk.c)(resolveProviderRuntimePlugin(params)?.resolveConfigApiKey?.(params.context));
}
function resolveProviderReplayPolicyWithPlugin(params) {
  return resolveProviderRuntimePlugin(params)?.buildReplayPolicy?.(params.context) ?? void 0;
}
async function sanitizeProviderReplayHistoryWithPlugin(params) {
  return await resolveProviderRuntimePlugin(params)?.sanitizeReplayHistory?.(params.context);
}
async function validateProviderReplayTurnsWithPlugin(params) {
  return await resolveProviderRuntimePlugin(params)?.validateReplayTurns?.(params.context);
}
function normalizeProviderToolSchemasWithPlugin(params) {
  return ensureProviderRuntimePluginHandle(params).plugin?.normalizeToolSchemas?.(params.context) ?? void 0;
}
function inspectProviderToolSchemasWithPlugin(params) {
  return ensureProviderRuntimePluginHandle(params).plugin?.inspectToolSchemas?.(params.context) ?? void 0;
}
function resolveProviderReasoningOutputModeWithPlugin(params) {
  const mode = resolveProviderRuntimePlugin(params)?.resolveReasoningOutputMode?.(params.context);
  return mode === "native" || mode === "tagged" ? mode : void 0;
}
function resolveProviderStreamFn(params) {
  return (params.allowRuntimePluginLoad === false ? resolveLoadedProviderRuntimePlugin(params) : resolveProviderRuntimePlugin(params))?.createStreamFn?.(params.context) ?? void 0;
}
function resolveProviderTransportTurnStateWithPlugin(params) {
  return resolveProviderRuntimePlugin(params)?.resolveTransportTurnState?.(params.context) ?? void 0;
}
function resolveProviderWebSocketSessionPolicyWithPlugin(params) {
  return resolveProviderRuntimePlugin(params)?.resolveWebSocketSessionPolicy?.(params.context) ?? void 0;
}
async function createProviderEmbeddingProvider(params) {
  return await resolveProviderRuntimePlugin(params)?.createEmbeddingProvider?.(params.context);
}
async function prepareProviderRuntimeAuth(params) {
  return await resolveProviderRuntimePlugin(params)?.prepareRuntimeAuth?.(params.context);
}
async function resolveProviderUsageAuthWithPlugin(params) {
  return await resolveProviderRuntimePlugin(params)?.resolveUsageAuth?.(params.context);
}
async function resolveProviderUsageSnapshotWithPlugin(params) {
  return await resolveProviderRuntimePlugin(params)?.fetchUsageSnapshot?.(params.context);
}
function matchesProviderContextOverflowWithPlugin(params) {
  const plugins = params.provider ? [resolveProviderHookPlugin({
    ...params,
    provider: params.provider
  })].filter((plugin) => Boolean(plugin)) : resolveProviderPluginsForHooks(params);
  for (const plugin of plugins) if (plugin.matchesContextOverflowError?.(params.context)) return true;
  return false;
}
function classifyProviderFailoverReasonWithPlugin(params) {
  const plugins = params.provider ? [resolveProviderHookPlugin({
    ...params,
    provider: params.provider
  })].filter((plugin) => Boolean(plugin)) : resolveProviderPluginsForHooks(params);
  for (const plugin of plugins) {
    const reason = plugin.classifyFailoverReason?.(params.context);
    if (reason) return reason;
  }
}
function formatProviderAuthProfileApiKeyWithPlugin(params) {
  return resolveProviderRuntimePlugin(params)?.formatApiKey?.(params.context);
}
async function refreshProviderOAuthCredentialWithPlugin(params) {
  return await resolveProviderRuntimePlugin(params)?.refreshOAuth?.(params.context);
}
async function buildProviderAuthDoctorHintWithPlugin(params) {
  return await resolveProviderRuntimePlugin(params)?.buildAuthDoctorHint?.(params.context);
}
function resolveProviderCacheTtlEligibility(params) {
  return resolveProviderRuntimePlugin(params)?.isCacheTtlEligible?.(params.context);
}
function resolveProviderBinaryThinking(params) {
  return resolveProviderRuntimePlugin(params)?.isBinaryThinking?.(params.context);
}
function resolveProviderXHighThinking(params) {
  return resolveProviderRuntimePlugin(params)?.supportsXHighThinking?.(params.context);
}
function resolveProviderThinkingProfile(params) {
  const bundledSurface = (0, _thinkingUKUPba.v)(params.provider);
  if (bundledSurface?.resolveThinkingProfile) return bundledSurface.resolveThinkingProfile(params.context) ?? void 0;
  return resolveProviderRuntimePlugin(params)?.resolveThinkingProfile?.(params.context);
}
function resolveProviderDefaultThinkingLevel(params) {
  return resolveProviderRuntimePlugin(params)?.resolveDefaultThinkingLevel?.(params.context);
}
function applyProviderConfigDefaultsWithPlugin(params) {
  const bundledSurface = (0, _thinkingUKUPba.v)(params.provider);
  if (bundledSurface?.applyConfigDefaults) return bundledSurface.applyConfigDefaults(params.context) ?? void 0;
  return resolveProviderRuntimePlugin(params)?.applyConfigDefaults?.(params.context) ?? void 0;
}
function resolveProviderModernModelRef(params) {
  return resolveProviderRuntimePlugin(params)?.isModernModelRef?.(params.context);
}
function buildProviderMissingAuthMessageWithPlugin(params) {
  return resolveProviderRuntimePlugin(params)?.buildMissingAuthMessage?.(params.context) ?? void 0;
}
function buildProviderUnknownModelHintWithPlugin(params) {
  return resolveProviderRuntimePlugin(params)?.buildUnknownModelHint?.(params.context) ?? void 0;
}
function resolveProviderSyntheticAuthWithPlugin(params) {
  const providerRefs = resolveProviderHookRefs(params.provider, params.context.providerConfig);
  const discoveryPluginIds = [...new Set(providerRefs.flatMap((provider) => (0, _pluginAutoEnableCa3CdPro.h)({
    provider,
    config: params.config,
    workspaceDir: params.workspaceDir,
    env: params.env
  }) ?? []))];
  const discoveryProvider = (discoveryPluginIds.length > 0 ? (0, _providerDiscoveryRuntime.t)({
    config: params.config,
    workspaceDir: params.workspaceDir,
    env: params.env,
    onlyPluginIds: discoveryPluginIds,
    discoveryEntriesOnly: true
  }) : []).find((provider) => matchesAnyProviderPluginRef(provider, providerRefs));
  if (typeof discoveryProvider?.resolveSyntheticAuth === "function") return discoveryProvider.resolveSyntheticAuth(params.context) ?? void 0;
  const runtimeResolved = resolveProviderRuntimePlugin({
    ...params,
    applyAutoEnable: false,
    bundledProviderAllowlistCompat: false,
    bundledProviderVitestCompat: false
  })?.resolveSyntheticAuth?.(params.context);
  if (runtimeResolved) return runtimeResolved;
  for (const providerRef of providerRefs) {
    if ((0, _providerIdCz7K6wgK.r)(providerRef) === (0, _providerIdCz7K6wgK.r)(params.provider)) continue;
    const runtimeProviderResolved = resolveProviderRuntimePlugin({
      ...params,
      provider: providerRef,
      applyAutoEnable: false,
      bundledProviderAllowlistCompat: false,
      bundledProviderVitestCompat: false
    })?.resolveSyntheticAuth?.(params.context);
    if (runtimeProviderResolved) return runtimeProviderResolved;
  }
  if (providerRefs.length === 1) return (0, _providerDiscoveryRuntime.t)({
    config: params.config,
    workspaceDir: params.workspaceDir,
    env: params.env
  }).find((provider) => matchesAnyProviderPluginRef(provider, providerRefs))?.resolveSyntheticAuth?.(params.context);
}
function resolveExternalAuthProfilesWithPlugins(params) {
  const workspaceDir = params.workspaceDir ?? (0, _runtimeStateD14rXNRL.n)();
  const env = params.env ?? process.env;
  const externalAuthPluginIds = (0, _pluginAutoEnableCa3CdPro.p)({
    config: params.config,
    workspaceDir,
    env
  });
  const declaredPluginIds = new Set(externalAuthPluginIds);
  const fallbackPluginIds = (0, _pluginAutoEnableCa3CdPro.f)({
    config: params.config,
    workspaceDir,
    env,
    declaredPluginIds
  });
  const pluginIds = [...new Set([...externalAuthPluginIds, ...fallbackPluginIds])].toSorted((left, right) => left.localeCompare(right));
  if (pluginIds.length === 0) return [];
  const matches = [];
  for (const plugin of resolveProviderPluginsForHooks({
    ...params,
    workspaceDir,
    env,
    onlyPluginIds: pluginIds
  })) {
    const profiles = plugin.resolveExternalAuthProfiles?.(params.context) ?? plugin.resolveExternalOAuthProfiles?.(params.context);
    if (!profiles || profiles.length === 0) continue;
    const pluginId = plugin.pluginId ?? plugin.id;
    if (!declaredPluginIds.has(pluginId) && !warnedExternalAuthFallbackPluginIds.has(pluginId)) {
      warnedExternalAuthFallbackPluginIds.add(pluginId);
      log.warn(`Provider plugin "${(0, _ansiBk0Jp_0O.t)(pluginId)}" uses external auth hooks without declaring contracts.externalAuthProviders. This compatibility fallback is deprecated and will be removed in a future release.`);
    }
    matches.push(...profiles);
  }
  return matches;
}
function resolveExternalOAuthProfilesWithPlugins(params) {
  return resolveExternalAuthProfilesWithPlugins(params);
}
function shouldDeferProviderSyntheticProfileAuthWithPlugin(params) {
  const providerRefs = resolveProviderHookRefs(params.provider, params.context.providerConfig);
  for (const providerRef of providerRefs) {
    const resolved = resolveProviderRuntimePlugin({
      ...params,
      provider: providerRef
    })?.shouldDeferSyntheticProfileAuth?.(params.context);
    if (resolved !== void 0) return resolved;
  }
}
async function augmentModelCatalogWithProviderPlugins(params) {
  const supplemental = [];
  for (const plugin of resolveProviderPluginsForCatalogHooks(params)) {
    const next = await plugin.augmentModelCatalog?.(params.context);
    if (!next || next.length === 0) continue;
    supplemental.push(...next);
  }
  return supplemental;
}
//#endregion /* v9-caaaf28db24d870f */
