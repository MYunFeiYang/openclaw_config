"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.i = resolveBundledPluginScanDir;exports.n = resolveBundledPluginRepoEntryPath;exports.r = normalizeBundledPluginStringList;exports.t = resolveBundledPluginGeneratedPath;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
var _stringNormalizationDgUPESoD = require("./string-normalization-DgUPESoD.js");
var _jsonFiles1SmAauRO = require("./json-files-1SmAauRO.js");
var _manifestCkPySoxh = require("./manifest-CkPySoxh.js");
var _pluginModuleLoaderCacheCXUDv7JF = require("./plugin-module-loader-cache-CXUDv7JF.js");
var _sdkAliasBOEr = require("./sdk-alias-BOEr7503.js");
var _publicSurfaceRuntimeHv340Ieq = require("./public-surface-runtime-Hv340Ieq.js");
var _configSchemaD8aO2abV = require("./config-schema-D8aO2abV.js");
var _nodeUrl = require("node:url");
var _nodeFs = _interopRequireDefault(require("node:fs"));
var _nodePath = _interopRequireDefault(require("node:path"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}
//#region src/plugins/bundled-plugin-scan.ts
const RUNTIME_SIDECAR_ARTIFACTS = new Set([
"helper-api.js",
"light-runtime-api.js",
"runtime-api.js",
"runtime-setter-api.js",
"thread-bindings-runtime.js"]
);
function normalizeBundledPluginStringList(value) {
  return (0, _stringNormalizationDgUPESoD.l)(value);
}
function rewriteBundledPluginEntryToBuiltPath(entry) {
  if (!entry) return;
  return entry.replace(/^\.\//u, "").replace(/\.[^.]+$/u, ".js");
}
function isTopLevelPublicSurfaceSource(name) {
  if (!_publicSurfaceRuntimeHv340Ieq.t.includes(_nodePath.default.extname(name))) return false;
  if (name.startsWith(".") || name.startsWith("test-") || name.includes(".test-")) return false;
  if (name.endsWith(".d.ts")) return false;
  if (/^config-api(\.[cm]?[jt]s)$/u.test(name)) return false;
  return !/(\.test|\.spec)(\.[cm]?[jt]s)$/u.test(name);
}
function deriveBundledPluginIdHint(params) {
  const base = _nodePath.default.basename(params.entryPath, _nodePath.default.extname(params.entryPath));
  if (!params.hasMultipleExtensions) return params.manifestId;
  const packageName = (0, _stringCoerceLndEvhRk.c)(params.packageName);
  if (!packageName) return `${params.manifestId}/${base}`;
  return `${packageName.includes("/") ? packageName.split("/").pop() ?? packageName : packageName}/${base}`;
}
function collectBundledPluginPublicSurfaceArtifacts(params) {
  const excluded = new Set((0, _stringNormalizationDgUPESoD.l)([params.sourceEntry, params.setupEntry]).map((entry) => _nodePath.default.basename(entry)));
  const artifacts = _nodeFs.default.readdirSync(params.pluginDir, { withFileTypes: true }).filter((entry) => entry.isFile()).map((entry) => entry.name).filter(isTopLevelPublicSurfaceSource).filter((entry) => !excluded.has(entry)).map((entry) => rewriteBundledPluginEntryToBuiltPath(entry)).filter((entry) => typeof entry === "string" && entry.length > 0).toSorted((left, right) => left.localeCompare(right));
  return artifacts.length > 0 ? artifacts : void 0;
}
function collectBundledPluginRuntimeSidecarArtifacts(publicSurfaceArtifacts) {
  if (!publicSurfaceArtifacts) return;
  const artifacts = publicSurfaceArtifacts.filter((artifact) => RUNTIME_SIDECAR_ARTIFACTS.has(artifact));
  return artifacts.length > 0 ? artifacts : void 0;
}
function resolveBundledPluginScanDir(params) {
  const sourceDir = _nodePath.default.join(params.packageRoot, "extensions");
  const runtimeDir = _nodePath.default.join(params.packageRoot, "dist-runtime", "extensions");
  const builtDir = _nodePath.default.join(params.packageRoot, "dist", "extensions");
  if (params.runningFromBuiltArtifact) {
    if (_nodeFs.default.existsSync(builtDir)) return builtDir;
    if (_nodeFs.default.existsSync(runtimeDir)) return runtimeDir;
  }
  if (_nodeFs.default.existsSync(sourceDir)) return sourceDir;
  if (_nodeFs.default.existsSync(runtimeDir) && _nodeFs.default.existsSync(builtDir)) return runtimeDir;
  if (_nodeFs.default.existsSync(builtDir)) return builtDir;
}
//#endregion
//#region src/plugins/bundled-channel-config-metadata.ts
const SOURCE_CONFIG_SCHEMA_CANDIDATES = [
_nodePath.default.join("src", "config-schema.ts"),
_nodePath.default.join("src", "config-schema.js"),
_nodePath.default.join("src", "config-schema.mts"),
_nodePath.default.join("src", "config-schema.mjs"),
_nodePath.default.join("src", "config-schema.cts"),
_nodePath.default.join("src", "config-schema.cjs")];

const PUBLIC_CONFIG_SURFACE_BASENAMES = ["channel-config-api"];
const moduleLoaders = (0, _pluginModuleLoaderCacheCXUDv7JF.t)();
function isBuiltChannelConfigSchema(value) {
  if (!value || typeof value !== "object") return false;
  const candidate = value;
  return Boolean(candidate.schema && typeof candidate.schema === "object");
}
function isJsonSchemaConfigSurface(value) {
  if (!value || typeof value !== "object") return false;
  const candidate = value;
  if (typeof candidate.safeParse === "function" || typeof candidate.toJSONSchema === "function") return false;
  return typeof candidate.type === "string" || Array.isArray(candidate.anyOf) || Array.isArray(candidate.oneOf) || Array.isArray(candidate.allOf) || Array.isArray(candidate.enum) || Object.prototype.hasOwnProperty.call(candidate, "const");
}
function resolveConfigSchemaExport(imported) {
  for (const [name, value] of Object.entries(imported)) if (name.endsWith("ChannelConfigSchema") && isBuiltChannelConfigSchema(value)) return value;
  for (const [name, value] of Object.entries(imported)) {
    if (!name.endsWith("ConfigSchema") || name.endsWith("AccountConfigSchema")) continue;
    if (isBuiltChannelConfigSchema(value)) return value;
    if (isJsonSchemaConfigSurface(value)) return (0, _configSchemaD8aO2abV.i)(value);
    if (value && typeof value === "object") return (0, _configSchemaD8aO2abV.r)(value);
  }
  for (const value of Object.values(imported)) if (isBuiltChannelConfigSchema(value)) return value;
  return null;
}
function getModuleLoader(modulePath) {
  return (0, _pluginModuleLoaderCacheCXUDv7JF.n)({
    cache: moduleLoaders,
    modulePath,
    importerUrl: "file:///Users/thinkway/.nvm/versions/node/v24.14.0/lib/node_modules/openclaw/dist/bundled-plugin-metadata-BAyqhztz.js",
    preferBuiltDist: true,
    loaderFilename: "file:///Users/thinkway/.nvm/versions/node/v24.14.0/lib/node_modules/openclaw/dist/bundled-plugin-metadata-BAyqhztz.js"
  });
}
function resolveChannelConfigSchemaModulePath(pluginDir) {
  for (const relativePath of SOURCE_CONFIG_SCHEMA_CANDIDATES) {
    const candidate = _nodePath.default.join(pluginDir, relativePath);
    if (_nodeFs.default.existsSync(candidate)) return candidate;
  }
  for (const basename of PUBLIC_CONFIG_SURFACE_BASENAMES) for (const extension of _publicSurfaceRuntimeHv340Ieq.t) {
    const candidate = _nodePath.default.join(pluginDir, `${basename}${extension}`);
    if (_nodeFs.default.existsSync(candidate)) return candidate;
  }
}
function loadChannelConfigSurfaceModuleSync(modulePath) {
  try {
    return resolveConfigSchemaExport(getModuleLoader(modulePath)(modulePath));
  } catch {
    return null;
  }
}
function resolvePackageChannelMeta(packageManifest, channelId) {
  const channelMeta = packageManifest?.channel;
  return channelMeta?.id?.trim() === channelId ? channelMeta : void 0;
}
function collectBundledChannelConfigs(params) {
  const channelIds = normalizeBundledPluginStringList(params.manifest.channels);
  const existingChannelConfigs = params.manifest.channelConfigs && Object.keys(params.manifest.channelConfigs).length > 0 ? { ...params.manifest.channelConfigs } : {};
  if (channelIds.length === 0) return Object.keys(existingChannelConfigs).length > 0 ? existingChannelConfigs : void 0;
  const surfaceModulePath = resolveChannelConfigSchemaModulePath(params.pluginDir);
  const surface = surfaceModulePath ? loadChannelConfigSurfaceModuleSync(surfaceModulePath) : null;
  for (const channelId of channelIds) {
    const existing = existingChannelConfigs[channelId];
    const channelMeta = resolvePackageChannelMeta(params.packageManifest, channelId);
    const preferOver = normalizeBundledPluginStringList(channelMeta?.preferOver);
    const uiHints = surface?.uiHints || existing?.uiHints ? {
      ...(surface?.uiHints && Object.keys(surface.uiHints).length > 0 ? surface.uiHints : {}),
      ...(existing?.uiHints && Object.keys(existing.uiHints).length > 0 ? existing.uiHints : {})
    } : void 0;
    if (!surface?.schema && !existing?.schema) continue;
    existingChannelConfigs[channelId] = {
      schema: surface?.schema ?? existing?.schema ?? {},
      ...(uiHints && Object.keys(uiHints).length > 0 ? { uiHints } : {}),
      ...(surface?.runtime ?? existing?.runtime ? { runtime: surface?.runtime ?? existing?.runtime } : {}),
      ...((0, _stringCoerceLndEvhRk.c)(existing?.label) ?? (0, _stringCoerceLndEvhRk.c)(channelMeta?.label) ? { label: (0, _stringCoerceLndEvhRk.c)(existing?.label) ?? (0, _stringCoerceLndEvhRk.c)(channelMeta?.label) } : {}),
      ...((0, _stringCoerceLndEvhRk.c)(existing?.description) ?? (0, _stringCoerceLndEvhRk.c)(channelMeta?.blurb) ? { description: (0, _stringCoerceLndEvhRk.c)(existing?.description) ?? (0, _stringCoerceLndEvhRk.c)(channelMeta?.blurb) } : {}),
      ...(existing?.preferOver?.length ? { preferOver: existing.preferOver } : preferOver.length > 0 ? { preferOver } : {}),
      ...(existing?.commands ?? channelMeta?.commands ? { commands: existing?.commands ?? channelMeta?.commands } : {})
    };
  }
  return Object.keys(existingChannelConfigs).length > 0 ? existingChannelConfigs : void 0;
}
//#endregion
//#region src/plugins/bundled-plugin-metadata.ts
const OPENCLAW_PACKAGE_ROOT = (0, _sdkAliasBOEr.l)({
  modulePath: (0, _nodeUrl.fileURLToPath)("file:///Users/thinkway/.nvm/versions/node/v24.14.0/lib/node_modules/openclaw/dist/bundled-plugin-metadata-BAyqhztz.js"),
  moduleUrl: "file:///Users/thinkway/.nvm/versions/node/v24.14.0/lib/node_modules/openclaw/dist/bundled-plugin-metadata-BAyqhztz.js"
}) ?? (0, _nodeUrl.fileURLToPath)(new URL("../..", "file:///Users/thinkway/.nvm/versions/node/v24.14.0/lib/node_modules/openclaw/dist/bundled-plugin-metadata-BAyqhztz.js"));
const CURRENT_MODULE_PATH = (0, _nodeUrl.fileURLToPath)("file:///Users/thinkway/.nvm/versions/node/v24.14.0/lib/node_modules/openclaw/dist/bundled-plugin-metadata-BAyqhztz.js");
const RUNNING_FROM_BUILT_ARTIFACT = CURRENT_MODULE_PATH.includes(`${_nodePath.default.sep}dist${_nodePath.default.sep}`) || CURRENT_MODULE_PATH.includes(`${_nodePath.default.sep}dist-runtime${_nodePath.default.sep}`);
function readPackageManifest(pluginDir) {
  return (0, _jsonFiles1SmAauRO.u)(_nodePath.default.join(pluginDir, "package.json")) ?? void 0;
}
function resolveBundledPluginMetadataScanDir(packageRoot, scanDir) {
  if (scanDir) return _nodePath.default.resolve(scanDir);
  return resolveBundledPluginScanDir({
    packageRoot,
    runningFromBuiltArtifact: RUNNING_FROM_BUILT_ARTIFACT
  });
}
function resolveBundledPluginLookupParams(params) {
  return params.scanDir ? params : { rootDir: params.rootDir };
}
function collectBundledPluginMetadata(resolvedScanDir, includeChannelConfigs, includeSyntheticChannelConfigs) {
  if (!resolvedScanDir || !_nodeFs.default.existsSync(resolvedScanDir)) return [];
  const entries = [];
  for (const dirName of _nodeFs.default.readdirSync(resolvedScanDir, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name).toSorted((left, right) => left.localeCompare(right))) {
    const pluginDir = _nodePath.default.join(resolvedScanDir, dirName);
    const manifestResult = (0, _manifestCkPySoxh.i)(pluginDir, false);
    if (!manifestResult.ok) continue;
    const packageJson = readPackageManifest(pluginDir);
    const packageManifest = (0, _manifestCkPySoxh.r)(packageJson);
    const extensions = normalizeBundledPluginStringList(packageManifest?.extensions);
    if (extensions.length === 0) continue;
    const sourceEntry = (0, _stringCoerceLndEvhRk.c)(extensions[0]);
    const builtEntry = rewriteBundledPluginEntryToBuiltPath(sourceEntry);
    if (!sourceEntry || !builtEntry) continue;
    const setupSourcePath = (0, _stringCoerceLndEvhRk.c)(packageManifest?.setupEntry);
    const setupSource = setupSourcePath && rewriteBundledPluginEntryToBuiltPath(setupSourcePath) ? {
      source: setupSourcePath,
      built: rewriteBundledPluginEntryToBuiltPath(setupSourcePath)
    } : void 0;
    const publicSurfaceArtifacts = collectBundledPluginPublicSurfaceArtifacts({
      pluginDir,
      sourceEntry,
      ...(setupSourcePath ? { setupEntry: setupSourcePath } : {})
    });
    const runtimeSidecarArtifacts = collectBundledPluginRuntimeSidecarArtifacts(publicSurfaceArtifacts);
    const channelConfigs = includeChannelConfigs && includeSyntheticChannelConfigs ? collectBundledChannelConfigs({
      pluginDir,
      manifest: manifestResult.manifest,
      packageManifest
    }) : manifestResult.manifest.channelConfigs;
    entries.push({
      dirName,
      idHint: deriveBundledPluginIdHint({
        entryPath: sourceEntry,
        manifestId: manifestResult.manifest.id,
        packageName: (0, _stringCoerceLndEvhRk.c)(packageJson?.name),
        hasMultipleExtensions: extensions.length > 1
      }),
      source: {
        source: sourceEntry,
        built: builtEntry
      },
      ...(setupSource ? { setupSource } : {}),
      ...(publicSurfaceArtifacts ? { publicSurfaceArtifacts } : {}),
      ...(runtimeSidecarArtifacts ? { runtimeSidecarArtifacts } : {}),
      ...((0, _stringCoerceLndEvhRk.c)(packageJson?.name) ? { packageName: (0, _stringCoerceLndEvhRk.c)(packageJson?.name) } : {}),
      ...((0, _stringCoerceLndEvhRk.c)(packageJson?.version) ? { packageVersion: (0, _stringCoerceLndEvhRk.c)(packageJson?.version) } : {}),
      ...((0, _stringCoerceLndEvhRk.c)(packageJson?.description) ? { packageDescription: (0, _stringCoerceLndEvhRk.c)(packageJson?.description) } : {}),
      ...(packageManifest ? { packageManifest } : {}),
      manifest: {
        ...manifestResult.manifest,
        ...(channelConfigs ? { channelConfigs } : {})
      }
    });
  }
  return entries;
}
function listBundledPluginMetadata(params) {
  const resolvedScanDir = resolveBundledPluginMetadataScanDir(_nodePath.default.resolve(params?.rootDir ?? OPENCLAW_PACKAGE_ROOT), params?.scanDir ? _nodePath.default.resolve(params.scanDir) : void 0);
  const includeChannelConfigs = params?.includeChannelConfigs ?? !RUNNING_FROM_BUILT_ARTIFACT;
  const includeSyntheticChannelConfigs = params?.includeSyntheticChannelConfigs ?? includeChannelConfigs;
  return Object.freeze(collectBundledPluginMetadata(resolvedScanDir, includeChannelConfigs, includeSyntheticChannelConfigs));
}
function findBundledPluginMetadataById(pluginId, params) {
  return listBundledPluginMetadata(params).find((entry) => entry.manifest.id === pluginId);
}
function listBundledPluginEntryBaseDirs(params) {
  return [
  ...(params.scanDir ? [_nodePath.default.resolve(params.scanDir, params.pluginDirName ?? "")] : []),
  _nodePath.default.resolve(params.rootDir, "dist", "extensions", params.pluginDirName ?? ""),
  _nodePath.default.resolve(params.rootDir, "dist-runtime", "extensions", params.pluginDirName ?? ""),
  _nodePath.default.resolve(params.rootDir, "extensions", params.pluginDirName ?? "")].
  filter((entry, index, all) => all.indexOf(entry) === index);
}
function resolveBundledPluginGeneratedPath(rootDir, entry, pluginDirName, scanDir) {
  if (!entry) return null;
  const entryOrder = [entry.built, entry.source].filter((candidate) => typeof candidate === "string" && candidate.length > 0);
  const baseDirs = listBundledPluginEntryBaseDirs({
    rootDir,
    pluginDirName,
    ...(scanDir ? { scanDir } : {})
  });
  for (const baseDir of baseDirs) for (const entryPath of entryOrder) {
    const candidate = resolveBundledPluginEntryCandidate(baseDir, entryPath);
    if (!candidate) continue;
    if (_nodeFs.default.existsSync(candidate)) return candidate;
  }
  return null;
}
function normalizeRelativePluginEntryPath(entryPath) {
  return entryPath.replace(/^\.\//u, "");
}
function resolveBundledPluginEntryCandidate(baseDir, entryPath) {
  const normalizedEntryPath = normalizeRelativePluginEntryPath(entryPath);
  const candidate = _nodePath.default.isAbsolute(normalizedEntryPath) ? _nodePath.default.normalize(normalizedEntryPath) : _nodePath.default.resolve(baseDir, normalizedEntryPath);
  const relative = _nodePath.default.relative(baseDir, candidate);
  if (relative === ".." || relative.startsWith(`..${_nodePath.default.sep}`) || _nodePath.default.isAbsolute(relative)) return null;
  return candidate;
}
function resolveBundledPluginRepoEntryPath(params) {
  const metadata = findBundledPluginMetadataById(params.pluginId, {
    ...resolveBundledPluginLookupParams({
      rootDir: params.rootDir,
      scanDir: params.scanDir
    }),
    includeChannelConfigs: false,
    includeSyntheticChannelConfigs: false
  });
  if (!metadata) return null;
  const entryOrder = params.preferBuilt ? [metadata.source.built, metadata.source.source] : [metadata.source.source, metadata.source.built];
  const baseDirs = listBundledPluginEntryBaseDirs({
    rootDir: params.rootDir,
    pluginDirName: metadata.dirName,
    ...(params.scanDir ? { scanDir: params.scanDir } : {})
  });
  for (const baseDir of baseDirs) for (const entryPath of entryOrder) {
    const candidate = resolveBundledPluginEntryCandidate(baseDir, entryPath);
    if (!candidate) continue;
    if (_nodeFs.default.existsSync(candidate)) return candidate;
  }
  return null;
}
//#endregion /* v9-eeae9747da52e62e */
