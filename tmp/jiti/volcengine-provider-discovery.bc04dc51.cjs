"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _providerCatalogDCorgzcI = require("../../provider-catalog-DCorgzcI.js");
//#region extensions/volcengine/provider-discovery.ts
const volcengineProviderDiscovery = exports.default = [{
  id: "volcengine",
  label: "Volcengine",
  docsPath: "/providers/models",
  auth: [],
  staticCatalog: {
    order: "simple",
    run: async () => ({ provider: (0, _providerCatalogDCorgzcI.n)() })
  }
}, {
  id: "volcengine-plan",
  label: "Volcengine Plan",
  docsPath: "/providers/models",
  auth: [],
  staticCatalog: {
    order: "simple",
    run: async () => ({ provider: (0, _providerCatalogDCorgzcI.t)() })
  }
}];
//#endregion /* v9-7d64af78df02335f */
