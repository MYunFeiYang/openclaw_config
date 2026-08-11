"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.t = enablePluginInConfig;var _idsCRqUrRLW = require("./ids-CRqUrRLW.js");
var _toggleConfigWb4zXDz = require("./toggle-config-Wb4zXDz0.js");
//#region src/plugins/enable.ts
function enablePluginInConfig(cfg, pluginId, options = {}) {
  const resolvedId = (0, _idsCRqUrRLW.r)(pluginId) ?? pluginId;
  if (cfg.plugins?.enabled === false) return {
    config: cfg,
    enabled: false,
    pluginId: resolvedId,
    reason: "plugins disabled"
  };
  if (cfg.plugins?.deny?.includes(pluginId) || cfg.plugins?.deny?.includes(resolvedId)) return {
    config: cfg,
    enabled: false,
    pluginId: resolvedId,
    reason: "blocked by denylist"
  };
  const allow = cfg.plugins?.allow;
  if (Array.isArray(allow) && allow.length > 0 && !allow.includes(pluginId) && !allow.includes(resolvedId)) return {
    config: cfg,
    enabled: false,
    pluginId: resolvedId,
    reason: "blocked by allowlist"
  };
  return {
    config: (0, _toggleConfigWb4zXDz.t)(cfg, resolvedId, true, options),
    enabled: true,
    pluginId: resolvedId
  };
}
//#endregion /* v9-38e78bd652691c0f */
