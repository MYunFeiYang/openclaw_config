"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.t = buildDeepSeekProvider;var _modelsBIZtStiz = require("./models-BIZtStiz.js");
//#region extensions/deepseek/provider-catalog.ts
function buildDeepSeekProvider() {
  return {
    baseUrl: _modelsBIZtStiz.t,
    api: "openai-completions",
    models: _modelsBIZtStiz.n.map(_modelsBIZtStiz.r)
  };
}
//#endregion /* v9-b9434e089f16a043 */
