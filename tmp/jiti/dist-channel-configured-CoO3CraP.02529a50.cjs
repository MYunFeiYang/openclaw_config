"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.i = listBundledChannelIdsWithConfiguredState;exports.n = isStaticallyChannelConfigured;exports.r = hasBundledChannelConfiguredState;exports.t = isChannelConfigured;var _utilsCKsuXgDI = require("./utils-CKsuXgDI.js");
var _channelEnvVarsBqBNZvnV = require("./channel-env-vars-BqBNZvnV.js");
var _packageStateProbesCCRzRGc = require("./package-state-probes-CCRzRGc6.js");
var _bootstrapRegistryDVTeyEUV = require("./bootstrap-registry-DVTeyEUV.js");
//#region src/channels/plugins/configured-state.ts
function listBundledChannelIdsWithConfiguredState() {
  return (0, _packageStateProbesCCRzRGc.n)("configuredState");
}
function hasBundledChannelConfiguredState(params) {
  return (0, _packageStateProbesCCRzRGc.t)({
    metadataKey: "configuredState",
    channelId: params.channelId,
    cfg: params.cfg,
    env: params.env
  });
}
//#endregion
//#region src/config/channel-configured-shared.ts
function resolveChannelConfigRecord(cfg, channelId) {
  const entry = cfg.channels?.[channelId];
  return (0, _utilsCKsuXgDI.c)(entry) ? entry : null;
}
function hasMeaningfulChannelConfigShallow(value) {
  if (!(0, _utilsCKsuXgDI.c)(value)) return false;
  const keys = Object.keys(value);
  if (keys.length === 1 && keys[0] === "enabled") return value.enabled === true;
  return keys.some((key) => key !== "enabled");
}
function isStaticallyChannelConfigured(cfg, channelId, env = process.env) {
  for (const envVar of (0, _channelEnvVarsBqBNZvnV.t)(channelId, {
    config: cfg,
    env
  })) if (typeof env[envVar] === "string" && env[envVar].trim().length > 0) return true;
  return hasMeaningfulChannelConfigShallow(resolveChannelConfigRecord(cfg, channelId));
}
//#endregion
//#region src/config/channel-configured.ts
function isChannelConfigured(cfg, channelId, env = process.env) {
  if (hasMeaningfulChannelConfigShallow(resolveChannelConfigRecord(cfg, channelId))) return true;
  if (hasBundledChannelConfiguredState({
    channelId,
    cfg,
    env
  })) return true;
  const plugin = (0, _bootstrapRegistryDVTeyEUV.t)(channelId);
  return Boolean(plugin?.config?.hasConfiguredState?.({
    cfg,
    env
  }));
}
//#endregion /* v9-7d45e3dd260e0d46 */
