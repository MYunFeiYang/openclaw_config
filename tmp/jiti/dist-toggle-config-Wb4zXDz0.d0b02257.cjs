"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.t = setPluginEnabledInConfig;var _idsCRqUrRLW = require("./ids-CRqUrRLW.js");
//#region src/plugins/toggle-config.ts
function setPluginEnabledInConfig(config, pluginId, enabled, options = {}) {
  const builtInChannelId = (0, _idsCRqUrRLW.r)(pluginId);
  const resolvedId = builtInChannelId ?? pluginId;
  const next = {
    ...config,
    plugins: {
      ...config.plugins,
      entries: {
        ...config.plugins?.entries,
        [resolvedId]: {
          ...config.plugins?.entries?.[resolvedId],
          enabled
        }
      }
    }
  };
  if (!builtInChannelId || options.updateChannelConfig === false) return next;
  const existing = config.channels?.[builtInChannelId];
  const existingRecord = existing && typeof existing === "object" && !Array.isArray(existing) ? existing : {};
  return {
    ...next,
    channels: {
      ...config.channels,
      [builtInChannelId]: {
        ...existingRecord,
        enabled
      }
    }
  };
}
//#endregion /* v9-e193ac8cfde5e582 */
