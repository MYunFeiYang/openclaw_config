"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = normalizeHeaderValues;exports.c = resolveMissingProviderApiKey;exports.i = normalizeConfiguredProviderApiKey;exports.n = createProviderAuthResolver;exports.o = normalizeResolvedEnvApiKey;exports.r = normalizeApiKeyConfig;exports.s = resolveApiKeyFromProfiles;exports.t = createProviderApiKeyResolver;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
var _typesSecretsCJS3n8Im = require("./types.secrets-CJS3n8Im.js");
var _providerAuthAliasesDEhinO0g = require("./provider-auth-aliases-DEhinO0g.js");
var _providerRuntimeO0ZjFTlv = require("./provider-runtime-o0ZjFTlv.js");
var _modelAuthMarkersBoUkLnQ = require("./model-auth-markers-Bo-UkLnQ.js");
var _normalizeSecretInputCH0hjbpb = require("./normalize-secret-input-CH0hjbpb.js");
var _modelAuthEnvPIWXP99L = require("./model-auth-env-PIWXP99L.js");
var _modelAuthRuntimeSharedDAhI9GRn = require("./model-auth-runtime-shared-DAhI9GRn.js");
//#region src/agents/models-config.providers.secret-helpers.ts
const ENV_VAR_NAME_RE = /^[A-Z_][A-Z0-9_]*$/;
function normalizeApiKeyConfig(value) {
  const trimmed = value.trim();
  return /^\$\{([A-Z0-9_]+)\}$/.exec(trimmed)?.[1] ?? trimmed;
}
function toDiscoveryApiKey(value) {
  const trimmed = (0, _stringCoerceLndEvhRk.c)(value);
  if (!trimmed || (0, _modelAuthMarkersBoUkLnQ.u)(trimmed)) return;
  return trimmed;
}
function resolveEnvApiKeyVarName(provider, env = process.env) {
  const resolved = (0, _modelAuthEnvPIWXP99L.t)(provider, env);
  if (!resolved) return;
  const match = /^(?:env: |shell env: )([A-Z0-9_]+)$/.exec(resolved.source);
  return match ? match[1] : void 0;
}
function resolveAwsSdkApiKeyVarName(env = process.env) {
  return (0, _modelAuthRuntimeSharedDAhI9GRn.r)(env);
}
function normalizeHeaderValues(params) {
  const { headers } = params;
  if (!headers) return {
    headers,
    mutated: false
  };
  let mutated = false;
  const nextHeaders = {};
  for (const [headerName, headerValue] of Object.entries(headers)) {
    const resolvedRef = (0, _typesSecretsCJS3n8Im.m)({
      value: headerValue,
      defaults: params.secretDefaults
    }).ref;
    if (!resolvedRef || !resolvedRef.id.trim()) {
      nextHeaders[headerName] = headerValue;
      continue;
    }
    mutated = true;
    nextHeaders[headerName] = resolvedRef.source === "env" ? (0, _modelAuthMarkersBoUkLnQ.m)(resolvedRef.id) : (0, _modelAuthMarkersBoUkLnQ.g)(resolvedRef.source);
  }
  if (!mutated) return {
    headers,
    mutated: false
  };
  return {
    headers: nextHeaders,
    mutated: true
  };
}
function resolveApiKeyFromCredential(cred, env = process.env) {
  if (!cred) return;
  if (cred.type === "api_key") {
    const keyRef = (0, _typesSecretsCJS3n8Im.o)(cred.keyRef);
    if (keyRef && keyRef.id.trim()) {
      if (keyRef.source === "env") {
        const envVar = keyRef.id.trim();
        return {
          apiKey: envVar,
          source: "env-ref",
          discoveryApiKey: toDiscoveryApiKey(env[envVar])
        };
      }
      return {
        apiKey: (0, _modelAuthMarkersBoUkLnQ.h)(keyRef.source),
        source: "non-env-ref"
      };
    }
    if (cred.key?.trim()) return {
      apiKey: cred.key,
      source: "plaintext",
      discoveryApiKey: toDiscoveryApiKey(cred.key)
    };
    return;
  }
  if (cred.type === "token") {
    const tokenRef = (0, _typesSecretsCJS3n8Im.o)(cred.tokenRef);
    if (tokenRef && tokenRef.id.trim()) {
      if (tokenRef.source === "env") {
        const envVar = tokenRef.id.trim();
        return {
          apiKey: envVar,
          source: "env-ref",
          discoveryApiKey: toDiscoveryApiKey(env[envVar])
        };
      }
      return {
        apiKey: (0, _modelAuthMarkersBoUkLnQ.h)(tokenRef.source),
        source: "non-env-ref"
      };
    }
    if (cred.token?.trim()) return {
      apiKey: cred.token,
      source: "plaintext",
      discoveryApiKey: toDiscoveryApiKey(cred.token)
    };
  }
}
function listAuthProfilesForProvider(store, provider) {
  const providerKey = (0, _providerAuthAliasesDEhinO0g.r)(provider);
  return Object.entries(store.profiles).filter(([, cred]) => (0, _providerAuthAliasesDEhinO0g.r)(cred.provider) === providerKey).map(([id]) => id);
}
function resolveApiKeyFromProfiles(params) {
  const ids = listAuthProfilesForProvider(params.store, params.provider);
  for (const id of ids) {
    const resolved = resolveApiKeyFromCredential(params.store.profiles[id], params.env);
    if (resolved) return resolved;
  }
}
function normalizeConfiguredProviderApiKey(params) {
  const configuredApiKey = params.provider.apiKey;
  const configuredApiKeyRef = (0, _typesSecretsCJS3n8Im.m)({
    value: configuredApiKey,
    defaults: params.secretDefaults
  }).ref;
  if (configuredApiKeyRef && configuredApiKeyRef.id.trim()) {
    const marker = configuredApiKeyRef.source === "env" ? configuredApiKeyRef.id.trim() : (0, _modelAuthMarkersBoUkLnQ.h)(configuredApiKeyRef.source);
    params.secretRefManagedProviders?.add(params.providerKey);
    if (params.provider.apiKey === marker) return params.provider;
    return {
      ...params.provider,
      apiKey: marker
    };
  }
  if (typeof configuredApiKey !== "string") return params.provider;
  const normalizedConfiguredApiKey = normalizeApiKeyConfig(configuredApiKey);
  if ((0, _modelAuthMarkersBoUkLnQ.u)(normalizedConfiguredApiKey)) params.secretRefManagedProviders?.add(params.providerKey);
  if (params.profileApiKey && params.profileApiKey.source !== "plaintext" && normalizedConfiguredApiKey === params.profileApiKey.apiKey) params.secretRefManagedProviders?.add(params.providerKey);
  if (normalizedConfiguredApiKey === configuredApiKey) return params.provider;
  return {
    ...params.provider,
    apiKey: normalizedConfiguredApiKey
  };
}
function normalizeResolvedEnvApiKey(params) {
  const currentApiKey = params.provider.apiKey;
  if (typeof currentApiKey !== "string" || !currentApiKey.trim() || ENV_VAR_NAME_RE.test(currentApiKey.trim())) return params.provider;
  const envVarName = resolveEnvApiKeyVarName(params.providerKey, params.env);
  if (!envVarName || params.env[envVarName] !== currentApiKey) return params.provider;
  params.secretRefManagedProviders?.add(params.providerKey);
  return {
    ...params.provider,
    apiKey: envVarName
  };
}
function resolveMissingProviderApiKey(params) {
  const hasModels = Array.isArray(params.provider.models) && params.provider.models.length > 0;
  const normalizedApiKey = (0, _normalizeSecretInputCH0hjbpb.t)(params.provider.apiKey);
  const hasConfiguredApiKey = Boolean(normalizedApiKey || params.provider.apiKey);
  if (!hasModels || hasConfiguredApiKey) return params.provider;
  const authMode = params.provider.auth;
  if (params.providerApiKeyResolver && (!authMode || authMode === "aws-sdk")) {
    const resolvedApiKey = params.providerApiKeyResolver(params.env);
    if (!resolvedApiKey) return params.provider;
    return {
      ...params.provider,
      apiKey: resolvedApiKey
    };
  }
  if (authMode === "aws-sdk") {
    const awsEnvVar = resolveAwsSdkApiKeyVarName(params.env);
    if (!awsEnvVar) return params.provider;
    return {
      ...params.provider,
      apiKey: awsEnvVar
    };
  }
  const apiKey = resolveEnvApiKeyVarName(params.providerKey, params.env) ?? params.profileApiKey?.apiKey;
  if (!apiKey?.trim()) return params.provider;
  if (params.profileApiKey && params.profileApiKey.source !== "plaintext") params.secretRefManagedProviders?.add(params.providerKey);
  return {
    ...params.provider,
    apiKey
  };
}
//#endregion
//#region src/agents/models-config.providers.secrets.ts
function resolveAuthProfileStoreInput(input) {
  return typeof input === "function" ? input() : input;
}
function createProviderApiKeyResolver(env, authStoreInput, config) {
  return (provider) => {
    const authProvider = (0, _providerAuthAliasesDEhinO0g.r)(provider, {
      config,
      env
    });
    const envVar = resolveEnvApiKeyVarName(authProvider, env);
    if (envVar) return {
      apiKey: envVar,
      discoveryApiKey: toDiscoveryApiKey(env[envVar])
    };
    const fromConfig = resolveConfigBackedProviderAuth({
      provider: authProvider,
      config,
      env
    });
    if (fromConfig?.apiKey) return {
      apiKey: fromConfig.apiKey,
      discoveryApiKey: fromConfig.discoveryApiKey
    };
    const fromProfiles = resolveApiKeyFromProfiles({
      provider: authProvider,
      store: resolveAuthProfileStoreInput(authStoreInput),
      env
    });
    return fromProfiles?.apiKey ? {
      apiKey: fromProfiles.apiKey,
      discoveryApiKey: fromProfiles.discoveryApiKey
    } : {
      apiKey: void 0,
      discoveryApiKey: void 0
    };
  };
}
function createProviderAuthResolver(env, authStoreInput, config) {
  return (provider, options) => {
    const authProvider = (0, _providerAuthAliasesDEhinO0g.r)(provider, {
      config,
      env
    });
    const authStore = resolveAuthProfileStoreInput(authStoreInput);
    const ids = listAuthProfilesForProvider(authStore, authProvider);
    let oauthCandidate;
    for (const id of ids) {
      const cred = authStore.profiles[id];
      if (!cred) continue;
      if (cred.type === "oauth") {
        oauthCandidate ??= {
          apiKey: options?.oauthMarker,
          discoveryApiKey: toDiscoveryApiKey(cred.access),
          mode: "oauth",
          source: "profile",
          profileId: id
        };
        continue;
      }
      const resolved = resolveApiKeyFromCredential(cred, env);
      if (!resolved) continue;
      return {
        apiKey: resolved.apiKey,
        discoveryApiKey: resolved.discoveryApiKey,
        mode: cred.type,
        source: "profile",
        profileId: id
      };
    }
    if (oauthCandidate) return oauthCandidate;
    const envVar = resolveEnvApiKeyVarName(authProvider, env);
    if (envVar) return {
      apiKey: envVar,
      discoveryApiKey: toDiscoveryApiKey(env[envVar]),
      mode: "api_key",
      source: "env"
    };
    const fromConfig = resolveConfigBackedProviderAuth({
      provider: authProvider,
      config,
      env
    });
    if (fromConfig) return {
      apiKey: fromConfig.apiKey,
      discoveryApiKey: fromConfig.discoveryApiKey,
      mode: fromConfig.mode,
      source: "none"
    };
    return {
      apiKey: void 0,
      discoveryApiKey: void 0,
      mode: "none",
      source: "none"
    };
  };
}
function resolveConfigBackedProviderAuth(params) {
  const authProvider = (0, _providerAuthAliasesDEhinO0g.r)(params.provider, { config: params.config });
  const apiKey = (0, _providerRuntimeO0ZjFTlv.M)({
    provider: authProvider,
    config: params.config,
    context: {
      config: params.config,
      provider: authProvider,
      providerConfig: params.config?.models?.providers?.[authProvider]
    }
  })?.apiKey?.trim();
  if (apiKey) return (0, _modelAuthMarkersBoUkLnQ.u)(apiKey) ? {
    apiKey,
    discoveryApiKey: toDiscoveryApiKey(apiKey),
    mode: "api_key",
    source: "config"
  } : {
    apiKey: (0, _modelAuthMarkersBoUkLnQ.h)("file"),
    discoveryApiKey: toDiscoveryApiKey(apiKey),
    mode: "api_key",
    source: "config"
  };
  const configuredProviderApiKey = params.config?.models?.providers?.[authProvider]?.apiKey;
  const configuredApiKeyRef = (0, _typesSecretsCJS3n8Im.m)({
    value: configuredProviderApiKey,
    defaults: params.config?.secrets?.defaults
  }).ref;
  if (configuredApiKeyRef) {
    if (configuredApiKeyRef.source === "env") {
      const envVar = configuredApiKeyRef.id.trim();
      const envValue = params.env?.[envVar]?.trim();
      return envValue ? {
        apiKey: envVar,
        discoveryApiKey: toDiscoveryApiKey(envValue),
        mode: "api_key",
        source: "config"
      } : void 0;
    }
    return {
      apiKey: (0, _modelAuthMarkersBoUkLnQ.h)(configuredApiKeyRef.source),
      discoveryApiKey: void 0,
      mode: "api_key",
      source: "config"
    };
  }
  if (typeof configuredProviderApiKey !== "string") return;
  const configuredApiKey = normalizeApiKeyConfig(configuredProviderApiKey);
  if (!configuredApiKey) return;
  if ((0, _modelAuthMarkersBoUkLnQ.l)(configuredApiKey)) {
    const envValue = params.env?.[configuredApiKey]?.trim();
    if (envValue) return {
      apiKey: configuredApiKey,
      discoveryApiKey: toDiscoveryApiKey(envValue),
      mode: "api_key",
      source: "config"
    };
    return;
  }
  return (0, _modelAuthMarkersBoUkLnQ.u)(configuredApiKey) ? {
    apiKey: configuredApiKey,
    discoveryApiKey: toDiscoveryApiKey(configuredApiKey),
    mode: "api_key",
    source: "config"
  } : {
    apiKey: configuredApiKey,
    discoveryApiKey: toDiscoveryApiKey(configuredApiKey),
    mode: "api_key",
    source: "config"
  };
}
//#endregion /* v9-c02ec8ca84d7d719 */
