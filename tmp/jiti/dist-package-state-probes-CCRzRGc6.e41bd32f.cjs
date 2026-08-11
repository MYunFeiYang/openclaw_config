"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = listBundledChannelIdsForPackageState;exports.t = hasBundledChannelPackageState;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
var _errorsIxwfrboQ = require("./errors-ixwfrboQ.js");
var _discoveryBNk7kgJV = require("./discovery-BNk7kgJV.js");
var _pluginModuleLoaderCacheCXUDv7JF = require("./plugin-module-loader-cache-CXUDv7JF.js");
var _subsystemCH8Q21Y = require("./subsystem-C-H8Q21Y.js");
var _channelCatalogRegistryBDlELhOw = require("./channel-catalog-registry-BDlELhOw.js");
var _bundledCGlg0Y2W = require("./bundled-CGlg0Y2W.js");
var _nodeFs = _interopRequireDefault(require("node:fs"));
var _nodePath = _interopRequireDefault(require("node:path"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}
//#region src/channels/plugins/package-state-probes.ts
const log = (0, _subsystemCH8Q21Y.t)("channels");
const sourcePackageStateLoaderCache = /* @__PURE__ */new Map();
function isSourceModulePath(modulePath) {
  return /\.(?:c|m)?tsx?$/iu.test(modulePath);
}
function loadChannelPackageStateModule(params) {
  try {
    return (0, _bundledCGlg0Y2W.h)(params);
  } catch (error) {
    if (!isSourceModulePath(params.modulePath)) throw error;
    return (0, _pluginModuleLoaderCacheCXUDv7JF.n)({
      cache: sourcePackageStateLoaderCache,
      modulePath: params.modulePath,
      importerUrl: "file:///Users/thinkway/.nvm/versions/node/v24.14.0/lib/node_modules/openclaw/dist/package-state-probes-CCRzRGc6.js",
      tryNative: true,
      cacheScopeKey: "channel-package-state"
    })(params.modulePath);
  }
}
function normalizeStringList(value) {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => (0, _stringCoerceLndEvhRk.c)(entry)).filter((entry) => Boolean(entry));
}
function hasNonEmptyEnvValue(env, key) {
  return typeof env?.[key] === "string" && env[key].trim().length > 0;
}
function resolveSourceBundledPluginRoot(rootDir) {
  const pluginRoot = _nodePath.default.resolve(rootDir);
  const extensionsDir = _nodePath.default.dirname(pluginRoot);
  if (_nodePath.default.basename(extensionsDir) !== "extensions") return null;
  const packageRoot = _nodePath.default.dirname(extensionsDir);
  if (_nodePath.default.basename(packageRoot) === "dist" || _nodePath.default.basename(packageRoot) === "dist-runtime") return null;
  return {
    packageRoot,
    dirName: _nodePath.default.basename(pluginRoot)
  };
}
function isBundledSourceOverlayPluginRoot(rootDir) {
  const pluginRoot = _nodePath.default.resolve(rootDir);
  return (0, _discoveryBNk7kgJV.l)({ sourcePath: pluginRoot }) || _nodePath.default.basename(_nodePath.default.dirname(pluginRoot)) === "extensions" && (0, _discoveryBNk7kgJV.l)({ sourcePath: _nodePath.default.dirname(pluginRoot) });
}
function listBuiltBundledPackageStateModules(params) {
  if (isBundledSourceOverlayPluginRoot(params.rootDir)) return [];
  const sourceRoot = resolveSourceBundledPluginRoot(params.rootDir);
  if (!sourceRoot) return [];
  const locations = [];
  for (const rootDir of [_nodePath.default.join(sourceRoot.packageRoot, "dist", "extensions", sourceRoot.dirName), _nodePath.default.join(sourceRoot.packageRoot, "dist-runtime", "extensions", sourceRoot.dirName)]) {
    const modulePath = (0, _bundledCGlg0Y2W.g)(rootDir, params.specifier);
    if (_nodeFs.default.existsSync(modulePath) && !isSourceModulePath(modulePath)) locations.push({
      modulePath,
      rootDir
    });
  }
  return locations;
}
function resolveChannelPackageStateModuleLocation(params) {
  return {
    modulePath: (0, _bundledCGlg0Y2W.g)(params.entry.rootDir, params.specifier),
    rootDir: params.entry.rootDir
  };
}
function listChannelPackageStateModuleLocations(params) {
  const source = resolveChannelPackageStateModuleLocation(params);
  return [...listBuiltBundledPackageStateModules({
    rootDir: params.entry.rootDir,
    specifier: params.specifier
  }).filter((location) => location.modulePath !== source.modulePath), source];
}
function resolveChannelPackageStateMetadata(entry, metadataKey) {
  const metadata = entry.channel[metadataKey];
  if (!metadata || typeof metadata !== "object") return null;
  const specifier = (0, _stringCoerceLndEvhRk.c)(metadata.specifier) ?? "";
  const exportName = (0, _stringCoerceLndEvhRk.c)(metadata.exportName) ?? "";
  const envMetadata = "env" in metadata ? metadata.env : void 0;
  const allOf = normalizeStringList(envMetadata?.allOf);
  const anyOf = normalizeStringList(envMetadata?.anyOf);
  const env = allOf.length > 0 || anyOf.length > 0 ? {
    allOf,
    anyOf
  } : void 0;
  if ((!specifier || !exportName) && !env) return null;
  return {
    ...(specifier ? { specifier } : {}),
    ...(exportName ? { exportName } : {}),
    ...(env ? { env } : {})
  };
}
function listChannelPackageStateCatalog(metadataKey) {
  return (0, _channelCatalogRegistryBDlELhOw.t)({ origin: "bundled" }).filter((entry) => Boolean(resolveChannelPackageStateMetadata(entry, metadataKey)));
}
function resolveChannelPackageStateChecker(params) {
  const metadata = resolveChannelPackageStateMetadata(params.entry, params.metadataKey);
  if (!metadata) return null;
  if (metadata.env) return ({ env }) => {
    const allOf = metadata.env?.allOf ?? [];
    const anyOf = metadata.env?.anyOf ?? [];
    return allOf.every((key) => hasNonEmptyEnvValue(env, key)) && (anyOf.length === 0 || anyOf.some((key) => hasNonEmptyEnvValue(env, key)));
  };
  let loadError;
  for (const location of listChannelPackageStateModuleLocations({
    entry: params.entry,
    specifier: metadata.specifier
  })) try {
    const checker = loadChannelPackageStateModule({
      modulePath: location.modulePath,
      rootDir: location.rootDir
    })[metadata.exportName];
    if (typeof checker !== "function") throw new Error(`missing ${params.metadataKey} export ${metadata.exportName}`);
    return checker;
  } catch (error) {
    loadError = error;
  }
  if (loadError) {
    const detail = (0, _errorsIxwfrboQ.i)(loadError);
    log.warn(`[channels] failed to load ${params.metadataKey} checker for ${params.entry.pluginId}: ${detail}`);
  }
  return null;
}
function resolvePackageStateChannelId(entry) {
  return (0, _stringCoerceLndEvhRk.c)(entry.channel.id);
}
function listBundledChannelIdsForPackageState(metadataKey) {
  return listChannelPackageStateCatalog(metadataKey).map((entry) => resolvePackageStateChannelId(entry)).filter((channelId) => Boolean(channelId));
}
function hasBundledChannelPackageState(params) {
  const requestedChannelId = (0, _stringCoerceLndEvhRk.c)(params.channelId);
  const entry = listChannelPackageStateCatalog(params.metadataKey).find((candidate) => resolvePackageStateChannelId(candidate) === requestedChannelId);
  if (!entry) return false;
  const checker = resolveChannelPackageStateChecker({
    entry,
    metadataKey: params.metadataKey
  });
  return checker ? checker({
    cfg: params.cfg,
    env: params.env
  }) : false;
}
//#endregion /* v9-7bd3e12be6bc4fc8 */
