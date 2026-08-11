"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = resolveManifestOwnerBasePolicyBlock;exports.i = passesManifestOwnerBasePolicy;exports.n = isActivatedManifestOwner;exports.r = isBundledManifestOwner;exports.t = hasExplicitManifestOwnerTrust;var _installedPluginIndexStoreDEo2ZAhx = require("./installed-plugin-index-store-DEo2ZAhx.js");
var _configStateCOhlckC = require("./config-state-COhlckC5.js");
//#region src/plugins/manifest-owner-policy.ts
function isBundledManifestOwner(plugin) {
  return plugin.origin === "bundled";
}
function hasExplicitManifestOwnerTrust(params) {
  return params.normalizedConfig.allow.includes(params.plugin.id) || params.normalizedConfig.entries[params.plugin.id]?.enabled === true;
}
function passesManifestOwnerBasePolicy(params) {
  return resolveManifestOwnerBasePolicyBlock(params) === null;
}
function resolveManifestOwnerBasePolicyBlock(params) {
  if (!params.normalizedConfig.enabled) return "plugins-disabled";
  if (params.normalizedConfig.deny.includes(params.plugin.id)) return "blocked-by-denylist";
  if (params.normalizedConfig.entries[params.plugin.id]?.enabled === false && params.allowExplicitlyDisabled !== true) return "plugin-disabled";
  if (params.allowRestrictiveAllowlistBypass !== true && params.normalizedConfig.allow.length > 0 && !params.normalizedConfig.allow.includes(params.plugin.id)) return "not-in-allowlist";
  return null;
}
function isActivatedManifestOwner(params) {
  return (0, _configStateCOhlckC.l)({
    id: params.plugin.id,
    origin: params.plugin.origin,
    config: params.normalizedConfig,
    rootConfig: params.rootConfig,
    enabledByDefault: (0, _installedPluginIndexStoreDEo2ZAhx.g)(params.plugin)
  }).activated;
}
//#endregion /* v9-8dae4b1206d9c98b */
