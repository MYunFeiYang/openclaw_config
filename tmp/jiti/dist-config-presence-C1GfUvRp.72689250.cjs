"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = listPotentialConfiguredChannelPresenceSignals;exports.i = listPotentialConfiguredChannelIds;exports.n = hasPotentialConfiguredChannels;exports.r = listExplicitlyDisabledChannelIdsForConfig;exports.t = hasMeaningfulChannelConfig;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
var _pathsCnwfh6dH = require("./paths-Cnwfh6dH.js");
var _utilsCKsuXgDI = require("./utils-CKsuXgDI.js");
var _packageStateProbesCCRzRGc = require("./package-state-probes-CCRzRGc6.js");
var _bootstrapRegistryDVTeyEUV = require("./bootstrap-registry-DVTeyEUV.js");
var _channelTargetCv7dvIDX = require("./channel-target-Cv7dvIDX.js");
var _nodeFs = _interopRequireDefault(require("node:fs"));
var _nodeOs = _interopRequireDefault(require("node:os"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}
//#region src/channels/plugins/persisted-auth-state.ts
function listBundledChannelIdsWithPersistedAuthState() {
  return (0, _packageStateProbesCCRzRGc.n)("persistedAuthState");
}
function hasBundledChannelPersistedAuthState(params) {
  return (0, _packageStateProbesCCRzRGc.t)({
    metadataKey: "persistedAuthState",
    channelId: params.channelId,
    cfg: params.cfg,
    env: params.env
  });
}
//#endregion
//#region src/channels/config-presence.ts
const IGNORED_CHANNEL_CONFIG_KEYS = new Set(["defaults", "modelByChannel"]);
function hasMeaningfulChannelConfig(value) {
  if (!(0, _utilsCKsuXgDI.c)(value)) return false;
  return Object.keys(value).some((key) => key !== "enabled");
}
function listExplicitlyDisabledChannelIdsForConfig(cfg) {
  const channels = (0, _utilsCKsuXgDI.c)(cfg.channels) ? cfg.channels : null;
  if (!channels) return [];
  return Object.entries(channels).filter(([, value]) => (0, _utilsCKsuXgDI.c)(value) && value.enabled === false).map(([channelId]) => (0, _stringCoerceLndEvhRk.s)(channelId)).filter((channelId) => Boolean(channelId));
}
function listChannelEnvPrefixes(channelIds) {
  return channelIds.map((channelId) => [`${channelId.replace(/[^a-z0-9]+/gi, "_").toUpperCase()}_`, channelId]);
}
function hasPersistedChannelState(env) {
  return _nodeFs.default.existsSync((0, _pathsCnwfh6dH.v)(env, _nodeOs.default.homedir));
}
let persistedAuthStateChannelIds = null;
function listPersistedAuthStateChannelIds(options) {
  const override = options.persistedAuthStateProbe?.listChannelIds();
  if (override) return override;
  if (persistedAuthStateChannelIds) return persistedAuthStateChannelIds;
  persistedAuthStateChannelIds = listBundledChannelIdsWithPersistedAuthState();
  return persistedAuthStateChannelIds;
}
function hasPersistedAuthState(params) {
  const override = params.options.persistedAuthStateProbe;
  if (override) return override.hasState(params);
  return hasBundledChannelPersistedAuthState(params);
}
function listPotentialConfiguredChannelIds(cfg, env = process.env, options = {}) {
  return [...new Set(listPotentialConfiguredChannelPresenceSignals(cfg, env, options).map((signal) => signal.channelId))];
}
function listPotentialConfiguredChannelPresenceSignals(cfg, env = process.env, options = {}) {
  const signals = [];
  const seenSignals = /* @__PURE__ */new Set();
  const addSignal = (channelId, source) => {
    const key = `${source}:${channelId}`;
    if (seenSignals.has(key)) return;
    seenSignals.add(key);
    signals.push({
      channelId,
      source
    });
  };
  const configuredChannelIds = /* @__PURE__ */new Set();
  const channelEnvPrefixes = listChannelEnvPrefixes(options.channelIds ?? (0, _bootstrapRegistryDVTeyEUV.r)(env));
  const channels = (0, _utilsCKsuXgDI.c)(cfg.channels) ? cfg.channels : null;
  if (channels) for (const [key, value] of Object.entries(channels)) {
    if (IGNORED_CHANNEL_CONFIG_KEYS.has(key)) continue;
    if (hasMeaningfulChannelConfig(value)) {
      configuredChannelIds.add(key);
      addSignal(key, "config");
    }
  }
  for (const [key, value] of Object.entries(env)) {
    if (!(0, _channelTargetCv7dvIDX.i)(value)) continue;
    for (const [prefix, channelId] of channelEnvPrefixes) if (key.startsWith(prefix)) {
      configuredChannelIds.add(channelId);
      addSignal(channelId, "env");
    }
  }
  if (options.includePersistedAuthState !== false && hasPersistedChannelState(env)) {
    for (const channelId of listPersistedAuthStateChannelIds(options)) if (hasPersistedAuthState({
      channelId,
      cfg,
      env,
      options
    })) {
      configuredChannelIds.add(channelId);
      addSignal(channelId, "persisted-auth");
    }
  }
  return signals.filter((signal) => configuredChannelIds.has(signal.channelId));
}
function hasEnvConfiguredChannel(cfg, env, options = {}) {
  const channelEnvPrefixes = listChannelEnvPrefixes(options.channelIds ?? (0, _bootstrapRegistryDVTeyEUV.r)(env));
  for (const [key, value] of Object.entries(env)) {
    if (!(0, _channelTargetCv7dvIDX.i)(value)) continue;
    if (channelEnvPrefixes.some(([prefix]) => key.startsWith(prefix))) return true;
  }
  if (options.includePersistedAuthState === false || !hasPersistedChannelState(env)) return false;
  return listPersistedAuthStateChannelIds(options).some((channelId) => hasPersistedAuthState({
    channelId,
    cfg,
    env,
    options
  }));
}
function hasPotentialConfiguredChannels(cfg, env = process.env, options = {}) {
  const channels = (0, _utilsCKsuXgDI.c)(cfg?.channels) ? cfg.channels : null;
  if (channels) for (const [key, value] of Object.entries(channels)) {
    if (IGNORED_CHANNEL_CONFIG_KEYS.has(key)) continue;
    if (hasMeaningfulChannelConfig(value)) return true;
  }
  return hasEnvConfiguredChannel(cfg ?? {}, env, options);
}
//#endregion /* v9-c2f6647ce438b948 */
