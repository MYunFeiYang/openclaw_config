"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = normalizeManifestActivation;exports.i = loadPluginManifest;exports.n = void 0;exports.o = resolvePackageExtensionEntries;exports.r = getPackageManifestMetadata;exports.t = void 0;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
var _rootFileCqMcFM3J = require("./root-file-CqMcFM3J.js");
var _utilsCKsuXgDI = require("./utils-CKsuXgDI.js");
var _prototypeKeysCxs5UffD = require("./prototype-keys-Cxs5UffD.js");
var _stringNormalizationDgUPESoD = require("./string-normalization-DgUPESoD.js");
require("./boundary-file-read-wgc2vgUM.js");
var _legacyNamesB770VN3J = require("./legacy-names-B770VN3J.js");
var _modelCatalogD79ZM1tY = require("./model-catalog-D79ZM1tY.js");
var _parseJsonCompatCukN3ZQB = require("./parse-json-compat-CukN3ZQB.js");
var _manifestCommandAliasesBFWl4mXS = require("./manifest-command-aliases-BFWl4mXS.js");
var _pluginCachePrimitivesM9JN_JCw = require("./plugin-cache-primitives-M9JN_JCw.js");
var _nodeFs = _interopRequireDefault(require("node:fs"));
var _nodePath = _interopRequireDefault(require("node:path"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}
//#region src/plugins/manifest.ts
const PLUGIN_MANIFEST_FILENAME = exports.n = "openclaw.plugin.json";
const PLUGIN_MANIFEST_FILENAMES = [PLUGIN_MANIFEST_FILENAME];
const MAX_PLUGIN_MANIFEST_BYTES = 256 * 1024;
const pluginManifestLoadCache = new _pluginCachePrimitivesM9JN_JCw.t(512);
function normalizeStringListRecord(value) {
  if (!(0, _utilsCKsuXgDI.c)(value)) return;
  const normalized = Object.create(null);
  for (const [key, rawValues] of Object.entries(value)) {
    const providerId = (0, _stringCoerceLndEvhRk.c)(key) ?? "";
    if (!providerId || (0, _prototypeKeysCxs5UffD.t)(providerId)) continue;
    const values = (0, _stringNormalizationDgUPESoD.l)(rawValues);
    if (values.length === 0) continue;
    normalized[providerId] = values;
  }
  return Object.keys(normalized).length > 0 ? normalized : void 0;
}
function normalizeStringRecord(value) {
  if (!(0, _utilsCKsuXgDI.c)(value)) return;
  const normalized = Object.create(null);
  for (const [rawKey, rawValue] of Object.entries(value)) {
    const key = (0, _stringCoerceLndEvhRk.c)(rawKey) ?? "";
    const value = (0, _stringCoerceLndEvhRk.c)(rawValue) ?? "";
    if (!key || (0, _prototypeKeysCxs5UffD.t)(key) || !value) continue;
    normalized[key] = value;
  }
  return Object.keys(normalized).length > 0 ? normalized : void 0;
}
const MEDIA_UNDERSTANDING_CAPABILITIES = new Set([
"image",
"audio",
"video"]
);
function normalizeMediaUnderstandingCapabilityRecord(value) {
  if (!(0, _utilsCKsuXgDI.c)(value)) return;
  const normalized = {};
  for (const [rawKey, rawValue] of Object.entries(value)) {
    if (!MEDIA_UNDERSTANDING_CAPABILITIES.has(rawKey)) continue;
    const model = (0, _stringCoerceLndEvhRk.c)(rawValue);
    if (model) normalized[rawKey] = model;
  }
  return Object.keys(normalized).length > 0 ? normalized : void 0;
}
function normalizeMediaUnderstandingPriorityRecord(value) {
  if (!(0, _utilsCKsuXgDI.c)(value)) return;
  const normalized = {};
  for (const [rawKey, rawValue] of Object.entries(value)) {
    if (!MEDIA_UNDERSTANDING_CAPABILITIES.has(rawKey) || typeof rawValue !== "number" || !Number.isFinite(rawValue)) continue;
    normalized[rawKey] = rawValue;
  }
  return Object.keys(normalized).length > 0 ? normalized : void 0;
}
function normalizeMediaUnderstandingCapabilities(value) {
  const values = (0, _stringNormalizationDgUPESoD.l)(value).filter((entry) => MEDIA_UNDERSTANDING_CAPABILITIES.has(entry));
  return values.length > 0 ? values : void 0;
}
function normalizeMediaUnderstandingNativeDocumentInputs(value) {
  const values = (0, _stringNormalizationDgUPESoD.l)(value).filter((entry) => entry === "pdf");
  return values.length > 0 ? values : void 0;
}
function normalizeMediaUnderstandingProviderMetadata(value) {
  if (!(0, _utilsCKsuXgDI.c)(value)) return;
  const normalized = Object.create(null);
  for (const [rawProviderId, rawMetadata] of Object.entries(value)) {
    const providerId = (0, _stringCoerceLndEvhRk.c)(rawProviderId) ?? "";
    if (!providerId || (0, _prototypeKeysCxs5UffD.t)(providerId) || !(0, _utilsCKsuXgDI.c)(rawMetadata)) continue;
    const capabilities = normalizeMediaUnderstandingCapabilities(rawMetadata.capabilities);
    const defaultModels = normalizeMediaUnderstandingCapabilityRecord(rawMetadata.defaultModels);
    const autoPriority = normalizeMediaUnderstandingPriorityRecord(rawMetadata.autoPriority);
    const nativeDocumentInputs = normalizeMediaUnderstandingNativeDocumentInputs(rawMetadata.nativeDocumentInputs);
    const metadata = {
      ...(capabilities ? { capabilities } : {}),
      ...(defaultModels ? { defaultModels } : {}),
      ...(autoPriority ? { autoPriority } : {}),
      ...(nativeDocumentInputs ? { nativeDocumentInputs } : {})
    };
    if (Object.keys(metadata).length > 0) normalized[providerId] = metadata;
  }
  return Object.keys(normalized).length > 0 ? normalized : void 0;
}
function normalizeProviderBaseUrlGuard(value) {
  if (!(0, _utilsCKsuXgDI.c)(value)) return;
  const provider = (0, _stringCoerceLndEvhRk.c)(value.provider);
  const allowedBaseUrls = (0, _stringNormalizationDgUPESoD.l)(value.allowedBaseUrls);
  if (!provider || allowedBaseUrls.length === 0) return;
  const defaultBaseUrl = (0, _stringCoerceLndEvhRk.c)(value.defaultBaseUrl);
  return {
    provider,
    ...(defaultBaseUrl ? { defaultBaseUrl } : {}),
    allowedBaseUrls
  };
}
function normalizeCapabilityProviderAuthSignals(value) {
  if (!Array.isArray(value)) return;
  const signals = [];
  for (const rawSignal of value) {
    if (!(0, _utilsCKsuXgDI.c)(rawSignal)) continue;
    const provider = (0, _stringCoerceLndEvhRk.c)(rawSignal.provider);
    if (!provider) continue;
    const providerBaseUrl = normalizeProviderBaseUrlGuard(rawSignal.providerBaseUrl);
    signals.push({
      provider,
      ...(providerBaseUrl ? { providerBaseUrl } : {})
    });
  }
  return signals.length > 0 ? signals : void 0;
}
function normalizeCapabilityProviderModeConfigSignal(value) {
  if (!(0, _utilsCKsuXgDI.c)(value)) return;
  const path = (0, _stringCoerceLndEvhRk.c)(value.path);
  const defaultValue = (0, _stringCoerceLndEvhRk.c)(value.default);
  const allowed = (0, _stringNormalizationDgUPESoD.l)(value.allowed);
  const disallowed = (0, _stringNormalizationDgUPESoD.l)(value.disallowed);
  const signal = {
    ...(path ? { path } : {}),
    ...(defaultValue ? { default: defaultValue } : {}),
    ...(allowed.length > 0 ? { allowed } : {}),
    ...(disallowed.length > 0 ? { disallowed } : {})
  };
  return Object.keys(signal).length > 0 ? signal : void 0;
}
function normalizeCapabilityProviderConfigSignals(value) {
  if (!Array.isArray(value)) return;
  const signals = [];
  for (const rawSignal of value) {
    if (!(0, _utilsCKsuXgDI.c)(rawSignal)) continue;
    const rootPath = (0, _stringCoerceLndEvhRk.c)(rawSignal.rootPath);
    if (!rootPath) continue;
    const overlayPath = (0, _stringCoerceLndEvhRk.c)(rawSignal.overlayPath);
    const required = (0, _stringNormalizationDgUPESoD.l)(rawSignal.required);
    const requiredAny = (0, _stringNormalizationDgUPESoD.l)(rawSignal.requiredAny);
    const mode = normalizeCapabilityProviderModeConfigSignal(rawSignal.mode);
    const signal = {
      rootPath,
      ...(overlayPath ? { overlayPath } : {}),
      ...(required.length > 0 ? { required } : {}),
      ...(requiredAny.length > 0 ? { requiredAny } : {}),
      ...(mode ? { mode } : {})
    };
    if (required.length > 0 || requiredAny.length > 0 || mode) signals.push(signal);
  }
  return signals.length > 0 ? signals : void 0;
}
function normalizeCapabilityProviderMetadataEntry(rawMetadata) {
  const aliases = (0, _stringNormalizationDgUPESoD.l)(rawMetadata.aliases);
  const authProviders = (0, _stringNormalizationDgUPESoD.l)(rawMetadata.authProviders);
  const authSignals = normalizeCapabilityProviderAuthSignals(rawMetadata.authSignals);
  const configSignals = normalizeCapabilityProviderConfigSignals(rawMetadata.configSignals);
  const referenceAudioInputs = rawMetadata.referenceAudioInputs === true ? true : void 0;
  const metadata = {
    ...(aliases.length > 0 ? { aliases } : {}),
    ...(authProviders.length > 0 ? { authProviders } : {}),
    ...(authSignals ? { authSignals } : {}),
    ...(configSignals ? { configSignals } : {}),
    ...(referenceAudioInputs ? { referenceAudioInputs } : {})
  };
  return Object.keys(metadata).length > 0 ? metadata : void 0;
}
function normalizeCapabilityProviderMetadata(value) {
  if (!(0, _utilsCKsuXgDI.c)(value)) return;
  const normalized = Object.create(null);
  for (const [rawProviderId, rawMetadata] of Object.entries(value)) {
    const providerId = (0, _stringCoerceLndEvhRk.c)(rawProviderId) ?? "";
    if (!providerId || (0, _prototypeKeysCxs5UffD.t)(providerId) || !(0, _utilsCKsuXgDI.c)(rawMetadata)) continue;
    const metadata = normalizeCapabilityProviderMetadataEntry(rawMetadata);
    if (metadata) normalized[providerId] = metadata;
  }
  return Object.keys(normalized).length > 0 ? normalized : void 0;
}
function normalizePluginToolMetadata(value) {
  if (!(0, _utilsCKsuXgDI.c)(value)) return;
  const normalized = Object.create(null);
  for (const [rawToolName, rawMetadata] of Object.entries(value)) {
    const toolName = (0, _stringCoerceLndEvhRk.c)(rawToolName) ?? "";
    if (!toolName || (0, _prototypeKeysCxs5UffD.t)(toolName) || !(0, _utilsCKsuXgDI.c)(rawMetadata)) continue;
    const metadata = {
      ...normalizeCapabilityProviderMetadataEntry(rawMetadata),
      ...(rawMetadata.optional === true ? { optional: true } : {})
    };
    if (Object.keys(metadata).length > 0) normalized[toolName] = metadata;
  }
  return Object.keys(normalized).length > 0 ? normalized : void 0;
}
function normalizeManifestContracts(value) {
  if (!(0, _utilsCKsuXgDI.c)(value)) return;
  const embeddedExtensionFactories = (0, _stringNormalizationDgUPESoD.l)(value.embeddedExtensionFactories);
  const agentToolResultMiddleware = (0, _stringNormalizationDgUPESoD.l)(value.agentToolResultMiddleware);
  const externalAuthProviders = (0, _stringNormalizationDgUPESoD.l)(value.externalAuthProviders);
  const memoryEmbeddingProviders = (0, _stringNormalizationDgUPESoD.l)(value.memoryEmbeddingProviders);
  const speechProviders = (0, _stringNormalizationDgUPESoD.l)(value.speechProviders);
  const realtimeTranscriptionProviders = (0, _stringNormalizationDgUPESoD.l)(value.realtimeTranscriptionProviders);
  const realtimeVoiceProviders = (0, _stringNormalizationDgUPESoD.l)(value.realtimeVoiceProviders);
  const mediaUnderstandingProviders = (0, _stringNormalizationDgUPESoD.l)(value.mediaUnderstandingProviders);
  const documentExtractors = (0, _stringNormalizationDgUPESoD.l)(value.documentExtractors);
  const imageGenerationProviders = (0, _stringNormalizationDgUPESoD.l)(value.imageGenerationProviders);
  const videoGenerationProviders = (0, _stringNormalizationDgUPESoD.l)(value.videoGenerationProviders);
  const musicGenerationProviders = (0, _stringNormalizationDgUPESoD.l)(value.musicGenerationProviders);
  const webContentExtractors = (0, _stringNormalizationDgUPESoD.l)(value.webContentExtractors);
  const webFetchProviders = (0, _stringNormalizationDgUPESoD.l)(value.webFetchProviders);
  const webSearchProviders = (0, _stringNormalizationDgUPESoD.l)(value.webSearchProviders);
  const migrationProviders = (0, _stringNormalizationDgUPESoD.l)(value.migrationProviders);
  const gatewayMethodDispatch = (0, _stringNormalizationDgUPESoD.l)(value.gatewayMethodDispatch);
  const tools = (0, _stringNormalizationDgUPESoD.l)(value.tools);
  const contracts = {
    ...(embeddedExtensionFactories.length > 0 ? { embeddedExtensionFactories } : {}),
    ...(agentToolResultMiddleware.length > 0 ? { agentToolResultMiddleware } : {}),
    ...(externalAuthProviders.length > 0 ? { externalAuthProviders } : {}),
    ...(memoryEmbeddingProviders.length > 0 ? { memoryEmbeddingProviders } : {}),
    ...(speechProviders.length > 0 ? { speechProviders } : {}),
    ...(realtimeTranscriptionProviders.length > 0 ? { realtimeTranscriptionProviders } : {}),
    ...(realtimeVoiceProviders.length > 0 ? { realtimeVoiceProviders } : {}),
    ...(mediaUnderstandingProviders.length > 0 ? { mediaUnderstandingProviders } : {}),
    ...(documentExtractors.length > 0 ? { documentExtractors } : {}),
    ...(imageGenerationProviders.length > 0 ? { imageGenerationProviders } : {}),
    ...(videoGenerationProviders.length > 0 ? { videoGenerationProviders } : {}),
    ...(musicGenerationProviders.length > 0 ? { musicGenerationProviders } : {}),
    ...(webContentExtractors.length > 0 ? { webContentExtractors } : {}),
    ...(webFetchProviders.length > 0 ? { webFetchProviders } : {}),
    ...(webSearchProviders.length > 0 ? { webSearchProviders } : {}),
    ...(migrationProviders.length > 0 ? { migrationProviders } : {}),
    ...(gatewayMethodDispatch.length > 0 ? { gatewayMethodDispatch } : {}),
    ...(tools.length > 0 ? { tools } : {})
  };
  return Object.keys(contracts).length > 0 ? contracts : void 0;
}
function isManifestConfigLiteral(value) {
  return value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}
function normalizeManifestDangerousConfigFlags(value) {
  if (!Array.isArray(value)) return;
  const normalized = [];
  for (const entry of value) {
    if (!(0, _utilsCKsuXgDI.c)(entry)) continue;
    const path = (0, _stringCoerceLndEvhRk.c)(entry.path) ?? "";
    if (!path || !isManifestConfigLiteral(entry.equals)) continue;
    normalized.push({
      path,
      equals: entry.equals
    });
  }
  return normalized.length > 0 ? normalized : void 0;
}
function normalizeManifestSecretInputPaths(value) {
  if (!Array.isArray(value)) return;
  const normalized = [];
  for (const entry of value) {
    if (!(0, _utilsCKsuXgDI.c)(entry)) continue;
    const path = (0, _stringCoerceLndEvhRk.c)(entry.path) ?? "";
    if (!path) continue;
    const expected = entry.expected === "string" ? entry.expected : void 0;
    normalized.push({
      path,
      ...(expected ? { expected } : {})
    });
  }
  return normalized.length > 0 ? normalized : void 0;
}
function normalizeManifestConfigContracts(value) {
  if (!(0, _utilsCKsuXgDI.c)(value)) return;
  const compatibilityMigrationPaths = (0, _stringNormalizationDgUPESoD.l)(value.compatibilityMigrationPaths);
  const compatibilityRuntimePaths = (0, _stringNormalizationDgUPESoD.l)(value.compatibilityRuntimePaths);
  const rawSecretInputs = (0, _utilsCKsuXgDI.c)(value.secretInputs) ? value.secretInputs : void 0;
  const dangerousFlags = normalizeManifestDangerousConfigFlags(value.dangerousFlags);
  const secretInputPaths = rawSecretInputs ? normalizeManifestSecretInputPaths(rawSecretInputs.paths) : void 0;
  const secretInputs = secretInputPaths && secretInputPaths.length > 0 ? {
    ...(rawSecretInputs?.bundledDefaultEnabled === true ? { bundledDefaultEnabled: true } : rawSecretInputs?.bundledDefaultEnabled === false ? { bundledDefaultEnabled: false } : {}),
    paths: secretInputPaths
  } : void 0;
  const configContracts = {
    ...(compatibilityMigrationPaths.length > 0 ? { compatibilityMigrationPaths } : {}),
    ...(compatibilityRuntimePaths.length > 0 ? { compatibilityRuntimePaths } : {}),
    ...(dangerousFlags ? { dangerousFlags } : {}),
    ...(secretInputs ? { secretInputs } : {})
  };
  return Object.keys(configContracts).length > 0 ? configContracts : void 0;
}
function normalizeManifestModelSupport(value) {
  if (!(0, _utilsCKsuXgDI.c)(value)) return;
  const modelPrefixes = (0, _stringNormalizationDgUPESoD.l)(value.modelPrefixes);
  const modelPatterns = (0, _stringNormalizationDgUPESoD.l)(value.modelPatterns);
  const modelSupport = {
    ...(modelPrefixes.length > 0 ? { modelPrefixes } : {}),
    ...(modelPatterns.length > 0 ? { modelPatterns } : {})
  };
  return Object.keys(modelSupport).length > 0 ? modelSupport : void 0;
}
function normalizeManifestModelPricingSource(value) {
  if (value === false) return false;
  if (!(0, _utilsCKsuXgDI.c)(value)) return;
  const provider = (0, _modelCatalogD79ZM1tY.s)((0, _stringCoerceLndEvhRk.c)(value.provider) ?? "");
  const modelIdTransforms = (0, _stringNormalizationDgUPESoD.l)(value.modelIdTransforms).filter((entry) => entry === "version-dots");
  const source = {
    ...(provider ? { provider } : {}),
    ...(value.passthroughProviderModel === true ? { passthroughProviderModel: true } : {}),
    ...(modelIdTransforms.length > 0 ? { modelIdTransforms } : {})
  };
  return Object.keys(source).length > 0 ? source : void 0;
}
function normalizeManifestModelPricingProvider(value) {
  if (!(0, _utilsCKsuXgDI.c)(value)) return;
  const openRouter = normalizeManifestModelPricingSource(value.openRouter);
  const liteLLM = normalizeManifestModelPricingSource(value.liteLLM);
  const policy = {
    ...(typeof value.external === "boolean" ? { external: value.external } : {}),
    ...(openRouter !== void 0 ? { openRouter } : {}),
    ...(liteLLM !== void 0 ? { liteLLM } : {})
  };
  return Object.keys(policy).length > 0 ? policy : void 0;
}
function normalizeManifestModelPricing(value, params) {
  if (!(0, _utilsCKsuXgDI.c)(value) || !(0, _utilsCKsuXgDI.c)(value.providers)) return;
  const ownedProviders = new Set([...params.ownedProviders].map((provider) => (0, _modelCatalogD79ZM1tY.s)(provider)).filter(Boolean));
  const providers = {};
  for (const [rawProviderId, rawPolicy] of Object.entries(value.providers)) {
    const providerId = (0, _modelCatalogD79ZM1tY.s)(rawProviderId);
    if (!providerId || !ownedProviders.has(providerId)) continue;
    const policy = normalizeManifestModelPricingProvider(rawPolicy);
    if (policy) providers[providerId] = policy;
  }
  return Object.keys(providers).length > 0 ? { providers } : void 0;
}
function normalizeManifestModelIdPrefixRules(value) {
  if (!Array.isArray(value)) return;
  const rules = [];
  for (const rawRule of value) {
    if (!(0, _utilsCKsuXgDI.c)(rawRule)) continue;
    const modelPrefix = (0, _stringCoerceLndEvhRk.c)(rawRule.modelPrefix);
    const prefix = (0, _stringCoerceLndEvhRk.c)(rawRule.prefix);
    if (!modelPrefix || !prefix) continue;
    rules.push({
      modelPrefix,
      prefix
    });
  }
  return rules.length > 0 ? rules : void 0;
}
function normalizeManifestModelIdNormalizationProvider(value) {
  if (!(0, _utilsCKsuXgDI.c)(value)) return;
  const aliases = {};
  if ((0, _utilsCKsuXgDI.c)(value.aliases)) for (const [rawAlias, rawCanonical] of Object.entries(value.aliases)) {
    const alias = (0, _modelCatalogD79ZM1tY.s)(rawAlias);
    const canonical = (0, _stringCoerceLndEvhRk.c)(rawCanonical);
    if (alias && canonical) aliases[alias] = canonical;
  }
  const stripPrefixes = (0, _stringNormalizationDgUPESoD.l)(value.stripPrefixes);
  const prefixWhenBare = (0, _stringCoerceLndEvhRk.c)(value.prefixWhenBare);
  const prefixWhenBareAfterAliasStartsWith = normalizeManifestModelIdPrefixRules(value.prefixWhenBareAfterAliasStartsWith);
  const normalization = {
    ...(Object.keys(aliases).length > 0 ? { aliases } : {}),
    ...(stripPrefixes.length > 0 ? { stripPrefixes } : {}),
    ...(prefixWhenBare ? { prefixWhenBare } : {}),
    ...(prefixWhenBareAfterAliasStartsWith ? { prefixWhenBareAfterAliasStartsWith } : {})
  };
  return Object.keys(normalization).length > 0 ? normalization : void 0;
}
function normalizeManifestModelIdNormalization(value, params) {
  if (!(0, _utilsCKsuXgDI.c)(value) || !(0, _utilsCKsuXgDI.c)(value.providers)) return;
  const ownedProviders = new Set([...params.ownedProviders].map((provider) => (0, _modelCatalogD79ZM1tY.s)(provider)).filter(Boolean));
  const providers = {};
  for (const [rawProviderId, rawPolicy] of Object.entries(value.providers)) {
    const providerId = (0, _modelCatalogD79ZM1tY.s)(rawProviderId);
    if (!providerId || !ownedProviders.has(providerId)) continue;
    const policy = normalizeManifestModelIdNormalizationProvider(rawPolicy);
    if (policy) providers[providerId] = policy;
  }
  return Object.keys(providers).length > 0 ? { providers } : void 0;
}
function normalizeManifestProviderEndpoints(value) {
  if (!Array.isArray(value)) return;
  const endpoints = [];
  for (const rawEndpoint of value) {
    if (!(0, _utilsCKsuXgDI.c)(rawEndpoint)) continue;
    const endpointClass = (0, _stringCoerceLndEvhRk.c)(rawEndpoint.endpointClass);
    if (!endpointClass) continue;
    const hosts = (0, _stringNormalizationDgUPESoD.l)(rawEndpoint.hosts).map((host) => host.toLowerCase());
    const hostSuffixes = (0, _stringNormalizationDgUPESoD.l)(rawEndpoint.hostSuffixes).map((host) => host.toLowerCase());
    const baseUrls = (0, _stringNormalizationDgUPESoD.l)(rawEndpoint.baseUrls);
    const googleVertexRegion = (0, _stringCoerceLndEvhRk.c)(rawEndpoint.googleVertexRegion);
    const googleVertexRegionHostSuffix = (0, _stringCoerceLndEvhRk.c)(rawEndpoint.googleVertexRegionHostSuffix)?.toLowerCase();
    if (hosts.length === 0 && hostSuffixes.length === 0 && baseUrls.length === 0) continue;
    endpoints.push({
      endpointClass,
      ...(hosts.length > 0 ? { hosts } : {}),
      ...(hostSuffixes.length > 0 ? { hostSuffixes } : {}),
      ...(baseUrls.length > 0 ? { baseUrls } : {}),
      ...(googleVertexRegion ? { googleVertexRegion } : {}),
      ...(googleVertexRegionHostSuffix ? { googleVertexRegionHostSuffix } : {})
    });
  }
  return endpoints.length > 0 ? endpoints : void 0;
}
function normalizeManifestProviderRequestProvider(value) {
  if (!(0, _utilsCKsuXgDI.c)(value)) return;
  const family = (0, _stringCoerceLndEvhRk.c)(value.family);
  const compatibilityFamily = (0, _stringCoerceLndEvhRk.c)(value.compatibilityFamily) === "moonshot" ? "moonshot" : void 0;
  const supportsStreamingUsage = (0, _utilsCKsuXgDI.c)(value.openAICompletions) ? value.openAICompletions.supportsStreamingUsage : void 0;
  const openAICompletions = typeof supportsStreamingUsage === "boolean" ? { supportsStreamingUsage } : void 0;
  const providerRequest = {
    ...(family ? { family } : {}),
    ...(compatibilityFamily ? { compatibilityFamily } : {}),
    ...(openAICompletions && Object.keys(openAICompletions).length > 0 ? { openAICompletions } : {})
  };
  return Object.keys(providerRequest).length > 0 ? providerRequest : void 0;
}
function normalizeManifestProviderRequest(value, params) {
  if (!(0, _utilsCKsuXgDI.c)(value) || !(0, _utilsCKsuXgDI.c)(value.providers)) return;
  const ownedProviders = new Set([...params.ownedProviders].map((provider) => (0, _modelCatalogD79ZM1tY.s)(provider)).filter(Boolean));
  const providers = {};
  for (const [rawProviderId, rawPolicy] of Object.entries(value.providers)) {
    const providerId = (0, _modelCatalogD79ZM1tY.s)(rawProviderId);
    if (!providerId || !ownedProviders.has(providerId)) continue;
    const policy = normalizeManifestProviderRequestProvider(rawPolicy);
    if (policy) providers[providerId] = policy;
  }
  return Object.keys(providers).length > 0 ? { providers } : void 0;
}
function normalizeManifestActivation(value) {
  if (!(0, _utilsCKsuXgDI.c)(value)) return;
  const onProviders = (0, _stringNormalizationDgUPESoD.l)(value.onProviders);
  const onAgentHarnesses = (0, _stringNormalizationDgUPESoD.l)(value.onAgentHarnesses);
  const onCommands = (0, _stringNormalizationDgUPESoD.l)(value.onCommands);
  const onChannels = (0, _stringNormalizationDgUPESoD.l)(value.onChannels);
  const onRoutes = (0, _stringNormalizationDgUPESoD.l)(value.onRoutes);
  const onConfigPaths = (0, _stringNormalizationDgUPESoD.l)(value.onConfigPaths);
  const onStartup = typeof value.onStartup === "boolean" ? value.onStartup : void 0;
  const onCapabilities = (0, _stringNormalizationDgUPESoD.l)(value.onCapabilities).filter((capability) => capability === "provider" || capability === "channel" || capability === "tool" || capability === "hook");
  const activation = {
    ...(onStartup !== void 0 ? { onStartup } : {}),
    ...(onProviders.length > 0 ? { onProviders } : {}),
    ...(onAgentHarnesses.length > 0 ? { onAgentHarnesses } : {}),
    ...(onCommands.length > 0 ? { onCommands } : {}),
    ...(onChannels.length > 0 ? { onChannels } : {}),
    ...(onRoutes.length > 0 ? { onRoutes } : {}),
    ...(onConfigPaths.length > 0 ? { onConfigPaths } : {}),
    ...(onCapabilities.length > 0 ? { onCapabilities } : {})
  };
  return Object.keys(activation).length > 0 ? activation : void 0;
}
const MANIFEST_DEFAULT_ENABLEMENT_PLATFORMS = new Set([
"aix",
"android",
"darwin",
"freebsd",
"haiku",
"linux",
"openbsd",
"sunos",
"win32",
"cygwin",
"netbsd"]
);
function normalizeManifestDefaultPlatforms(value) {
  return (0, _stringNormalizationDgUPESoD.l)(value).filter((platform) => MANIFEST_DEFAULT_ENABLEMENT_PLATFORMS.has(platform));
}
function normalizeManifestSetupProviders(value) {
  if (!Array.isArray(value)) return;
  const normalized = [];
  for (const entry of value) {
    if (!(0, _utilsCKsuXgDI.c)(entry)) continue;
    const id = (0, _stringCoerceLndEvhRk.c)(entry.id) ?? "";
    if (!id) continue;
    const authMethods = (0, _stringNormalizationDgUPESoD.l)(entry.authMethods);
    const envVars = (0, _stringNormalizationDgUPESoD.l)(entry.envVars);
    const authEvidence = normalizeManifestSetupProviderAuthEvidence(entry.authEvidence);
    normalized.push({
      id,
      ...(authMethods.length > 0 ? { authMethods } : {}),
      ...(envVars.length > 0 ? { envVars } : {}),
      ...(authEvidence ? { authEvidence } : {})
    });
  }
  return normalized.length > 0 ? normalized : void 0;
}
function normalizeManifestSetupProviderAuthEvidence(value) {
  if (!Array.isArray(value)) return;
  const normalized = [];
  for (const entry of value) {
    if (!(0, _utilsCKsuXgDI.c)(entry) || entry.type !== "local-file-with-env") continue;
    const credentialMarker = (0, _stringCoerceLndEvhRk.c)(entry.credentialMarker);
    if (!credentialMarker) continue;
    const fileEnvVar = (0, _stringCoerceLndEvhRk.c)(entry.fileEnvVar);
    const fallbackPaths = (0, _stringNormalizationDgUPESoD.l)(entry.fallbackPaths);
    if (!fileEnvVar && fallbackPaths.length === 0) continue;
    const requiresAnyEnv = (0, _stringNormalizationDgUPESoD.l)(entry.requiresAnyEnv);
    const requiresAllEnv = (0, _stringNormalizationDgUPESoD.l)(entry.requiresAllEnv);
    const source = (0, _stringCoerceLndEvhRk.c)(entry.source);
    normalized.push({
      type: "local-file-with-env",
      ...(fileEnvVar ? { fileEnvVar } : {}),
      ...(fallbackPaths.length > 0 ? { fallbackPaths } : {}),
      ...(requiresAnyEnv.length > 0 ? { requiresAnyEnv } : {}),
      ...(requiresAllEnv.length > 0 ? { requiresAllEnv } : {}),
      credentialMarker,
      ...(source ? { source } : {})
    });
  }
  return normalized.length > 0 ? normalized : void 0;
}
function normalizeManifestSetup(value) {
  if (!(0, _utilsCKsuXgDI.c)(value)) return;
  const providers = normalizeManifestSetupProviders(value.providers);
  const cliBackends = (0, _stringNormalizationDgUPESoD.l)(value.cliBackends);
  const configMigrations = (0, _stringNormalizationDgUPESoD.l)(value.configMigrations);
  const requiresRuntime = typeof value.requiresRuntime === "boolean" ? value.requiresRuntime : void 0;
  const setup = {
    ...(providers ? { providers } : {}),
    ...(cliBackends.length > 0 ? { cliBackends } : {}),
    ...(configMigrations.length > 0 ? { configMigrations } : {}),
    ...(requiresRuntime !== void 0 ? { requiresRuntime } : {})
  };
  return Object.keys(setup).length > 0 ? setup : void 0;
}
function normalizeManifestQaRunners(value) {
  if (!Array.isArray(value)) return;
  const normalized = [];
  for (const entry of value) {
    if (!(0, _utilsCKsuXgDI.c)(entry)) continue;
    const commandName = (0, _stringCoerceLndEvhRk.c)(entry.commandName) ?? "";
    if (!commandName) continue;
    const description = (0, _stringCoerceLndEvhRk.c)(entry.description) ?? "";
    normalized.push({
      commandName,
      ...(description ? { description } : {})
    });
  }
  return normalized.length > 0 ? normalized : void 0;
}
function normalizeProviderAuthChoices(value) {
  if (!Array.isArray(value)) return;
  const normalized = [];
  for (const entry of value) {
    if (!(0, _utilsCKsuXgDI.c)(entry)) continue;
    const provider = (0, _stringCoerceLndEvhRk.c)(entry.provider) ?? "";
    const method = (0, _stringCoerceLndEvhRk.c)(entry.method) ?? "";
    const choiceId = (0, _stringCoerceLndEvhRk.c)(entry.choiceId) ?? "";
    if (!provider || !method || !choiceId) continue;
    const choiceLabel = (0, _stringCoerceLndEvhRk.c)(entry.choiceLabel) ?? "";
    const choiceHint = (0, _stringCoerceLndEvhRk.c)(entry.choiceHint) ?? "";
    const assistantPriority = typeof entry.assistantPriority === "number" && Number.isFinite(entry.assistantPriority) ? entry.assistantPriority : void 0;
    const assistantVisibility = entry.assistantVisibility === "manual-only" || entry.assistantVisibility === "visible" ? entry.assistantVisibility : void 0;
    const deprecatedChoiceIds = (0, _stringNormalizationDgUPESoD.l)(entry.deprecatedChoiceIds);
    const groupId = (0, _stringCoerceLndEvhRk.c)(entry.groupId) ?? "";
    const groupLabel = (0, _stringCoerceLndEvhRk.c)(entry.groupLabel) ?? "";
    const groupHint = (0, _stringCoerceLndEvhRk.c)(entry.groupHint) ?? "";
    const onboardingFeatured = entry.onboardingFeatured === true;
    const optionKey = (0, _stringCoerceLndEvhRk.c)(entry.optionKey) ?? "";
    const cliFlag = (0, _stringCoerceLndEvhRk.c)(entry.cliFlag) ?? "";
    const cliOption = (0, _stringCoerceLndEvhRk.c)(entry.cliOption) ?? "";
    const cliDescription = (0, _stringCoerceLndEvhRk.c)(entry.cliDescription) ?? "";
    const onboardingScopes = (0, _stringNormalizationDgUPESoD.l)(entry.onboardingScopes).filter((scope) => scope === "text-inference" || scope === "image-generation" || scope === "music-generation");
    normalized.push({
      provider,
      method,
      choiceId,
      ...(choiceLabel ? { choiceLabel } : {}),
      ...(choiceHint ? { choiceHint } : {}),
      ...(assistantPriority !== void 0 ? { assistantPriority } : {}),
      ...(assistantVisibility ? { assistantVisibility } : {}),
      ...(deprecatedChoiceIds.length > 0 ? { deprecatedChoiceIds } : {}),
      ...(groupId ? { groupId } : {}),
      ...(groupLabel ? { groupLabel } : {}),
      ...(groupHint ? { groupHint } : {}),
      ...(onboardingFeatured ? { onboardingFeatured: true } : {}),
      ...(optionKey ? { optionKey } : {}),
      ...(cliFlag ? { cliFlag } : {}),
      ...(cliOption ? { cliOption } : {}),
      ...(cliDescription ? { cliDescription } : {}),
      ...(onboardingScopes.length > 0 ? { onboardingScopes } : {})
    });
  }
  return normalized.length > 0 ? normalized : void 0;
}
function normalizeChannelConfigs(value) {
  if (!(0, _utilsCKsuXgDI.c)(value)) return;
  const normalized = Object.create(null);
  for (const [key, rawEntry] of Object.entries(value)) {
    const channelId = (0, _stringCoerceLndEvhRk.c)(key) ?? "";
    if (!channelId || (0, _prototypeKeysCxs5UffD.t)(channelId) || !(0, _utilsCKsuXgDI.c)(rawEntry)) continue;
    const schema = (0, _utilsCKsuXgDI.c)(rawEntry.schema) ? rawEntry.schema : null;
    if (!schema) continue;
    const uiHints = (0, _utilsCKsuXgDI.c)(rawEntry.uiHints) ? rawEntry.uiHints : void 0;
    const runtime = (0, _utilsCKsuXgDI.c)(rawEntry.runtime) && typeof rawEntry.runtime.safeParse === "function" ? rawEntry.runtime : void 0;
    const label = (0, _stringCoerceLndEvhRk.c)(rawEntry.label) ?? "";
    const description = (0, _stringCoerceLndEvhRk.c)(rawEntry.description) ?? "";
    const preferOver = (0, _stringNormalizationDgUPESoD.l)(rawEntry.preferOver);
    const commandDefaults = normalizeManifestChannelCommandDefaults(rawEntry.commands);
    normalized[channelId] = {
      schema,
      ...(uiHints ? { uiHints } : {}),
      ...(runtime ? { runtime } : {}),
      ...(label ? { label } : {}),
      ...(description ? { description } : {}),
      ...(preferOver.length > 0 ? { preferOver } : {}),
      ...(commandDefaults ? { commands: commandDefaults } : {})
    };
  }
  return Object.keys(normalized).length > 0 ? normalized : void 0;
}
function normalizeManifestChannelCommandDefaults(value) {
  if (!(0, _utilsCKsuXgDI.c)(value)) return;
  const nativeCommandsAutoEnabled = typeof value.nativeCommandsAutoEnabled === "boolean" ? value.nativeCommandsAutoEnabled : void 0;
  const nativeSkillsAutoEnabled = typeof value.nativeSkillsAutoEnabled === "boolean" ? value.nativeSkillsAutoEnabled : void 0;
  return nativeCommandsAutoEnabled !== void 0 || nativeSkillsAutoEnabled !== void 0 ? {
    ...(nativeCommandsAutoEnabled !== void 0 ? { nativeCommandsAutoEnabled } : {}),
    ...(nativeSkillsAutoEnabled !== void 0 ? { nativeSkillsAutoEnabled } : {})
  } : void 0;
}
function resolvePluginManifestPath(rootDir) {
  for (const filename of PLUGIN_MANIFEST_FILENAMES) {
    const candidate = _nodePath.default.join(rootDir, filename);
    if (_nodeFs.default.existsSync(candidate)) return candidate;
  }
  return _nodePath.default.join(rootDir, PLUGIN_MANIFEST_FILENAME);
}
function buildPluginManifestLoadCacheKey(params) {
  return (0, _pluginCachePrimitivesM9JN_JCw.r)([
  [
  _nodePath.default.resolve(params.manifestPath),
  params.rejectHardlinks,
  params.rootRealPath ?? "",
  params.stats.dev,
  params.stats.ino],

  params.stats.size,
  params.stats.mtimeMs,
  params.stats.ctimeMs]
  );
}
function getCachedPluginManifestLoadResult(key, stats) {
  const entry = pluginManifestLoadCache.get(key);
  if (!entry || entry.size !== stats.size || entry.mtimeMs !== stats.mtimeMs || entry.ctimeMs !== stats.ctimeMs) return;
  return entry.result;
}
function setCachedPluginManifestLoadResult(key, stats, result) {
  pluginManifestLoadCache.set(key, {
    result,
    size: stats.size,
    mtimeMs: stats.mtimeMs,
    ctimeMs: stats.ctimeMs
  });
}
function parsePluginKind(raw) {
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw) && raw.length > 0 && raw.every((k) => typeof k === "string")) return raw.length === 1 ? raw[0] : raw;
}
function loadPluginManifest(rootDir, rejectHardlinks = true, rootRealPath) {
  const manifestPath = resolvePluginManifestPath(rootDir);
  const opened = (0, _rootFileCqMcFM3J.i)({
    absolutePath: manifestPath,
    rootPath: rootDir,
    ...(rootRealPath !== void 0 ? { rootRealPath } : {}),
    boundaryLabel: "plugin root",
    maxBytes: MAX_PLUGIN_MANIFEST_BYTES,
    rejectHardlinks
  });
  if (!opened.ok) return (0, _rootFileCqMcFM3J.n)(opened, {
    path: () => ({
      ok: false,
      error: `plugin manifest not found: ${manifestPath}`,
      manifestPath
    }),
    fallback: (failure) => ({
      ok: false,
      error: `unsafe plugin manifest path: ${manifestPath} (${failure.reason})`,
      manifestPath
    })
  });
  const stats = opened.stat;
  const cacheKey = buildPluginManifestLoadCacheKey({
    manifestPath,
    rejectHardlinks,
    ...(rootRealPath !== void 0 ? { rootRealPath } : {}),
    stats
  });
  const cached = getCachedPluginManifestLoadResult(cacheKey, stats);
  if (cached) {
    _nodeFs.default.closeSync(opened.fd);
    return cached;
  }
  const cacheResult = (result) => {
    setCachedPluginManifestLoadResult(cacheKey, stats, result);
    return result;
  };
  let raw;
  try {
    raw = (0, _parseJsonCompatCukN3ZQB.t)(_nodeFs.default.readFileSync(opened.fd, "utf-8"));
  } catch (err) {
    return cacheResult({
      ok: false,
      error: `failed to parse plugin manifest: ${String(err)}`,
      manifestPath
    });
  } finally {
    _nodeFs.default.closeSync(opened.fd);
  }
  if (!(0, _utilsCKsuXgDI.c)(raw)) return cacheResult({
    ok: false,
    error: "plugin manifest must be an object",
    manifestPath
  });
  const id = (0, _stringCoerceLndEvhRk.c)(raw.id) ?? "";
  if (!id) return cacheResult({
    ok: false,
    error: "plugin manifest requires id",
    manifestPath
  });
  const configSchema = (0, _utilsCKsuXgDI.c)(raw.configSchema) ? raw.configSchema : null;
  if (!configSchema) return cacheResult({
    ok: false,
    error: "plugin manifest requires configSchema",
    manifestPath
  });
  const kind = parsePluginKind(raw.kind);
  const enabledByDefault = raw.enabledByDefault === true;
  const enabledByDefaultOnPlatforms = normalizeManifestDefaultPlatforms(raw.enabledByDefaultOnPlatforms);
  const legacyPluginIds = (0, _stringNormalizationDgUPESoD.l)(raw.legacyPluginIds);
  const autoEnableWhenConfiguredProviders = (0, _stringNormalizationDgUPESoD.l)(raw.autoEnableWhenConfiguredProviders);
  const name = (0, _stringCoerceLndEvhRk.c)(raw.name);
  const description = (0, _stringCoerceLndEvhRk.c)(raw.description);
  const version = (0, _stringCoerceLndEvhRk.c)(raw.version);
  const channels = (0, _stringNormalizationDgUPESoD.l)(raw.channels);
  const providers = (0, _stringNormalizationDgUPESoD.l)(raw.providers);
  const providerCatalogEntry = (0, _stringCoerceLndEvhRk.c)(raw.providerCatalogEntry);
  const providerDiscoveryEntry = (0, _stringCoerceLndEvhRk.c)(raw.providerDiscoveryEntry);
  const modelSupport = normalizeManifestModelSupport(raw.modelSupport);
  const modelCatalog = (0, _modelCatalogD79ZM1tY.a)(raw.modelCatalog, { ownedProviders: new Set(providers) });
  const modelPricing = normalizeManifestModelPricing(raw.modelPricing, { ownedProviders: new Set(providers) });
  const modelIdNormalization = normalizeManifestModelIdNormalization(raw.modelIdNormalization, { ownedProviders: new Set(providers) });
  const providerEndpoints = normalizeManifestProviderEndpoints(raw.providerEndpoints);
  const providerRequest = normalizeManifestProviderRequest(raw.providerRequest, { ownedProviders: new Set(providers) });
  const cliBackends = (0, _stringNormalizationDgUPESoD.l)(raw.cliBackends);
  const syntheticAuthRefs = (0, _stringNormalizationDgUPESoD.l)(raw.syntheticAuthRefs);
  const nonSecretAuthMarkers = (0, _stringNormalizationDgUPESoD.l)(raw.nonSecretAuthMarkers);
  const commandAliases = (0, _manifestCommandAliasesBFWl4mXS.t)(raw.commandAliases);
  const providerAuthEnvVars = normalizeStringListRecord(raw.providerAuthEnvVars);
  const providerAuthAliases = normalizeStringRecord(raw.providerAuthAliases);
  const channelEnvVars = normalizeStringListRecord(raw.channelEnvVars);
  const providerAuthChoices = normalizeProviderAuthChoices(raw.providerAuthChoices);
  const activation = normalizeManifestActivation(raw.activation);
  const setup = normalizeManifestSetup(raw.setup);
  const qaRunners = normalizeManifestQaRunners(raw.qaRunners);
  const skills = (0, _stringNormalizationDgUPESoD.l)(raw.skills);
  const contracts = normalizeManifestContracts(raw.contracts);
  const mediaUnderstandingProviderMetadata = normalizeMediaUnderstandingProviderMetadata(raw.mediaUnderstandingProviderMetadata);
  const imageGenerationProviderMetadata = normalizeCapabilityProviderMetadata(raw.imageGenerationProviderMetadata);
  const videoGenerationProviderMetadata = normalizeCapabilityProviderMetadata(raw.videoGenerationProviderMetadata);
  const musicGenerationProviderMetadata = normalizeCapabilityProviderMetadata(raw.musicGenerationProviderMetadata);
  const toolMetadata = normalizePluginToolMetadata(raw.toolMetadata);
  const configContracts = normalizeManifestConfigContracts(raw.configContracts);
  const channelConfigs = normalizeChannelConfigs(raw.channelConfigs);
  let uiHints;
  if ((0, _utilsCKsuXgDI.c)(raw.uiHints)) uiHints = raw.uiHints;
  return cacheResult({
    ok: true,
    manifest: {
      id,
      configSchema,
      ...(enabledByDefault ? { enabledByDefault } : {}),
      ...(enabledByDefaultOnPlatforms.length > 0 ? { enabledByDefaultOnPlatforms } : {}),
      ...(legacyPluginIds.length > 0 ? { legacyPluginIds } : {}),
      ...(autoEnableWhenConfiguredProviders.length > 0 ? { autoEnableWhenConfiguredProviders } : {}),
      kind,
      channels,
      providers,
      providerCatalogEntry,
      providerDiscoveryEntry,
      modelSupport,
      modelCatalog,
      modelPricing,
      modelIdNormalization,
      providerEndpoints,
      providerRequest,
      cliBackends,
      syntheticAuthRefs,
      nonSecretAuthMarkers,
      commandAliases,
      providerAuthEnvVars,
      providerAuthAliases,
      channelEnvVars,
      providerAuthChoices,
      activation,
      setup,
      qaRunners,
      skills,
      name,
      description,
      version,
      uiHints,
      contracts,
      mediaUnderstandingProviderMetadata,
      imageGenerationProviderMetadata,
      videoGenerationProviderMetadata,
      musicGenerationProviderMetadata,
      toolMetadata,
      configContracts,
      channelConfigs
    },
    manifestPath
  });
}
const DEFAULT_PLUGIN_ENTRY_CANDIDATES = exports.t = [
"index.ts",
"index.js",
"index.mjs",
"index.cjs"];

