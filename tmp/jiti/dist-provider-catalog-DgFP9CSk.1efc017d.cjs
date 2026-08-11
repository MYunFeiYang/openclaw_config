"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.t = buildTokenHubProvider;var _models0rlb_umh = require("./models-0rlb_umh.js");
//#region extensions/tencent/provider-catalog.ts
function buildTokenHubProvider() {
  return {
    baseUrl: _models0rlb_umh.t,
    api: "openai-completions",
    models: _models0rlb_umh.n.map(_models0rlb_umh.i)
  };
}
//#endregion /* v9-77f350f8e92368fe */
