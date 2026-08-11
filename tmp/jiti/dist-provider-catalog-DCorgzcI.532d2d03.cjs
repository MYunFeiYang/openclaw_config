"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = buildDoubaoProvider;exports.t = buildDoubaoCodingProvider;var _providerCatalogSharedCbrkvEq = require("./provider-catalog-shared-CbrkvEq2.js");
var _openclawPluginDrx9X4Y = require("./openclaw.plugin-Drx9X4Y-.js");
//#region extensions/volcengine/provider-catalog.ts
function buildDoubaoProvider() {
  return (0, _providerCatalogSharedCbrkvEq.n)({
    providerId: "volcengine",
    catalog: _openclawPluginDrx9X4Y.t.providers.volcengine
  });
}
function buildDoubaoCodingProvider() {
  return (0, _providerCatalogSharedCbrkvEq.n)({
    providerId: "volcengine-plan",
    catalog: _openclawPluginDrx9X4Y.t.providers["volcengine-plan"]
  });
}
//#endregion /* v9-77aec12bf6e5cbcb */
