"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _registerRuntime = require("./register.runtime.js");
var _acpRuntimeBackend = require("openclaw/plugin-sdk/acp-runtime-backend");
//#region extensions/acpx/index.ts
const plugin = exports.default = {
  id: "acpx",
  name: "ACPX Runtime",
  description: "Embedded ACP runtime backend with plugin-owned session and transport management.",
  register(api) {
    api.registerService((0, _registerRuntime.createAcpxRuntimeService)({ pluginConfig: api.pluginConfig }));
    api.on("reply_dispatch", _acpRuntimeBackend.tryDispatchAcpReplyHook);
  }
};
//#endregion /* v9-bcc1751899d8b12a */
