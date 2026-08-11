"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = findRegisteredChannelPluginEntryById;exports.r = listRegisteredChannelPluginEntries;exports.t = findRegisteredChannelPluginEntry;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
var _runtimeChannelStateCKHHRUUh = require("./runtime-channel-state-CKHHRUUh.js");
//#region src/channels/registry-lookup.ts
let registeredChannelPluginLookup;
function setLookupEntry(map, key, entry) {
  if (key && !map.has(key)) map.set(key, entry);
}
function buildRegisteredChannelPluginLookup() {
  const { registry, version } = (0, _runtimeChannelStateCKHHRUUh.n)();
  const channels = Array.isArray(registry?.channels) ? registry.channels : void 0;
  const channelCount = channels?.length ?? 0;
  const cached = registeredChannelPluginLookup;
  if (cached && cached.registry === registry && cached.channels === channels && cached.channelCount === channelCount && cached.version === version) return cached;
  const entries = channelCount > 0 ? channels : [];
  const byKey = /* @__PURE__ */new Map();
  const byId = /* @__PURE__ */new Map();
  for (const entry of entries) {
    const id = (0, _stringCoerceLndEvhRk.s)(entry.plugin.id ?? "");
    setLookupEntry(byKey, id, entry);
    setLookupEntry(byId, id, entry);
    for (const alias of entry.plugin.meta?.aliases ?? []) setLookupEntry(byKey, (0, _stringCoerceLndEvhRk.s)(alias), entry);
  }
  registeredChannelPluginLookup = {
    registry,
    channels,
    channelCount,
    version,
    entries,
    byKey,
    byId
  };
  return registeredChannelPluginLookup;
}
function listRegisteredChannelPluginEntries() {
  return buildRegisteredChannelPluginLookup().entries;
}
function findRegisteredChannelPluginEntry(normalizedKey) {
  return buildRegisteredChannelPluginLookup().byKey.get(normalizedKey);
}
function findRegisteredChannelPluginEntryById(id) {
  const normalizedId = (0, _stringCoerceLndEvhRk.s)(id);
  if (!normalizedId) return;
  return buildRegisteredChannelPluginLookup().byId.get(normalizedId);
}
//#endregion /* v9-b8dbeaca99dc1051 */
