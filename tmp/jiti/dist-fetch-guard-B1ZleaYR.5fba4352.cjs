"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = withTrustedEnvProxyGuardedFetchMode;exports.i = withStrictGuardedFetchMode;exports.n = fetchWithSsrFGuard;exports.o = withTrustedExplicitProxyGuardedFetchMode;exports.r = retainSafeHeadersForCrossOriginRedirectHeaders;exports.t = void 0;var _loggerLY96ESJ = require("./logger-lY96ESJ4.js");
var _proxyEnvDPHGz7yn = require("./proxy-env-DPHGz7yn.js");
var _undiciRuntime8SDq9eZh = require("./undici-runtime-8SDq9eZh.js");
var _undiciGlobalDispatcherC07Pdb0O = require("./undici-global-dispatcher-C07Pdb0O.js");
var _fetchHeadersD02VVhDi = require("./fetch-headers-D02VVhDi.js");
var _redirectHeadersBen26iD = require("./redirect-headers-Ben26iD9.js");
var _ssrfDZjn8bFZ = require("./ssrf-DZjn8bFZ.js");
var _fetchTimeoutCzT_eJ6W = require("./fetch-timeout-CzT_eJ6W.js");
var _runtimeFetchToBUJG = require("./runtime-fetch-toB-UJG3.js");function _interopRequireWildcard(e, t) {if ("function" == typeof WeakMap) var r = new WeakMap(),n = new WeakMap();return (_interopRequireWildcard = function (e, t) {if (!t && e && e.__esModule) return e;var o,i,f = { __proto__: null, default: e };if (null === e || "object" != typeof e && "function" != typeof e) return f;if (o = t ? n : r) {if (o.has(e)) return o.get(e);o.set(e, f);}for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]);return f;})(e, t);}
//#region src/infra/net/fetch-guard.ts
function resolveDispatcherTimeoutMs(fromParams) {
  if (fromParams !== void 0) return fromParams;
  if (_undiciGlobalDispatcherC07Pdb0O.o !== void 0) return _undiciGlobalDispatcherC07Pdb0O.o;
}
const GUARDED_FETCH_MODE = exports.t = {
  STRICT: "strict",
  TRUSTED_ENV_PROXY: "trusted_env_proxy",
  TRUSTED_EXPLICIT_PROXY: "trusted_explicit_proxy"
};
const DEFAULT_MAX_REDIRECTS = 3;
const OPENCLAW_DEBUG_PROXY_ENABLED = "OPENCLAW_DEBUG_PROXY_ENABLED";
function isTruthyEnvValue(value) {
  return value === "1" || value === "true" || value === "yes" || value === "on";
}
function withStrictGuardedFetchMode(params) {
  return {
    ...params,
    mode: GUARDED_FETCH_MODE.STRICT
  };
}
function withTrustedEnvProxyGuardedFetchMode(params) {
  return {
    ...params,
    mode: GUARDED_FETCH_MODE.TRUSTED_ENV_PROXY
  };
}
function withTrustedExplicitProxyGuardedFetchMode(params) {
  return {
    ...params,
    mode: GUARDED_FETCH_MODE.TRUSTED_EXPLICIT_PROXY
  };
}
function resolveGuardedFetchMode(params) {
  if (params.mode) return params.mode;
  if (params.proxy === "env" && params.dangerouslyAllowEnvProxyWithoutPinnedDns === true) return GUARDED_FETCH_MODE.TRUSTED_ENV_PROXY;
  return GUARDED_FETCH_MODE.STRICT;
}
function isManagedProxyActive() {
  return process.env["OPENCLAW_PROXY_ACTIVE"] === "1";
}
function assertExplicitProxySupportsPinnedDns(url, dispatcherPolicy, pinDns) {
  if (pinDns !== false && dispatcherPolicy?.mode === "explicit-proxy" && url.protocol !== "https:") throw new Error("Explicit proxy SSRF pinning requires HTTPS targets; plain HTTP targets are not supported");
}
function createPolicyDispatcherWithoutPinnedDns(dispatcherPolicy, timeoutMs) {
  if (!dispatcherPolicy) return null;
  if (dispatcherPolicy.mode === "direct") return (0, _undiciRuntime8SDq9eZh.t)(dispatcherPolicy.connect ? { connect: { ...dispatcherPolicy.connect } } : void 0, timeoutMs);
  if (dispatcherPolicy.mode === "env-proxy") return (0, _undiciRuntime8SDq9eZh.n)({
    ...(dispatcherPolicy.connect ? { connect: { ...dispatcherPolicy.connect } } : {}),
    ...(dispatcherPolicy.proxyTls ? { proxyTls: { ...dispatcherPolicy.proxyTls } } : {})
  }, timeoutMs);
  const proxyUrl = dispatcherPolicy.proxyUrl.trim();
  if (dispatcherPolicy.proxyTls) return (0, _undiciRuntime8SDq9eZh.r)({
    uri: proxyUrl,
    requestTls: { ...dispatcherPolicy.proxyTls }
  }, timeoutMs);
  return (0, _undiciRuntime8SDq9eZh.r)({ uri: proxyUrl }, timeoutMs);
}
async function assertExplicitProxyAllowed(dispatcherPolicy, lookupFn, policy) {
  if (!dispatcherPolicy || dispatcherPolicy.mode !== "explicit-proxy") return;
  let parsedProxyUrl;
  try {
    parsedProxyUrl = new URL(dispatcherPolicy.proxyUrl);
  } catch {
    throw new Error("Invalid explicit proxy URL");
  }
  if (!["http:", "https:"].includes(parsedProxyUrl.protocol)) throw new Error("Explicit proxy URL must use http or https");
  const proxyPolicy = policy || dispatcherPolicy.allowPrivateProxy === true ? {
    ...policy,
    hostnameAllowlist: void 0,
    ...(dispatcherPolicy.allowPrivateProxy === true ? { allowPrivateNetwork: true } : {})
  } : void 0;
  await (0, _ssrfDZjn8bFZ._)(parsedProxyUrl.hostname, {
    lookupFn,
    policy: proxyPolicy
  });
}
function isRedirectStatus(status) {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308;
}
function isAmbientGlobalFetch(params) {
  return typeof params.fetchImpl === "function" && typeof params.globalFetch === "function" && params.fetchImpl === params.globalFetch;
}
function retainSafeHeadersForCrossOriginRedirectHeaders(headers) {
  return (0, _redirectHeadersBen26iD.t)(headers);
}
async function captureGuardedFetchExchange(params) {
  if (params.capture === false || !isTruthyEnvValue(process.env[OPENCLAW_DEBUG_PROXY_ENABLED])) return;
  const { captureHttpExchange } = await Promise.resolve().then(() => jitiImport("./runtime-BDYCMo17.js").then((m) => _interopRequireWildcard(m)));
  captureHttpExchange({
    url: params.url,
    method: params.method,
    requestHeaders: params.requestHeaders,
    requestBody: params.requestBody,
    response: params.response,
    transport: params.transport,
    flowId: params.capture?.flowId,
    meta: {
      captureOrigin: "guarded-fetch",
      ...(params.auditContext ? { auditContext: params.auditContext } : {}),
      ...params.capture?.meta
    }
  });
}
function retainSafeHeadersForCrossOriginRedirect(init) {
  if (!init?.headers) return init;
  return {
    ...init,
    headers: (0, _redirectHeadersBen26iD.t)(init.headers)
  };
}
function dropBodyHeaders(headers) {
  if (!headers) return headers;
  const nextHeaders = new Headers((0, _fetchHeadersD02VVhDi.t)(headers));
  nextHeaders.delete("content-encoding");
  nextHeaders.delete("content-language");
  nextHeaders.delete("content-length");
  nextHeaders.delete("content-location");
  nextHeaders.delete("content-type");
  nextHeaders.delete("transfer-encoding");
  return nextHeaders;
}
function rewriteRedirectInitForMethod(params) {
  const { init, status } = params;
  if (!init) return init;
  const currentMethod = init.method?.toUpperCase() ?? "GET";
  if (!(status === 303 ? currentMethod !== "GET" && currentMethod !== "HEAD" : (status === 301 || status === 302) && currentMethod === "POST")) return init;
  return {
    ...init,
    method: "GET",
    body: void 0,
    headers: dropBodyHeaders(init.headers)
  };
}
function rewriteRedirectInitForCrossOrigin(params) {
  const { init, allowUnsafeReplay } = params;
  if (!init || allowUnsafeReplay) return init;
  const currentMethod = init.method?.toUpperCase() ?? "GET";
  if (currentMethod === "GET" || currentMethod === "HEAD") return init;
  return {
    ...init,
    body: void 0,
    headers: dropBodyHeaders(init.headers)
  };
}
async function fetchWithSsrFGuard(params) {
  const defaultFetch = params.fetchImpl ?? globalThis.fetch;
  if (!defaultFetch) throw new Error("fetch is not available");
  const isUsingMockedFetch = (0, _runtimeFetchToBUJG.r)(defaultFetch);
  const maxRedirects = typeof params.maxRedirects === "number" && Number.isFinite(params.maxRedirects) ? Math.max(0, Math.floor(params.maxRedirects)) : DEFAULT_MAX_REDIRECTS;
  const mode = resolveGuardedFetchMode(params);
  const { signal, cleanup, refresh } = (0, _fetchTimeoutCzT_eJ6W.n)({
    timeoutMs: params.timeoutMs,
    signal: params.signal,
    operation: "fetchWithSsrFGuard",
    url: params.url
  });
  let released = false;
  const release = async (dispatcher) => {
    if (released) return;
    released = true;
    cleanup();
    await (0, _ssrfDZjn8bFZ.i)(dispatcher ?? void 0);
  };
  const visited = new Set([params.url]);
  let currentUrl = params.url;
  let currentInit = (0, _fetchHeadersD02VVhDi.n)(params.init ? { ...params.init } : void 0);
  let redirectCount = 0;
  while (true) {
    let parsedUrl;
    try {
      parsedUrl = new URL(currentUrl);
    } catch {
      await release();
      throw new Error("Invalid URL: must be http or https");
    }
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      await release();
      throw new Error("Invalid URL: must be http or https");
    }
    if (params.requireHttps === true && parsedUrl.protocol !== "https:") {
      await release();
      throw new Error("URL must use https");
    }
    let dispatcher = null;
    const policyForUrl = (0, _ssrfDZjn8bFZ.v)(parsedUrl, params.policy);
    try {
      const usesTrustedExplicitProxyMode = mode === GUARDED_FETCH_MODE.TRUSTED_EXPLICIT_PROXY && params.dispatcherPolicy?.mode === "explicit-proxy";
      assertExplicitProxySupportsPinnedDns(parsedUrl, params.dispatcherPolicy, usesTrustedExplicitProxyMode ? false : params.pinDns);
      await assertExplicitProxyAllowed(params.dispatcherPolicy, params.lookupFn, params.policy);
      const canUseTrustedEnvProxy = mode === GUARDED_FETCH_MODE.TRUSTED_ENV_PROXY && (0, _proxyEnvDPHGz7yn.c)(parsedUrl.toString());
      const canUseManagedProxy = mode === GUARDED_FETCH_MODE.STRICT && isManagedProxyActive() && (0, _proxyEnvDPHGz7yn.i)();
      const canUseMockedFetchWithoutDns = isUsingMockedFetch && params.lookupFn === void 0 && !canUseTrustedEnvProxy && !canUseManagedProxy && !usesTrustedExplicitProxyMode && params.pinDns !== false;
      const timeoutMs = resolveDispatcherTimeoutMs(params.timeoutMs);
      if (canUseTrustedEnvProxy || params.pinDns === false) (0, _ssrfDZjn8bFZ.n)(parsedUrl.hostname, policyForUrl);
      if (canUseTrustedEnvProxy) dispatcher = (0, _undiciRuntime8SDq9eZh.n)(void 0, timeoutMs);else
      if (canUseManagedProxy) {
        await (0, _ssrfDZjn8bFZ._)(parsedUrl.hostname, {
          lookupFn: params.lookupFn,
          policy: policyForUrl
        });
        dispatcher = (0, _undiciRuntime8SDq9eZh.n)(void 0, timeoutMs);
      } else if (usesTrustedExplicitProxyMode) {
        (0, _ssrfDZjn8bFZ.n)(parsedUrl.hostname, policyForUrl);
        dispatcher = createPolicyDispatcherWithoutPinnedDns(params.dispatcherPolicy, timeoutMs);
      } else if (canUseMockedFetchWithoutDns) (0, _ssrfDZjn8bFZ.n)(parsedUrl.hostname, policyForUrl);else
      if (params.pinDns === false) {
        await (0, _ssrfDZjn8bFZ._)(parsedUrl.hostname, {
          lookupFn: params.lookupFn,
          policy: policyForUrl
        });
        dispatcher = createPolicyDispatcherWithoutPinnedDns(params.dispatcherPolicy, timeoutMs);
      } else dispatcher = (0, _ssrfDZjn8bFZ.a)(await (0, _ssrfDZjn8bFZ._)(parsedUrl.hostname, {
        lookupFn: params.lookupFn,
        policy: policyForUrl
      }), params.dispatcherPolicy, policyForUrl, timeoutMs);
      const init = {
        ...(currentInit ? { ...currentInit } : {}),
        redirect: "manual",
        ...(dispatcher ? { dispatcher } : {}),
        ...(signal ? { signal } : {})
      };
      const supportsDispatcherInit = params.fetchImpl !== void 0 && !isAmbientGlobalFetch({
        fetchImpl: params.fetchImpl,
        globalFetch: globalThis.fetch
      }) || isUsingMockedFetch;
      const response = Boolean(dispatcher) && !supportsDispatcherInit ? await (0, _runtimeFetchToBUJG.t)(parsedUrl.toString(), init) : await defaultFetch(parsedUrl.toString(), init);
      await captureGuardedFetchExchange({
        url: parsedUrl.toString(),
        method: currentInit?.method ?? "GET",
        requestHeaders: currentInit?.headers,
        requestBody: currentInit?.body ?? null,
        response,
        transport: "http",
        capture: params.capture,
        auditContext: params.auditContext
      });
      if (isRedirectStatus(response.status)) {
        const location = response.headers.get("location");
        if (!location) {
          await release(dispatcher);
          throw new Error(`Redirect missing location header (${response.status})`);
        }
        redirectCount += 1;
        if (redirectCount > maxRedirects) {
          await release(dispatcher);
          throw new Error(`Too many redirects (limit: ${maxRedirects})`);
        }
        const nextParsedUrl = new URL(location, parsedUrl);
        const nextUrl = nextParsedUrl.toString();
        if (visited.has(nextUrl)) {
          await release(dispatcher);
          throw new Error("Redirect loop detected");
        }
        currentInit = rewriteRedirectInitForMethod({
          init: currentInit,
          status: response.status
        });
        if (nextParsedUrl.origin !== parsedUrl.origin) {
          currentInit = rewriteRedirectInitForCrossOrigin({
            init: currentInit,
            allowUnsafeReplay: params.allowCrossOriginUnsafeRedirectReplay === true
          });
          currentInit = retainSafeHeadersForCrossOriginRedirect(currentInit);
        }
        visited.add(nextUrl);
        response.body?.cancel();
        await (0, _ssrfDZjn8bFZ.i)(dispatcher);
        currentUrl = nextUrl;
        continue;
      }
      return {
        response,
        finalUrl: currentUrl,
        release: async () => release(dispatcher),
        refreshTimeout: refresh
      };
    } catch (err) {
      if (err instanceof _ssrfDZjn8bFZ.t) (0, _loggerLY96ESJ.a)(`security: blocked URL fetch (${params.auditContext ?? "url-fetch"}) targetOrigin=${parsedUrl.origin} reason=${err.message}`);
      await release(dispatcher);
      throw err;
    }
  }
}
//#endregion /* v9-c0d58993c9eef035 */
