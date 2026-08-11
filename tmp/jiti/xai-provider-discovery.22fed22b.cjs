"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _webSearchProviderCommonCtGgfxhT = require("../../web-search-provider-common-CtGgfxhT.js");
require("../../provider-web-search-JzmJ3sHJ.js");
var _toolAuthSharedCQvTylR = require("../../tool-auth-shared-CQvTylR4.js");
//#region extensions/xai/provider-discovery.ts
const PROVIDER_ID = "xai";
function resolveXaiSyntheticAuth(config) {
  const apiKey = (0, _toolAuthSharedCQvTylR.n)(config)?.apiKey || (0, _webSearchProviderCommonCtGgfxhT.p)(["XAI_API_KEY"]);
  return apiKey ? {
    apiKey,
    source: "xAI plugin config",
    mode: "api-key"
  } : void 0;
}
const xaiProviderDiscovery = exports.default = {
  id: PROVIDER_ID,
  label: "xAI",
  docsPath: "/providers/models",
  auth: [],
  resolveSyntheticAuth: ({ config }) => resolveXaiSyntheticAuth(config)
};
//#endregion /* v9-31bafb079f0f8d0d */