function getPackageManifestMetadata(manifest) {
  if (!manifest) return;
  return manifest[_legacyNamesB770VN3J.n];
}
function resolvePackageExtensionEntries(manifest) {
  const rawOpenClaw = manifest?.[_legacyNamesB770VN3J.n];
  if (rawOpenClaw === void 0 || rawOpenClaw === null) return {
    status: "missing",
    entries: []
  };
  if (!(0, _utilsCKsuXgDI.c)(rawOpenClaw)) return {
    status: "invalid",
    entries: [],
    error: "package.json openclaw must be an object"
  };
  const raw = rawOpenClaw.extensions;
  if (raw === void 0 || raw === null) return {
    status: "missing",
    entries: []
  };
  if (!Array.isArray(raw)) return {
    status: "invalid",
    entries: [],
    error: "package.json openclaw.extensions must be an array"
  };
  const entries = [];
  for (const [index, entry] of raw.entries()) {
    const normalized = (0, _stringCoerceLndEvhRk.c)(entry);
    if (!normalized) return {
      status: "invalid",
      entries: [],
      error: `package.json openclaw.extensions[${index}] must be a non-empty string`
    };
    entries.push(normalized);
  }
  if (entries.length === 0) return {
    status: "empty",
    entries: []
  };
  return {
    status: "ok",
    entries
  };
}
//#endregion /* v9-f55e9dd0da233b08 */
