"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = recordPluginInstall;exports.t = buildNpmResolutionInstallFields;var _installSourceUtilsUFvzN5vW = require("./install-source-utils-UFvzN5vW.js");
//#region src/plugins/installs.ts
function buildNpmResolutionInstallFields(resolution) {
  return (0, _installSourceUtilsUFvzN5vW.t)(resolution);
}
function recordPluginInstall(cfg, update) {
  const { pluginId, ...record } = update;
  const installs = {
    ...cfg.plugins?.installs,
    [pluginId]: {
      ...cfg.plugins?.installs?.[pluginId],
      ...record,
      installedAt: record.installedAt ?? (/* @__PURE__ */new Date()).toISOString()
    }
  };
  return {
    ...cfg,
    plugins: {
      ...cfg.plugins,
      installs: {
        ...installs,
        [pluginId]: installs[pluginId]
      }
    }
  };
}
//#endregion /* v9-cf9da7e1cd53b71e */
