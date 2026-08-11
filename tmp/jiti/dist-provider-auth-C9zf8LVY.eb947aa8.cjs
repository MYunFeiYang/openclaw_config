"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = listUsableProviderAuthProfileIds;exports.c = generateHexPkceVerifierChallenge;exports.i = isProviderAuthProfileConfigured;exports.l = generatePkceVerifierChallenge;exports.n = deriveCopilotApiBaseUrlFromToken;exports.o = resolveCopilotApiToken;exports.r = isProviderApiKeyConfigured;exports.s = resolveProviderAuthProfileApiKey;exports.t = void 0;exports.u = toFormUrlEncoded;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
var _pathsCnwfh6dH = require("./paths-Cnwfh6dH.js");
require("./types.secrets-CJS3n8Im.js");
var _agentScopeConfigDCRwWQZy = require("./agent-scope-config-DCRwWQZy.js");
var _jsonFileDIl8If_ = require("./json-file-DIl8If_4.js");
require("./ref-contract-BR8wwaMv.js");
require("./provider-env-vars-RuZeKVfu.js");
require("./store-cache-BCuMtdkq.js");
var _storeCMBbDiib = require("./store-CMBbDiib.js");
require("./model-auth-markers-Bo-UkLnQ.js");
var _modelAuthEnvPIWXP99L = require("./model-auth-env-PIWXP99L.js");
require("./models-config.providers.secrets-DNccJSxS.js");
var _providerAttributionCivBbTY = require("./provider-attribution-civBbTY2.js");
var _oauthBiX6jZGO = require("./oauth-BiX6jZGO.js");
var _profileListU8pxO = require("./profile-list-U8pxO857.js");
require("./profiles-Bu_OqYpj.js");
require("./repair-Cwqn0mQn.js");
var _orderCLZoFJ = require("./order-CLZoF-j6.js");
var _copilotDynamicHeaders_EdUICw = require("./copilot-dynamic-headers-_EdUICw5.js");
require("./provider-model-shared-DJr5ebSK.js");
require("./provider-auth-input-BmDsTtBZ.js");
require("./provider-auth-helpers-CiF5KnAc.js");
require("./provider-api-key-auth-ZsYj33Xz.js");
require("./agent-dir-compat-CX-SwdOY.js");
require("./provider-auth-result-BsnWCTff.js");
var _nodePath = _interopRequireDefault(require("node:path"));
var _nodeCrypto = require("node:crypto");function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}
//#region src/plugin-sdk/oauth-utils.ts
/**
* Encode a flat object as application/x-www-form-urlencoded form data.
*
* @deprecated OAuth provider-owned helper; keep this local to provider plugins instead.
*/
function toFormUrlEncoded(data) {
  return Object.entries(data).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join("&");
}
/**
* Generate a PKCE verifier/challenge pair suitable for OAuth authorization flows.
*
* @deprecated OAuth provider-owned helper; keep this local to provider plugins instead.
*/
function generatePkceVerifierChallenge() {
  const verifier = (0, _nodeCrypto.randomBytes)(32).toString("base64url");
  return {
    verifier,
    challenge: (0, _nodeCrypto.createHash)("sha256").update(verifier).digest("base64url")
  };
}
/** Generate a PKCE verifier/challenge pair with a 64-character hex verifier. */
function generateHexPkceVerifierChallenge() {
  const verifier = (0, _nodeCrypto.randomBytes)(32).toString("hex");
  return {
    verifier,
    challenge: (0, _nodeCrypto.createHash)("sha256").update(verifier).digest("base64url")
  };
}
//#endregion
//#region src/plugin-sdk/provider-auth.ts
const COPILOT_TOKEN_URL = "https://api.github.com/copilot_internal/v2/token";
/** @deprecated GitHub Copilot provider-owned helper; do not use from third-party plugins. */
const DEFAULT_COPILOT_API_BASE_URL = exports.t = "https://api.individual.githubcopilot.com";
function resolveCopilotTokenCachePath(env = process.env) {
  return _nodePath.default.join((0, _pathsCnwfh6dH.v)(env), "credentials", "github-copilot.token.json");
}
function isCopilotTokenUsable(cache, now = Date.now()) {
  return cache.integrationId === "vscode-chat" && cache.expiresAt - now > 300 * 1e3;
}
function parseCopilotTokenResponse(value) {
  if (!value || typeof value !== "object") throw new Error("Unexpected response from GitHub Copilot token endpoint");
  const asRecord = value;
  const token = asRecord.token;
  const expiresAt = asRecord.expires_at;
  if (typeof token !== "string" || token.trim().length === 0) throw new Error("Copilot token response missing token");
  let expiresAtMs;
  if (typeof expiresAt === "number" && Number.isFinite(expiresAt)) expiresAtMs = expiresAt < 1e11 ? expiresAt * 1e3 : expiresAt;else
  if (typeof expiresAt === "string" && expiresAt.trim().length > 0) {
    const parsed = Number.parseInt(expiresAt, 10);
    if (!Number.isFinite(parsed)) throw new Error("Copilot token response has invalid expires_at");
    expiresAtMs = parsed < 1e11 ? parsed * 1e3 : parsed;
  } else throw new Error("Copilot token response missing expires_at");
  return {
    token,
    expiresAt: expiresAtMs
  };
}
function resolveCopilotProxyHost(proxyEp) {
  const trimmed = proxyEp.trim();
  if (!trimmed) return null;
  const urlText = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(urlText);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return (0, _stringCoerceLndEvhRk.a)(url.hostname);
  } catch {
    return null;
  }
}
/** @deprecated GitHub Copilot provider-owned helper; do not use from third-party plugins. */
function deriveCopilotApiBaseUrlFromToken(token) {
  const trimmed = token.trim();
  if (!trimmed) return null;
  const proxyEp = trimmed.match(/(?:^|;)\s*proxy-ep=([^;\s]+)/i)?.[1]?.trim();
  if (!proxyEp) return null;
  const proxyHost = resolveCopilotProxyHost(proxyEp);
  if (!proxyHost) return null;
  const baseUrl = `https://${proxyHost.replace(/^proxy\./i, "api.")}`;
  return (0, _providerAttributionCivBbTY.n)(baseUrl).endpointClass === "invalid" ? null : baseUrl;
}
/** @deprecated GitHub Copilot provider-owned helper; do not use from third-party plugins. */
async function resolveCopilotApiToken(params) {
  const env = params.env ?? process.env;
  const cachePath = params.cachePath?.trim() || resolveCopilotTokenCachePath(env);
  const loadJsonFileFn = params.loadJsonFileImpl ?? _jsonFileDIl8If_.t;
  const saveJsonFileFn = params.saveJsonFileImpl ?? _jsonFileDIl8If_.n;
  const cached = loadJsonFileFn(cachePath);
  if (cached && typeof cached.token === "string" && typeof cached.expiresAt === "number") {
    if (isCopilotTokenUsable(cached)) return {
      token: cached.token,
      expiresAt: cached.expiresAt,
      source: `cache:${cachePath}`,
      baseUrl: deriveCopilotApiBaseUrlFromToken(cached.token) ?? "https://api.individual.githubcopilot.com"
    };
  }
  const res = await (params.fetchImpl ?? fetch)(COPILOT_TOKEN_URL, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${params.githubToken}`,
      "Copilot-Integration-Id": _copilotDynamicHeaders_EdUICw.i,
      ...(0, _copilotDynamicHeaders_EdUICw.s)({ includeApiVersion: true })
    }
  });
  if (!res.ok) throw new Error(`Copilot token exchange failed: HTTP ${res.status}`);
  const json = parseCopilotTokenResponse(await res.json());
  const payload = {
    token: json.token,
    expiresAt: json.expiresAt,
    updatedAt: Date.now(),
    integrationId: _copilotDynamicHeaders_EdUICw.i
  };
  saveJsonFileFn(cachePath, payload);
  return {
    token: payload.token,
    expiresAt: payload.expiresAt,
    source: `fetched:${COPILOT_TOKEN_URL}`,
    baseUrl: deriveCopilotApiBaseUrlFromToken(payload.token) ?? "https://api.individual.githubcopilot.com"
  };
}
function isProviderApiKeyConfigured(params) {
  if ((0, _modelAuthEnvPIWXP99L.t)(params.provider)?.apiKey) return true;
  const agentDir = params.agentDir?.trim();
  if (!agentDir) return false;
  return (0, _profileListU8pxO.n)((0, _storeCMBbDiib.n)(agentDir, { allowKeychainPrompt: false }), params.provider).length > 0;
}
function listUsableProviderAuthProfileIds(params) {
  try {
    const agentDir = params.agentDir?.trim() || (0, _agentScopeConfigDCRwWQZy.s)(params.cfg ?? {});
    const store = (0, _storeCMBbDiib.n)(agentDir, { allowKeychainPrompt: false });
    return {
      agentDir,
      profileIds: (0, _orderCLZoFJ.i)({
        cfg: params.cfg,
        store,
        provider: params.provider
      })
    };
  } catch {
    return {
      agentDir: "",
      profileIds: []
    };
  }
}
function isProviderAuthProfileConfigured(params) {
  return listUsableProviderAuthProfileIds(params).profileIds.length > 0;
}
async function resolveProviderAuthProfileApiKey(params) {
  const { agentDir, profileIds } = listUsableProviderAuthProfileIds(params);
  if (!agentDir || profileIds.length === 0) return;
  const store = (0, _storeCMBbDiib.n)(agentDir, { allowKeychainPrompt: false });
  for (const profileId of profileIds) {
    const resolved = await (0, _oauthBiX6jZGO.n)({
      cfg: params.cfg,
      store,
      agentDir,
      profileId
    });
    if (resolved?.apiKey) return resolved.apiKey;
  }
}
//#endregion /* v9-2b5e280d4ac1f3d7 */
