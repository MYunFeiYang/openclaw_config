"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.t = void 0;var _backendConfigDGhc9Ni_ = require("./backend-config-DGhc9Ni_.js");
require("./memory-core-host-runtime-files-43Oo8RRu.js");
var _memoryDnl74Q8s = require("./memory-Dnl74Q8s.js");
//#region extensions/memory-core/src/runtime-provider.ts
const memoryRuntime = exports.t = {
  async getMemorySearchManager(params) {
    const { manager, error } = await (0, _memoryDnl74Q8s.n)(params);
    return {
      manager,
      error
    };
  },
  resolveMemoryBackendConfig(params) {
    return (0, _backendConfigDGhc9Ni_.t)(params);
  },
  async closeAllMemorySearchManagers() {
    await (0, _memoryDnl74Q8s.t)();
  }
};
//#endregion /* v9-3bcc04dcbfb55671 */
