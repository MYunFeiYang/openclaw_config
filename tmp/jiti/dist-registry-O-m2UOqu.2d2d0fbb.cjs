"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = normalizeAnyChannelId;exports.i = listRegisteredChannelPluginIds;exports.n = formatChannelSelectionLine;exports.o = normalizeChannelId;exports.r = getRegisteredChannelPluginMeta;exports.t = formatChannelPrimerLine;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
var _idsCRqUrRLW = require("./ids-CRqUrRLW.js");
require("./chat-meta-BtJ8Pxrm.js");
var _registryLookup5ZKa5BSl = require("./registry-lookup-5ZKa5BSl.js");
//#region src/channels/registry.ts
function normalizeChannelId(raw) {
  return (0, _idsCRqUrRLW.r)(raw);
}
function normalizeAnyChannelId(raw) {
  const key = (0, _stringCoerceLndEvhRk.s)(raw);
  if (!key) return null;
  return (0, _registryLookup5ZKa5BSl.t)(key)?.plugin.id ?? null;
}
function listRegisteredChannelPluginIds() {
  return (0, _registryLookup5ZKa5BSl.r)().flatMap((entry) => {
    const id = (0, _stringCoerceLndEvhRk.c)(entry.plugin.id);
    return id ? [id] : [];
  });
}
function getRegisteredChannelPluginMeta(id) {
  return (0, _registryLookup5ZKa5BSl.n)(id)?.plugin.meta ?? null;
}
function formatChannelPrimerLine(meta) {
  return `${meta.label}: ${meta.blurb}`;
}
function formatChannelSelectionLine(meta, docsLink) {
  const docsPrefix = meta.selectionDocsPrefix ?? "Docs:";
  const docsLabel = meta.docsLabel ?? meta.id;
  const docs = meta.selectionDocsOmitLabel ? docsLink(meta.docsPath) : docsLink(meta.docsPath, docsLabel);
  const extras = (meta.selectionExtras ?? []).filter(Boolean).join(" ");
  return `${meta.label} — ${meta.blurb} ${docsPrefix ? `${docsPrefix} ` : ""}${docs}${extras ? ` ${extras}` : ""}`;
}
//#endregion /* v9-4172b4c0286185b2 */
