"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = recordPluginInstall;exports.t = buildNpmResolutionInstallFields;var _installSourceUtilsBNDT76QB = require("./install-source-utils-BNDT76QB.js");
//#region src/plugins/installs.ts
function buildNpmResolutionInstallFields(resolution) {
  return (0, _installSourceUtilsBNDT76QB.t)(resolution);
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
//#endregion /* v9-bd1dfcfbb3a18f07 */
