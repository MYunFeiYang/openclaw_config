"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _providerCatalogDgqrmy = require("../../provider-catalog-Dgqrmy53.js");
//#region extensions/moonshot/provider-discovery.ts
const moonshotProviderDiscovery = exports.default = {
  id: "moonshot",
  label: "Moonshot",
  docsPath: "/providers/moonshot",
  auth: [],
  staticCatalog: {
    order: "simple",
    run: async () => ({ provider: (0, _providerCatalogDgqrmy.a)() })
  }
};
//#endregion /* v9-6012ecf09316c3f5 */
