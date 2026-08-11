"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = getBootstrapChannelSecrets;exports.r = listBundledChannelIds;exports.t = getBootstrapChannelPlugin;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
var _channelCatalogRegistryBDlELhOw = require("./channel-catalog-registry-BDlELhOw.js");
var _bundledCGlg0Y2W = require("./bundled-CGlg0Y2W.js");
//#region src/channels/plugins/bundled-ids.ts
function listBundledChannelIdsForRoot(_packageRoot, env = process.env) {
  return (0, _channelCatalogRegistryBDlELhOw.t)({
    origin: "bundled",
    env
  }).map((entry) => entry.channel.id).filter((channelId) => Boolean(channelId)).toSorted((left, right) => left.localeCompare(right));
}
function listBundledChannelIds(env = process.env) {
  return listBundledChannelIdsForRoot((0, _bundledCGlg0Y2W.m)(env).cacheKey, env);
}
//#endregion
//#region src/channels/plugins/bootstrap-registry.ts
function resolveBootstrapChannelId(id) {
  return (0, _stringCoerceLndEvhRk.c)(id) ?? "";
}
function mergePluginSection(runtimeValue, setupValue) {
  if (runtimeValue && setupValue && typeof runtimeValue === "object" && typeof setupValue === "object") {
    const merged = { ...runtimeValue };
    for (const [key, value] of Object.entries(setupValue)) if (value !== void 0) merged[key] = value;
    return { ...merged };
  }
  return setupValue ?? runtimeValue;
}
function mergeBootstrapPlugin(runtimePlugin, setupPlugin) {
  return {
    ...runtimePlugin,
    ...setupPlugin,
    meta: mergePluginSection(runtimePlugin.meta, setupPlugin.meta),
    capabilities: mergePluginSection(runtimePlugin.capabilities, setupPlugin.capabilities),
    commands: mergePluginSection(runtimePlugin.commands, setupPlugin.commands),
    doctor: mergePluginSection(runtimePlugin.doctor, setupPlugin.doctor),
    reload: mergePluginSection(runtimePlugin.reload, setupPlugin.reload),
    config: mergePluginSection(runtimePlugin.config, setupPlugin.config),
    setup: mergePluginSection(runtimePlugin.setup, setupPlugin.setup),
    messaging: mergePluginSection(runtimePlugin.messaging, setupPlugin.messaging),
    actions: mergePluginSection(runtimePlugin.actions, setupPlugin.actions),
    secrets: mergePluginSection(runtimePlugin.secrets, setupPlugin.secrets)
  };
}
function getBootstrapChannelPlugin(id) {
  const resolvedId = resolveBootstrapChannelId(id);
  if (!resolvedId) return;
  let runtimePlugin;
  let setupPlugin;
  try {
    runtimePlugin = (0, _bundledCGlg0Y2W.n)(resolvedId);
    setupPlugin = (0, _bundledCGlg0Y2W.i)(resolvedId);
  } catch {
    return;
  }
  return runtimePlugin && setupPlugin ? mergeBootstrapPlugin(runtimePlugin, setupPlugin) : setupPlugin ?? runtimePlugin;
}
function getBootstrapChannelSecrets(id) {
  const resolvedId = resolveBootstrapChannelId(id);
  if (!resolvedId) return;
  try {
    return mergePluginSection((0, _bundledCGlg0Y2W.r)(resolvedId), (0, _bundledCGlg0Y2W.a)(resolvedId));
  } catch {
    return;
  }
}
//#endregion /* v9-c498b178b9464343 */
