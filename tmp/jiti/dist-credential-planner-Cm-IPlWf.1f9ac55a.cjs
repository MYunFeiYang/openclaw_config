"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = void 0;exports.i = trimCredentialToUndefined;exports.n = hasGatewayPasswordEnvCandidate;exports.r = hasGatewayTokenEnvCandidate;exports.t = createGatewayCredentialPlan;var _stringCoerceBje8XVt = require("./string-coerce-Bje8XVt9.js");
var _envSubstitutionD05UO89C = require("./env-substitution-D05UO89C.js");
var _typesSecretsBHp0Y_k = require("./types.secrets-BHp0Y_k0.js");
//#region src/gateway/credential-planner.ts
const trimToUndefined = exports.a = _stringCoerceBje8XVt.c;
/**
* Like trimToUndefined but also rejects unresolved env var placeholders (e.g. `${VAR}`).
* This prevents literal placeholder strings like `${OPENCLAW_GATEWAY_TOKEN}` from being
* accepted as valid credentials when the referenced env var is missing.
* Note: legitimate credential values containing literal `${UPPER_CASE}` patterns will
* also be rejected, but this is an extremely unlikely edge case.
*/
function trimCredentialToUndefined(value) {
  const trimmed = trimToUndefined(value);
  if (trimmed && (0, _envSubstitutionD05UO89C.n)(trimmed)) return;
  return trimmed;
}
function hasGatewayTokenEnvCandidate(env = process.env) {
  return Boolean(trimToUndefined(env.OPENCLAW_GATEWAY_TOKEN));
}
function hasGatewayPasswordEnvCandidate(env = process.env) {
  return Boolean(trimToUndefined(env.OPENCLAW_GATEWAY_PASSWORD));
}
function resolveConfiguredGatewayCredentialInput(params) {
  const ref = (0, _typesSecretsBHp0Y_k.p)({
    value: params.value,
    defaults: params.defaults
  }).ref;
  return {
    path: params.path,
    configured: (0, _typesSecretsBHp0Y_k.o)(params.value, params.defaults),
    value: ref ? void 0 : trimToUndefined(params.value),
    refPath: ref ? params.path : void 0,
    hasSecretRef: ref !== null
  };
}
function createGatewayCredentialPlan(params) {
  const env = params.env ?? process.env;
  const gateway = params.config.gateway;
  const remote = gateway?.remote;
  const defaults = params.defaults ?? params.config.secrets?.defaults;
  const authMode = gateway?.auth?.mode;
  const envToken = trimToUndefined(env.OPENCLAW_GATEWAY_TOKEN);
  const envPassword = trimToUndefined(env.OPENCLAW_GATEWAY_PASSWORD);
  const localToken = resolveConfiguredGatewayCredentialInput({
    value: gateway?.auth?.token,
    defaults,
    path: "gateway.auth.token"
  });
  const localPassword = resolveConfiguredGatewayCredentialInput({
    value: gateway?.auth?.password,
    defaults,
    path: "gateway.auth.password"
  });
  const remoteToken = resolveConfiguredGatewayCredentialInput({
    value: remote?.token,
    defaults,
    path: "gateway.remote.token"
  });
  const remotePassword = resolveConfiguredGatewayCredentialInput({
    value: remote?.password,
    defaults,
    path: "gateway.remote.password"
  });
  const localTokenCanWin = authMode !== "password" && authMode !== "none" && authMode !== "trusted-proxy";
  const tokenCanWin = Boolean(envToken || localToken.configured || remoteToken.configured);
  const passwordCanWin = authMode === "password" || authMode === "trusted-proxy" || authMode !== "token" && authMode !== "none" && !tokenCanWin;
  const localTokenSurfaceActive = localTokenCanWin && !envToken && (authMode === "token" || authMode === void 0 && !(envPassword || localPassword.configured));
  const remoteMode = gateway?.mode === "remote";
  const remoteUrlConfigured = Boolean(trimToUndefined(remote?.url));
  const tailscaleRemoteExposure = gateway?.tailscale?.mode === "serve" || gateway?.tailscale?.mode === "funnel";
  const remoteConfiguredSurface = remoteMode || remoteUrlConfigured || tailscaleRemoteExposure;
  const remoteTokenFallbackActive = localTokenCanWin && !envToken && !localToken.configured;
  const remotePasswordFallbackActive = authMode !== "trusted-proxy" && !envPassword && !localPassword.configured && passwordCanWin;
  return {
    configuredMode: gateway?.mode === "remote" ? "remote" : "local",
    authMode,
    envToken,
    envPassword,
    localToken,
    localPassword,
    remoteToken,
    remotePassword,
    localTokenCanWin,
    localPasswordCanWin: passwordCanWin,
    localTokenSurfaceActive,
    tokenCanWin,
    passwordCanWin,
    remoteMode,
    remoteUrlConfigured,
    tailscaleRemoteExposure,
    remoteConfiguredSurface,
    remoteTokenFallbackActive,
    remoteTokenActive: remoteConfiguredSurface || remoteTokenFallbackActive,
    remotePasswordFallbackActive,
    remotePasswordActive: remoteConfiguredSurface || remotePasswordFallbackActive
  };
}
//#endregion /* v9-2d9354c98411aeaa */
