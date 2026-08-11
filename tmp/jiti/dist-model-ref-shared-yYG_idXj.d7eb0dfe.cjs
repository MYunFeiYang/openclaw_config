"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = resolveStaticAllowlistModelKey;exports.i = normalizeStaticProviderModelId;exports.n = modelKey;exports.o = normalizeProviderModelIdWithManifest;exports.r = normalizeConfiguredProviderCatalogModelId;exports.t = formatLiteralProviderPrefixedModelRef;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
var _providerIdCz7K6wgK = require("./provider-id-Cz7K6wgK.js");
var _providerModelIdNormalize_TvLuZl = require("./provider-model-id-normalize-_TvLu-Zl.js");
var _pluginMetadataSnapshotYo9W2SZ = require("./plugin-metadata-snapshot-yo9-w2SZ.js");
var _pluginRegistryBZohWtpt = require("./plugin-registry-BZohWtpt.js");
var _runtimeStateD14rXNRL = require("./runtime-state-D14rXNRL.js");
//#region src/plugins/manifest-model-id-normalization.ts
function collectManifestModelIdNormalizationPolicies(plugins) {
  const policies = /* @__PURE__ */new Map();
  for (const plugin of plugins) for (const [provider, policy] of Object.entries(plugin.modelIdNormalization?.providers ?? {})) policies.set((0, _stringCoerceLndEvhRk.a)(provider), policy);
  return policies;
}
let cachedPolicies;
function resolveMetadataSnapshotForPolicies(params = {}) {
  const env = params.env ?? process.env;
  const workspaceDir = params.workspaceDir ?? (0, _runtimeStateD14rXNRL.n)();
  const current = (0, _pluginRegistryBZohWtpt.v)({
    config: params.config,
    env,
    workspaceDir
  });
  if (current) return {
    snapshot: current,
    cacheable: true
  };
  return {
    snapshot: (0, _pluginMetadataSnapshotYo9W2SZ.i)({
      config: params.config ?? {},
      env,
      workspaceDir
    }),
    cacheable: false
  };
}
function loadManifestModelIdNormalizationPolicies(params = {}) {
  if (params.plugins) return collectManifestModelIdNormalizationPolicies(params.plugins);
  const { snapshot, cacheable } = resolveMetadataSnapshotForPolicies(params);
  const configFingerprint = snapshot.configFingerprint;
  if (cacheable && configFingerprint && cachedPolicies?.configFingerprint === configFingerprint) return cachedPolicies.policies;
  const policies = collectManifestModelIdNormalizationPolicies(snapshot.plugins);
  if (cacheable && configFingerprint) cachedPolicies = {
    configFingerprint,
    policies
  };
  return policies;
}
function resolveManifestModelIdNormalizationPolicy(provider, params = {}) {
  const providerId = (0, _stringCoerceLndEvhRk.a)(provider);
  return loadManifestModelIdNormalizationPolicies(params).get(providerId);
}
function hasProviderPrefix(modelId) {
  return modelId.includes("/");
}
function formatPrefixedModelId(prefix, modelId) {
  return `${prefix.replace(/\/+$/u, "")}/${modelId.replace(/^\/+/u, "")}`;
}
function normalizeProviderModelIdWithManifest(params) {
  const policy = resolveManifestModelIdNormalizationPolicy(params.provider, params);
  if (!policy) return;
  let modelId = params.context.modelId.trim();
  if (!modelId) return modelId;
  for (const prefix of policy.stripPrefixes ?? []) {
    const normalizedPrefix = (0, _stringCoerceLndEvhRk.a)(prefix);
    if (normalizedPrefix && (0, _stringCoerceLndEvhRk.a)(modelId).startsWith(normalizedPrefix)) {
      modelId = modelId.slice(prefix.length);
      break;
    }
  }
  modelId = policy.aliases?.[(0, _stringCoerceLndEvhRk.a)(modelId)] ?? modelId;
  if (!hasProviderPrefix(modelId)) {
    for (const rule of policy.prefixWhenBareAfterAliasStartsWith ?? []) if ((0, _stringCoerceLndEvhRk.a)(modelId).startsWith(rule.modelPrefix.toLowerCase())) return formatPrefixedModelId(rule.prefix, modelId);
    if (policy.prefixWhenBare) return formatPrefixedModelId(policy.prefixWhenBare, modelId);
  }
  return modelId;
}
//#endregion
//#region src/agents/model-ref-shared.ts
function modelKey(provider, model) {
  const providerId = provider.trim();
  const modelId = model.trim();
  if (!providerId) return modelId;
  if (!modelId) return providerId;
  return (0, _stringCoerceLndEvhRk.a)(modelId).startsWith(`${(0, _stringCoerceLndEvhRk.a)(providerId)}/`) ? modelId : `${providerId}/${modelId}`;
}
function normalizeStaticProviderModelId(provider, model, options = {}) {
  const normalizedProvider = (0, _providerIdCz7K6wgK.r)(provider);
  if (options.allowManifestNormalization === false) return normalizeBuiltInProviderModelId(normalizedProvider, model);
  return normalizeBuiltInProviderModelId(normalizedProvider, normalizeProviderModelIdWithManifest({
    provider: normalizedProvider,
    plugins: options.manifestPlugins,
    context: {
      provider: normalizedProvider,
      modelId: model
    }
  }) ?? model);
}
function normalizeBuiltInProviderModelId(provider, model) {
  if (provider === "google" || provider === "google-gemini-cli" || provider === "google-vertex") return (0, _providerModelIdNormalize_TvLuZl.n)(model);
  return model;
}
function normalizeConfiguredProviderCatalogModelId(provider, model, options = {}) {
  const providerModel = normalizeStaticProviderModelId(provider, model, options);
  const googlePrefix = "google/";
  if (!providerModel.startsWith(googlePrefix)) {
    const slash = providerModel.indexOf("/");
    if (slash <= 0 || slash >= providerModel.length - 1) return providerModel;
    const prefix = providerModel.slice(0, slash + 1);
    const suffix = providerModel.slice(slash + 1);
    if (!suffix.startsWith(googlePrefix)) return providerModel;
    const normalizedSuffix = (0, _providerModelIdNormalize_TvLuZl.n)(suffix);
    return normalizedSuffix === suffix ? providerModel : `${prefix}${normalizedSuffix}`;
  }
  const modelId = providerModel.slice(7);
  const normalizedModelId = (0, _providerModelIdNormalize_TvLuZl.n)(modelId);
  return normalizedModelId === modelId ? providerModel : `${googlePrefix}${normalizedModelId}`;
}
function parseStaticModelRef(raw, defaultProvider) {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const slash = trimmed.indexOf("/");
  const providerRaw = slash === -1 ? defaultProvider : trimmed.slice(0, slash).trim();
  const modelRaw = slash === -1 ? trimmed : trimmed.slice(slash + 1).trim();
  if (!providerRaw || !modelRaw) return null;
  const provider = (0, _providerIdCz7K6wgK.r)(providerRaw);
  return {
    provider,
    model: normalizeStaticProviderModelId(provider, modelRaw)
  };
}
function resolveStaticAllowlistModelKey(raw, defaultProvider) {
  const parsed = parseStaticModelRef(raw, defaultProvider);
  if (!parsed) return null;
  return modelKey(parsed.provider, parsed.model);
}
function formatLiteralProviderPrefixedModelRef(provider, modelRef) {
  const providerId = (0, _providerIdCz7K6wgK.r)(provider);
  const trimmedRef = modelRef.trim();
  if (!providerId || !trimmedRef) return trimmedRef;
  const normalizedRef = (0, _stringCoerceLndEvhRk.a)(trimmedRef);
  const literalPrefix = `${providerId}/${providerId}/`;
  if (normalizedRef.startsWith(literalPrefix)) return trimmedRef;
  return normalizedRef.startsWith(`${providerId}/`) ? `${providerId}/${trimmedRef}` : trimmedRef;
}
//#endregion /* v9-c932a74e45bd89a5 */
