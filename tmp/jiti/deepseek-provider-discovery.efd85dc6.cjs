"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _providerCatalogH7qa4d = require("../../provider-catalog-h-7qa4d7.js");
//#region extensions/deepseek/provider-discovery.ts
const deepSeekProviderDiscovery = exports.default = {
  id: "deepseek",
  label: "DeepSeek",
  docsPath: "/providers/deepseek",
  auth: [],
  staticCatalog: {
    order: "simple",
    run: async () => ({ provider: (0, _providerCatalogH7qa4d.t)() })
  }
};
//#endregion /* v9-c957adbfce6cde81 */
