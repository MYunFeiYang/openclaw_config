"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.t = getLoadedChannelPluginForRead;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
var _runtimeChannelStateCKHHRUUh = require("./runtime-channel-state-CKHHRUUh.js");
//#region src/channels/plugins/registry-loaded-read.ts
function coerceLoadedChannelPlugin(plugin) {
  const id = (0, _stringCoerceLndEvhRk.c)(plugin?.id) ?? "";
  if (!plugin || !id) return;
  if (!plugin.meta || typeof plugin.meta !== "object") plugin.meta = {};
  return plugin;
}
function getLoadedChannelPluginForRead(id) {
  const resolvedId = (0, _stringCoerceLndEvhRk.c)(id) ?? "";
  if (!resolvedId) return;
  const registry = (0, _runtimeChannelStateCKHHRUUh.t)();
  if (!registry || !Array.isArray(registry.channels)) return;
  for (const entry of registry.channels) {
    const plugin = coerceLoadedChannelPlugin(entry?.plugin);
    if (plugin && plugin.id === resolvedId) return plugin;
  }
}
//#endregion /* v9-5943b0aece432f67 */
