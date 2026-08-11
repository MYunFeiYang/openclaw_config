"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.t = buildTokenHubProvider;var _modelsDVb8dLHJ = require("./models-DVb8dLHJ.js");
//#region extensions/tencent/provider-catalog.ts
function buildTokenHubProvider() {
  return {
    baseUrl: _modelsDVb8dLHJ.t,
    api: "openai-completions",
    models: _modelsDVb8dLHJ.n.map(_modelsDVb8dLHJ.i)
  };
}
//#endregion /* v9-79184d42be976422 */
