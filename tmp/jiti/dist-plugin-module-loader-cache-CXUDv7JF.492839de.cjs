"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = isJavaScriptModulePath;exports.i = getPluginModuleLoaderStats;exports.n = getCachedPluginModuleLoader;exports.o = tryNativeRequireJavaScriptModule;exports.r = getCachedPluginSourceModuleLoader;exports.s = toSafeImportPath;exports.t = createPluginModuleLoaderCache;var _pluginCachePrimitivesM9JN_JCw = require("./plugin-cache-primitives-M9JN_JCw.js");
var _sdkAliasBOEr = require("./sdk-alias-BOEr7503.js");
var _nodeModule = _interopRequireWildcard(require("node:module"));
var _nodeUrl = require("node:url");
var _nodeFs = _interopRequireDefault(require("node:fs"));
var _nodePath = _interopRequireDefault(require("node:path"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}function _interopRequireWildcard(e, t) {if ("function" == typeof WeakMap) var r = new WeakMap(),n = new WeakMap();return (_interopRequireWildcard = function (e, t) {if (!t && e && e.__esModule) return e;var o,i,f = { __proto__: null, default: e };if (null === e || "object" != typeof e && "function" != typeof e) return f;if (o = t ? n : r) {if (o.has(e)) return o.get(e);o.set(e, f);}for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]);return f;})(e, t);}
//#region src/shared/import-specifier.ts
/**
* On Windows, Node's ESM loader requires absolute paths to be expressed as
* file:// URLs. Raw drive-letter paths like C:\... are parsed as URL schemes.
*/
function toSafeImportPath(specifier) {
  if (process.platform !== "win32") return specifier;
  if (specifier.startsWith("file://")) return specifier;
  if (_nodePath.default.win32.isAbsolute(specifier)) return (0, _nodeUrl.pathToFileURL)(specifier, { windows: true }).href;
  return specifier;
}
//#endregion
//#region src/plugins/native-module-require.ts
const nodeRequire = (0, _nodeModule.createRequire)("file:///Users/thinkway/.nvm/versions/node/v24.14.0/lib/node_modules/openclaw/dist/plugin-module-loader-cache-CXUDv7JF.js");
const moduleWithResolver = _nodeModule.default;
function isJavaScriptModulePath(modulePath) {
  return [
  ".js",
  ".mjs",
  ".cjs"].
  includes(_nodePath.default.extname(modulePath).toLowerCase());
}
function isMissingTargetModuleError(error, modulePath) {
  if (error.code !== "MODULE_NOT_FOUND" || typeof error.message !== "string") return false;
  const firstLine = error.message.split("\n", 1)[0] ?? "";
  return firstLine.includes(`'${modulePath}'`) || firstLine.includes(`"${modulePath}"`);
}
function isSourceTransformFallbackError(error, modulePath) {
  if (!error || typeof error !== "object") return false;
  const candidate = error;
  const code = candidate.code;
  return code === "ERR_REQUIRE_ESM" || code === "ERR_REQUIRE_ASYNC_MODULE" || isMissingTargetModuleError(candidate, modulePath);
}
function tryNativeRequireJavaScriptModule(modulePath, options = {}) {
  if (process.platform === "win32" && options.allowWindows !== true) return { ok: false };
  if (!isJavaScriptModulePath(modulePath)) return { ok: false };
  try {
    return {
      ok: true,
      moduleExport: requireWithOptionalAliases(modulePath, options.aliasMap)
    };
  } catch (error) {
    const code = error && typeof error === "object" ? error.code : void 0;
    if (isSourceTransformFallbackError(error, modulePath) || options.fallbackOnNativeError || options.fallbackOnMissingDependency === true && (code === "MODULE_NOT_FOUND" || code === "ERR_MODULE_NOT_FOUND")) return { ok: false };
    throw error;
  }
}
function requireWithOptionalAliases(modulePath, aliasMap) {
  return withNativeRequireAliases(aliasMap, () => nodeRequire(modulePath));
}
function withNativeRequireAliases(aliasMap, run) {
  if (!aliasMap || Object.keys(aliasMap).length === 0 || !moduleWithResolver["_resolveFilename"]) return run();
  const originalResolveFilename = moduleWithResolver["_resolveFilename"];
  moduleWithResolver["_resolveFilename"] = (request, parent, isMain, options) => {
    const aliasTarget = aliasMap[request];
    if (aliasTarget) return aliasTarget;
    return originalResolveFilename(request, parent, isMain, options);
  };
  try {
    return run();
  } finally {
    moduleWithResolver["_resolveFilename"] = originalResolveFilename;
  }
}
//#endregion
//#region src/plugins/plugin-module-loader-cache.ts
const DEFAULT_PLUGIN_MODULE_LOADER_CACHE_ENTRIES = 128;
const MAX_TRACKED_SOURCE_TRANSFORM_TARGETS = 24;
const PLUGIN_SDK_IMPORT_SPECIFIER_PATTERN = /(?:\bfrom\s*["']|\bimport\s*\(\s*["']|\brequire\s*\(\s*["'])(?:openclaw|@openclaw)\/plugin-sdk(?:\/[^"']*)?["']/u;
const requireForJiti = (0, _nodeModule.createRequire)("file:///Users/thinkway/.nvm/versions/node/v24.14.0/lib/node_modules/openclaw/dist/plugin-module-loader-cache-CXUDv7JF.js");
let createJitiLoaderFactory;
const pluginModuleLoaderStats = {
  calls: 0,
  nativeHits: 0,
  nativeMisses: 0,
  sourceTransformForced: 0,
  sourceTransformFallbacks: 0,
  sourceTransformTargets: /* @__PURE__ */new Map()
};
function recordSourceTransformTarget(target) {
  const current = pluginModuleLoaderStats.sourceTransformTargets.get(target) ?? 0;
  pluginModuleLoaderStats.sourceTransformTargets.set(target, current + 1);
  if (pluginModuleLoaderStats.sourceTransformTargets.size <= MAX_TRACKED_SOURCE_TRANSFORM_TARGETS) return;
  let leastUsedTarget;
  let leastUsedCount = Number.POSITIVE_INFINITY;
  for (const [candidate, count] of pluginModuleLoaderStats.sourceTransformTargets) if (count < leastUsedCount) {
    leastUsedTarget = candidate;
    leastUsedCount = count;
  }
  if (leastUsedTarget) pluginModuleLoaderStats.sourceTransformTargets.delete(leastUsedTarget);
}
function getPluginModuleLoaderStats() {
  return {
    calls: pluginModuleLoaderStats.calls,
    nativeHits: pluginModuleLoaderStats.nativeHits,
    nativeMisses: pluginModuleLoaderStats.nativeMisses,
    sourceTransformForced: pluginModuleLoaderStats.sourceTransformForced,
    sourceTransformFallbacks: pluginModuleLoaderStats.sourceTransformFallbacks,
    topSourceTransformTargets: [...pluginModuleLoaderStats.sourceTransformTargets].toSorted((left, right) => right[1] - left[1] || left[0].localeCompare(right[0])).slice(0, 8).map(([target, count]) => ({
      target,
      count
    }))
  };
}
function loadCreateJitiLoaderFactory() {
  if (createJitiLoaderFactory) return createJitiLoaderFactory;
  const loaded = requireForJiti("jiti");
  if (typeof loaded.createJiti !== "function") throw new Error("jiti module did not export createJiti");
  createJitiLoaderFactory = loaded.createJiti;
  return createJitiLoaderFactory;
}
function createPluginModuleLoaderCache(maxEntries = DEFAULT_PLUGIN_MODULE_LOADER_CACHE_ENTRIES) {
  return new _pluginCachePrimitivesM9JN_JCw.t(maxEntries);
}
function toSourceTransformImportPath(specifier) {
  if (process.platform === "win32" && _nodePath.default.isAbsolute(specifier)) return (0, _nodeUrl.pathToFileURL)(specifier).href;
  return toSafeImportPath(specifier);
}
function resolveDefaultPluginModuleLoaderConfig(params) {
  return (0, _sdkAliasBOEr.u)({
    modulePath: params.modulePath,
    argv1: params.argvEntry ?? process.argv[1],
    moduleUrl: params.importerUrl,
    ...(params.preferBuiltDist ? { preferBuiltDist: true } : {}),
    ...(params.pluginSdkResolution ? { pluginSdkResolution: params.pluginSdkResolution } : {})
  });
}
function resolvePluginModuleLoaderCacheEntry(params) {
  const loaderFilename = toSafeImportPath(params.loaderFilename ?? params.modulePath);
  const hasAliasOverride = Boolean(params.aliasMap);
  const hasTryNativeOverride = typeof params.tryNative === "boolean";
  const defaultConfig = hasAliasOverride || hasTryNativeOverride ? resolveDefaultPluginModuleLoaderConfig(params) : null;
  const canReuseDefaultCacheKey = defaultConfig !== null && (!hasAliasOverride || params.aliasMap === defaultConfig.aliasMap) && (!hasTryNativeOverride || params.tryNative === defaultConfig.tryNative);
  const resolved = defaultConfig ? {
    tryNative: params.tryNative ?? defaultConfig.tryNative,
    aliasMap: params.aliasMap ?? defaultConfig.aliasMap,
    cacheKey: canReuseDefaultCacheKey ? defaultConfig.cacheKey : void 0
  } : resolveDefaultPluginModuleLoaderConfig(params);
  const { tryNative, aliasMap } = resolved;
  const cacheKey = resolved.cacheKey ?? (0, _sdkAliasBOEr.r)({
    tryNative,
    aliasMap
  });
  return {
    loaderFilename,
    aliasMap,
    tryNative,
    cacheKey,
    scopedCacheKey: `${loaderFilename}::${params.sharedCacheScopeKey ?? (params.cacheScopeKey ? `${params.cacheScopeKey}::${cacheKey}` : cacheKey)}`
  };
}
function createLazySourceTransformLoader(params) {
  let loadWithSourceTransform;
  return () => {
    if (loadWithSourceTransform) return loadWithSourceTransform;
    const jitiLoader = (params.createLoader ?? loadCreateJitiLoaderFactory())(params.loaderFilename, {
      ...(0, _sdkAliasBOEr.n)(params.aliasMap),
      tryNative: params.sourceTransformTryNative
    });
    loadWithSourceTransform = new Proxy(jitiLoader, { apply(target, thisArg, argArray) {
        const [first, ...rest] = argArray;
        if (typeof first === "string") return Reflect.apply(target, thisArg, [toSourceTransformImportPath(first), ...rest]);
        return Reflect.apply(target, thisArg, argArray);
      } });
    return loadWithSourceTransform;
  };
}
function shouldForceSourceTransformForPluginSdkAlias(params) {
  if (!params.aliasMap["openclaw/plugin-sdk"] && !params.aliasMap["@openclaw/plugin-sdk"] && !Object.keys(params.aliasMap).some((key) => key.startsWith("openclaw/plugin-sdk/") || key.startsWith("@openclaw/plugin-sdk/"))) return false;
  if (!/\.[cm]?js$/iu.test(params.target)) return false;
  try {
    return PLUGIN_SDK_IMPORT_SPECIFIER_PATTERN.test(_nodeFs.default.readFileSync(params.target, "utf-8"));
  } catch {
    return false;
  }
}
function createPluginModuleLoader(params) {
  const getLoadWithSourceTransform = createLazySourceTransformLoader({
    ...params,
    sourceTransformTryNative: params.tryNative
  });
  if (!params.tryNative) return (target, ...rest) => {
    pluginModuleLoaderStats.calls += 1;
    pluginModuleLoaderStats.sourceTransformForced += 1;
    recordSourceTransformTarget(target);
    return getLoadWithSourceTransform()(target, ...rest);
  };
  const getLoadWithAliasTransform = createLazySourceTransformLoader({
    ...params,
    sourceTransformTryNative: false
  });
  return (target, ...rest) => {
    pluginModuleLoaderStats.calls += 1;
    if (shouldForceSourceTransformForPluginSdkAlias({
      target,
      aliasMap: params.aliasMap
    })) {
      pluginModuleLoaderStats.sourceTransformForced += 1;
      recordSourceTransformTarget(target);
      return getLoadWithAliasTransform()(target, ...rest);
    }
    const native = tryNativeRequireJavaScriptModule(target, {
      allowWindows: true,
      aliasMap: params.aliasMap,
      fallbackOnMissingDependency: true,
      fallbackOnNativeError: true
    });
    if (native.ok) {
      pluginModuleLoaderStats.nativeHits += 1;
      return native.moduleExport;
    }
    pluginModuleLoaderStats.nativeMisses += 1;
    pluginModuleLoaderStats.sourceTransformFallbacks += 1;
    recordSourceTransformTarget(target);
    return getLoadWithSourceTransform()(target, ...rest);
  };
}
function getCachedPluginModuleLoader(params) {
  const cacheEntry = resolvePluginModuleLoaderCacheEntry(params);
  const cached = params.cache.get(cacheEntry.scopedCacheKey);
  if (cached) return cached;
  const loader = createPluginModuleLoader({
    loaderFilename: cacheEntry.loaderFilename,
    aliasMap: cacheEntry.aliasMap,
    tryNative: cacheEntry.tryNative,
    ...(params.createLoader ? { createLoader: params.createLoader } : {})
  });
  params.cache.set(cacheEntry.scopedCacheKey, loader);
  return loader;
}
function getCachedPluginSourceModuleLoader(params) {
  return getCachedPluginModuleLoader({
    ...params,
    tryNative: false
  });
}
//#endregion /* v9-3cbff553970e0710 */
