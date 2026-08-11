"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = listKnownChannelEnvVarNames;exports.t = getChannelEnvVars;var _pluginMetadataSnapshotYo9W2SZ = require("./plugin-metadata-snapshot-yo9-w2SZ.js");
//#region src/secrets/channel-env-vars.ts
function appendUniqueEnvVarCandidates(target, channelId, keys) {
  const normalizedChannelId = channelId.trim();
  if (!normalizedChannelId || keys.length === 0) return;
  const bucket = target[normalizedChannelId] ??= [];
  const seen = new Set(bucket);
  for (const key of keys) {
    const normalizedKey = key.trim();
    if (!normalizedKey || seen.has(normalizedKey)) continue;
    seen.add(normalizedKey);
    bucket.push(normalizedKey);
  }
}
function resolveChannelEnvVars(params) {
  const snapshot = (0, _pluginMetadataSnapshotYo9W2SZ.i)({
    config: params?.config ?? {},
    workspaceDir: params?.workspaceDir,
    env: params?.env ?? process.env
  });
  const candidates = {};
  for (const plugin of snapshot.plugins) {
    if (!plugin.channelEnvVars) continue;
    for (const [channelId, keys] of Object.entries(plugin.channelEnvVars).toSorted(([left], [right]) => left.localeCompare(right))) appendUniqueEnvVarCandidates(candidates, channelId, keys);
  }
  return candidates;
}
function getChannelEnvVars(channelId, params) {
  const channelEnvVars = resolveChannelEnvVars(params);
  const envVars = Object.hasOwn(channelEnvVars, channelId) ? channelEnvVars[channelId] : void 0;
  return Array.isArray(envVars) ? [...envVars] : [];
}
function listKnownChannelEnvVarNames(params) {
  return [...new Set(Object.values(resolveChannelEnvVars(params)).flatMap((keys) => keys))];
}
//#endregion /* v9-df9710522b5d3ee0 */
