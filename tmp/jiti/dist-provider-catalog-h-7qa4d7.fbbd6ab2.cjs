"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.t = buildDeepSeekProvider;var _modelsDqEY5ic = require("./models-Dq-EY5ic.js");
//#region extensions/deepseek/provider-catalog.ts
function buildDeepSeekProvider() {
  return {
    baseUrl: _modelsDqEY5ic.t,
    api: "openai-completions",
    models: _modelsDqEY5ic.n.map(_modelsDqEY5ic.r)
  };
}
//#endregion /* v9-d49a29e88be33c56 */
