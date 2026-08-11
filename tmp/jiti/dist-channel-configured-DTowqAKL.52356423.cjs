"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.i = listBundledChannelIdsWithConfiguredState;exports.n = isStaticallyChannelConfigured;exports.r = hasBundledChannelConfiguredState;exports.t = isChannelConfigured;var _utilsCKsuXgDI = require("./utils-CKsuXgDI.js");
var _channelEnvVarsKl6Wjoo = require("./channel-env-vars-kl6Wjoo2.js");
var _packageStateProbesBcFADgAF = require("./package-state-probes-BcFADgAF.js");
var _bootstrapRegistryC094XSLH = require("./bootstrap-registry-C094XSLH.js");
//#region src/channels/plugins/configured-state.ts
function listBundledChannelIdsWithConfiguredState() {
  return (0, _packageStateProbesBcFADgAF.n)("configuredState");
}
function hasBundledChannelConfiguredState(params) {
  return (0, _packageStateProbesBcFADgAF.t)({
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
  for (const envVar of (0, _channelEnvVarsKl6Wjoo.t)(channelId, {
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
  const plugin = (0, _bootstrapRegistryC094XSLH.t)(channelId);
  return Boolean(plugin?.config?.hasConfiguredState?.({
    cfg,
    env
  }));
}
//#endregion /* v9-c6e9f14800e342e3 */
