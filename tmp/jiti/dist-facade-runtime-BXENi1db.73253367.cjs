"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = tryLoadActivatedBundledPluginPublicSurfaceModuleSync;exports.i = resetFacadeRuntimeStateForTest;exports.n = loadActivatedBundledPluginPublicSurfaceModuleSync;exports.r = loadBundledPluginPublicSurfaceModuleSync;exports.t = createLazyFacadeValue;var _bundledDirBocaljIz = require("./bundled-dir-BocaljIz.js");
var _pluginModuleLoaderCacheCXUDv7JF = require("./plugin-module-loader-cache-CXUDv7JF.js");
var _sdkAliasBOEr = require("./sdk-alias-BOEr7503.js");
var _facadeResolutionSharedD3nWjvEl = require("./facade-resolution-shared-D3nWjvEl.js");
var _facadeLoaderB2pO9JJA = require("./facade-loader-B2pO9JJA.js");
var _nodeModule = require("node:module");
var _nodeUrl = require("node:url");
var _nodePath = _interopRequireDefault(require("node:path"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}
//#region src/plugin-sdk/facade-runtime.ts
function createLazyFacadeValue(loadFacadeModule, key) {
  return (...args) => {
    const value = loadFacadeModule()[key];
    if (typeof value !== "function") return value;
    return value(...args);
  };
}
const OPENCLAW_PACKAGE_ROOT = (0, _sdkAliasBOEr.l)({
  modulePath: (0, _nodeUrl.fileURLToPath)("file:///Users/thinkway/.nvm/versions/node/v24.14.0/lib/node_modules/openclaw/dist/facade-runtime-BXENi1db.js"),
  moduleUrl: "file:///Users/thinkway/.nvm/versions/node/v24.14.0/lib/node_modules/openclaw/dist/facade-runtime-BXENi1db.js"
}) ?? (0, _nodeUrl.fileURLToPath)(new URL("../..", "file:///Users/thinkway/.nvm/versions/node/v24.14.0/lib/node_modules/openclaw/dist/facade-runtime-BXENi1db.js"));
const CURRENT_MODULE_PATH = (0, _nodeUrl.fileURLToPath)("file:///Users/thinkway/.nvm/versions/node/v24.14.0/lib/node_modules/openclaw/dist/facade-runtime-BXENi1db.js");
const OPENCLAW_SOURCE_EXTENSIONS_ROOT = _nodePath.default.resolve(OPENCLAW_PACKAGE_ROOT, "extensions");
function createFacadeResolutionKey(params) {
  const bundledPluginsDir = (0, _bundledDirBocaljIz.n)(params.env ?? process.env);
  return (0, _facadeResolutionSharedD3nWjvEl.t)({
    ...params,
    bundledPluginsDir,
    ...(params.env ? { env: params.env } : {})
  });
}
function resolveRegistryPluginModuleLocation(params) {
  return loadFacadeActivationCheckRuntime().resolveRegistryPluginModuleLocation({
    ...params,
    resolutionKey: createFacadeResolutionKey(params)
  });
}
function resolveFacadeModuleLocationUncached(params) {
  const env = params.env ?? process.env;
  if (!(0, _bundledDirBocaljIz.t)(env)) {
    const bundledPluginsDir = (0, _bundledDirBocaljIz.n)(env);
    const bundledLocation = (0, _facadeResolutionSharedD3nWjvEl.n)({
      ...params,
      currentModulePath: CURRENT_MODULE_PATH,
      packageRoot: OPENCLAW_PACKAGE_ROOT,
      bundledPluginsDir
    });
    if (bundledLocation) return bundledLocation;
  }
  return resolveRegistryPluginModuleLocation(params);
}
function resolveFacadeModuleLocation(params) {
  return resolveFacadeModuleLocationUncached(params);
}
const nodeRequire = (0, _nodeModule.createRequire)("file:///Users/thinkway/.nvm/versions/node/v24.14.0/lib/node_modules/openclaw/dist/facade-runtime-BXENi1db.js");
const FACADE_ACTIVATION_CHECK_RUNTIME_CANDIDATES = ["./facade-activation-check.runtime.js", "./facade-activation-check.runtime.ts"];
let facadeActivationCheckRuntimeModule;
const facadeActivationCheckRuntimeLoaders = /* @__PURE__ */new Map();
function getFacadeActivationCheckRuntimeSourceLoader(modulePath) {
  return (0, _pluginModuleLoaderCacheCXUDv7JF.r)({
    cache: facadeActivationCheckRuntimeLoaders,
    modulePath,
    importerUrl: "file:///Users/thinkway/.nvm/versions/node/v24.14.0/lib/node_modules/openclaw/dist/facade-runtime-BXENi1db.js",
    loaderFilename: "file:///Users/thinkway/.nvm/versions/node/v24.14.0/lib/node_modules/openclaw/dist/facade-runtime-BXENi1db.js",
    aliasMap: {}
  });
}
function loadFacadeActivationCheckRuntimeFromCandidates(loadCandidate) {
  for (const candidate of FACADE_ACTIVATION_CHECK_RUNTIME_CANDIDATES) try {
    return loadCandidate(candidate);
  } catch {}
}
function loadFacadeActivationCheckRuntime() {
  if (facadeActivationCheckRuntimeModule) return facadeActivationCheckRuntimeModule;
  facadeActivationCheckRuntimeModule = loadFacadeActivationCheckRuntimeFromCandidates((candidate) => nodeRequire(candidate));
  if (facadeActivationCheckRuntimeModule) return facadeActivationCheckRuntimeModule;
  facadeActivationCheckRuntimeModule = loadFacadeActivationCheckRuntimeFromCandidates((candidate) => getFacadeActivationCheckRuntimeSourceLoader(candidate)(candidate));
  if (facadeActivationCheckRuntimeModule) return facadeActivationCheckRuntimeModule;
  throw new Error("Unable to load facade activation check runtime");
}
function loadFacadeModuleAtLocationSync(params) {
  return (0, _facadeLoaderB2pO9JJA.i)(params);
}
function buildFacadeActivationCheckParams(params, location = resolveFacadeModuleLocation(params)) {
  return {
    ...params,
    location,
    sourceExtensionsRoot: OPENCLAW_SOURCE_EXTENSIONS_ROOT,
    resolutionKey: createFacadeResolutionKey(params)
  };
}
function loadBundledPluginPublicSurfaceModuleSync(params) {
  const location = resolveFacadeModuleLocation(params);
  const trackedPluginId = () => loadFacadeActivationCheckRuntime().resolveTrackedFacadePluginId(buildFacadeActivationCheckParams(params, location));
  if (!location) return (0, _facadeLoaderB2pO9JJA.r)({
    ...params,
    trackedPluginId
  });
  return loadFacadeModuleAtLocationSync({
    location,
    trackedPluginId,
    runtimeDeps: {
      pluginId: params.dirName,
      ...(params.env ? { env: params.env } : {})
    }
  });
}
function loadActivatedBundledPluginPublicSurfaceModuleSync(params) {
  loadFacadeActivationCheckRuntime().resolveActivatedBundledPluginPublicSurfaceAccessOrThrow(buildFacadeActivationCheckParams(params));
  return loadBundledPluginPublicSurfaceModuleSync(params);
}
function tryLoadActivatedBundledPluginPublicSurfaceModuleSync(params) {
  if (!loadFacadeActivationCheckRuntime().resolveBundledPluginPublicSurfaceAccess(buildFacadeActivationCheckParams(params)).allowed) return null;
  return loadBundledPluginPublicSurfaceModuleSync(params);
}
function resetFacadeRuntimeStateForTest() {
  (0, _facadeLoaderB2pO9JJA.a)();
  facadeActivationCheckRuntimeModule = void 0;
  facadeActivationCheckRuntimeLoaders.clear();
}
//#endregion /* v9-9148c82fb20190c7 */
