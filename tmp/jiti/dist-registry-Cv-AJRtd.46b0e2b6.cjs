"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = normalizeChannelId;exports.i = listChannelPlugins;exports.n = getLoadedChannelPlugin;exports.r = getLoadedChannelPluginOrigin;exports.t = getChannelPlugin;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
var _registryOM2UOqu = require("./registry-O-m2UOqu.js");
var _bundledCGlg0Y2W = require("./bundled-CGlg0Y2W.js");
var _registryLoadedBscvFMYw = require("./registry-loaded-BscvFMYw.js");
//#region src/channels/plugins/registry.ts
function listChannelPlugins() {
  return (0, _registryLoadedBscvFMYw.r)();
}
function getLoadedChannelPlugin(id) {
  const resolvedId = (0, _stringCoerceLndEvhRk.c)(id) ?? "";
  if (!resolvedId) return;
  return (0, _registryLoadedBscvFMYw.t)(resolvedId);
}
function getLoadedChannelPluginOrigin(id) {
  const resolvedId = (0, _stringCoerceLndEvhRk.c)(id) ?? "";
  if (!resolvedId) return;
  return (0, _stringCoerceLndEvhRk.c)((0, _registryLoadedBscvFMYw.n)(resolvedId)?.origin) ?? void 0;
}
function getChannelPlugin(id) {
  const resolvedId = (0, _stringCoerceLndEvhRk.c)(id) ?? "";
  if (!resolvedId) return;
  return getLoadedChannelPlugin(resolvedId) ?? (0, _bundledCGlg0Y2W.n)(resolvedId);
}
function normalizeChannelId(raw) {
  return (0, _registryOM2UOqu.a)(raw);
}
//#endregion /* v9-e59864e2b03a7156 */
