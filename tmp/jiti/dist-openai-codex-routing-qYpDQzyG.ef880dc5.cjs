"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = listOpenAIAuthProfileProvidersForAgentRuntime;exports.c = resolveContextConfigProviderForRuntime;exports.d = shouldRouteOpenAIPiThroughCodexAuthProvider;exports.i = isOpenAIProvider;exports.l = resolveOpenAIRuntimeProviderForPi;exports.n = void 0;exports.o = modelSelectionShouldEnsureCodexPlugin;exports.r = isOpenAICodexProvider;exports.s = openAIProviderUsesCodexRuntimeByDefault;exports.t = void 0;exports.u = resolveSelectedOpenAIPiRuntimeProvider;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
var _providerIdCz7K6wgK = require("./provider-id-Cz7K6wgK.js");
var _providerAuthAliasesDEhinO0g = require("./provider-auth-aliases-DEhinO0g.js");
var _runtimeT2SzTsE = require("./runtime-t2SzTsE9.js");
//#region src/agents/openai-codex-routing.ts
const OPENAI_PROVIDER_ID = exports.n = "openai";
const OPENAI_CODEX_PROVIDER_ID = exports.t = "openai-codex";
function isOfficialOpenAIBaseUrl(baseUrl) {
  if (typeof baseUrl !== "string" || !baseUrl.trim()) return true;
  try {
    const url = new URL(baseUrl.trim());
    return url.protocol === "https:" && url.hostname.toLowerCase() === "api.openai.com" && (url.pathname === "" || url.pathname === "/" || url.pathname === "/v1" || url.pathname === "/v1/");
  } catch {
    return false;
  }
}
function openAIProviderUsesCustomBaseUrl(config) {
  return !isOfficialOpenAIBaseUrl(config?.models?.providers?.openai?.baseUrl);
}
function isOpenAIProvider(provider) {
  return (0, _providerIdCz7K6wgK.r)(provider ?? "") === OPENAI_PROVIDER_ID;
}
function isOpenAICodexProvider(provider) {
  return (0, _providerIdCz7K6wgK.r)(provider ?? "") === OPENAI_CODEX_PROVIDER_ID;
}
function openAIProviderUsesCodexRuntimeByDefault(params) {
  return isOpenAIProvider(params.provider) && !openAIProviderUsesCustomBaseUrl(params.config);
}
function parseModelRefProvider(value) {
  if (typeof value !== "string") return;
  const slashIndex = value.trim().indexOf("/");
  if (slashIndex <= 0) return;
  return (0, _providerIdCz7K6wgK.r)(value.trim().slice(0, slashIndex));
}
function modelSelectionShouldEnsureCodexPlugin(params) {
  const provider = parseModelRefProvider(params.model);
  if (provider === "openai-codex") return true;
  return provider === "openai" && !openAIProviderUsesCustomBaseUrl(params.config);
}
function hasOpenAICodexAuthProfileOverride(value) {
  return typeof value === "string" && (0, _stringCoerceLndEvhRk.s)(value)?.startsWith(`openai-codex:`) === true;
}
function configuredOpenAIAuthOrderStartsWithCodexProfile(config) {
  if (!openAIProviderUsesCodexRuntimeByDefault({
    provider: "openai",
    config
  })) return false;
  const firstProfile = (0, _providerIdCz7K6wgK.n)(config?.auth?.order, OPENAI_PROVIDER_ID)?.find((profileId) => typeof profileId === "string" && profileId.trim().length > 0);
  return hasOpenAICodexAuthProfileOverride(firstProfile);
}
function shouldRouteOpenAIPiThroughCodexAuthProvider(params) {
  if (!isOpenAIProvider(params.provider)) return false;
  if ((0, _runtimeT2SzTsE.t)(params.agentHarnessId ?? params.harnessRuntime) !== "pi") return false;
  if (!hasOpenAICodexAuthProfileOverride(params.authProfileId)) return false;
  const aliasLookupParams = {
    config: params.config,
    workspaceDir: params.workspaceDir
  };
  return (0, _providerAuthAliasesDEhinO0g.r)(params.authProfileProvider ?? params.authProfileId?.split(":", 1)[0] ?? "", aliasLookupParams) === OPENAI_CODEX_PROVIDER_ID;
}
function listOpenAIAuthProfileProvidersForAgentRuntime(params) {
  if (!isOpenAIProvider(params.provider)) return [params.provider];
  const runtime = (0, _runtimeT2SzTsE.t)(normalizeExplicitRuntimePin(params.agentHarnessId) ?? params.harnessRuntime);
  if (runtime === "codex") return [OPENAI_CODEX_PROVIDER_ID];
  if (runtime === "pi") {
    if (configuredOpenAIAuthOrderStartsWithCodexProfile(params.config)) return [OPENAI_CODEX_PROVIDER_ID, OPENAI_PROVIDER_ID];
    return [OPENAI_PROVIDER_ID, OPENAI_CODEX_PROVIDER_ID];
  }
  return [params.provider];
}
function normalizeExplicitRuntimePin(value) {
  if (typeof value !== "string" || !value.trim()) return;
  const runtime = (0, _runtimeT2SzTsE.t)(value);
  return runtime === "auto" || runtime === "default" ? void 0 : runtime;
}
function resolveOpenAIRuntimeProviderForPi(params) {
  return shouldRouteOpenAIPiThroughCodexAuthProvider(params) ? OPENAI_CODEX_PROVIDER_ID : params.provider;
}
function resolveSelectedOpenAIPiRuntimeProvider(params) {
  if (shouldRouteOpenAIPiThroughCodexAuthProvider(params)) return OPENAI_CODEX_PROVIDER_ID;
  const runtime = (0, _runtimeT2SzTsE.t)(params.agentHarnessId ?? params.harnessRuntime);
  if (!isOpenAIProvider(params.provider)) return params.provider;
  if (runtime === "codex") return OPENAI_CODEX_PROVIDER_ID;
  return runtime === "pi" && !params.authProfileId?.trim() && configuredOpenAIAuthOrderStartsWithCodexProfile(params.config) ? OPENAI_CODEX_PROVIDER_ID : params.provider;
}
function resolveContextConfigProviderForRuntime(params) {
  const provider = (0, _providerIdCz7K6wgK.r)(params.provider);
  const runtimeId = (0, _runtimeT2SzTsE.t)(params.runtimeId);
  if (provider === "openai" && runtimeId === "codex") return OPENAI_CODEX_PROVIDER_ID;
  return params.provider;
}
//#endregion /* v9-521bd4ee9b4063a4 */
