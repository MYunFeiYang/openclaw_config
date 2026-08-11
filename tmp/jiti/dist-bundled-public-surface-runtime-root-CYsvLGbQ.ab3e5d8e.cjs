"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.t = prepareBuiltBundledPluginPublicSurfaceLocation;var _bundledRuntimeRootD11Fl_T = require("./bundled-runtime-root-D11Fl_T4.js");
var _nodePath = _interopRequireDefault(require("node:path"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}
//#region src/plugins/bundled-public-surface-runtime-root.ts
function resolveBuiltBundledPluginRootFromModulePath(params) {
  const resolvedModulePath = _nodePath.default.resolve(params.modulePath);
  let currentDir = _nodePath.default.dirname(resolvedModulePath);
  while (true) {
    if (_nodePath.default.basename(currentDir) === params.pluginId && (0, _bundledRuntimeRootD11Fl_T.t)(currentDir)) {
      const relativePath = _nodePath.default.relative(currentDir, resolvedModulePath);
      if (!relativePath.startsWith("..") && !_nodePath.default.isAbsolute(relativePath)) return currentDir;
    }
    const parentDir = _nodePath.default.dirname(currentDir);
    if (parentDir === currentDir) return null;
    currentDir = parentDir;
  }
}
function prepareBuiltBundledPluginPublicSurfaceLocation(params) {
  if (params.installRuntimeDeps === false) return params.location;
  const pluginRoot = resolveBuiltBundledPluginRootFromModulePath({
    modulePath: params.location.modulePath,
    pluginId: params.pluginId
  });
  if (!pluginRoot) return params.location;
  const prepared = (0, _bundledRuntimeRootD11Fl_T.n)({
    pluginId: params.pluginId,
    pluginRoot,
    modulePath: params.location.modulePath,
    ...(params.env ? { env: params.env } : {})
  });
  return {
    modulePath: prepared.modulePath,
    boundaryRoot: prepared.pluginRoot
  };
}
//#endregion /* v9-a85d2d68fa9a2c32 */
