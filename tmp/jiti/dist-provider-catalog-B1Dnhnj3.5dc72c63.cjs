"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = buildDoubaoProvider;exports.t = buildDoubaoCodingProvider;var _providerCatalogSharedCD80ANYK = require("./provider-catalog-shared-CD80ANYK.js");
var _openclawPluginNddKwFzD = require("./openclaw.plugin-NddKwFzD.js");
//#region extensions/volcengine/provider-catalog.ts
function buildDoubaoProvider() {
  return (0, _providerCatalogSharedCD80ANYK.n)({
    providerId: "volcengine",
    catalog: _openclawPluginNddKwFzD.t.providers.volcengine
  });
}
function buildDoubaoCodingProvider() {
  return (0, _providerCatalogSharedCD80ANYK.n)({
    providerId: "volcengine-plan",
    catalog: _openclawPluginNddKwFzD.t.providers["volcengine-plan"]
  });
}
//#endregion /* v9-f9780a06a3c785ff */
