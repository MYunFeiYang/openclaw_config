"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = buildBytePlusProvider;exports.t = buildBytePlusCodingProvider;var _providerCatalogSharedCD80ANYK = require("./provider-catalog-shared-CD80ANYK.js");
var _openclawPluginDIoxuhav = require("./openclaw.plugin-DIoxuhav.js");
//#region extensions/byteplus/provider-catalog.ts
function buildBytePlusProvider() {
  return (0, _providerCatalogSharedCD80ANYK.n)({
    providerId: "byteplus",
    catalog: _openclawPluginDIoxuhav.t.providers.byteplus
  });
}
function buildBytePlusCodingProvider() {
  return (0, _providerCatalogSharedCD80ANYK.n)({
    providerId: "byteplus-plan",
    catalog: _openclawPluginDIoxuhav.t.providers["byteplus-plan"]
  });
}
//#endregion /* v9-40cea3bcd5970db6 */
