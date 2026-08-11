"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.t = loadBundledPluginPublicArtifactModuleSync;var _fileIdentityOkAKtUrG = require("./file-identity-OkAKtUrG.js");
var _boundaryFileRead6rU9DotD = require("./boundary-file-read-6rU9DotD.js");
var _bundledDirBdVWKJP = require("./bundled-dir-BdVWKJP0.js");
var _publicSurfaceRuntimeB17q9P0p = require("./public-surface-runtime-B17q9P0p.js");
var _bundledPluginMetadataVxOxTVqO = require("./bundled-plugin-metadata-VxOxTVqO.js");
var _sdkAliasDIhpBBl = require("./sdk-alias-DIhpBBl1.js");
var _bundledPublicSurfaceRuntimeRootCYsvLGbQ = require("./bundled-public-surface-runtime-root-CYsvLGbQ.js");
var _nodeModule = require("node:module");
var _nodeUrl = require("node:url");
var _nodeFs = _interopRequireDefault(require("node:fs"));
var _nodePath = _interopRequireDefault(require("node:path"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}
//#region src/plugins/public-surface-loader.ts
const OPENCLAW_PACKAGE_ROOT = (0, _sdkAliasDIhpBBl.l)({
  modulePath: (0, _nodeUrl.fileURLToPath)("file:///Users/thinkway/.openclaw/plugin-runtime-deps/openclaw-2026.4.27-ee15c164b378/dist/public-surface-loader-Dy6S3uW_.js"),
  moduleUrl: "file:///Users/thinkway/.openclaw/plugin-runtime-deps/openclaw-2026.4.27-ee15c164b378/dist/public-surface-loader-Dy6S3uW_.js"
}) ?? (0, _nodeUrl.fileURLToPath)(new URL("../..", "file:///Users/thinkway/.openclaw/plugin-runtime-deps/openclaw-2026.4.27-ee15c164b378/dist/public-surface-loader-Dy6S3uW_.js"));
const loadedPublicSurfaceModules = /* @__PURE__ */new Map();
const sourceArtifactRequire = (0, _nodeModule.createRequire)("file:///Users/thinkway/.openclaw/plugin-runtime-deps/openclaw-2026.4.27-ee15c164b378/dist/public-surface-loader-Dy6S3uW_.js");
const publicSurfaceLocations = /* @__PURE__ */new Map();
const jitiLoaders = /* @__PURE__ */new Map();
const sharedBundledPublicSurfaceJitiLoaders = /* @__PURE__ */new Map();
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
  const bundledPluginsDir = (0, _bundledDirBdVWKJP.n)();
  return `${params.dirName}::${params.artifactBasename}::${bundledPluginsDir ? _nodePath.default.resolve(bundledPluginsDir) : "<default>"}`;
}
function resolvePublicSurfaceLocationUncached(params) {
  const bundledPluginsDir = (0, _bundledDirBdVWKJP.n)();
  const modulePath = (0, _publicSurfaceRuntimeB17q9P0p.i)({
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
  if (publicSurfaceLocations.has(key)) return publicSurfaceLocations.get(key) ?? null;
  const resolved = resolvePublicSurfaceLocationUncached(params);
  publicSurfaceLocations.set(key, resolved);
  return resolved;
}
function getJiti(modulePath) {
  const sharedLoader = getSharedBundledPublicSurfaceJiti(modulePath, (0, _sdkAliasDIhpBBl.d)(modulePath, { preferBuiltDist: true }));
  if (sharedLoader) return sharedLoader;
  return (0, _bundledPluginMetadataVxOxTVqO.o)({
    cache: jitiLoaders,
    modulePath,
    importerUrl: "file:///Users/thinkway/.openclaw/plugin-runtime-deps/openclaw-2026.4.27-ee15c164b378/dist/public-surface-loader-Dy6S3uW_.js",
    preferBuiltDist: true,
    jitiFilename: "file:///Users/thinkway/.openclaw/plugin-runtime-deps/openclaw-2026.4.27-ee15c164b378/dist/public-surface-loader-Dy6S3uW_.js"
  });
}
function loadPublicSurfaceModule(modulePath) {
  if (canUseSourceArtifactRequire({
    modulePath,
    tryNative: (0, _sdkAliasDIhpBBl.d)(modulePath, { preferBuiltDist: true })
  })) return sourceArtifactRequire(modulePath);
  return getJiti(modulePath)(modulePath);
}
function getSharedBundledPublicSurfaceJiti(modulePath, tryNative) {
  const bundledPluginsDir = (0, _bundledDirBdVWKJP.n)();
  if (!(0, _sdkAliasDIhpBBl.i)({
    modulePath,
    openClawPackageRoot: OPENCLAW_PACKAGE_ROOT,
    ...(bundledPluginsDir ? { bundledPluginsDir } : {})
  })) return null;
  const cacheKey = tryNative ? "bundled:native" : "bundled:source";
  return (0, _bundledPluginMetadataVxOxTVqO.o)({
    cache: sharedBundledPublicSurfaceJitiLoaders,
    modulePath,
    importerUrl: "file:///Users/thinkway/.openclaw/plugin-runtime-deps/openclaw-2026.4.27-ee15c164b378/dist/public-surface-loader-Dy6S3uW_.js",
    jitiFilename: "file:///Users/thinkway/.openclaw/plugin-runtime-deps/openclaw-2026.4.27-ee15c164b378/dist/public-surface-loader-Dy6S3uW_.js",
    cacheScopeKey: cacheKey,
    tryNative
  });
}
function loadBundledPluginPublicArtifactModuleSync(params) {
  const location = resolvePublicSurfaceLocation(params);
  if (!location) throw new Error(`Unable to resolve bundled plugin public surface ${params.dirName}/${params.artifactBasename}`);
  const preparedLocation = (0, _bundledPublicSurfaceRuntimeRootCYsvLGbQ.t)({
    location,
    pluginId: params.dirName,
    installRuntimeDeps: params.installRuntimeDeps
  });
  const cached = loadedPublicSurfaceModules.get(location.modulePath) ?? loadedPublicSurfaceModules.get(preparedLocation.modulePath);
  if (cached) return cached;
  const opened = (0, _boundaryFileRead6rU9DotD.i)({
    absolutePath: preparedLocation.modulePath,
    rootPath: preparedLocation.boundaryRoot,
    boundaryLabel: preparedLocation.boundaryRoot === OPENCLAW_PACKAGE_ROOT ? "OpenClaw package root" : "plugin root",
    rejectHardlinks: true
  });
  if (!opened.ok) throw new Error(`Unable to open bundled plugin public surface ${params.dirName}/${params.artifactBasename}`, { cause: opened.error });
  const validatedPath = opened.path;
  const validatedStat = opened.stat;
  _nodeFs.default.closeSync(opened.fd);
  if (!(0, _fileIdentityOkAKtUrG.t)(validatedStat, _nodeFs.default.statSync(validatedPath))) throw new Error(`Bundled plugin public surface changed after validation: ${params.dirName}/${params.artifactBasename}`);
  const sentinel = {};
  loadedPublicSurfaceModules.set(location.modulePath, sentinel);
  loadedPublicSurfaceModules.set(preparedLocation.modulePath, sentinel);
  loadedPublicSurfaceModules.set(validatedPath, sentinel);
  try {
    const loaded = loadPublicSurfaceModule(validatedPath);
    Object.assign(sentinel, loaded);
    return sentinel;
  } catch (error) {
    loadedPublicSurfaceModules.delete(location.modulePath);
    loadedPublicSurfaceModules.delete(preparedLocation.modulePath);
    loadedPublicSurfaceModules.delete(validatedPath);
    throw error;
  }
}
//#endregion /* v9-b27b01af47e088ca */
