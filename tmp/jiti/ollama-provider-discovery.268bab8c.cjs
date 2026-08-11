"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.ollamaProviderDiscovery = exports.default = void 0;var _providerBaseUrlB2jjJens = require("../../provider-base-url-B2jjJens.js");
var _discoverySharedCoB9v71T = require("../../discovery-shared-CoB9v71T.js");
//#region extensions/ollama/provider-discovery.ts
function resolveOllamaPluginConfig(ctx) {
  return (ctx.config.plugins?.entries ?? {}).ollama?.config ?? {};
}
async function runOllamaDiscovery(ctx) {
  return await (0, _discoverySharedCoB9v71T.r)({
    ctx,
    pluginConfig: resolveOllamaPluginConfig(ctx),
    buildProvider: _providerBaseUrlB2jjJens.i
  });
}
const ollamaProviderDiscovery = exports.ollamaProviderDiscovery = exports.default = {
  id: _discoverySharedCoB9v71T.n,
  label: "Ollama",
  docsPath: "/providers/ollama",
  envVars: ["OLLAMA_API_KEY"],
  auth: [],
  resolveSyntheticAuth: ({ provider, providerConfig }) => {
    if (!(0, _discoverySharedCoB9v71T.i)(providerConfig)) return;
    return {
      apiKey: _discoverySharedCoB9v71T.t,
      source: `models.providers.${provider ?? "ollama"} (synthetic local key)`,
      mode: "api-key"
    };
  },
  catalog: {
    order: "late",
    run: runOllamaDiscovery
  }
};
//#endregion /* v9-6cc73c05b4fc1ac1 */
