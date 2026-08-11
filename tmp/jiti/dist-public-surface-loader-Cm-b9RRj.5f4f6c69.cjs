"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.t = loadBundledPluginPublicArtifactModuleSync;var _fileIdentityPAmF0zvV = require("./file-identity-PAmF0zvV.js");
var _rootFileCqMcFM3J = require("./root-file-CqMcFM3J.js");
require("./boundary-file-read-wgc2vgUM.js");
var _bundledDirBocaljIz = require("./bundled-dir-BocaljIz.js");
var _pluginModuleLoaderCacheAuBzBauz = require("./plugin-module-loader-cache-AuBzBauz.js");
var _sdkAliasBOEr = require("./sdk-alias-BOEr7503.js");
require("./fs-safe-advanced-jUnIgHPM.js");
var _publicSurfaceRuntimeHv340Ieq = require("./public-surface-runtime-Hv340Ieq.js");
var _nodeModule = require("node:module");
var _nodeUrl = require("node:url");
var _nodeFs = _interopRequireDefault(require("node:fs"));
var _nodePath = _interopRequireDefault(require("node:path"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}
//#region src/plugins/public-surface-loader.ts
const OPENCLAW_PACKAGE_ROOT = (0, _sdkAliasBOEr.l)({
  modulePath: (0, _nodeUrl.fileURLToPath)("file:///Users/thinkway/.nvm/versions/node/v24.14.0/lib/node_modules/openclaw/dist/public-surface-loader-Cm-b9RRj.js"),
  moduleUrl: "file:///Users/thinkway/.nvm/versions/node/v24.14.0/lib/node_modules/openclaw/dist/public-surface-loader-Cm-b9RRj.js"
}) ?? (0, _nodeUrl.fileURLToPath)(new URL("../..", "file:///Users/thinkway/.nvm/versions/node/v24.14.0/lib/node_modules/openclaw/dist/public-surface-loader-Cm-b9RRj.js"));
const publicSurfaceModuleCache = /* @__PURE__ */new Map();
const sourceArtifactRequire = (0, _nodeModule.createRequire)("file:///Users/thinkway/.nvm/versions/node/v24.14.0/lib/node_modules/openclaw/dist/public-surface-loader-Cm-b9RRj.js");
const publicSurfaceLocationCache = /* @__PURE__ */new Map();
const moduleLoaders = (0, _pluginModuleLoaderCacheAuBzBauz.t)();
function isSourceArtifactPath(modulePath) {
  switch (_nodePath.default.extname(modulePath).toLowerCase()) {
    case ".ts":
    case ".tsx":
    case ".mts":
    case ".cts":
    case ".mtsx":
    case ".ctsx":return true;
    default:return false;
  }
}
function canUseSourceArtifactRequire(params) {
  return !params.tryNative && isSourceArtifactPath(params.modulePath) && typeof sourceArtifactRequire.extensions?.[".ts"] === "function";
}
function createResolutionKey(params) {
  const bundledPluginsDir = (0, _bundledDirBocaljIz.n)();
  return `${params.dirName}::${params.artifactBasename}::${bundledPluginsDir ? _nodePath.default.resolve(bundledPluginsDir) : "<default>"}`;
}
function resolvePublicSurfaceLocationUncached(params) {
  const bundledPluginsDir = (0, _bundledDirBocaljIz.n)();
  const modulePath = (0, _publicSurfaceRuntimeHv340Ieq.i)({
    rootDir: OPENCLAW_PACKAGE_ROOT,
    ...(bundledPluginsDir ? { bundledPluginsDir } : {}),
    dirName: params.dirName,
    artifactBasename: params.artifactBasename
  });
  if (!modulePath) return null;
  return {
    modulePath,
    boundaryRoot: bundledPluginsDir && modulePath.startsWith(_nodePath.default.resolve(bundledPluginsDir) + _nodePath.default.sep) ? _nodePath.default.resolve(bundledPluginsDir) : OPENCLAW_PACKAGE_ROOT
  };
}
function resolvePublicSurfaceLocation(params) {
  const key = createResolutionKey(params);
  const cached = publicSurfaceLocationCache.get(key);
  if (cached) return cached;
  const resolved = resolvePublicSurfaceLocationUncached(params);
  if (resolved) publicSurfaceLocationCache.set(key, resolved);
  return resolved;
}
function getModuleLoader(modulePath) {
  return (0, _pluginModuleLoaderCacheAuBzBauz.n)({
    cache: moduleLoaders,
    modulePath,
    importerUrl: "file:///Users/thinkway/.nvm/versions/node/v24.14.0/lib/node_modules/openclaw/dist/public-surface-loader-Cm-b9RRj.js",
    preferBuiltDist: true,
    loaderFilename: "file:///Users/thinkway/.nvm/versions/node/v24.14.0/lib/node_modules/openclaw/dist/public-surface-loader-Cm-b9RRj.js"
  });
}
function loadPublicSurfaceModule(modulePath) {
  if (canUseSourceArtifactRequire({
    modulePath,
    tryNative: (0, _sdkAliasBOEr.d)(modulePath, { preferBuiltDist: true })
  })) return sourceArtifactRequire(modulePath);
  return getModuleLoader(modulePath)(modulePath);
}
function loadBundledPluginPublicArtifactModuleSync(params) {
  const location = resolvePublicSurfaceLocation(params);
  if (!location) throw new Error(`Unable to resolve bundled plugin public surface ${params.dirName}/${params.artifactBasename}`);
  const cached = publicSurfaceModuleCache.get(location.modulePath);
  if (cached) return cached;
  const opened = (0, _rootFileCqMcFM3J.i)({
    absolutePath: location.modulePath,
    rootPath: location.boundaryRoot,
    boundaryLabel: location.boundaryRoot === OPENCLAW_PACKAGE_ROOT ? "OpenClaw package root" : "plugin root",
    rejectHardlinks: false
  });
  if (!opened.ok) throw new Error(`Unable to open bundled plugin public surface ${params.dirName}/${params.artifactBasename}`, { cause: opened.error });
  const validatedPath = opened.path;
  const validatedStat = opened.stat;
  _nodeFs.default.closeSync(opened.fd);
  if (!(0, _fileIdentityPAmF0zvV.t)(validatedStat, _nodeFs.default.statSync(validatedPath))) throw new Error(`Bundled plugin public surface changed after validation: ${params.dirName}/${params.artifactBasename}`);
  const sentinel = {};
  publicSurfaceModuleCache.set(location.modulePath, sentinel);
  publicSurfaceModuleCache.set(validatedPath, sentinel);
  try {
    const loaded = loadPublicSurfaceModule(validatedPath);
    Object.assign(sentinel, loaded);
    return sentinel;
  } catch (error) {
    publicSurfaceModuleCache.delete(location.modulePath);
    publicSurfaceModuleCache.delete(validatedPath);
    throw error;
  }
}
//#endregion /* v9-328745181e3b494d */
