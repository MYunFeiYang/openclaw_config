"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = callGatewayLeastPrivilege;exports.c = randomIdempotencyKey;exports.i = callGatewayCli;exports.l = resolveExplicitGatewayAuth;exports.n = buildGatewayConnectionDetails;exports.o = callGatewayScoped;exports.r = callGateway;exports.s = ensureExplicitGatewayAuth;exports.t = void 0;var _stringCoerceBje8XVt = require("./string-coerce-Bje8XVt9.js");
var _pathsB2cMKWd = require("./paths-B2cMK-wd.js");
var _versionBidqAEUl = require("./version-BidqAEUl.js");
var _credentialPlannerCmIPlWf = require("./credential-planner-Cm-IPlWf.js");
require("./credentials-B-149jP7.js");
var _ipT2vr43pL = require("./ip-t2vr43pL.js");
var _ioB4W7YRox = require("./io-B4W7YRox.js");
var _clientC_yF1Jx = require("./client-C_yF1Jx2.js");
var _timerDelayB1w7n53b = require("./timer-delay-B1w7n53b.js");
var _deviceIdentity6T2GrNBP = require("./device-identity-6T2GrNBP.js");
var _clientInfoBhnDRj_s = require("./client-info-BhnDRj_s.js");
require("./message-channel-BWqMq4di.js");
require("./protocol-BvHKcb_2.js");
var _methodScopesC931ndUQ = require("./method-scopes-C931ndUQ.js");
var _gatewayChoMsZEr = require("./gateway-ChoMsZEr.js");
var _connectionDetails6534Mgqp = require("./connection-details-6534Mgqp.js");
var _credentialsSecretInputsDulDir6k = require("./credentials-secret-inputs-DulDir6k.js");
var _explicitConnectionPolicyOdATUQu = require("./explicit-connection-policy-odATUQu5.js");
var _nodeCrypto = require("node:crypto");
//#region src/gateway/call.ts
const defaultCreateGatewayClient = (opts) => new _clientC_yF1Jx.t(opts);
const defaultGatewayCallDeps = {
  createGatewayClient: defaultCreateGatewayClient,
  getRuntimeConfig: _ioB4W7YRox.i,
  loadOrCreateDeviceIdentity: _deviceIdentity6T2GrNBP.r,
  resolveGatewayPort: _pathsB2cMKWd.u,
  resolveConfigPath: _pathsB2cMKWd.o,
  resolveStateDir: _pathsB2cMKWd._,
  loadGatewayTlsRuntime: _gatewayChoMsZEr.t
};
const gatewayCallDeps = { ...defaultGatewayCallDeps };
async function stopGatewayClient(client) {
  try {
    await client.stopAndWait({ timeoutMs: 1e3 });
  } catch {
    client.stop();
  }
}
function resolveGatewayClientDisplayName(opts) {
  if (opts.clientDisplayName) return opts.clientDisplayName;
  const clientName = opts.clientName ?? _clientInfoBhnDRj_s.i.CLI;
  if ((opts.mode ?? _clientInfoBhnDRj_s.r.CLI) !== _clientInfoBhnDRj_s.r.BACKEND && clientName !== _clientInfoBhnDRj_s.i.GATEWAY_CLIENT) return;
  const method = opts.method.trim();
  return method ? `gateway:${method}` : "gateway:request";
}
function loadGatewayConfig() {
  return (typeof gatewayCallDeps.getRuntimeConfig === "function" ? gatewayCallDeps.getRuntimeConfig : typeof defaultGatewayCallDeps.getRuntimeConfig === "function" ? defaultGatewayCallDeps.getRuntimeConfig : _ioB4W7YRox.i)();
}
function resolveGatewayStateDir(env) {
  return (typeof gatewayCallDeps.resolveStateDir === "function" ? gatewayCallDeps.resolveStateDir : _pathsB2cMKWd._)(env);
}
function resolveGatewayConfigPath(env) {
  return (typeof gatewayCallDeps.resolveConfigPath === "function" ? gatewayCallDeps.resolveConfigPath : _pathsB2cMKWd.o)(env, resolveGatewayStateDir(env));
}
function resolveGatewayPortValue(config, env) {
  return (typeof gatewayCallDeps.resolveGatewayPort === "function" ? gatewayCallDeps.resolveGatewayPort : _pathsB2cMKWd.u)(config, env);
}
function buildGatewayConnectionDetails(options = {}) {
  return (0, _connectionDetails6534Mgqp.t)(options, {
    getRuntimeConfig: () => loadGatewayConfig(),
    resolveConfigPath: (env) => resolveGatewayConfigPath(env),
    resolveGatewayPort: (config, env) => resolveGatewayPortValue(config, env)
  });
}
const __testing = exports.t = {
  setDepsForTests(deps) {
    gatewayCallDeps.createGatewayClient = deps?.createGatewayClient ?? defaultGatewayCallDeps.createGatewayClient;
    gatewayCallDeps.getRuntimeConfig = deps?.getRuntimeConfig ?? defaultGatewayCallDeps.getRuntimeConfig;
    gatewayCallDeps.loadOrCreateDeviceIdentity = deps?.loadOrCreateDeviceIdentity ?? defaultGatewayCallDeps.loadOrCreateDeviceIdentity;
    gatewayCallDeps.resolveGatewayPort = deps?.resolveGatewayPort ?? defaultGatewayCallDeps.resolveGatewayPort;
    gatewayCallDeps.resolveConfigPath = deps?.resolveConfigPath ?? defaultGatewayCallDeps.resolveConfigPath;
    gatewayCallDeps.resolveStateDir = deps?.resolveStateDir ?? defaultGatewayCallDeps.resolveStateDir;
    gatewayCallDeps.loadGatewayTlsRuntime = deps?.loadGatewayTlsRuntime ?? defaultGatewayCallDeps.loadGatewayTlsRuntime;
  },
  setCreateGatewayClientForTests(createGatewayClient) {
    gatewayCallDeps.createGatewayClient = createGatewayClient ?? defaultGatewayCallDeps.createGatewayClient;
  },
  resetDepsForTests() {
    gatewayCallDeps.createGatewayClient = defaultGatewayCallDeps.createGatewayClient;
    gatewayCallDeps.getRuntimeConfig = defaultGatewayCallDeps.getRuntimeConfig;
    gatewayCallDeps.loadOrCreateDeviceIdentity = defaultGatewayCallDeps.loadOrCreateDeviceIdentity;
    gatewayCallDeps.resolveGatewayPort = defaultGatewayCallDeps.resolveGatewayPort;
    gatewayCallDeps.resolveConfigPath = defaultGatewayCallDeps.resolveConfigPath;
    gatewayCallDeps.resolveStateDir = defaultGatewayCallDeps.resolveStateDir;
    gatewayCallDeps.loadGatewayTlsRuntime = defaultGatewayCallDeps.loadGatewayTlsRuntime;
  }
};
function isLoopbackGatewayUrl(rawUrl) {
  try {
    const hostname = new URL(rawUrl).hostname.toLowerCase();
    const unbracketed = hostname.startsWith("[") && hostname.endsWith("]") ? hostname.slice(1, -1) : hostname;
    return unbracketed === "localhost" || (0, _ipT2vr43pL.u)(unbracketed);
  } catch {
    return false;
  }
}
function shouldOmitDeviceIdentityForGatewayCall(params) {
  const mode = params.opts.mode ?? _clientInfoBhnDRj_s.r.CLI;
  const clientName = params.opts.clientName ?? _clientInfoBhnDRj_s.i.CLI;
  const hasSharedAuth = Boolean(params.token || params.password);
  return mode === _clientInfoBhnDRj_s.r.BACKEND && clientName === _clientInfoBhnDRj_s.i.GATEWAY_CLIENT && hasSharedAuth && isLoopbackGatewayUrl(params.url);
}
function resolveDeviceIdentityForGatewayCall(params) {
  if (shouldOmitDeviceIdentityForGatewayCall(params)) return null;
  try {
    return gatewayCallDeps.loadOrCreateDeviceIdentity();
  } catch {
    return null;
  }
}
function resolveExplicitGatewayAuth(opts) {
  return {
    token: typeof opts?.token === "string" && opts.token.trim().length > 0 ? opts.token.trim() : void 0,
    password: typeof opts?.password === "string" && opts.password.trim().length > 0 ? opts.password.trim() : void 0
  };
}
function ensureExplicitGatewayAuth(params) {
  if (!params.urlOverride) return;
  const explicitToken = params.explicitAuth?.token;
  const explicitPassword = params.explicitAuth?.password;
  if (params.urlOverrideSource === "cli" && (explicitToken || explicitPassword)) return;
  const hasResolvedAuth = params.resolvedAuth?.token || params.resolvedAuth?.password || explicitToken || explicitPassword;
  if (params.urlOverrideSource === "env" && hasResolvedAuth) return;
  const message = [
  "gateway url override requires explicit credentials",
  params.errorHint,
  params.configPath ? `Config: ${params.configPath}` : void 0].
  filter(Boolean).join("\n");
  throw new Error(message);
}
function resolveGatewayCallTimeout(timeoutValue) {
  const timeoutMs = typeof timeoutValue === "number" && Number.isFinite(timeoutValue) ? timeoutValue : 1e4;
  return {
    timeoutMs,
    safeTimerTimeoutMs: (0, _timerDelayB1w7n53b.n)(timeoutMs)
  };
}
function resolveGatewayCallContext(opts) {
  const cliUrlOverride = (0, _credentialPlannerCmIPlWf.a)(opts.url);
  const explicitAuth = resolveExplicitGatewayAuth({
    token: opts.token,
    password: opts.password
  });
  const envUrlOverride = cliUrlOverride ? void 0 : (0, _credentialPlannerCmIPlWf.a)(process.env.OPENCLAW_GATEWAY_URL);
  const urlOverride = cliUrlOverride ?? envUrlOverride;
  const urlOverrideSource = cliUrlOverride ? "cli" : envUrlOverride ? "env" : void 0;
  const canSkipConfigLoad = (0, _explicitConnectionPolicyOdATUQu.t)({
    config: opts.config,
    urlOverride,
    explicitAuth
  });
  const config = opts.config ?? (canSkipConfigLoad ? {} : loadGatewayConfig());
  const configPath = opts.configPath ?? resolveGatewayConfigPath(process.env);
  const isRemoteMode = config.gateway?.mode === "remote";
  const remote = isRemoteMode ? config.gateway?.remote : void 0;
  return {
    config,
    configPath,
    isRemoteMode,
    remote,
    urlOverride,
    urlOverrideSource,
    remoteUrl: (0, _credentialPlannerCmIPlWf.a)(remote?.url),
    explicitAuth
  };
}
function ensureRemoteModeUrlConfigured(context) {
  if (!context.isRemoteMode || context.urlOverride || context.remoteUrl) return;
  throw new Error([
  "gateway remote mode misconfigured: gateway.remote.url missing",
  `Config: ${context.configPath}`,
  "Fix: set gateway.remote.url, or set gateway.mode=local."].
  join("\n"));
}
async function resolveGatewayCredentials(context) {
  return resolveGatewayCredentialsWithEnv(context, process.env);
}
async function resolveGatewayCredentialsWithEnv(context, env) {
  if (context.explicitAuth.token || context.explicitAuth.password) return {
    token: context.explicitAuth.token,
    password: context.explicitAuth.password
  };
  return (0, _credentialsSecretInputsDulDir6k.t)({
    config: context.config,
    explicitAuth: context.explicitAuth,
    urlOverride: context.urlOverride,
    urlOverrideSource: context.urlOverrideSource,
    env,
    modeOverride: context.modeOverride,
    localTokenPrecedence: context.localTokenPrecedence,
    localPasswordPrecedence: context.localPasswordPrecedence,
    remoteTokenPrecedence: context.remoteTokenPrecedence,
    remotePasswordPrecedence: context.remotePasswordPrecedence,
    remoteTokenFallback: context.remoteTokenFallback,
    remotePasswordFallback: context.remotePasswordFallback
  });
}
async function resolveGatewayTlsFingerprint(params) {
  const { opts, context, url } = params;
  const tlsRuntime = context.config.gateway?.tls?.enabled === true && !context.urlOverrideSource && !context.remoteUrl && url.startsWith("wss://") ? await gatewayCallDeps.loadGatewayTlsRuntime(context.config.gateway?.tls) : void 0;
  const overrideTlsFingerprint = (0, _credentialPlannerCmIPlWf.a)(opts.tlsFingerprint);
  const remoteTlsFingerprint = context.isRemoteMode && context.urlOverrideSource !== "cli" ? (0, _credentialPlannerCmIPlWf.a)(context.remote?.tlsFingerprint) : void 0;
  return overrideTlsFingerprint || remoteTlsFingerprint || (tlsRuntime?.enabled ? tlsRuntime.fingerprintSha256 : void 0);
}
function formatGatewayCloseError(code, reason, connectionDetails) {
  const reasonText = (0, _stringCoerceBje8XVt.c)(reason) || "no close reason";
  const hint = code === 1006 ? "abnormal closure (no close frame)" : code === 1e3 ? "normal closure" : "";
  let message = `gateway closed (${code}${hint ? ` ${hint}` : ""}): ${reasonText}\n${connectionDetails.message}`;
  if (code === 1006) message += "\n\nPossible causes:\n- Gateway not yet ready to accept connections (retry after a moment)\n- TLS mismatch (connecting with ws:// to a wss:// gateway, or vice versa)\n- Gateway crashed or was terminated unexpectedly\nRun `openclaw doctor` for diagnostics.";
  return message;
}
function formatGatewayTimeoutError(timeoutMs, connectionDetails) {
  return `gateway timeout after ${timeoutMs}ms\n${connectionDetails.message}`;
}
function ensureGatewaySupportsRequiredMethods(params) {
  const requiredMethods = Array.isArray(params.requiredMethods) ? params.requiredMethods.map((entry) => entry.trim()).filter((entry) => entry.length > 0) : [];
  if (requiredMethods.length === 0) return;
  const supportedMethods = new Set((Array.isArray(params.methods) ? params.methods : []).map((entry) => entry.trim()).filter((entry) => entry.length > 0));
  for (const method of requiredMethods) {
    if (supportedMethods.has(method)) continue;
    throw new Error([`active gateway does not support required method "${method}" for "${params.attemptedMethod}".`, "Update the gateway or run without SecretRefs."].join(" "));
  }
}
async function executeGatewayRequestWithScopes(params) {
  const { opts, scopes, url, token, password, tlsFingerprint, timeoutMs, safeTimerTimeoutMs } = params;
  await new Promise((r) => setImmediate(r));
  return await new Promise((resolve, reject) => {
    let settled = false;
    let ignoreClose = false;
    const stop = (err, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      stopGatewayClient(client).finally(() => {
        if (err) reject(err);else
        resolve(value);
      });
    };
    const client = gatewayCallDeps.createGatewayClient({
      url,
      token,
      password,
      tlsFingerprint,
      instanceId: opts.instanceId ?? (0, _nodeCrypto.randomUUID)(),
      clientName: opts.clientName ?? _clientInfoBhnDRj_s.i.CLI,
      clientDisplayName: resolveGatewayClientDisplayName(opts),
      clientVersion: opts.clientVersion ?? _versionBidqAEUl.n,
      platform: opts.platform,
      mode: opts.mode ?? _clientInfoBhnDRj_s.r.CLI,
      role: "operator",
      scopes,
      deviceIdentity: opts.deviceIdentity === void 0 ? resolveDeviceIdentityForGatewayCall({
        opts,
        url,
        token,
        password
      }) : opts.deviceIdentity,
      minProtocol: opts.minProtocol ?? 3,
      maxProtocol: opts.maxProtocol ?? 3,
      onHelloOk: async (hello) => {
        try {
          ensureGatewaySupportsRequiredMethods({
            requiredMethods: opts.requiredMethods,
            methods: hello.features?.methods,
            attemptedMethod: opts.method
          });
          const result = await client.request(opts.method, opts.params, {
            expectFinal: opts.expectFinal,
            timeoutMs: opts.timeoutMs
          });
          ignoreClose = true;
          stop(void 0, result);
        } catch (err) {
          ignoreClose = true;
          stop(err);
        }
      },
      onClose: (code, reason) => {
        if (settled || ignoreClose) return;
        ignoreClose = true;
        stop(new Error(formatGatewayCloseError(code, reason, params.connectionDetails)));
      }
    });
    const timer = setTimeout(() => {
      ignoreClose = true;
      stop(new Error(formatGatewayTimeoutError(timeoutMs, params.connectionDetails)));
    }, safeTimerTimeoutMs);
    client.start();
  });
}
async function callGatewayWithScopes(opts, scopes) {
  const { timeoutMs, safeTimerTimeoutMs } = resolveGatewayCallTimeout(opts.timeoutMs);
  const context = resolveGatewayCallContext(opts);
  const resolvedCredentials = await resolveGatewayCredentials(context);
  ensureExplicitGatewayAuth({
    urlOverride: context.urlOverride,
    urlOverrideSource: context.urlOverrideSource,
    explicitAuth: context.explicitAuth,
    resolvedAuth: resolvedCredentials,
    errorHint: "Fix: pass --token or --password (or gatewayToken in tools).",
    configPath: context.configPath
  });
  ensureRemoteModeUrlConfigured(context);
  const connectionDetails = buildGatewayConnectionDetails({
    config: context.config,
    url: context.urlOverride,
    urlSource: context.urlOverrideSource,
    ...(opts.configPath ? { configPath: opts.configPath } : {})
  });
  const url = connectionDetails.url;
  const tlsFingerprint = await resolveGatewayTlsFingerprint({
    opts,
    context,
    url
  });
  const { token, password } = resolvedCredentials;
  return await executeGatewayRequestWithScopes({
    opts,
    scopes,
    url,
    token,
    password,
    tlsFingerprint,
    timeoutMs,
    safeTimerTimeoutMs,
    connectionDetails
  });
}
async function callGatewayScoped(opts) {
  return await callGatewayWithScopes(opts, opts.scopes);
}
async function callGatewayCli(opts) {
  return await callGatewayWithScopes(opts, Array.isArray(opts.scopes) ? opts.scopes : _methodScopesC931ndUQ.t);
}
async function callGatewayLeastPrivilege(opts) {
  return await callGatewayWithScopes(opts, (0, _methodScopesC931ndUQ.a)(opts.method));
}
async function callGateway(opts) {
  const callerMode = opts.mode ?? _clientInfoBhnDRj_s.r.BACKEND;
  const callerName = opts.clientName ?? _clientInfoBhnDRj_s.i.GATEWAY_CLIENT;
  if (callerMode === _clientInfoBhnDRj_s.r.CLI || callerName === _clientInfoBhnDRj_s.i.CLI) return await callGatewayCli(opts);
  if (Array.isArray(opts.scopes)) return await callGatewayWithScopes({
    ...opts,
    mode: callerMode,
    clientName: callerName
  }, opts.scopes);
  return await callGatewayLeastPrivilege({
    ...opts,
    mode: callerMode,
    clientName: callerName
  });
}
function randomIdempotencyKey() {
  return (0, _nodeCrypto.randomUUID)();
}
//#endregion /* v9-605f43b1fdc4c723 */
