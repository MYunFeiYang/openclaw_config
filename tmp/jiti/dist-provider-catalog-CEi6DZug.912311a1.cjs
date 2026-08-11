"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.t = buildDeepSeekProvider;var _modelsCthhY3zF = require("./models-CthhY3zF.js");
//#region extensions/deepseek/provider-catalog.ts
function buildDeepSeekProvider() {
  return {
    baseUrl: _modelsCthhY3zF.t,
    api: "openai-completions",
    models: _modelsCthhY3zF.n.map(_modelsCthhY3zF.r)
  };
}
//#endregion /* v9-ffa5cb696a147377 */
