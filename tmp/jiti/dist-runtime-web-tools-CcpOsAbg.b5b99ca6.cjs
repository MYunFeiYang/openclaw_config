"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = collectConfigAssignments;exports.t = resolveRuntimeWebTools;var _stringCoerceBje8XVt = require("./string-coerce-Bje8XVt9.js");
var _utilsDvkbxKCZ = require("./utils-DvkbxKCZ.js");
var _typesSecretsBHp0Y_k = require("./types.secrets-BHp0Y_k0.js");
var _refContractDtvCiPbj = require("./ref-contract-DtvCiPbj.js");
var _configStateCB4SZz9a = require("./config-state-cB4SZz9a.js");
var _targetRegistryDOBQeKjE = require("./target-registry-DOBQeKjE.js");
require("./shared-C9ga15VD.js");
var _manifestRegistryAdU8lVLL = require("./manifest-registry-adU8lVLL.js");
var _resolveCKxwAAOr = require("./resolve-CKxwAAOr.js");
var _agentScopeRNt6KatQ = require("./agent-scope-RNt6KatQ.js");
var _bootstrapRegistryCSEgA6OB = require("./bootstrap-registry-CSEgA6OB.js");
require("./installed-plugin-index-records-D8w5X7uR.js");
var _configContractsBlvCFExB = require("./config-contracts-BlvCFExB.js");
var _normalizeSecretInputBBVMiIqq = require("./normalize-secret-input-BBVMiIqq.js");
var _configProviderModelsBLe4SK7D = require("./config-provider-models-BLe4SK7D.js");
var _capabilityProviderRuntimeD2czy7T_ = require("./capability-provider-runtime-D2czy7T_.js");
var _lazyRuntimeY64shOif = require("./lazy-runtime-y64shOif.js");
var _entryCapabilitiesDBn1ATuI = require("./entry-capabilities-DBn1ATuI.js");
var _webProviderPublicArtifactsExplicitDVl2HWOD = require("./web-provider-public-artifacts.explicit-DVl2HWOD.js");
var _runtimeSharedClUz2kEK = require("./runtime-shared-ClUz2kEK.js");
var _runtimeConfigCollectorsTtsCDSAn1jv = require("./runtime-config-collectors-tts-CDSAn1jv.js");
var _runtimeGatewayAuthSurfaces7OlMAWXn = require("./runtime-gateway-auth-surfaces-7OlMAWXn.js");
var _webSearchProvidersSharedDapa4fBD = require("./web-search-providers.shared-Dapa4fBD.js");function _interopRequireWildcard(e, t) {if ("function" == typeof WeakMap) var r = new WeakMap(),n = new WeakMap();return (_interopRequireWildcard = function (e, t) {if (!t && e && e.__esModule) return e;var o,i,f = { __proto__: null, default: e };if (null === e || "object" != typeof e && "function" != typeof e) return f;if (o = t ? n : r) {if (o.has(e)) return o.get(e);o.set(e, f);}for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]);return f;})(e, t);}
//#region src/secrets/runtime-config-collectors-channels.ts
function collectChannelConfigAssignments(params) {
  const channelIds = Object.keys(params.config.channels ?? {});
  if (channelIds.length === 0) return;
  for (const channelId of channelIds) ((0, _targetRegistryDOBQeKjE.l)(channelId)?.collectRuntimeConfigAssignments ?? (0, _bootstrapRegistryCSEgA6OB.n)(channelId)?.collectRuntimeConfigAssignments)?.(params);
}
//#endregion
//#region src/media-understanding/provider-capability-registry.ts
function mergeProviderCapabilities(registry, provider) {
  const normalizedKey = (0, _configProviderModelsBLe4SK7D.n)(provider.id);
  const existing = registry.get(normalizedKey);
  registry.set(normalizedKey, { capabilities: provider.capabilities ?? existing?.capabilities });
}
function buildMediaUnderstandingCapabilityRegistry(cfg) {
  const registry = /* @__PURE__ */new Map();
  for (const provider of (0, _capabilityProviderRuntimeD2czy7T_.n)({
    key: "mediaUnderstandingProviders",
    cfg
  })) mergeProviderCapabilities(registry, provider);
  for (const normalizedKey of (0, _configProviderModelsBLe4SK7D.t)(cfg)) if (!registry.has(normalizedKey)) mergeProviderCapabilities(registry, {
    id: normalizedKey,
    capabilities: ["image"]
  });
  return registry;
}
//#endregion
//#region src/secrets/runtime-config-collectors-core.ts
function collectModelProviderAssignments(params) {
  for (const [providerId, provider] of Object.entries(params.providers)) {
    const providerIsActive = provider.enabled !== false;
    (0, _runtimeSharedClUz2kEK.n)({
      value: provider.apiKey,
      path: `models.providers.${providerId}.apiKey`,
      expected: "string",
      defaults: params.defaults,
      context: params.context,
      active: providerIsActive,
      inactiveReason: "provider is disabled.",
      apply: (value) => {
        provider.apiKey = value;
      }
    });
    const headers = (0, _utilsDvkbxKCZ.c)(provider.headers) ? provider.headers : void 0;
    if (headers) for (const [headerKey, headerValue] of Object.entries(headers)) (0, _runtimeSharedClUz2kEK.n)({
      value: headerValue,
      path: `models.providers.${providerId}.headers.${headerKey}`,
      expected: "string",
      defaults: params.defaults,
      context: params.context,
      active: providerIsActive,
      inactiveReason: "provider is disabled.",
      apply: (value) => {
        headers[headerKey] = value;
      }
    });
    const request = (0, _utilsDvkbxKCZ.c)(provider.request) ? provider.request : void 0;
    if (request) collectProviderRequestAssignments({
      request,
      pathPrefix: `models.providers.${providerId}.request`,
      defaults: params.defaults,
      context: params.context,
      active: providerIsActive,
      inactiveReason: "provider is disabled.",
      collectTransportSecrets: true
    });
  }
}
function collectSkillAssignments(params) {
  for (const [skillKey, entry] of Object.entries(params.entries)) (0, _runtimeSharedClUz2kEK.n)({
    value: entry.apiKey,
    path: `skills.entries.${skillKey}.apiKey`,
    expected: "string",
    defaults: params.defaults,
    context: params.context,
    active: entry.enabled !== false,
    inactiveReason: "skill entry is disabled.",
    apply: (value) => {
      entry.apiKey = value;
    }
  });
}
function collectAgentMemorySearchAssignments(params) {
  const agents = params.config.agents;
  if (!(0, _utilsDvkbxKCZ.c)(agents)) return;
  const defaultsConfig = (0, _utilsDvkbxKCZ.c)(agents.defaults) ? agents.defaults : void 0;
  const defaultsMemorySearch = (0, _utilsDvkbxKCZ.c)(defaultsConfig?.memorySearch) ? defaultsConfig.memorySearch : void 0;
  const defaultsEnabled = defaultsMemorySearch?.enabled !== false;
  const list = Array.isArray(agents.list) ? agents.list : [];
  let hasEnabledAgentWithoutOverride = false;
  for (const rawAgent of list) {
    if (!(0, _utilsDvkbxKCZ.c)(rawAgent)) continue;
    if (rawAgent.enabled === false) continue;
    const memorySearch = (0, _utilsDvkbxKCZ.c)(rawAgent.memorySearch) ? rawAgent.memorySearch : void 0;
    if (memorySearch?.enabled === false) continue;
    if (!memorySearch || !Object.prototype.hasOwnProperty.call(memorySearch, "remote")) {
      hasEnabledAgentWithoutOverride = true;
      continue;
    }
    const remote = (0, _utilsDvkbxKCZ.c)(memorySearch.remote) ? memorySearch.remote : void 0;
    if (!remote || !Object.prototype.hasOwnProperty.call(remote, "apiKey")) {
      hasEnabledAgentWithoutOverride = true;
      continue;
    }
  }
  if (defaultsMemorySearch && (0, _utilsDvkbxKCZ.c)(defaultsMemorySearch.remote)) {
    const remote = defaultsMemorySearch.remote;
    (0, _runtimeSharedClUz2kEK.n)({
      value: remote.apiKey,
      path: "agents.defaults.memorySearch.remote.apiKey",
      expected: "string",
      defaults: params.defaults,
      context: params.context,
      active: defaultsEnabled && (hasEnabledAgentWithoutOverride || list.length === 0),
      inactiveReason: hasEnabledAgentWithoutOverride ? void 0 : "all enabled agents override memorySearch.remote.apiKey.",
      apply: (value) => {
        remote.apiKey = value;
      }
    });
  }
  list.forEach((rawAgent, index) => {
    if (!(0, _utilsDvkbxKCZ.c)(rawAgent)) return;
    const memorySearch = (0, _utilsDvkbxKCZ.c)(rawAgent.memorySearch) ? rawAgent.memorySearch : void 0;
    if (!memorySearch) return;
    const remote = (0, _utilsDvkbxKCZ.c)(memorySearch.remote) ? memorySearch.remote : void 0;
    if (!remote || !Object.prototype.hasOwnProperty.call(remote, "apiKey")) return;
    const enabled = rawAgent.enabled !== false && memorySearch.enabled !== false;
    (0, _runtimeSharedClUz2kEK.n)({
      value: remote.apiKey,
      path: `agents.list.${index}.memorySearch.remote.apiKey`,
      expected: "string",
      defaults: params.defaults,
      context: params.context,
      active: enabled,
      inactiveReason: "agent or memorySearch override is disabled.",
      apply: (value) => {
        remote.apiKey = value;
      }
    });
  });
}
function collectTalkAssignments(params) {
  const talk = params.config.talk;
  if (!(0, _utilsDvkbxKCZ.c)(talk)) return;
  (0, _runtimeSharedClUz2kEK.n)({
    value: talk.apiKey,
    path: "talk.apiKey",
    expected: "string",
    defaults: params.defaults,
    context: params.context,
    apply: (value) => {
      talk.apiKey = value;
    }
  });
  const providers = talk.providers;
  if (!(0, _utilsDvkbxKCZ.c)(providers)) return;
  for (const [providerId, providerConfig] of Object.entries(providers)) {
    if (!(0, _utilsDvkbxKCZ.c)(providerConfig)) continue;
    (0, _runtimeSharedClUz2kEK.n)({
      value: providerConfig.apiKey,
      path: `talk.providers.${providerId}.apiKey`,
      expected: "string",
      defaults: params.defaults,
      context: params.context,
      apply: (value) => {
        providerConfig.apiKey = value;
      }
    });
  }
}
function collectGatewayAssignments(params) {
  const gateway = params.config.gateway;
  if (!(0, _utilsDvkbxKCZ.c)(gateway)) return;
  const auth = (0, _utilsDvkbxKCZ.c)(gateway.auth) ? gateway.auth : void 0;
  const remote = (0, _utilsDvkbxKCZ.c)(gateway.remote) ? gateway.remote : void 0;
  const gatewaySurfaceStates = (0, _runtimeGatewayAuthSurfaces7OlMAWXn.n)({
    config: params.config,
    env: params.context.env,
    defaults: params.defaults
  });
  if (auth) {
    (0, _runtimeSharedClUz2kEK.n)({
      value: auth.token,
      path: "gateway.auth.token",
      expected: "string",
      defaults: params.defaults,
      context: params.context,
      active: gatewaySurfaceStates["gateway.auth.token"].active,
      inactiveReason: gatewaySurfaceStates["gateway.auth.token"].reason,
      apply: (value) => {
        auth.token = value;
      }
    });
    (0, _runtimeSharedClUz2kEK.n)({
      value: auth.password,
      path: "gateway.auth.password",
      expected: "string",
      defaults: params.defaults,
      context: params.context,
      active: gatewaySurfaceStates["gateway.auth.password"].active,
      inactiveReason: gatewaySurfaceStates["gateway.auth.password"].reason,
      apply: (value) => {
        auth.password = value;
      }
    });
  }
  if (remote) {
    (0, _runtimeSharedClUz2kEK.n)({
      value: remote.token,
      path: "gateway.remote.token",
      expected: "string",
      defaults: params.defaults,
      context: params.context,
      active: gatewaySurfaceStates["gateway.remote.token"].active,
      inactiveReason: gatewaySurfaceStates["gateway.remote.token"].reason,
      apply: (value) => {
        remote.token = value;
      }
    });
    (0, _runtimeSharedClUz2kEK.n)({
      value: remote.password,
      path: "gateway.remote.password",
      expected: "string",
      defaults: params.defaults,
      context: params.context,
      active: gatewaySurfaceStates["gateway.remote.password"].active,
      inactiveReason: gatewaySurfaceStates["gateway.remote.password"].reason,
      apply: (value) => {
        remote.password = value;
      }
    });
  }
}
function collectProviderRequestAssignments(params) {
  const headers = (0, _utilsDvkbxKCZ.c)(params.request.headers) ? params.request.headers : void 0;
  if (headers) for (const [headerKey, headerValue] of Object.entries(headers)) (0, _runtimeSharedClUz2kEK.n)({
    value: headerValue,
    path: `${params.pathPrefix}.headers.${headerKey}`,
    expected: "string",
    defaults: params.defaults,
    context: params.context,
    active: params.active,
    inactiveReason: params.inactiveReason,
    apply: (value) => {
      headers[headerKey] = value;
    }
  });
  const auth = (0, _utilsDvkbxKCZ.c)(params.request.auth) ? params.request.auth : void 0;
  if (auth) {
    (0, _runtimeSharedClUz2kEK.n)({
      value: auth.token,
      path: `${params.pathPrefix}.auth.token`,
      expected: "string",
      defaults: params.defaults,
      context: params.context,
      active: params.active,
      inactiveReason: params.inactiveReason,
      apply: (value) => {
        auth.token = value;
      }
    });
    (0, _runtimeSharedClUz2kEK.n)({
      value: auth.value,
      path: `${params.pathPrefix}.auth.value`,
      expected: "string",
      defaults: params.defaults,
      context: params.context,
      active: params.active,
      inactiveReason: params.inactiveReason,
      apply: (value) => {
        auth.value = value;
      }
    });
  }
  const collectTlsAssignments = (tls, pathPrefix) => {
    if (!tls) return;
    for (const key of [
    "ca",
    "cert",
    "key",
    "passphrase"])
    (0, _runtimeSharedClUz2kEK.n)({
      value: tls[key],
      path: `${pathPrefix}.${key}`,
      expected: "string",
      defaults: params.defaults,
      context: params.context,
      active: params.active,
      inactiveReason: params.inactiveReason,
      apply: (value) => {
        tls[key] = value;
      }
    });
  };
  if (params.collectTransportSecrets !== false) {
    collectTlsAssignments((0, _utilsDvkbxKCZ.c)(params.request.tls) ? params.request.tls : void 0, `${params.pathPrefix}.tls`);
    const proxy = (0, _utilsDvkbxKCZ.c)(params.request.proxy) ? params.request.proxy : void 0;
    collectTlsAssignments((0, _utilsDvkbxKCZ.c)(proxy?.tls) ? proxy.tls : void 0, `${params.pathPrefix}.proxy.tls`);
  }
}
function collectMediaRequestAssignments(params) {
  const tools = (0, _utilsDvkbxKCZ.c)(params.config.tools) ? params.config.tools : void 0;
  const media = (0, _utilsDvkbxKCZ.c)(tools?.media) ? tools.media : void 0;
  if (!media) return;
  let providerRegistry;
  const getProviderRegistry = () => {
    providerRegistry ??= buildMediaUnderstandingCapabilityRegistry(params.config);
    return providerRegistry;
  };
  const capabilityKeys = [
  "audio",
  "image",
  "video"];

  const isCapabilityEnabled = (capability) => ((0, _utilsDvkbxKCZ.c)(media[capability]) ? media[capability] : void 0)?.enabled !== false;
  const collectModelAssignments = (models, pathPrefix, resolveActivity) => {
    if (!Array.isArray(models)) return;
    models.forEach((rawModel, index) => {
      if (!(0, _utilsDvkbxKCZ.c)(rawModel) || !(0, _utilsDvkbxKCZ.c)(rawModel.request)) return;
      const { active, inactiveReason } = resolveActivity(rawModel);
      collectProviderRequestAssignments({
        request: rawModel.request,
        pathPrefix: `${pathPrefix}.${index}.request`,
        defaults: params.defaults,
        context: params.context,
        active,
        inactiveReason
      });
    });
  };
  collectModelAssignments(media.models, "tools.media.models", (rawModel) => {
    const entry = rawModel;
    const capabilities = (0, _entryCapabilitiesDBn1ATuI.n)(entry) ?? (0, _entryCapabilitiesDBn1ATuI.r)({
      entry,
      source: "shared",
      providerRegistry: getProviderRegistry()
    });
    if (!capabilities || capabilities.length === 0) return {
      active: false,
      inactiveReason: "shared media model does not declare capabilities and none could be inferred from its provider."
    };
    return {
      active: capabilities.some((capability) => isCapabilityEnabled(capability)),
      inactiveReason: `all configured media capabilities for this shared model are disabled: ${capabilities.join(", ")}.`
    };
  });
  for (const capability of capabilityKeys) {
    const section = (0, _utilsDvkbxKCZ.c)(media[capability]) ? media[capability] : void 0;
    const active = isCapabilityEnabled(capability);
    const inactiveReason = `${capability} media understanding is disabled.`;
    if (section && (0, _utilsDvkbxKCZ.c)(section.request)) collectProviderRequestAssignments({
      request: section.request,
      pathPrefix: `tools.media.${capability}.request`,
      defaults: params.defaults,
      context: params.context,
      active,
      inactiveReason
    });
    collectModelAssignments(section?.models, `tools.media.${capability}.models`, (rawModel) => ({
      active: active && (() => {
        const configuredCapabilities = (0, _entryCapabilitiesDBn1ATuI.n)(rawModel);
        return configuredCapabilities ? configuredCapabilities.includes(capability) : true;
      })(),
      inactiveReason: active ? `${capability} media model is filtered out by its configured capabilities.` : inactiveReason
    }));
  }
}
function collectMessagesTtsAssignments(params) {
  const messages = params.config.messages;
  if (!(0, _utilsDvkbxKCZ.c)(messages) || !(0, _utilsDvkbxKCZ.c)(messages.tts)) return;
  (0, _runtimeConfigCollectorsTtsCDSAn1jv.t)({
    tts: messages.tts,
    pathPrefix: "messages.tts",
    defaults: params.defaults,
    context: params.context
  });
}
function collectAgentTtsAssignments(params) {
  const list = params.config.agents?.list;
  if (!Array.isArray(list)) return;
  for (const [index, entry] of list.entries()) {
    if (!(0, _utilsDvkbxKCZ.c)(entry) || !(0, _utilsDvkbxKCZ.c)(entry.tts)) continue;
    (0, _runtimeConfigCollectorsTtsCDSAn1jv.t)({
      tts: entry.tts,
      pathPrefix: `agents.list.${index}.tts`,
      defaults: params.defaults,
      context: params.context
    });
  }
}
function collectCronAssignments(params) {
  const cron = params.config.cron;
  if (!(0, _utilsDvkbxKCZ.c)(cron)) return;
  (0, _runtimeSharedClUz2kEK.n)({
    value: cron.webhookToken,
    path: "cron.webhookToken",
    expected: "string",
    defaults: params.defaults,
    context: params.context,
    apply: (value) => {
      cron.webhookToken = value;
    }
  });
}
function collectSandboxSshAssignments(params) {
  const agents = (0, _utilsDvkbxKCZ.c)(params.config.agents) ? params.config.agents : void 0;
  if (!agents) return;
  const defaultsAgent = (0, _utilsDvkbxKCZ.c)(agents.defaults) ? agents.defaults : void 0;
  const defaultsSandbox = (0, _utilsDvkbxKCZ.c)(defaultsAgent?.sandbox) ? defaultsAgent.sandbox : void 0;
  const defaultsSsh = (0, _utilsDvkbxKCZ.c)(defaultsSandbox?.ssh) ? defaultsSandbox.ssh : void 0;
  const defaultsBackend = typeof defaultsSandbox?.backend === "string" ? defaultsSandbox.backend : void 0;
  const defaultsMode = typeof defaultsSandbox?.mode === "string" ? defaultsSandbox.mode : void 0;
  const inheritedDefaultsUsage = {
    identityData: false,
    certificateData: false,
    knownHostsData: false
  };
  (Array.isArray(agents.list) ? agents.list : []).forEach((rawAgent, index) => {
    const agentRecord = (0, _utilsDvkbxKCZ.c)(rawAgent) ? rawAgent : null;
    if (!agentRecord || agentRecord.enabled === false) return;
    const sandbox = (0, _utilsDvkbxKCZ.c)(agentRecord.sandbox) ? agentRecord.sandbox : void 0;
    const ssh = (0, _utilsDvkbxKCZ.c)(sandbox?.ssh) ? sandbox.ssh : void 0;
    const effectiveBackend = (typeof sandbox?.backend === "string" ? sandbox.backend : void 0) ?? defaultsBackend ?? "docker";
    const effectiveMode = (typeof sandbox?.mode === "string" ? sandbox.mode : void 0) ?? defaultsMode ?? "off";
    const active = (0, _stringCoerceBje8XVt.s)(effectiveBackend) === "ssh" && effectiveMode !== "off";
    for (const key of [
    "identityData",
    "certificateData",
    "knownHostsData"])
    if (ssh && Object.prototype.hasOwnProperty.call(ssh, key)) (0, _runtimeSharedClUz2kEK.n)({
      value: ssh[key],
      path: `agents.list.${index}.sandbox.ssh.${key}`,
      expected: "string",
      defaults: params.defaults,
      context: params.context,
      active,
      inactiveReason: "sandbox SSH backend is not active for this agent.",
      apply: (value) => {
        ssh[key] = value;
      }
    });else
    if (active) inheritedDefaultsUsage[key] = true;
  });
  if (!defaultsSsh) return;
  const defaultsActive = (0, _stringCoerceBje8XVt.s)(defaultsBackend) === "ssh" && defaultsMode !== "off" || inheritedDefaultsUsage.identityData || inheritedDefaultsUsage.certificateData || inheritedDefaultsUsage.knownHostsData;
  for (const key of [
  "identityData",
  "certificateData",
  "knownHostsData"])
  (0, _runtimeSharedClUz2kEK.n)({
    value: defaultsSsh[key],
    path: `agents.defaults.sandbox.ssh.${key}`,
    expected: "string",
    defaults: params.defaults,
    context: params.context,
    active: defaultsActive || inheritedDefaultsUsage[key],
    inactiveReason: "sandbox SSH backend is not active.",
    apply: (value) => {
      defaultsSsh[key] = value;
    }
  });
}
function collectCoreConfigAssignments(params) {
  const providers = params.config.models?.providers;
  if (providers) collectModelProviderAssignments({
    providers,
    defaults: params.defaults,
    context: params.context
  });
  const skillEntries = params.config.skills?.entries;
  if (skillEntries) collectSkillAssignments({
    entries: skillEntries,
    defaults: params.defaults,
    context: params.context
  });
  collectAgentMemorySearchAssignments(params);
  collectTalkAssignments(params);
  collectGatewayAssignments(params);
  collectSandboxSshAssignments(params);
  collectMessagesTtsAssignments(params);
  collectAgentTtsAssignments(params);
  collectCronAssignments(params);
  collectMediaRequestAssignments(params);
}
//#endregion
//#region src/secrets/runtime-config-collectors-plugins.ts
/**
* Walk manifest-declared plugin config SecretRef surfaces and collect
* assignments for runtime materialization. Plugin-owned metadata controls which
* config paths support SecretRefs and whether bundled plugins stay inactive on
* that surface until explicitly enabled.
*
* When `loadablePluginOrigins` is provided, entries whose ID is not in the map
* are treated as inactive (stale config entries for plugins that are no longer
* installed). This prevents resolution failures for SecretRefs belonging to
* non-loadable plugins from blocking startup or preflight validation.
*/
function collectPluginConfigAssignments(params) {
  const entries = params.config.plugins?.entries;
  if (!(0, _utilsDvkbxKCZ.c)(entries)) return;
  const normalizedConfig = (0, _configStateCB4SZz9a.o)(params.config.plugins);
  const workspaceDir = (0, _agentScopeRNt6KatQ.x)(params.config, (0, _agentScopeRNt6KatQ.S)(params.config));
  const bundledLoadablePluginIds = [...(params.loadablePluginOrigins?.entries() ?? [])].filter(([, origin]) => origin === "bundled").map(([pluginId]) => pluginId);
  const pluginSecretInputs = new Map([...(0, _configContractsBlvCFExB.n)({
    config: params.config,
    workspaceDir,
    env: params.context.env,
    cache: true,
    fallbackToBundledMetadata: true,
    fallbackToBundledMetadataForResolvedBundled: true,
    fallbackBundledPluginIds: bundledLoadablePluginIds,
    pluginIds: Object.keys(entries)
  }).entries()].flatMap(([pluginId, metadata]) => {
    const secretInputs = metadata.configContracts.secretInputs;
    if (!secretInputs?.paths.length) return [];
    return [[pluginId, {
      origin: metadata.origin,
      bundledDefaultEnabled: secretInputs.bundledDefaultEnabled,
      paths: secretInputs.paths
    }]];
  }));
  for (const [pluginId, entry] of Object.entries(entries)) {
    const secretInputs = pluginSecretInputs.get(pluginId);
    if (!secretInputs) continue;
    if (!(0, _utilsDvkbxKCZ.c)(entry)) continue;
    const pluginConfig = entry.config;
    if (!(0, _utilsDvkbxKCZ.c)(pluginConfig)) continue;
    const pluginOrigin = params.loadablePluginOrigins?.get(pluginId);
    if (params.loadablePluginOrigins && !pluginOrigin) {
      collectConfiguredPluginSecretAssignments({
        pluginId,
        pluginConfig,
        secretPaths: secretInputs.paths,
        active: false,
        inactiveReason: "plugin is not loadable (stale config entry).",
        defaults: params.defaults,
        context: params.context
      });
      continue;
    }
    const resolvedOrigin = pluginOrigin ?? secretInputs.origin;
    const enableState = (0, _configStateCB4SZz9a.l)(pluginId, resolvedOrigin, normalizedConfig, resolvedOrigin === "bundled" ? secretInputs.bundledDefaultEnabled : void 0);
    collectConfiguredPluginSecretAssignments({
      pluginId,
      pluginConfig,
      secretPaths: secretInputs.paths,
      active: enableState.enabled,
      inactiveReason: enableState.reason ?? "plugin is disabled.",
      defaults: params.defaults,
      context: params.context
    });
  }
}
function collectConfiguredPluginSecretAssignments(params) {
  const seenPaths = /* @__PURE__ */new Set();
  for (const secretPath of params.secretPaths) for (const match of (0, _configContractsBlvCFExB.t)({
    root: params.pluginConfig,
    pathPattern: secretPath.path
  })) {
    const fullPath = `plugins.entries.${params.pluginId}.config.${match.path}`;
    if (seenPaths.has(fullPath)) continue;
    seenPaths.add(fullPath);
    (0, _runtimeSharedClUz2kEK.n)({
      value: match.value,
      path: fullPath,
      expected: secretPath.expected ?? "string",
      defaults: params.defaults,
      context: params.context,
      active: params.active,
      inactiveReason: `plugin "${params.pluginId}": ${params.inactiveReason}`,
      apply: createPluginConfigAssignmentApply(params.pluginConfig, match.path)
    });
  }
}
function createPluginConfigAssignmentApply(pluginConfig, relativePath) {
  return (value) => {
    const segments = relativePath.replace(/\[(\d+)\]/g, ".$1").split(".").map((segment) => segment.trim()).filter(Boolean);
    if (segments.length === 0) return;
    let current = pluginConfig;
    for (const segment of segments.slice(0, -1)) {
      if (Array.isArray(current)) {
        const index = Number.parseInt(segment, 10);
        current = Number.isInteger(index) ? current[index] : void 0;
        continue;
      }
      current = (0, _utilsDvkbxKCZ.c)(current) ? current[segment] : void 0;
    }
    const finalSegment = segments.at(-1);
    if (!finalSegment) return;
    if (Array.isArray(current)) {
      const index = Number.parseInt(finalSegment, 10);
      if (Number.isInteger(index) && index >= 0 && index < current.length) current[index] = value;
      return;
    }
    if ((0, _utilsDvkbxKCZ.c)(current)) current[finalSegment] = value;
  };
}
//#endregion
//#region src/secrets/runtime-config-collectors.ts
function collectConfigAssignments(params) {
  const defaults = params.context.sourceConfig.secrets?.defaults;
  collectCoreConfigAssignments({
    config: params.config,
    defaults,
    context: params.context
  });
  collectChannelConfigAssignments({
    config: params.config,
    defaults,
    context: params.context
  });
  collectPluginConfigAssignments({
    config: params.config,
    defaults,
    context: params.context,
    loadablePluginOrigins: params.loadablePluginOrigins
  });
}
//#endregion
//#region src/secrets/runtime-web-tools.shared.ts
const loadResolveManifestContractOwnerPluginId = (0, _lazyRuntimeY64shOif.i)(() => Promise.resolve().then(() => jitiImport("./runtime-web-tools-manifest.runtime-Br80xM65.js").then((m) => _interopRequireWildcard(m))), "resolveManifestContractOwnerPluginId");
function pushInactiveProviderCredentialWarnings(params) {
  for (const provider of params.selection.providers) {
    if (provider.id === params.skipProviderId) continue;
    const value = params.selection.readConfiguredCredential({
      provider,
      config: params.selection.sourceConfig,
      toolConfig: params.selection.toolConfig
    });
    if (!params.selection.hasConfiguredSecretRef(value, params.selection.defaults)) continue;
    for (const path of params.selection.inactivePathsForProvider(provider)) (0, _runtimeSharedClUz2kEK.c)({
      context: params.selection.context,
      path,
      details: params.details
    });
  }
}
function ensureObject(target, key) {
  const current = target[key];
  if ((0, _utilsDvkbxKCZ.c)(current)) return current;
  const next = {};
  target[key] = next;
  return next;
}
function normalizeKnownProvider(value, providers) {
  const normalized = (0, _stringCoerceBje8XVt.s)(value);
  if (!normalized) return;
  if (providers.some((provider) => provider.id === normalized)) return normalized;
}
function hasConfiguredSecretRef(value, defaults) {
  return Boolean((0, _typesSecretsBHp0Y_k.p)({
    value,
    defaults
  }).ref);
}
async function resolveRuntimeWebProviderSurface(params) {
  let configuredBundledPluginId = params.configuredBundledPluginIdHint;
  if (!configuredBundledPluginId && params.rawProvider) configuredBundledPluginId = (await loadResolveManifestContractOwnerPluginId())({
    contract: params.contract,
    value: params.rawProvider,
    origin: "bundled",
    config: params.sourceConfig,
    env: {
      ...process.env,
      ...params.context.env
    }
  });
  let allProviders = params.sortProviders(await params.resolveProviders({ configuredBundledPluginId }));
  if (params.rawProvider && params.configuredBundledPluginIdHint && configuredBundledPluginId && !allProviders.some((provider) => provider.id === params.rawProvider)) configuredBundledPluginId = void 0;
  if (params.rawProvider && !configuredBundledPluginId) {
    configuredBundledPluginId = (await loadResolveManifestContractOwnerPluginId())({
      contract: params.contract,
      value: params.rawProvider,
      origin: "bundled",
      config: params.sourceConfig,
      env: {
        ...process.env,
        ...params.context.env
      }
    });
    allProviders = params.sortProviders(await params.resolveProviders({ configuredBundledPluginId }));
  }
  const hasConfiguredSurface = Boolean(params.toolConfig) || allProviders.some((provider) => {
    if (params.ignoreKeylessProvidersForConfiguredSurface && provider.requiresCredential === false) return false;
    return params.readConfiguredCredential({
      provider,
      config: params.sourceConfig,
      toolConfig: params.toolConfig
    }) !== void 0;
  });
  const providers = hasConfiguredSurface || !params.emptyProvidersWhenSurfaceMissing ? allProviders : [];
  const configuredProvider = normalizeKnownProvider(params.rawProvider, params.normalizeConfiguredProviderAgainstActiveProviders ? providers : allProviders);
  if (params.rawProvider && !configuredProvider) {
    const diagnostic = {
      code: params.invalidAutoDetectCode,
      message: `${params.providerPath} is "${params.rawProvider}". Falling back to auto-detect precedence.`,
      path: params.providerPath
    };
    params.diagnostics.push(diagnostic);
    params.metadataDiagnostics.push(diagnostic);
    (0, _runtimeSharedClUz2kEK.l)(params.context, {
      code: params.invalidAutoDetectCode,
      path: params.providerPath,
      message: diagnostic.message
    });
  }
  return {
    providers,
    configuredProvider,
    enabled: hasConfiguredSurface && (!(0, _utilsDvkbxKCZ.c)(params.toolConfig) || params.toolConfig.enabled !== false),
    hasConfiguredSurface
  };
}
async function resolveRuntimeWebProviderSelection(params) {
  if (params.configuredProvider) {
    params.metadata.providerConfigured = params.configuredProvider;
    params.metadata.providerSource = "configured";
  }
  if (params.enabled) {
    const candidates = params.configuredProvider ? params.providers.filter((provider) => provider.id === params.configuredProvider) : params.providers;
    const unresolvedWithoutFallback = [];
    let selectedProvider;
    let selectedResolution;
    let keylessFallbackProvider;
    for (const provider of candidates) {
      if (provider.requiresCredential === false) {
        if (params.deferKeylessFallback && !params.configuredProvider) {
          keylessFallbackProvider ||= provider;
          continue;
        }
        selectedProvider = provider.id;
        selectedResolution = {
          source: "missing",
          secretRefConfigured: false,
          fallbackUsedAfterRefFailure: false
        };
        break;
      }
      const path = params.inactivePathsForProvider(provider)[0] ?? "";
      const value = params.readConfiguredCredential({
        provider,
        config: params.sourceConfig,
        toolConfig: params.toolConfig
      });
      const resolution = await params.resolveSecretInput({
        value,
        path,
        envVars: "envVars" in provider && Array.isArray(provider.envVars) ? provider.envVars : []
      });
      if (resolution.secretRefConfigured && resolution.fallbackUsedAfterRefFailure) {
        const diagnostic = {
          code: params.fallbackUsedCode,
          message: `${path} SecretRef could not be resolved; using ${resolution.fallbackEnvVar ?? "env fallback"}. ` + (resolution.unresolvedRefReason ?? "").trim(),
          path
        };
        params.diagnostics.push(diagnostic);
        params.metadata.diagnostics.push(diagnostic);
        (0, _runtimeSharedClUz2kEK.l)(params.context, {
          code: params.fallbackUsedCode,
          path,
          message: diagnostic.message
        });
      }
      if (resolution.secretRefConfigured && !resolution.value && resolution.unresolvedRefReason) unresolvedWithoutFallback.push({
        provider: provider.id,
        path,
        reason: resolution.unresolvedRefReason
      });
      if (params.configuredProvider) {
        selectedProvider = provider.id;
        selectedResolution = resolution;
        if (resolution.value) params.setResolvedCredential({
          resolvedConfig: params.resolvedConfig,
          provider,
          value: resolution.value
        });
        break;
      }
      if (resolution.value) {
        selectedProvider = provider.id;
        selectedResolution = resolution;
        params.setResolvedCredential({
          resolvedConfig: params.resolvedConfig,
          provider,
          value: resolution.value
        });
        break;
      }
    }
    if (!selectedProvider && keylessFallbackProvider) {
      selectedProvider = keylessFallbackProvider.id;
      selectedResolution = {
        source: "missing",
        secretRefConfigured: false,
        fallbackUsedAfterRefFailure: false
      };
    }
    const failUnresolvedNoFallback = (unresolved) => {
      const diagnostic = {
        code: params.noFallbackCode,
        message: unresolved.reason,
        path: unresolved.path
      };
      params.diagnostics.push(diagnostic);
      params.metadata.diagnostics.push(diagnostic);
      (0, _runtimeSharedClUz2kEK.l)(params.context, {
        code: params.noFallbackCode,
        path: unresolved.path,
        message: unresolved.reason
      });
      throw new Error(`[${params.noFallbackCode}] ${unresolved.reason}`);
    };
    if (params.configuredProvider) {
      const unresolved = unresolvedWithoutFallback[0];
      if (unresolved) failUnresolvedNoFallback(unresolved);
    } else {
      if (!selectedProvider && unresolvedWithoutFallback.length > 0) failUnresolvedNoFallback(unresolvedWithoutFallback[0]);
      if (selectedProvider) {
        const selectedDetails = params.providers.find((entry) => entry.id === selectedProvider)?.requiresCredential === false ? `${params.scopePath} auto-detected keyless provider "${selectedProvider}" as the default fallback.` : `${params.scopePath} auto-detected provider "${selectedProvider}" from available credentials.`;
        const diagnostic = {
          code: params.autoDetectSelectedCode,
          message: selectedDetails,
          path: `${params.scopePath}.provider`
        };
        params.diagnostics.push(diagnostic);
        params.metadata.diagnostics.push(diagnostic);
      }
    }
    if (selectedProvider) {
      params.metadata.selectedProvider = selectedProvider;
      params.metadata.selectedProviderKeySource = selectedResolution?.source;
      if (!params.configuredProvider) params.metadata.providerSource = "auto-detect";
      const provider = params.providers.find((entry) => entry.id === selectedProvider);
      if (provider && params.mergeRuntimeMetadata) await params.mergeRuntimeMetadata({
        provider,
        metadata: params.metadata,
        toolConfig: params.toolConfig,
        selectedResolution
      });
    }
  }
  if (params.enabled && !params.configuredProvider && params.metadata.selectedProvider) pushInactiveProviderCredentialWarnings({
    selection: params,
    skipProviderId: params.metadata.selectedProvider,
    details: `${params.scopePath} auto-detected provider is "${params.metadata.selectedProvider}".`
  });else
  if (params.toolConfig && !params.enabled) pushInactiveProviderCredentialWarnings({
    selection: params,
    details: `${params.scopePath} is disabled.`
  });
  if (params.enabled && params.toolConfig && params.configuredProvider) pushInactiveProviderCredentialWarnings({
    selection: params,
    skipProviderId: params.configuredProvider,
    details: `${params.scopePath}.provider is "${params.configuredProvider}".`
  });
}
//#endregion
//#region src/secrets/runtime-web-tools.ts
const loadRuntimeWebToolsFallbackProviders = (0, _lazyRuntimeY64shOif.a)(() => Promise.resolve().then(() => jitiImport("./runtime-web-tools-fallback.runtime-DxOWQ5JQ.js").then((m) => _interopRequireWildcard(m))), ({ runtimeWebToolsFallbackProviders }) => runtimeWebToolsFallbackProviders);
const loadRuntimeWebToolsPublicArtifacts = (0, _lazyRuntimeY64shOif.a)(() => Promise.resolve().then(() => jitiImport("./runtime-web-tools-public-artifacts.runtime-CJeQkv1c.js").then((m) => _interopRequireWildcard(m))), (mod) => mod);
const loadRuntimeWebToolsManifest = (0, _lazyRuntimeY64shOif.a)(() => Promise.resolve().then(() => jitiImport("./runtime-web-tools-manifest.runtime-Br80xM65.js").then((m) => _interopRequireWildcard(m))), (mod) => mod);
function hasPluginScopedWebToolConfig(config, key) {
  const entries = config.plugins?.entries;
  if (!entries) return false;
  return Object.values(entries).some((entry) => {
    if (!(0, _utilsDvkbxKCZ.c)(entry)) return false;
    const pluginConfig = (0, _utilsDvkbxKCZ.c)(entry.config) ? entry.config : void 0;
    return Boolean(pluginConfig?.[key]);
  });
}
function inferSingleBundledPluginScopedWebToolConfigOwner(config, key) {
  const entries = config.plugins?.entries;
  if (!entries) return;
  const matches = [];
  for (const [pluginId, entry] of Object.entries(entries)) {
    if (!(0, _utilsDvkbxKCZ.c)(entry) || entry.enabled === false) continue;
    if (!(0, _utilsDvkbxKCZ.c)(((0, _utilsDvkbxKCZ.c)(entry.config) ? entry.config : void 0)?.[key])) continue;
    matches.push(pluginId);
    if (matches.length > 1) return;
  }
  return matches[0];
}
function inferExactBundledPluginScopedWebToolConfigOwner(params) {
  const entry = params.config.plugins?.entries?.[params.pluginId];
  if (!(0, _utilsDvkbxKCZ.c)(entry) || entry.enabled === false) return;
  return (0, _utilsDvkbxKCZ.c)(((0, _utilsDvkbxKCZ.c)(entry.config) ? entry.config : void 0)?.[params.key]) ? params.pluginId : void 0;
}
async function hasCustomWebProviderPluginRisk(params) {
  const installRecords = (0, _manifestRegistryAdU8lVLL.i)({ env: params.env });
  if (Object.keys(installRecords).length > 0) return true;
  const plugins = params.config.plugins;
  if (!plugins) return false;
  if (Array.isArray(plugins.load?.paths) && plugins.load.paths.length > 0) return true;
  const { resolveManifestContractPluginIds } = await loadRuntimeWebToolsManifest();
  const bundledPluginIds = new Set(resolveManifestContractPluginIds({
    contract: params.contract,
    origin: "bundled",
    config: params.config,
    env: params.env
  }));
  const hasNonBundledPluginId = (pluginId) => !bundledPluginIds.has(pluginId.trim());
  if (Array.isArray(plugins.allow) && plugins.allow.some(hasNonBundledPluginId)) return true;
  if (Array.isArray(plugins.deny) && plugins.deny.some(hasNonBundledPluginId)) return true;
  if (plugins.entries && Object.keys(plugins.entries).some(hasNonBundledPluginId)) return true;
  return false;
}
function readNonEmptyEnvValue(env, names) {
  for (const envVar of names) {
    const value = (0, _normalizeSecretInputBBVMiIqq.n)(env[envVar]);
    if (value) return {
      value,
      envVar
    };
  }
  return {};
}
function buildUnresolvedReason(params) {
  if (params.kind === "non-string") return `${params.path} SecretRef resolved to a non-string value.`;
  if (params.kind === "empty") return `${params.path} SecretRef resolved to an empty value.`;
  return `${params.path} SecretRef is unresolved (${params.refLabel}).`;
}
async function resolveSecretInputWithEnvFallback(params) {
  const { ref } = (0, _typesSecretsBHp0Y_k.p)({
    value: params.value,
    defaults: params.defaults
  });
  if (!ref) {
    const configValue = (0, _normalizeSecretInputBBVMiIqq.n)(params.value);
    if (configValue) return {
      value: configValue,
      source: "config",
      secretRefConfigured: false,
      fallbackUsedAfterRefFailure: false
    };
    const fallback = readNonEmptyEnvValue(params.context.env, params.envVars);
    if (fallback.value) return {
      value: fallback.value,
      source: "env",
      fallbackEnvVar: fallback.envVar,
      secretRefConfigured: false,
      fallbackUsedAfterRefFailure: false
    };
    return {
      source: "missing",
      secretRefConfigured: false,
      fallbackUsedAfterRefFailure: false
    };
  }
  const refLabel = `${ref.source}:${ref.provider}:${ref.id}`;
  let resolvedFromRef;
  let unresolvedRefReason;
  if (params.restrictEnvRefsToEnvVars === true && ref.source === "env" && !params.envVars.includes(ref.id)) unresolvedRefReason = `${params.path} SecretRef env var "${ref.id}" is not allowed.`;else
  try {
    const resolvedValue = (await (0, _resolveCKxwAAOr.o)([ref], {
      config: params.sourceConfig,
      env: params.context.env,
      cache: params.context.cache
    })).get((0, _refContractDtvCiPbj.u)(ref));
    if (typeof resolvedValue !== "string") unresolvedRefReason = buildUnresolvedReason({
      path: params.path,
      kind: "non-string",
      refLabel
    });else
    {
      resolvedFromRef = (0, _normalizeSecretInputBBVMiIqq.n)(resolvedValue);
      if (!resolvedFromRef) unresolvedRefReason = buildUnresolvedReason({
        path: params.path,
        kind: "empty",
        refLabel
      });
    }
  } catch {
    unresolvedRefReason = buildUnresolvedReason({
      path: params.path,
      kind: "unresolved",
      refLabel
    });
  }
  if (resolvedFromRef) return {
    value: resolvedFromRef,
    source: "secretRef",
    secretRefConfigured: true,
    fallbackUsedAfterRefFailure: false
  };
  const fallback = readNonEmptyEnvValue(params.context.env, params.envVars);
  if (fallback.value) return {
    value: fallback.value,
    source: "env",
    fallbackEnvVar: fallback.envVar,
    unresolvedRefReason,
    secretRefConfigured: true,
    fallbackUsedAfterRefFailure: true
  };
  return {
    source: "missing",
    unresolvedRefReason,
    secretRefConfigured: true,
    fallbackUsedAfterRefFailure: false
  };
}
function setResolvedWebSearchApiKey(params) {
  if (params.provider.setConfiguredCredentialValue) {
    params.provider.setConfiguredCredentialValue(params.resolvedConfig, params.value);
    return;
  }
  const search = ensureObject(ensureObject(ensureObject(params.resolvedConfig, "tools"), "web"), "search");
  params.provider.setCredentialValue(search, params.value);
}
async function resolveBundledWebSearchProviders(params) {
  const env = {
    ...process.env,
    ...params.context.env
  };
  const onlyPluginIds = params.configuredBundledPluginId !== void 0 ? [params.configuredBundledPluginId] : params.onlyPluginIds && params.onlyPluginIds.length > 0 ? [...new Set(params.onlyPluginIds)].toSorted((left, right) => left.localeCompare(right)) : void 0;
  if (onlyPluginIds && onlyPluginIds.length > 0) {
    const bundled = (0, _webProviderPublicArtifactsExplicitDVl2HWOD.i)({ onlyPluginIds });
    if (bundled && bundled.length > 0) return bundled;
    const { resolvePluginWebSearchProviders } = await loadRuntimeWebToolsFallbackProviders();
    return resolvePluginWebSearchProviders({
      config: params.sourceConfig,
      env,
      bundledAllowlistCompat: true,
      onlyPluginIds,
      origin: "bundled"
    });
  }
  if (!params.hasCustomWebSearchPluginRisk) {
    const { resolveBundledWebSearchProvidersFromPublicArtifacts } = await loadRuntimeWebToolsPublicArtifacts();
    const bundled = resolveBundledWebSearchProvidersFromPublicArtifacts({
      config: params.sourceConfig,
      env,
      bundledAllowlistCompat: true
    });
    if (bundled && bundled.length > 0) return bundled;
    const { resolvePluginWebSearchProviders } = await loadRuntimeWebToolsFallbackProviders();
    return resolvePluginWebSearchProviders({
      config: params.sourceConfig,
      env,
      bundledAllowlistCompat: true,
      origin: "bundled"
    });
  }
  const { resolvePluginWebSearchProviders } = await loadRuntimeWebToolsFallbackProviders();
  return resolvePluginWebSearchProviders({
    config: params.sourceConfig,
    env,
    bundledAllowlistCompat: true
  });
}
async function resolveBundledWebFetchProviders(params) {
  const env = {
    ...process.env,
    ...params.context.env
  };
  if (params.configuredBundledPluginId) {
    const bundled = (0, _webProviderPublicArtifactsExplicitDVl2HWOD.r)({ onlyPluginIds: [params.configuredBundledPluginId] });
    if (bundled && bundled.length > 0) return bundled;
    const { resolvePluginWebFetchProviders } = await loadRuntimeWebToolsFallbackProviders();
    return resolvePluginWebFetchProviders({
      config: params.sourceConfig,
      env,
      bundledAllowlistCompat: true,
      onlyPluginIds: [params.configuredBundledPluginId],
      origin: "bundled"
    });
  }
  if (!params.hasCustomWebFetchPluginRisk) {
    const { resolveBundledWebFetchProvidersFromPublicArtifacts } = await loadRuntimeWebToolsPublicArtifacts();
    const bundled = resolveBundledWebFetchProvidersFromPublicArtifacts({
      config: params.sourceConfig,
      env,
      bundledAllowlistCompat: true
    });
    if (bundled && bundled.length > 0) return bundled;
    const { resolvePluginWebFetchProviders } = await loadRuntimeWebToolsFallbackProviders();
    return resolvePluginWebFetchProviders({
      config: params.sourceConfig,
      env,
      bundledAllowlistCompat: true,
      origin: "bundled"
    });
  }
  const { resolvePluginWebFetchProviders } = await loadRuntimeWebToolsFallbackProviders();
  return resolvePluginWebFetchProviders({
    config: params.sourceConfig,
    env,
    bundledAllowlistCompat: true,
    origin: "bundled"
  });
}
function readConfiguredProviderCredential(params) {
  return params.provider.getConfiguredCredentialValue?.(params.config);
}
function inactivePathsForProvider(provider) {
  if (provider.requiresCredential === false) return [];
  return provider.inactiveSecretPaths?.length ? provider.inactiveSecretPaths : [provider.credentialPath];
}
function setResolvedWebFetchApiKey(params) {
  const fetch = ensureObject(ensureObject(ensureObject(params.resolvedConfig, "tools"), "web"), "fetch");
  if (params.provider.setConfiguredCredentialValue) {
    params.provider.setConfiguredCredentialValue(params.resolvedConfig, params.value);
    return;
  }
  params.provider.setCredentialValue(fetch, params.value);
}
function readConfiguredFetchProviderCredential(params) {
  return params.provider.getConfiguredCredentialValue?.(params.config) ?? params.provider.getCredentialValue(params.fetch);
}
function inactivePathsForFetchProvider(provider) {
  if (provider.requiresCredential === false) return [];
  return provider.inactiveSecretPaths?.length ? provider.inactiveSecretPaths : [provider.credentialPath];
}
async function resolveRuntimeWebTools(params) {
  const defaults = params.sourceConfig.secrets?.defaults;
  const diagnostics = [];
  const env = {
    ...process.env,
    ...params.context.env
  };
  const sourceTools = (0, _utilsDvkbxKCZ.c)(params.sourceConfig.tools) ? params.sourceConfig.tools : void 0;
  const sourceWeb = (0, _utilsDvkbxKCZ.c)(sourceTools?.web) ? sourceTools.web : void 0;
  const resolvedTools = (0, _utilsDvkbxKCZ.c)(params.resolvedConfig.tools) ? params.resolvedConfig.tools : void 0;
  const resolvedWeb = (0, _utilsDvkbxKCZ.c)(resolvedTools?.web) ? resolvedTools.web : void 0;
  let hasCustomWebSearchRisk;
  const getHasCustomWebSearchRisk = () => {
    hasCustomWebSearchRisk ??= hasCustomWebProviderPluginRisk({
      contract: "webSearchProviders",
      config: params.sourceConfig,
      env
    });
    return hasCustomWebSearchRisk;
  };
  let hasCustomWebFetchRisk;
  const getHasCustomWebFetchRisk = () => {
    hasCustomWebFetchRisk ??= hasCustomWebProviderPluginRisk({
      contract: "webFetchProviders",
      config: params.sourceConfig,
      env
    });
    return hasCustomWebFetchRisk;
  };
  const legacyXSearchSource = (0, _utilsDvkbxKCZ.c)(sourceWeb?.x_search) ? sourceWeb.x_search : void 0;
  const legacyXSearchResolved = (0, _utilsDvkbxKCZ.c)(resolvedWeb?.x_search) ? resolvedWeb.x_search : void 0;
  if (legacyXSearchSource && legacyXSearchResolved && Object.prototype.hasOwnProperty.call(legacyXSearchSource, "apiKey")) {
    const legacyXSearchSourceRecord = legacyXSearchSource;
    const legacyXSearchResolvedRecord = legacyXSearchResolved;
    const resolution = await resolveSecretInputWithEnvFallback({
      sourceConfig: params.sourceConfig,
      context: params.context,
      defaults,
      value: legacyXSearchSourceRecord.apiKey,
      path: "tools.web.x_search.apiKey",
      envVars: ["XAI_API_KEY"]
    });
    if (resolution.value) legacyXSearchResolvedRecord.apiKey = resolution.value;
  }
  const hasPluginWebSearchConfig = hasPluginScopedWebToolConfig(params.sourceConfig, "webSearch");
  const hasPluginWebFetchConfig = hasPluginScopedWebToolConfig(params.sourceConfig, "webFetch");
  if (!sourceWeb && !hasPluginWebSearchConfig && !hasPluginWebFetchConfig) return {
    search: {
      providerSource: "none",
      diagnostics: []
    },
    fetch: {
      providerSource: "none",
      diagnostics: []
    },
    diagnostics
  };
  const search = (0, _utilsDvkbxKCZ.c)(sourceWeb?.search) ? sourceWeb.search : void 0;
  const fetch = (0, _utilsDvkbxKCZ.c)(sourceWeb?.fetch) ? sourceWeb.fetch : void 0;
  if (!search && !fetch && !hasPluginWebSearchConfig && !hasPluginWebFetchConfig) return {
    search: {
      providerSource: "none",
      diagnostics: []
    },
    fetch: {
      providerSource: "none",
      diagnostics: []
    },
    diagnostics
  };
  const rawProvider = (0, _stringCoerceBje8XVt.a)(search?.provider);
  let configuredBundledWebSearchPluginIdHint;
  if (hasPluginWebSearchConfig && !(await getHasCustomWebSearchRisk())) {
    if (rawProvider) configuredBundledWebSearchPluginIdHint = inferExactBundledPluginScopedWebToolConfigOwner({
      config: params.sourceConfig,
      key: "webSearch",
      pluginId: rawProvider
    });
    configuredBundledWebSearchPluginIdHint ??= inferSingleBundledPluginScopedWebToolConfigOwner(params.sourceConfig, "webSearch");
  }
  const searchMetadata = {
    providerSource: "none",
    diagnostics: []
  };
  if (search || hasPluginWebSearchConfig) {
    const searchSurface = await resolveRuntimeWebProviderSurface({
      contract: "webSearchProviders",
      rawProvider,
      providerPath: "tools.web.search.provider",
      toolConfig: search,
      diagnostics,
      metadataDiagnostics: searchMetadata.diagnostics,
      invalidAutoDetectCode: "WEB_SEARCH_PROVIDER_INVALID_AUTODETECT",
      sourceConfig: params.sourceConfig,
      context: params.context,
      configuredBundledPluginIdHint: configuredBundledWebSearchPluginIdHint,
      resolveProviders: async ({ configuredBundledPluginId }) => resolveBundledWebSearchProviders({
        sourceConfig: params.sourceConfig,
        context: params.context,
        configuredBundledPluginId,
        hasCustomWebSearchPluginRisk: await getHasCustomWebSearchRisk()
      }),
      sortProviders: _webSearchProvidersSharedDapa4fBD.r,
      readConfiguredCredential: ({ provider, config, toolConfig }) => readConfiguredProviderCredential({
        provider,
        config,
        search: toolConfig
      }),
      ignoreKeylessProvidersForConfiguredSurface: true,
      emptyProvidersWhenSurfaceMissing: true,
      normalizeConfiguredProviderAgainstActiveProviders: true
    });
    await resolveRuntimeWebProviderSelection({
      scopePath: "tools.web.search",
      toolConfig: search,
      enabled: searchSurface.enabled,
      providers: searchSurface.providers,
      configuredProvider: searchSurface.configuredProvider,
      metadata: searchMetadata,
      diagnostics,
      sourceConfig: params.sourceConfig,
      resolvedConfig: params.resolvedConfig,
      context: params.context,
      defaults,
      deferKeylessFallback: true,
      fallbackUsedCode: "WEB_SEARCH_KEY_UNRESOLVED_FALLBACK_USED",
      noFallbackCode: "WEB_SEARCH_KEY_UNRESOLVED_NO_FALLBACK",
      autoDetectSelectedCode: "WEB_SEARCH_AUTODETECT_SELECTED",
      readConfiguredCredential: ({ provider, config, toolConfig }) => readConfiguredProviderCredential({
        provider,
        config,
        search: toolConfig
      }),
      resolveSecretInput: ({ value, path, envVars }) => resolveSecretInputWithEnvFallback({
        sourceConfig: params.sourceConfig,
        context: params.context,
        defaults,
        value,
        path,
        envVars
      }),
      setResolvedCredential: ({ resolvedConfig, provider, value }) => setResolvedWebSearchApiKey({
        resolvedConfig,
        provider,
        value
      }),
      inactivePathsForProvider,
      hasConfiguredSecretRef,
      mergeRuntimeMetadata: async ({ provider, metadata, toolConfig, selectedResolution }) => {
        if (!provider.resolveRuntimeMetadata) return;
        Object.assign(metadata, await provider.resolveRuntimeMetadata({
          config: params.sourceConfig,
          searchConfig: toolConfig,
          runtimeMetadata: metadata,
          resolvedCredential: selectedResolution ? {
            value: selectedResolution.value,
            source: selectedResolution.source,
            fallbackEnvVar: selectedResolution.fallbackEnvVar
          } : void 0
        }));
      }
    });
  }
  const rawFetchProvider = (0, _stringCoerceBje8XVt.a)(fetch?.provider);
  const fetchMetadata = {
    providerSource: "none",
    diagnostics: []
  };
  if (fetch || hasPluginWebFetchConfig) {
    const fetchSurface = await resolveRuntimeWebProviderSurface({
      contract: "webFetchProviders",
      rawProvider: rawFetchProvider,
      providerPath: "tools.web.fetch.provider",
      toolConfig: fetch,
      diagnostics,
      metadataDiagnostics: fetchMetadata.diagnostics,
      invalidAutoDetectCode: "WEB_FETCH_PROVIDER_INVALID_AUTODETECT",
      sourceConfig: params.sourceConfig,
      context: params.context,
      resolveProviders: async ({ configuredBundledPluginId }) => resolveBundledWebFetchProviders({
        sourceConfig: params.sourceConfig,
        context: params.context,
        configuredBundledPluginId,
        hasCustomWebFetchPluginRisk: await getHasCustomWebFetchRisk()
      }),
      sortProviders: _webSearchProvidersSharedDapa4fBD.o,
      readConfiguredCredential: ({ provider, config, toolConfig }) => readConfiguredFetchProviderCredential({
        provider,
        config,
        fetch: toolConfig
      })
    });
    await resolveRuntimeWebProviderSelection({
      scopePath: "tools.web.fetch",
      toolConfig: fetch,
      enabled: fetchSurface.enabled,
      providers: fetchSurface.providers,
      configuredProvider: fetchSurface.configuredProvider,
      metadata: fetchMetadata,
      diagnostics,
      sourceConfig: params.sourceConfig,
      resolvedConfig: params.resolvedConfig,
      context: params.context,
      defaults,
      deferKeylessFallback: false,
      fallbackUsedCode: "WEB_FETCH_PROVIDER_KEY_UNRESOLVED_FALLBACK_USED",
      noFallbackCode: "WEB_FETCH_PROVIDER_KEY_UNRESOLVED_NO_FALLBACK",
      autoDetectSelectedCode: "WEB_FETCH_AUTODETECT_SELECTED",
      readConfiguredCredential: ({ provider, config, toolConfig }) => readConfiguredFetchProviderCredential({
        provider,
        config,
        fetch: toolConfig
      }),
      resolveSecretInput: ({ value, path, envVars }) => resolveSecretInputWithEnvFallback({
        sourceConfig: params.sourceConfig,
        context: params.context,
        defaults,
        value,
        path,
        envVars,
        restrictEnvRefsToEnvVars: true
      }),
      setResolvedCredential: ({ resolvedConfig, provider, value }) => setResolvedWebFetchApiKey({
        resolvedConfig,
        provider,
        value
      }),
      inactivePathsForProvider: inactivePathsForFetchProvider,
      hasConfiguredSecretRef,
      mergeRuntimeMetadata: async ({ provider, metadata, toolConfig, selectedResolution }) => {
        if (!provider.resolveRuntimeMetadata) return;
        Object.assign(metadata, await provider.resolveRuntimeMetadata({
          config: params.sourceConfig,
          fetchConfig: toolConfig,
          runtimeMetadata: metadata,
          resolvedCredential: selectedResolution ? {
            value: selectedResolution.value,
            source: selectedResolution.source,
            fallbackEnvVar: selectedResolution.fallbackEnvVar
          } : void 0
        }));
      }
    });
  }
  return {
    search: searchMetadata,
    fetch: fetchMetadata,
    diagnostics
  };
}
//#endregion /* v9-b85ae2be64ea9eab */
