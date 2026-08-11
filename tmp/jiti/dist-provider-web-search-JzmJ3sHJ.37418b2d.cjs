"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = resolveWebSearchProviderCredential;exports.r = resolveCitationRedirectUrl;exports.t = createPluginBackedWebSearchProvider;var _typesSecretsCJS3n8Im = require("./types.secrets-CJS3n8Im.js");
require("./enable-CzpxjsaG.js");
var _normalizeSecretInputCH0hjbpb = require("./normalize-secret-input-CH0hjbpb.js");
require("./common-CBeX38Ay.js");
require("./external-content-DHSmu4Jx.js");
require("./web-shared-DinxzErj.js");
require("./web-search-provider-common-CtGgfxhT.js");
var _webGuardedFetchDKbsNXyX = require("./web-guarded-fetch-DKbsNXyX.js");
//#region src/agents/tools/web-search-citation-redirect.ts
const REDIRECT_TIMEOUT_MS = 5e3;
/**
* Resolve a citation redirect URL to its final destination using a HEAD request.
* Returns the original URL if resolution fails or times out.
*/
async function resolveCitationRedirectUrl(url) {
  try {
    return await (0, _webGuardedFetchDKbsNXyX.r)({
      url,
      init: { method: "HEAD" },
      timeoutMs: REDIRECT_TIMEOUT_MS
    }, async ({ finalUrl }) => finalUrl || url);
  } catch {
    return url;
  }
}
//#endregion
//#region src/agents/tools/web-search-provider-credentials.ts
function resolveWebSearchProviderCredential(params) {
  const fromConfig = (0, _normalizeSecretInputCH0hjbpb.n)((0, _typesSecretsCJS3n8Im.d)(params.credentialValue));
  if (fromConfig) return fromConfig;
  const credentialRef = (0, _typesSecretsCJS3n8Im.m)({ value: params.credentialValue }).ref;
  if (credentialRef) {
    if (credentialRef.source !== "env") return;
    const fromEnvRef = (0, _normalizeSecretInputCH0hjbpb.n)(process.env[credentialRef.id]);
    if (fromEnvRef) return fromEnvRef;
    return;
  }
  for (const envVar of params.envVars) {
    const fromEnv = (0, _normalizeSecretInputCH0hjbpb.n)(process.env[envVar]);
    if (fromEnv) return fromEnv;
  }
}
//#endregion
//#region src/plugin-sdk/provider-web-search.ts
/**
* @deprecated Implement provider-owned `createTool(...)` directly on the
* returned WebSearchProviderPlugin instead of routing through core.
*/
function createPluginBackedWebSearchProvider(provider) {
  return {
    ...provider,
    createTool: () => {
      throw new Error(`createPluginBackedWebSearchProvider(${provider.id}) is no longer supported. Define provider-owned createTool(...) directly in the extension's WebSearchProviderPlugin.`);
    }
  };
}
//#endregion /* v9-7e08d9ddd6eb4a93 */
