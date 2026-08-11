"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = buildBytePlusProvider;exports.t = buildBytePlusCodingProvider;var _providerCatalogSharedCbrkvEq = require("./provider-catalog-shared-CbrkvEq2.js");
var _openclawPluginBlztrpyx = require("./openclaw.plugin-Blztrpyx.js");
//#region extensions/byteplus/provider-catalog.ts
function buildBytePlusProvider() {
  return (0, _providerCatalogSharedCbrkvEq.n)({
    providerId: "byteplus",
    catalog: _openclawPluginBlztrpyx.t.providers.byteplus
  });
}
function buildBytePlusCodingProvider() {
  return (0, _providerCatalogSharedCbrkvEq.n)({
    providerId: "byteplus-plan",
    catalog: _openclawPluginBlztrpyx.t.providers["byteplus-plan"]
  });
}
//#endregion /* v9-80da86157c30331b */
