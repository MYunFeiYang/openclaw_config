"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _providerCatalogDgFP9CSk = require("../../provider-catalog-DgFP9CSk.js");
//#region extensions/tencent/provider-discovery.ts
const tencentProviderDiscovery = exports.default = {
  id: "tencent-tokenhub",
  label: "Tencent TokenHub",
  docsPath: "/providers/models",
  auth: [],
  staticCatalog: {
    order: "simple",
    run: async () => ({ provider: (0, _providerCatalogDgFP9CSk.t)() })
  }
};
//#endregion /* v9-8f2a8114f76359da */
