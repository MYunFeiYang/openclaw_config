"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.C = resolvePluginControlPlaneFingerprint;exports.S = fingerprintPluginDiscoveryContext;exports._ = clearCurrentPluginMetadataSnapshot;exports.a = resolveManifestContractPluginIds;exports.b = setCurrentPluginMetadataSnapshot;exports.c = resolveProviderOwners;exports.d = inspectPluginRegistry;exports.f = isPluginEnabled;exports.g = captureCurrentPluginMetadataSnapshotState;exports.h = refreshPluginRegistry;exports.i = resolveManifestContractOwnerPluginId;exports.l = void 0;exports.m = loadPluginRegistrySnapshotWithMetadata;exports.n = loadPluginManifestRegistryForPluginRegistry;exports.o = resolveManifestContractPluginIdsByCompatibilityRuntimePath;exports.p = loadPluginRegistrySnapshot;exports.r = normalizePluginsConfigWithRegistry;exports.s = resolvePluginContributionOwners;exports.t = listPluginContributionIds;exports.u = getPluginRecord;exports.v = getCurrentPluginMetadataSnapshot;exports.w = resolvePluginDiscoveryContext;exports.x = createPluginRegistryIdNormalizer;exports.y = restoreCurrentPluginMetadataSnapshotState;var _discoveryBNk7kgJV = require("./discovery-BNk7kgJV.js");
var _utilsCKsuXgDI = require("./utils-CKsuXgDI.js");
var _providerIdCz7K6wgK = require("./provider-id-Cz7K6wgK.js");
var _installedPluginIndexStoreDEo2ZAhx = require("./installed-plugin-index-store-DEo2ZAhx.js");
var _configNormalizationSharedD1vSsZ = require("./config-normalization-shared-D1vSsZ07.js");
var _bundledDirBocaljIz = require("./bundled-dir-BocaljIz.js");
var _installedPluginIndexRecordReaderDR3h__QQ = require("./installed-plugin-index-record-reader-DR3h__QQ.js");
var _manifestRegistryInstalledCRoA7rSF = require("./manifest-registry-installed-CRoA7rSF.js");
var _nodeFs = _interopRequireDefault(require("node:fs"));
var _nodePath = _interopRequireDefault(require("node:path"));
var _nodeCrypto = _interopRequireDefault(require("node:crypto"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}
//#region src/plugins/plugin-control-plane-context.ts
function resolveConfiguredPluginLoadPaths(config) {
  const paths = config?.plugins?.load?.paths;
  return Array.isArray(paths) ? paths : void 0;
}
function resolvePluginDiscoveryContext(params = {}) {
  return (0, _discoveryBNk7kgJV.i)({
    env: params.env ?? process.env,
    workspaceDir: params.workspaceDir,
    loadPaths: [...(params.loadPaths ?? resolveConfiguredPluginLoadPaths(params.config) ?? [])]
  });
}
function fingerprintPluginDiscoveryContext(context) {
  return (0, _installedPluginIndexStoreDEo2ZAhx.b)(context);
}
function resolvePluginControlPlaneContext(params = {}) {
  const inventoryFingerprint = params.inventoryFingerprint ?? (params.index ? (0, _manifestRegistryInstalledCRoA7rSF.n)(params.index) : void 0);
  return {
    discovery: resolvePluginDiscoveryContext(params),
    policyFingerprint: params.policyHash ?? (0, _installedPluginIndexStoreDEo2ZAhx._)(params.config),
    ...(inventoryFingerprint ? { inventoryFingerprint } : {}),
    ...(params.activationFingerprint ? { activationFingerprint: params.activationFingerprint } : {})
  };
}
function resolvePluginControlPlaneFingerprint(params = {}) {
  return fingerprintPluginControlPlaneContext(resolvePluginControlPlaneContext(params));
}
function fingerprintPluginControlPlaneContext(context) {
  return (0, _installedPluginIndexStoreDEo2ZAhx.b)(context);
}
//#endregion
//#region src/plugins/plugin-registry-id-normalizer.ts
function normalizePluginRegistryAlias(value) {
  return value.trim();
}
function normalizePluginRegistryAliasKey(value) {
  return normalizePluginRegistryAlias(value).toLowerCase();
}
function collectObjectKeys$1(value) {
  return value ? Object.keys(value) : [];
}
function listPluginRegistryNormalizerAliases(plugin) {
  return [
  plugin.id,
  ...(plugin.providers ?? []),
  ...(plugin.channels ?? []),
  ...(plugin.setup?.providers?.map((provider) => provider.id) ?? []),
  ...(plugin.cliBackends ?? []),
  ...(plugin.setup?.cliBackends ?? []),
  ...collectObjectKeys$1(plugin.modelCatalog?.providers),
  ...collectObjectKeys$1(plugin.modelCatalog?.aliases),
  ...(plugin.legacyPluginIds ?? [])];

}
function createPluginRegistryIdNormalizer(index, options = {}) {
  const aliases = /* @__PURE__ */new Map();
  for (const plugin of index.plugins) {
    if (!plugin.pluginId) continue;
    const pluginId = normalizePluginRegistryAlias(plugin.pluginId);
    if (pluginId) aliases.set(normalizePluginRegistryAliasKey(pluginId), plugin.pluginId);
  }
  const registry = options.lookUpTable?.manifestRegistry ?? options.manifestRegistry ?? (0, _manifestRegistryInstalledCRoA7rSF.t)({
    index,
    includeDisabled: true
  });
  for (const plugin of [...registry.plugins].toSorted((left, right) => left.id.localeCompare(right.id))) {
    const pluginId = normalizePluginRegistryAlias(plugin.id);
    if (!pluginId) continue;
    aliases.set(normalizePluginRegistryAliasKey(pluginId), plugin.id);
    for (const alias of listPluginRegistryNormalizerAliases(plugin)) {
      const normalizedAlias = normalizePluginRegistryAlias(alias);
      const normalizedAliasKey = normalizePluginRegistryAliasKey(alias);
      if (normalizedAlias && !aliases.has(normalizedAliasKey)) aliases.set(normalizedAliasKey, pluginId);
    }
  }
  return (pluginId) => {
    const trimmed = normalizePluginRegistryAlias(pluginId);
    return aliases.get(normalizePluginRegistryAliasKey(trimmed)) ?? trimmed;
  };
}
//#endregion
//#region src/plugins/current-plugin-metadata-snapshot.ts
function resolvePluginMetadataControlPlaneFingerprint(config, options = {}) {
  return resolvePluginControlPlaneFingerprint({
    config,
    ...options
  });
}
function setCurrentPluginMetadataSnapshot(snapshot, options = {}) {
  const compatiblePolicyHashes = snapshot ? options.compatibleConfigs?.map((config) => (0, _installedPluginIndexStoreDEo2ZAhx._)(config)) : void 0;
  const compatibleConfigFingerprints = snapshot ? options.compatibleConfigs?.map((config, index) => resolvePluginMetadataControlPlaneFingerprint(config, {
    env: options.env,
    index: snapshot.index,
    policyHash: compatiblePolicyHashes?.[index],
    workspaceDir: options.workspaceDir ?? snapshot.workspaceDir
  })) : void 0;
  (0, _installedPluginIndexStoreDEo2ZAhx.l)(snapshot, snapshot ? resolvePluginMetadataControlPlaneFingerprint(options.config, {
    env: options.env,
    index: snapshot.index,
    policyHash: snapshot.policyHash,
    workspaceDir: options.workspaceDir ?? snapshot.workspaceDir
  }) : void 0, compatiblePolicyHashes, compatibleConfigFingerprints);
}
function clearCurrentPluginMetadataSnapshot() {
  (0, _installedPluginIndexStoreDEo2ZAhx.s)();
}
function captureCurrentPluginMetadataSnapshotState() {
  return (0, _installedPluginIndexStoreDEo2ZAhx.c)();
}
function restoreCurrentPluginMetadataSnapshotState(state) {
  (0, _installedPluginIndexStoreDEo2ZAhx.l)(state.snapshot, state.configFingerprint, state.compatiblePolicyHashes, state.compatibleConfigFingerprints);
}
function getCurrentPluginMetadataSnapshot(params = {}) {
  const { snapshot: rawSnapshot, configFingerprint, compatiblePolicyHashes, compatibleConfigFingerprints } = (0, _installedPluginIndexStoreDEo2ZAhx.c)();
  const snapshot = rawSnapshot;
  if (!snapshot) return;
  const requestedPolicyHash = params.config ? (0, _installedPluginIndexStoreDEo2ZAhx._)(params.config) : void 0;
  if (requestedPolicyHash && snapshot.policyHash !== requestedPolicyHash) {
    if (!new Set(compatiblePolicyHashes ?? []).has(requestedPolicyHash)) return;
  }
  const requestedWorkspaceDir = params.workspaceDir ?? (params.allowWorkspaceScopedSnapshot === true ? snapshot.workspaceDir : void 0);
  if (params.config) {
    const requestedConfigFingerprint = resolvePluginMetadataControlPlaneFingerprint(params.config, {
      env: params.env,
      index: snapshot.index,
      policyHash: requestedPolicyHash,
      workspaceDir: requestedWorkspaceDir
    });
    const compatibleFingerprints = new Set(compatibleConfigFingerprints ?? []);
    if (!(configFingerprint === requestedConfigFingerprint || snapshot.configFingerprint === requestedConfigFingerprint || compatibleFingerprints.has(requestedConfigFingerprint))) return;
  }
  if (params.requireDefaultDiscoveryContext === true) {
    const defaultDiscoveryConfigFingerprint = resolvePluginMetadataControlPlaneFingerprint({}, {
      env: params.env,
      index: snapshot.index,
      policyHash: snapshot.policyHash,
      workspaceDir: requestedWorkspaceDir
    });
    const compatibleFingerprints = new Set(compatibleConfigFingerprints ?? []);
    if (!(configFingerprint === defaultDiscoveryConfigFingerprint || snapshot.configFingerprint === defaultDiscoveryConfigFingerprint || compatibleFingerprints.has(defaultDiscoveryConfigFingerprint))) return;
  }
  if (snapshot.workspaceDir !== void 0 && requestedWorkspaceDir === void 0) return;
  if (requestedWorkspaceDir !== void 0 && (snapshot.workspaceDir ?? "") !== (requestedWorkspaceDir ?? "")) return;
  return snapshot;
}
//#endregion
//#region src/plugins/plugin-registry-snapshot.ts
const DISABLE_PERSISTED_PLUGIN_REGISTRY_ENV = exports.l = "OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY";
function formatDeprecatedPersistedRegistryDisableWarning() {
  return `${DISABLE_PERSISTED_PLUGIN_REGISTRY_ENV} is a deprecated break-glass compatibility switch; use \`openclaw plugins registry --refresh\` or \`openclaw doctor --fix\` to repair registry state.`;
}
function hasEnvFlag(env, name) {
  const value = env[name]?.trim().toLowerCase();
  return Boolean(value && value !== "0" && value !== "false" && value !== "no");
}
function canReuseCurrentPluginMetadataSnapshot(params) {
  return params.preferPersisted !== false && params.stateDir === void 0 && params.filePath === void 0 && params.pluginIndexFilePath === void 0 && params.installRecords === void 0 && params.candidates === void 0 && params.diagnostics === void 0 && params.now === void 0;
}
function loadCurrentPluginRegistrySnapshotResult(params) {
  if (!canReuseCurrentPluginMetadataSnapshot(params)) return;
  const env = params.env ?? process.env;
  const current = getCurrentPluginMetadataSnapshot({
    config: params.config,
    env,
    ...(params.workspaceDir ? { workspaceDir: params.workspaceDir } : {}),
    ...(params.workspaceDir === void 0 ? { allowWorkspaceScopedSnapshot: true } : {})
  });
  if (!current || current.registryDiagnostics.length > 0) return;
  return {
    snapshot: current.index,
    source: "provided",
    diagnostics: current.registryDiagnostics
  };
}
function hasMissingPersistedPluginSource(index) {
  return index.plugins.some((plugin) => {
    if (!plugin.enabled) return false;
    return !_nodeFs.default.existsSync(plugin.rootDir) || !(0, _installedPluginIndexStoreDEo2ZAhx.m)(plugin) && !_nodeFs.default.existsSync(plugin.manifestPath) || (plugin.source ? !_nodeFs.default.existsSync(plugin.source) : false) || (plugin.setupSource ? !_nodeFs.default.existsSync(plugin.setupSource) : false);
  });
}
function resolveComparablePath(filePath) {
  try {
    return _nodeFs.default.realpathSync(filePath);
  } catch {
    return _nodePath.default.resolve(filePath);
  }
}
function isRelativePathInsideOrEqual(relativePath) {
  return relativePath === "" || relativePath !== ".." && !relativePath.startsWith(`..${_nodePath.default.sep}`) && !_nodePath.default.isAbsolute(relativePath);
}
function isPathInsideOrEqual(childPath, parentPath) {
  return isRelativePathInsideOrEqual(_nodePath.default.relative(resolveComparablePath(parentPath), resolveComparablePath(childPath)));
}
function hasMismatchedPersistedBundledPluginRoot(index, env) {
  const bundledPluginsDir = (0, _bundledDirBocaljIz.n)(env);
  if (!bundledPluginsDir) return false;
  return index.plugins.some((plugin) => plugin.origin === "bundled" && !isPathInsideOrEqual(plugin.rootDir, bundledPluginsDir));
}
function hashExistingFile(filePath) {
  try {
    return _nodeCrypto.default.createHash("sha256").update(_nodeFs.default.readFileSync(filePath)).digest("hex");
  } catch {
    return null;
  }
}
function resolveRecordPackageJsonPath(plugin) {
  const packageJsonPath = plugin.packageJson?.path;
  if (!packageJsonPath) return null;
  const rootDir = plugin.rootDir || _nodePath.default.dirname(plugin.manifestPath);
  const resolved = _nodePath.default.resolve(rootDir, packageJsonPath);
  if (!isRelativePathInsideOrEqual(_nodePath.default.relative(rootDir, resolved))) return null;
  return isRelativePathInsideOrEqual(_nodePath.default.relative(resolveComparablePath(rootDir), resolveComparablePath(resolved))) ? resolved : null;
}
function hasStalePersistedPluginDiagnostics(index) {
  return index.diagnostics.some((diag) => {
    const source = diag.source;
    return typeof diag.pluginId === "string" && diag.pluginId.trim().length > 0 && typeof source === "string" && _nodePath.default.isAbsolute(source) && !_nodeFs.default.existsSync(source);
  });
}
function hasStalePersistedPluginMetadata(index) {
  return index.plugins.some((plugin) => {
    if (!(0, _installedPluginIndexStoreDEo2ZAhx.m)(plugin)) {
      if ((0, _installedPluginIndexStoreDEo2ZAhx.y)(plugin.manifestPath, plugin.manifestFile) !== true) {
        const manifestHash = hashExistingFile(plugin.manifestPath);
        if (manifestHash && manifestHash !== plugin.manifestHash) return true;
      }
    }
    const packageJsonPath = resolveRecordPackageJsonPath(plugin);
    if (!plugin.packageJson?.hash) return false;
    if (!packageJsonPath) return true;
    const packageJsonSignatureMatches = (0, _installedPluginIndexStoreDEo2ZAhx.y)(packageJsonPath, plugin.packageJson.fileSignature);
    if (packageJsonSignatureMatches === true && plugin.origin === "bundled") return false;
    if (packageJsonSignatureMatches === false) return hashExistingFile(packageJsonPath) !== plugin.packageJson.hash;
    return hashExistingFile(packageJsonPath) !== plugin.packageJson.hash;
  });
}
function loadSnapshotInstallRecords(params, env) {
  return (0, _installedPluginIndexRecordReaderDR3h__QQ.n)({
    env,
    ...(params.stateDir ? { stateDir: params.stateDir } : {}),
    ...(params.filePath ? { filePath: params.filePath } : params.pluginIndexFilePath ? { filePath: params.pluginIndexFilePath } : {})
  });
}
function hasRecoveredInstallRecordsMissingFromPersistedIndex(index, installRecords, env) {
  const persistedRecords = (0, _installedPluginIndexStoreDEo2ZAhx.h)(index);
  const persistedPluginIds = new Set(index.plugins.map((plugin) => plugin.pluginId));
  return Object.entries(installRecords).some(([pluginId, record]) => {
    if (persistedRecords[pluginId] && persistedPluginIds.has(pluginId)) return false;
    const installPaths = [record.installPath, record.sourcePath].filter((candidate) => typeof candidate === "string" && candidate.trim().length > 0);
    if (installPaths.length === 0) return true;
    return installPaths.some((installPath) => _nodeFs.default.existsSync((0, _utilsCKsuXgDI.p)(installPath, env)));
  });
}
function loadPluginRegistrySnapshotWithMetadata(params = {}) {
  if (params.index) return {
    snapshot: params.index,
    source: "provided",
    diagnostics: []
  };
  const current = loadCurrentPluginRegistrySnapshotResult(params);
  if (current) return current;
  const env = params.env ?? process.env;
  const diagnostics = [];
  const disabledByCaller = params.preferPersisted === false;
  const disabledByEnv = hasEnvFlag(env, DISABLE_PERSISTED_PLUGIN_REGISTRY_ENV);
  const persistedReadsEnabled = !disabledByCaller && !disabledByEnv;
  const persistedInstallRecordReadsEnabled = !disabledByEnv;
  let persistedIndex = null;
  if (persistedInstallRecordReadsEnabled) {
    persistedIndex = (0, _installedPluginIndexStoreDEo2ZAhx.r)(params);
    if (persistedReadsEnabled && persistedIndex) {if (params.config && persistedIndex.policyHash !== (0, _installedPluginIndexStoreDEo2ZAhx._)(params.config)) diagnostics.push({
        level: "warn",
        code: "persisted-registry-stale-policy",
        message: "Persisted plugin registry policy does not match current config; using derived plugin index. Run `openclaw plugins registry --refresh` to update the persisted registry."
      });else
      if (hasMissingPersistedPluginSource(persistedIndex)) diagnostics.push({
        level: "warn",
        code: "persisted-registry-stale-source",
        message: "Persisted plugin registry points at missing plugin files; using derived plugin index. Run `openclaw plugins registry --refresh` to update the persisted registry."
      });else
      if (hasMismatchedPersistedBundledPluginRoot(persistedIndex, env)) diagnostics.push({
        level: "warn",
        code: "persisted-registry-stale-source",
        message: "Persisted plugin registry points at a different bundled plugin tree; using derived plugin index. Run `openclaw plugins registry --refresh` to update the persisted registry."
      });else
      if (hasStalePersistedPluginDiagnostics(persistedIndex)) diagnostics.push({
        level: "warn",
        code: "persisted-registry-stale-source",
        message: "Persisted plugin registry contains diagnostics referencing missing paths; using derived plugin index. Run `openclaw plugins registry --refresh` to update the persisted registry."
      });else
      if (hasStalePersistedPluginMetadata(persistedIndex)) diagnostics.push({
        level: "warn",
        code: "persisted-registry-stale-source",
        message: "Persisted plugin registry metadata no longer matches plugin manifest or package files; using derived plugin index. Run `openclaw plugins registry --refresh` to update the persisted registry."
      });else
      if (hasRecoveredInstallRecordsMissingFromPersistedIndex(persistedIndex, loadSnapshotInstallRecords(params, env), env)) diagnostics.push({
        level: "warn",
        code: "persisted-registry-stale-source",
        message: "Persisted plugin registry is missing recoverable managed npm plugins; using derived plugin index. Run `openclaw plugins registry --refresh` to update the persisted registry."
      });else
      return {
        snapshot: persistedIndex,
        source: "persisted",
        diagnostics
      };} else
    if (persistedReadsEnabled) diagnostics.push({
      level: "info",
      code: "persisted-registry-missing",
      message: "Persisted plugin registry is missing or invalid; using derived plugin index."
    });
  } else diagnostics.push({
    level: "warn",
    code: "persisted-registry-disabled",
    message: disabledByEnv ? `${formatDeprecatedPersistedRegistryDisableWarning()} Using legacy derived plugin index.` : "Persisted plugin registry reads are disabled by the caller; using derived plugin index."
  });
  return {
    snapshot: (0, _installedPluginIndexStoreDEo2ZAhx.f)({
      ...params,
      ...(persistedInstallRecordReadsEnabled ? {} : { installRecords: params.installRecords ?? {} })
    }),
    source: "derived",
    diagnostics
  };
}
function resolveSnapshot(params = {}) {
  return loadPluginRegistrySnapshotWithMetadata(params).snapshot;
}
function loadPluginRegistrySnapshot(params = {}) {
  return resolveSnapshot(params);
}
function getPluginRecord(params) {
  return (0, _installedPluginIndexStoreDEo2ZAhx.u)(resolveSnapshot(params), params.pluginId);
}
function isPluginEnabled(params) {
  return (0, _installedPluginIndexStoreDEo2ZAhx.d)(resolveSnapshot(params), params.pluginId, params.config);
}
function inspectPluginRegistry(params = {}) {
  return (0, _installedPluginIndexStoreDEo2ZAhx.t)(params);
}
function refreshPluginRegistry(params) {
  return (0, _installedPluginIndexStoreDEo2ZAhx.i)(params);
}
//#endregion
//#region src/plugins/plugin-registry-contributions.ts
function normalizeContributionId(value) {
  return value.trim();
}
function sortUnique(values) {
  return [...new Set([...values].map((value) => value.trim()).filter(Boolean))].toSorted((left, right) => left.localeCompare(right));
}
function collectObjectKeys(value) {
  return value ? Object.keys(value) : [];
}
function collectContractKeys(plugin) {
  const contracts = plugin.contracts;
  if (!contracts) return [];
  return Object.entries(contracts).flatMap(([key, value]) => Array.isArray(value) && value.length > 0 ? [key] : []);
}
function listManifestContractValues(plugin, contract) {
  return plugin.contracts?.[contract] ?? [];
}
function loadManifestContractRegistry(params) {
  return loadPluginManifestRegistryForPluginRegistry({
    ...params,
    pluginIds: params.onlyPluginIds,
    includeDisabled: true
  });
}
function listManifestContributionIds(plugin, contribution) {
  switch (contribution) {
    case "providers":return plugin.providers;
    case "channels":return plugin.channels;
    case "channelConfigs":return collectObjectKeys(plugin.channelConfigs);
    case "setupProviders":return plugin.setup?.providers?.map((provider) => provider.id) ?? [];
    case "cliBackends":return [...plugin.cliBackends, ...(plugin.setup?.cliBackends ?? [])];
    case "modelCatalogProviders":return [...collectObjectKeys(plugin.modelCatalog?.providers), ...collectObjectKeys(plugin.modelCatalog?.aliases)];
    case "commandAliases":return plugin.commandAliases?.map((alias) => alias.name) ?? [];
    case "contracts":return collectContractKeys(plugin);
  }
  return [];
}
function resolveContributionPluginIds(params) {
  if (params.includeDisabled) return params.index.plugins.map((plugin) => plugin.pluginId);
  return params.index.plugins.filter((plugin) => (0, _installedPluginIndexStoreDEo2ZAhx.d)(params.index, plugin.pluginId, params.config)).map((plugin) => plugin.pluginId);
}
function loadContributionManifestRegistry(params) {
  return (0, _manifestRegistryInstalledCRoA7rSF.t)({
    index: params.index,
    config: params.config,
    workspaceDir: params.workspaceDir,
    env: params.env,
    pluginIds: resolveContributionPluginIds({
      index: params.index,
      includeDisabled: params.includeDisabled,
      config: params.config
    }),
    includeDisabled: true
  });
}
function listContributionManifestPlugins(params) {
  const plugins = params.lookUpTable?.plugins;
  if (plugins) {
    const enabledPluginIds = new Set(resolveContributionPluginIds({
      index: params.index,
      includeDisabled: params.includeDisabled,
      config: params.config
    }));
    return plugins.filter((plugin) => enabledPluginIds.has(plugin.id));
  }
  return loadContributionManifestRegistry({
    ...params,
    index: params.index
  }).plugins;
}
function resolveContributionOwnerMap(table, contribution) {
  switch (contribution) {
    case "channels":return table.owners.channels;
    case "channelConfigs":return table.owners.channelConfigs;
    case "providers":return table.owners.providers;
    case "modelCatalogProviders":return table.owners.modelCatalogProviders;
    case "cliBackends":return table.owners.cliBackends;
    case "setupProviders":return table.owners.setupProviders;
    case "commandAliases":return table.owners.commandAliases;
    case "contracts":return table.owners.contracts;
  }
}
function filterContributionOwnerIds(params) {
  const enabledPluginIds = new Set(resolveContributionPluginIds({
    index: params.index,
    includeDisabled: params.includeDisabled,
    config: params.config
  }));
  return sortUnique(params.owners.filter((owner) => enabledPluginIds.has(owner)));
}
function canReuseCurrentManifestRegistry(params) {
  return params.bundledChannelConfigCollector === void 0 && params.index === void 0 && params.preferPersisted !== false && params.stateDir === void 0 && params.filePath === void 0 && params.pluginIndexFilePath === void 0 && params.installRecords === void 0 && params.candidates === void 0 && params.diagnostics === void 0;
}
function loadCurrentManifestRegistryForPluginRegistry(params) {
  if (!canReuseCurrentManifestRegistry(params)) return;
  const env = params.env ?? process.env;
  const current = getCurrentPluginMetadataSnapshot({
    config: params.config,
    env,
    ...(params.workspaceDir ? { workspaceDir: params.workspaceDir } : {}),
    ...(params.workspaceDir === void 0 ? { allowWorkspaceScopedSnapshot: true } : {})
  });
  if (!current || current.registryDiagnostics.length > 0) return;
  const pluginIdSet = params.pluginIds === void 0 ? void 0 : new Set(params.pluginIds);
  const enabledPluginIds = new Set(current.index.plugins.filter((plugin) => params.includeDisabled || plugin.enabled).map((plugin) => plugin.pluginId));
  return {
    plugins: current.manifestRegistry.plugins.filter((plugin) => (!pluginIdSet || pluginIdSet.has(plugin.id)) && (params.includeDisabled || enabledPluginIds.has(plugin.id))),
    diagnostics: pluginIdSet ? current.manifestRegistry.diagnostics.filter((diagnostic) => !diagnostic.pluginId || pluginIdSet.has(diagnostic.pluginId)) : current.manifestRegistry.diagnostics
  };
}
function loadPluginManifestRegistryForPluginRegistry(params = {}) {
  const current = loadCurrentManifestRegistryForPluginRegistry(params);
  if (current) return current;
  return (0, _manifestRegistryInstalledCRoA7rSF.t)({
    index: loadPluginRegistrySnapshot(params),
    config: params.config,
    workspaceDir: params.workspaceDir,
    env: params.env,
    pluginIds: params.pluginIds,
    includeDisabled: params.includeDisabled,
    ...(params.bundledChannelConfigCollector ? { bundledChannelConfigCollector: params.bundledChannelConfigCollector } : {})
  });
}
function normalizePluginsConfigWithRegistry(config, index, options = {}) {
  return (0, _configNormalizationSharedD1vSsZ.i)(config, createPluginRegistryIdNormalizer(index, options));
}
function listPluginContributionIds(params) {
  const index = params.lookUpTable?.index ?? loadPluginRegistrySnapshot(params);
  return sortUnique(listContributionManifestPlugins({
    ...params,
    index
  }).flatMap((plugin) => listManifestContributionIds(plugin, params.contribution)));
}
function resolvePluginContributionOwners(params) {
  const index = params.lookUpTable?.index ?? loadPluginRegistrySnapshot(params);
  if (params.lookUpTable && typeof params.matches === "string") {
    const owners = resolveContributionOwnerMap(params.lookUpTable, params.contribution)?.get(params.matches);
    if (owners) return filterContributionOwnerIds({
      owners,
      index,
      includeDisabled: params.includeDisabled,
      config: params.config
    });
    return [];
  }
  const matcher = typeof params.matches === "string" ? (contributionId) => contributionId === params.matches : params.matches;
  return sortUnique(listContributionManifestPlugins({
    ...params,
    index
  }).flatMap((plugin) => listManifestContributionIds(plugin, params.contribution).some(matcher) ? [plugin.id] : []));
}
function resolveProviderOwners(params) {
  const providerId = (0, _providerIdCz7K6wgK.r)(params.providerId);
  if (!providerId) return [];
  if (params.lookUpTable) {
    const index = params.lookUpTable.index;
    const owners = [];
    for (const [contributionId, ownerIds] of params.lookUpTable.owners.providers.entries()) if ((0, _providerIdCz7K6wgK.r)(contributionId) === providerId) owners.push(...ownerIds);
    return filterContributionOwnerIds({
      owners,
      index,
      includeDisabled: params.includeDisabled,
      config: params.config
    });
  }
  return resolvePluginContributionOwners({
    ...params,
    contribution: "providers",
    matches: (contributionId) => (0, _providerIdCz7K6wgK.r)(contributionId) === providerId
  });
}
function resolveManifestContractPluginIds(params) {
  return loadManifestContractRegistry(params).plugins.filter((plugin) => (!params.origin || plugin.origin === params.origin) && listManifestContractValues(plugin, params.contract).length > 0).map((plugin) => plugin.id).toSorted((left, right) => left.localeCompare(right));
}
function resolveManifestContractPluginIdsByCompatibilityRuntimePath(params) {
  const normalizedPath = params.path?.trim();
  if (!normalizedPath) return [];
  return loadManifestContractRegistry(params).plugins.filter((plugin) => (!params.origin || plugin.origin === params.origin) && listManifestContractValues(plugin, params.contract).length > 0 && (plugin.configContracts?.compatibilityRuntimePaths ?? []).includes(normalizedPath)).map((plugin) => plugin.id).toSorted((left, right) => left.localeCompare(right));
}
function resolveManifestContractOwnerPluginId(params) {
  const normalizedValue = normalizeContributionId(params.value ?? "").toLowerCase();
  if (!normalizedValue) return;
  return loadManifestContractRegistry(params).plugins.find((plugin) => (!params.origin || plugin.origin === params.origin) && listManifestContractValues(plugin, params.contract).some((candidate) => normalizeContributionId(candidate).toLowerCase() === normalizedValue))?.id;
}
//#endregion /* v9-1c5996fa4980047a */
