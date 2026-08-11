"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _providerCatalogPpOKart = require("../../provider-catalog-ppO-kart.js");
//#region extensions/byteplus/provider-discovery.ts
const bytePlusProviderDiscovery = exports.default = [{
  id: "byteplus",
  label: "BytePlus",
  docsPath: "/providers/models",
  auth: [],
  staticCatalog: {
    order: "simple",
    run: async () => ({ provider: (0, _providerCatalogPpOKart.n)() })
  }
}, {
  id: "byteplus-plan",
  label: "BytePlus Plan",
  docsPath: "/providers/models",
  auth: [],
  staticCatalog: {
    order: "simple",
    run: async () => ({ provider: (0, _providerCatalogPpOKart.t)() })
  }
}];
//#endregion /* v9-b4eb5f219b58e525 */
