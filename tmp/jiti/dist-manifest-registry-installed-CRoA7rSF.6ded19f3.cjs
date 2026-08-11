"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = resolveInstalledManifestRegistryIndexFingerprint;exports.t = loadPluginManifestRegistryForInstalledIndex;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
var _pathB5B_oAT = require("./path-B5B-_oAT.js");
var _discoveryBNk7kgJV = require("./discovery-BNk7kgJV.js");
var _stringNormalizationDgUPESoD = require("./string-normalization-DgUPESoD.js");
require("./bundle-manifest-DpCbfxOo.js");
var _installedPluginIndexStoreDEo2ZAhx = require("./installed-plugin-index-store-DEo2ZAhx.js");
var _jsonFiles1SmAauRO = require("./json-files-1SmAauRO.js");
var _manifestCkPySoxh = require("./manifest-CkPySoxh.js");
var _manifestRegistryDbnX5kdP = require("./manifest-registry-DbnX5kdP.js");
var _nodeFs = _interopRequireDefault(require("node:fs"));
var _nodePath = _interopRequireDefault(require("node:path"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}
//#region src/plugins/manifest-registry-installed.ts
function isRelativePathInsideOrEqual(relativePath) {
  return relativePath === "" || relativePath !== ".." && !relativePath.startsWith(`..${_nodePath.default.sep}`) && !_nodePath.default.isAbsolute(relativePath);
}
function resolvePackageJsonPath(record) {
  if (!record.packageJson?.path) return;
  const rootDir = resolveInstalledPluginRootDir(record);
  const realRootDir = (0, _pathB5B_oAT.d)(rootDir) ?? _nodePath.default.resolve(rootDir);
  const packageJsonPath = _nodePath.default.resolve(realRootDir, record.packageJson.path);
  if (!isRelativePathInsideOrEqual(_nodePath.default.relative(realRootDir, packageJsonPath))) return;
  if (!(0, _pathB5B_oAT.a)(realRootDir, packageJsonPath)) return;
  return packageJsonPath;
}
function safeFileSignature(filePath) {
  if (!filePath) return;
  try {
    const stat = _nodeFs.default.statSync(filePath);
    return `${filePath}:${stat.size}:${stat.mtimeMs}`;
  } catch {
    return `${filePath}:missing`;
  }
}
function buildInstalledManifestRegistryIndexKey(index) {
  return {
    version: index.version,
    hostContractVersion: index.hostContractVersion,
    compatRegistryVersion: index.compatRegistryVersion,
    migrationVersion: index.migrationVersion,
    policyHash: index.policyHash,
    installRecords: index.installRecords,
    diagnostics: index.diagnostics,
    plugins: index.plugins.map((record) => {
      const packageJsonPath = resolvePackageJsonPath(record);
      return {
        pluginId: record.pluginId,
        packageName: record.packageName,
        packageVersion: record.packageVersion,
        installRecord: record.installRecord,
        installRecordHash: record.installRecordHash,
        packageInstall: record.packageInstall,
        packageChannel: record.packageChannel,
        manifestPath: record.manifestPath,
        manifestHash: record.manifestHash,
        manifestFile: safeFileSignature(record.manifestPath),
        format: record.format,
        bundleFormat: record.bundleFormat,
        source: record.source,
        setupSource: record.setupSource,
        packageJson: record.packageJson,
        packageJsonFile: safeFileSignature(packageJsonPath),
        rootDir: record.rootDir,
        origin: record.origin,
        enabled: record.enabled,
        enabledByDefault: record.enabledByDefault,
        enabledByDefaultOnPlatforms: record.enabledByDefaultOnPlatforms ? [...record.enabledByDefaultOnPlatforms] : void 0,
        syntheticAuthRefs: record.syntheticAuthRefs,
        startup: record.startup,
        compat: record.compat
      };
    })
  };
}
function resolveInstalledManifestRegistryIndexFingerprint(index) {
  return (0, _installedPluginIndexStoreDEo2ZAhx.b)(buildInstalledManifestRegistryIndexKey(index));
}
function resolveInstalledPluginRootDir(record) {
  return record.rootDir || _nodePath.default.dirname(record.manifestPath || process.cwd());
}
function resolveFallbackPluginSource(record) {
  const rootDir = resolveInstalledPluginRootDir(record);
  for (const entry of _manifestCkPySoxh.t) {
    const candidate = _nodePath.default.join(rootDir, entry);
    if (_nodeFs.default.existsSync(candidate)) return candidate;
  }
  return _nodePath.default.join(rootDir, _manifestCkPySoxh.t[0]);
}
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function normalizePackageChannelCommands(commands) {
  if (!isRecord(commands)) return;
  const nativeCommandsAutoEnabled = typeof commands.nativeCommandsAutoEnabled === "boolean" ? commands.nativeCommandsAutoEnabled : void 0;
  const nativeSkillsAutoEnabled = typeof commands.nativeSkillsAutoEnabled === "boolean" ? commands.nativeSkillsAutoEnabled : void 0;
  return nativeCommandsAutoEnabled !== void 0 || nativeSkillsAutoEnabled !== void 0 ? {
    ...(nativeCommandsAutoEnabled !== void 0 ? { nativeCommandsAutoEnabled } : {}),
    ...(nativeSkillsAutoEnabled !== void 0 ? { nativeSkillsAutoEnabled } : {})
  } : void 0;
}
function normalizePackageChannelExposure(exposure) {
  if (!isRecord(exposure)) return;
  const configured = typeof exposure.configured === "boolean" ? exposure.configured : void 0;
  const setup = typeof exposure.setup === "boolean" ? exposure.setup : void 0;
  const docs = typeof exposure.docs === "boolean" ? exposure.docs : void 0;
  return configured !== void 0 || setup !== void 0 || docs !== void 0 ? {
    ...(configured !== void 0 ? { configured } : {}),
    ...(setup !== void 0 ? { setup } : {}),
    ...(docs !== void 0 ? { docs } : {})
  } : void 0;
}
function normalizePackageChannelConfiguredState(configuredState) {
  if (!isRecord(configuredState)) return;
  const env = isRecord(configuredState.env) ? {
    ...((0, _stringNormalizationDgUPESoD.a)(configuredState.env.allOf)?.length ? { allOf: (0, _stringNormalizationDgUPESoD.a)(configuredState.env.allOf) } : {}),
    ...((0, _stringNormalizationDgUPESoD.a)(configuredState.env.anyOf)?.length ? { anyOf: (0, _stringNormalizationDgUPESoD.a)(configuredState.env.anyOf) } : {})
  } : void 0;
  const specifier = (0, _stringCoerceLndEvhRk.c)(configuredState.specifier);
  const exportName = (0, _stringCoerceLndEvhRk.c)(configuredState.exportName);
  return specifier || exportName || env && Object.keys(env).length > 0 ? {
    ...(specifier ? { specifier } : {}),
    ...(exportName ? { exportName } : {}),
    ...(env && Object.keys(env).length > 0 ? { env } : {})
  } : void 0;
}
function normalizePackageChannelPersistedAuthState(persistedAuthState) {
  if (!isRecord(persistedAuthState)) return;
  const specifier = (0, _stringCoerceLndEvhRk.c)(persistedAuthState.specifier);
  const exportName = (0, _stringCoerceLndEvhRk.c)(persistedAuthState.exportName);
  return specifier || exportName ? {
    ...(specifier ? { specifier } : {}),
    ...(exportName ? { exportName } : {})
  } : void 0;
}
function normalizePackageChannelDoctorCapabilities(doctorCapabilities) {
  if (!isRecord(doctorCapabilities)) return;
  const dmAllowFromMode = doctorCapabilities.dmAllowFromMode === "topOnly" || doctorCapabilities.dmAllowFromMode === "topOrNested" || doctorCapabilities.dmAllowFromMode === "nestedOnly" ? doctorCapabilities.dmAllowFromMode : void 0;
  const groupModel = doctorCapabilities.groupModel === "sender" || doctorCapabilities.groupModel === "route" || doctorCapabilities.groupModel === "hybrid" ? doctorCapabilities.groupModel : void 0;
  const groupAllowFromFallbackToAllowFrom = typeof doctorCapabilities.groupAllowFromFallbackToAllowFrom === "boolean" ? doctorCapabilities.groupAllowFromFallbackToAllowFrom : void 0;
  const warnOnEmptyGroupSenderAllowlist = typeof doctorCapabilities.warnOnEmptyGroupSenderAllowlist === "boolean" ? doctorCapabilities.warnOnEmptyGroupSenderAllowlist : void 0;
  return dmAllowFromMode || groupModel || groupAllowFromFallbackToAllowFrom !== void 0 || warnOnEmptyGroupSenderAllowlist !== void 0 ? {
    ...(dmAllowFromMode ? { dmAllowFromMode } : {}),
    ...(groupModel ? { groupModel } : {}),
    ...(groupAllowFromFallbackToAllowFrom !== void 0 ? { groupAllowFromFallbackToAllowFrom } : {}),
    ...(warnOnEmptyGroupSenderAllowlist !== void 0 ? { warnOnEmptyGroupSenderAllowlist } : {})
  } : void 0;
}
function normalizePackageChannelCliOptions(cliAddOptions) {
  if (!Array.isArray(cliAddOptions)) return;
  const normalized = cliAddOptions.flatMap((option) => {
    if (!isRecord(option)) return [];
    const flags = (0, _stringCoerceLndEvhRk.c)(option.flags);
    const description = (0, _stringCoerceLndEvhRk.c)(option.description);
    if (!flags || !description) return [];
    const defaultValue = typeof option.defaultValue === "boolean" || typeof option.defaultValue === "string" ? option.defaultValue : void 0;
    return [{
      flags,
      description,
      ...(defaultValue !== void 0 ? { defaultValue } : {})
    }];
  });
  return normalized.length > 0 ? normalized : void 0;
}
function normalizePersistedPackageChannel(value) {
  if (!isRecord(value)) return;
  const id = (0, _stringCoerceLndEvhRk.c)(value.id);
  if (!id) return;
  const channel = { id };
  for (const key of [
  "label",
  "selectionLabel",
  "detailLabel",
  "docsPath",
  "docsLabel",
  "blurb",
  "systemImage",
  "selectionDocsPrefix"])
  {
    const normalized = (0, _stringCoerceLndEvhRk.c)(value[key]);
    if (normalized) channel[key] = normalized;
  }
  if (typeof value.order === "number" && Number.isFinite(value.order)) channel.order = value.order;
  for (const key of [
  "aliases",
  "preferOver",
  "selectionExtras"])
  {
    const normalized = (0, _stringNormalizationDgUPESoD.a)(value[key]);
    if (normalized?.length) channel[key] = normalized;
  }
  for (const key of [
  "selectionDocsOmitLabel",
  "markdownCapable",
  "showConfigured",
  "showInSetup",
  "quickstartAllowFrom",
  "forceAccountBinding",
  "preferSessionLookupForAnnounceTarget"])
  if (typeof value[key] === "boolean") channel[key] = value[key];
  const exposure = normalizePackageChannelExposure(value.exposure);
  if (exposure) channel.exposure = exposure;
  const commands = normalizePackageChannelCommands(value.commands);
  if (commands) channel.commands = commands;
  const configuredState = normalizePackageChannelConfiguredState(value.configuredState);
  if (configuredState) channel.configuredState = configuredState;
  const persistedAuthState = normalizePackageChannelPersistedAuthState(value.persistedAuthState);
  if (persistedAuthState) channel.persistedAuthState = persistedAuthState;
  const doctorCapabilities = normalizePackageChannelDoctorCapabilities(value.doctorCapabilities);
  if (doctorCapabilities) channel.doctorCapabilities = doctorCapabilities;
  const cliAddOptions = normalizePackageChannelCliOptions(value.cliAddOptions);
  if (cliAddOptions) channel.cliAddOptions = cliAddOptions;
  return channel;
}
function resolveInstalledPackageMetadata(record) {
  const recordPackageChannel = normalizePersistedPackageChannel(record.packageChannel);
  const fallbackPackageManifest = recordPackageChannel ? { channel: recordPackageChannel } : void 0;
  const packageJsonPath = record.packageJson?.path ? resolvePackageJsonPath(record) : void 0;
  if (!packageJsonPath) return fallbackPackageManifest ? { packageManifest: fallbackPackageManifest } : {};
  const packageJson = (0, _jsonFiles1SmAauRO.u)(packageJsonPath);
  if (packageJson) {
    const packageManifest = (0, _manifestCkPySoxh.r)(packageJson);
    const dependencies = (0, _discoveryBNk7kgJV.r)({
      dependencies: packageJson.dependencies,
      optionalDependencies: packageJson.optionalDependencies
    });
    if (!packageManifest) return {
      ...(fallbackPackageManifest ? { packageManifest: fallbackPackageManifest } : {}),
      packageDependencies: dependencies.dependencies,
      packageOptionalDependencies: dependencies.optionalDependencies
    };
    const packageChannel = normalizePersistedPackageChannel(packageManifest.channel);
    const channel = recordPackageChannel || packageChannel ? {
      ...recordPackageChannel,
      ...packageChannel
    } : void 0;
    const { channel: _ignoredChannel, ...packageManifestWithoutChannel } = packageManifest;
    return {
      packageManifest: {
        ...packageManifestWithoutChannel,
        ...(channel ? { channel } : {})
      },
      packageDependencies: dependencies.dependencies,
      packageOptionalDependencies: dependencies.optionalDependencies
    };
  }
  return fallbackPackageManifest ? { packageManifest: fallbackPackageManifest } : {};
}
function toPluginCandidate(record) {
  const rootDir = resolveInstalledPluginRootDir(record);
  const packageMetadata = resolveInstalledPackageMetadata(record);
  return {
    idHint: record.pluginId,
    source: record.source ?? resolveFallbackPluginSource(record),
    ...(record.setupSource ? { setupSource: record.setupSource } : {}),
    rootDir,
    origin: record.origin,
    ...(record.format ? { format: record.format } : {}),
    ...(record.bundleFormat ? { bundleFormat: record.bundleFormat } : {}),
    ...(record.packageName ? { packageName: record.packageName } : {}),
    ...(record.packageVersion ? { packageVersion: record.packageVersion } : {}),
    ...(packageMetadata.packageManifest ? { packageManifest: packageMetadata.packageManifest } : {}),
    ...(packageMetadata.packageDependencies ? { packageDependencies: packageMetadata.packageDependencies } : {}),
    ...(packageMetadata.packageOptionalDependencies ? { packageOptionalDependencies: packageMetadata.packageOptionalDependencies } : {}),
    packageDir: rootDir
  };
}
function loadPluginManifestRegistryForInstalledIndex(params) {
  return (0, _discoveryBNk7kgJV.o)("manifest registry", () => {
    if (params.pluginIds && params.pluginIds.length === 0) return {
      plugins: [],
      diagnostics: []
    };
    const env = params.env ?? process.env;
    const pluginIdSet = params.pluginIds?.length ? new Set(params.pluginIds) : null;
    const diagnostics = pluginIdSet ? params.index.diagnostics.filter((diagnostic) => {
      const pluginId = diagnostic.pluginId;
      return !pluginId || pluginIdSet.has(pluginId);
    }) : params.index.diagnostics;
    const candidates = params.index.plugins.filter((plugin) => params.includeDisabled || plugin.enabled).filter((plugin) => !pluginIdSet || pluginIdSet.has(plugin.pluginId)).map(toPluginCandidate);
    return (0, _manifestRegistryDbnX5kdP.t)({
      config: params.config,
      workspaceDir: params.workspaceDir,
      env,
      candidates,
      diagnostics: [...diagnostics],
      installRecords: (0, _installedPluginIndexStoreDEo2ZAhx.h)(params.index),
      ...(params.bundledChannelConfigCollector ? { bundledChannelConfigCollector: params.bundledChannelConfigCollector } : {})
    });
  }, {
    includeDisabled: params.includeDisabled === true,
    pluginIdCount: params.pluginIds?.length,
    indexPluginCount: params.index.plugins.length
  });
}
//#endregion /* v9-6720f1dc7339612a */
