"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.installGlobalProxy = void 0;exports.installProxyline = installProxyline;var _nodeHttp = _interopRequireDefault(require("node:http"));
var _nodeHttps = _interopRequireDefault(require("node:https"));
var _nodeAsync_hooks = require("node:async_hooks");
var _nodeNet = _interopRequireDefault(require("node:net"));
var _undici = require("undici");
var _env = require("./env.js");
var _nodeHttp2 = require("./node-http.js");
var _shared = require("./shared.js");
var _dispatcherBrand = require("./dispatcher-brand.js");function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}
let activeRuntime;
let activeHandle;
// Node's global fetch types come from bundled undici-types, while the runtime
// implementation intentionally delegates to this package's undici dependency.
const proxylineHeaders = _undici.Headers;
const proxylineRequest = _undici.Request;
const proxylineResponse = _undici.Response;
const proxylineFormData = _undici.FormData;
function getRequestDispatcher(request) {
  for (const symbol of Object.getOwnPropertySymbols(request)) {
    if (symbol.description !== "dispatcher") {
      continue;
    }
    return Reflect.get(request, symbol);
  }
  return undefined;
}
function isFetchRequestLike(value) {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value;
  return typeof record.url === "string" &&
  typeof record.method === "string" &&
  typeof record.arrayBuffer === "function" &&
  record.headers !== undefined;
}
async function createProxylineRequestFromRequestLike(request, options) {
  const init = {
    headers: request.headers,
    method: request.method
  };
  if (request.cache !== undefined) {
    init.cache = request.cache;
  }
  if (request.credentials !== undefined) {
    init.credentials = request.credentials;
  }
  if (request.integrity !== undefined) {
    init.integrity = request.integrity;
  }
  if (request.keepalive !== undefined) {
    init.keepalive = request.keepalive;
  }
  if (request.mode !== undefined) {
    init.mode = request.mode;
  }
  if (request.redirect !== undefined) {
    init.redirect = request.redirect;
  }
  if (request.referrer !== undefined) {
    init.referrer = request.referrer;
  }
  if (request.referrerPolicy !== undefined) {
    init.referrerPolicy = request.referrerPolicy;
  }
  if (options.preserveDispatcher) {
    const dispatcher = getRequestDispatcher(request);
    if (dispatcher !== undefined) {
      Reflect.set(init, "dispatcher", dispatcher);
    }
  }
  if (request.signal !== undefined) {
    init.signal = request.signal;
  }
  if (options.includeBody &&
  request.body !== null &&
  request.method !== "GET" &&
  request.method !== "HEAD") {
    init.body = request.body;
    init.duplex = "half";
  }
  const requestUnknown = Reflect.construct(proxylineRequest, [request.url, init]);
  if (!(requestUnknown instanceof proxylineRequest)) {
    throw new TypeError("Proxyline failed to normalize a fetch Request.");
  }
  return requestUnknown;
}
function requestInitOverridesBody(init) {
  if (typeof init !== "object" || init === null) {
    return false;
  }
  return "body" in init;
}
async function normalizeFetchInput(input, init, options) {
  if (input instanceof proxylineRequest && options.preserveDispatcher || !isFetchRequestLike(input)) {
    return input;
  }
  return await createProxylineRequestFromRequestLike(input, {
    includeBody: !requestInitOverridesBody(init),
    preserveDispatcher: options.preserveDispatcher
  });
}
function withManagedFetchDispatcher(init, dispatcher) {
  if (init !== undefined &&
  init !== null &&
  typeof init !== "object" &&
  typeof init !== "function") {
    throw new TypeError(`Request constructor: Expected ${String(init)} to be one of: Null, Undefined, Object.`);
  }
  const sanitized = init === undefined || init === null ? {} : Object.create(init);
  Reflect.defineProperty(sanitized, "dispatcher", {
    configurable: true,
    enumerable: true,
    value: dispatcher,
    writable: true
  });
  return sanitized;
}
const proxylineFetch = async (input, init) => {
  const managedDispatcher = activeRuntime?.mode === "managed" ?
  activeRuntime.installedDispatcher :
  undefined;
  const normalizedInput = await normalizeFetchInput(input, init, {
    preserveDispatcher: managedDispatcher === undefined
  });
  const normalizedInit = managedDispatcher === undefined ?
  init :
  withManagedFetchDispatcher(init, managedDispatcher);
  const response = await Reflect.apply(_undici.fetch, undefined, normalizedInit === undefined ? [normalizedInput] : [normalizedInput, normalizedInit]);
  if (!(response instanceof proxylineResponse)) {
    throw new TypeError("Proxyline fetch returned a non-Response value.");
  }
  return response;
};
function normalizeProxyUrl(value) {
  if (value === undefined) {
    return undefined;
  }
  const url = value instanceof URL ? new URL(value.href) : new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new _shared.ProxylineError("UNSUPPORTED_PROXY_PROTOCOL", `Proxyline only supports http:// and https:// proxy endpoints in this slice: ${url.protocol}`);
  }
  return url;
}
function emit(onEvent, event) {
  onEvent?.(event);
}
function isProxyableUrlProtocol(protocol) {
  return protocol === "http:" ||
  protocol === "https:" ||
  protocol === "ws:" ||
  protocol === "wss:";
}
function shouldBypassManagedProxy(bypassPolicy, bypasses, url, surface) {
  if (bypasses.has(url, surface)) {
    return true;
  }
  if (bypassPolicy === undefined) {
    return false;
  }
  return bypassPolicy({ surface, url: (0, _shared.formatUrl)(url) });
}
function bypassKey(url, surface) {
  return `${surface ?? "*"}\n${(0, _shared.formatUrl)(url)}`;
}
function createDynamicBypassRegistry() {
  const counts = new Map();
  const scopedBypasses = new _nodeAsync_hooks.AsyncLocalStorage();
  const hasScopedBypass = (url, surface) => {
    const scoped = scopedBypasses.getStore();
    return scoped !== undefined && (
    scoped.has(bypassKey(url, surface)) || scoped.has(bypassKey(url, undefined)));
  };
  return {
    add: (registration) => {
      const key = bypassKey(registration.url, registration.surface);
      counts.set(key, (counts.get(key) ?? 0) + 1);
      let stopped = false;
      return () => {
        if (stopped) {
          return;
        }
        stopped = true;
        const next = (counts.get(key) ?? 1) - 1;
        if (next <= 0) {
          counts.delete(key);
        } else
        {
          counts.set(key, next);
        }
      };
    },
    has: (url, surface) => hasScopedBypass(url, surface) ||
    (counts.get(bypassKey(url, surface)) ?? 0) > 0 ||
    (counts.get(bypassKey(url, undefined)) ?? 0) > 0,
    runScoped: (registration, run) => {
      const inherited = scopedBypasses.getStore();
      const scoped = new Set(inherited);
      scoped.add(bypassKey(registration.url, registration.surface));
      return scopedBypasses.run(scoped, run);
    }
  };
}
function proxyEnvSnapshotKey(env) {
  return JSON.stringify(env ?? _env.EMPTY_PROXY_ENV);
}
function createManagedProxyResolver(proxyUrl, bypassPolicy, bypasses) {
  const redactedProxyUrl = (0, _shared.redactProxyUrl)(proxyUrl);
  return {
    active: true,
    describeProxy: () => redactedProxyUrl,
    explain: (url, surface) => {
      const formattedUrl = (0, _shared.formatUrl)(url);
      if (!isProxyableUrlProtocol(new URL(url).protocol)) {
        return {
          kind: "direct",
          reason: "managed-proxy-unsupported-url-scheme",
          surface,
          url: formattedUrl
        };
      }
      if (shouldBypassManagedProxy(bypassPolicy, bypasses, url, surface)) {
        return {
          kind: "direct",
          reason: "managed-proxy-bypass-policy",
          surface,
          url: formattedUrl
        };
      }
      return {
        kind: "proxied",
        reason: "managed-proxy-active",
        surface,
        url: formattedUrl,
        proxyUrl: redactedProxyUrl
      };
    },
    getProxyForUrl: (url, surface = "unknown") => {
      const protocol = new URL(url).protocol;
      return isProxyableUrlProtocol(protocol) &&
      !shouldBypassManagedProxy(bypassPolicy, bypasses, url, surface) ?
      proxyUrl.href :
      "";
    }
  };
}
function finiteNonNegativeInteger(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ?
  Math.floor(value) :
  undefined;
}
function finitePositiveInteger(value) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ?
  Math.floor(value) :
  undefined;
}
function resolveUndiciBaseOptions(options) {
  const bodyTimeout = finiteNonNegativeInteger(options?.bodyTimeout);
  const headersTimeout = finiteNonNegativeInteger(options?.headersTimeout);
  return {
    ...(options?.allowH2 !== undefined ? { allowH2: options.allowH2 } : {}),
    ...(bodyTimeout !== undefined ? { bodyTimeout } : {}),
    ...(headersTimeout !== undefined ? { headersTimeout } : {}),
    ...(options?.connect !== undefined ?
    {
      connect: {
        ...(options.connect.autoSelectFamily !== undefined ?
        { autoSelectFamily: options.connect.autoSelectFamily } :
        {}),
        ...(finitePositiveInteger(options.connect.autoSelectFamilyAttemptTimeout) !== undefined ?
        {
          autoSelectFamilyAttemptTimeout: finitePositiveInteger(options.connect.autoSelectFamilyAttemptTimeout)
        } :
        {})
      }
    } :
    {})
  };
}
function createUndiciAgent(options) {
  return new _undici.Agent(resolveUndiciBaseOptions(options));
}
function isObjectRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function stripIpServernameFromConnectOptions(options) {
  if (!isObjectRecord(options) || typeof options.servername !== "string") {
    return options;
  }
  const servername = options.servername.replace(/^\[|\]$/g, "");
  if (_nodeNet.default.isIP(servername) === 0) {
    return options;
  }
  const next = { ...options };
  delete next.servername;
  return next;
}
function stripIpServernameFromConnect(connect) {
  if (typeof connect !== "function") {
    return connect;
  }
  return (options, callback) => connect(stripIpServernameFromConnectOptions(options), callback);
}
function createProxyClientFactory() {
  return (origin, options) => {
    const clientOptions = isObjectRecord(options) ?
    { ...options, connect: stripIpServernameFromConnect(options.connect) } :
    options;
    return new _undici.Pool(origin, clientOptions);
  };
}
function createUndiciProxyAgent(proxyUrl, options) {
  return new _undici.ProxyAgent({
    ...resolveUndiciBaseOptions(options.undici),
    uri: proxyUrl,
    clientFactory: createProxyClientFactory(),
    ...(options.proxyCa !== undefined ? { proxyTls: { ca: options.proxyCa } } : {})
  });
}
function createUndiciProxyDispatcher(options, dispatcherOptions) {
  if (options.mode === "ambient") {
    if (!options.active) {
      return createUndiciAgent(dispatcherOptions.undici);
    }
    return new AmbientUndiciDispatcher(options.env, dispatcherOptions);
  }
  return new ManagedUndiciDispatcher(options.resolver, dispatcherOptions);
}
function reportClosedDispatchError(handler, error) {
  const compatibleHandler = handler;
  if (compatibleHandler.onResponseError !== undefined) {
    compatibleHandler.onResponseError(null, error);
    return false;
  }
  if (compatibleHandler.onError !== undefined) {
    compatibleHandler.onError(error);
    return false;
  }
  throw error;
}
class ManagedUndiciDispatcher extends _undici.Dispatcher {
  [_dispatcherBrand.PROXYLINE_DISPATCHER_BRAND] = true;
  #directDispatcher;
  #dispatcherOptions;
  #proxyDispatchers = new Map();
  #resolver;
  #closedError;
  constructor(resolver, dispatcherOptions) {
    super();
    this.#resolver = resolver;
    this.#dispatcherOptions = dispatcherOptions;
    this.#directDispatcher = createUndiciAgent(dispatcherOptions.undici);
  }
  dispatch(options, handler) {
    if (this.#closedError !== undefined) {
      return reportClosedDispatchError(handler, this.#closedError);
    }
    const url = resolveUndiciDispatchUrl(options);
    const proxyUrl = url === undefined ? "" : this.#resolver.getProxyForUrl(url, "undici");
    const dispatcher = proxyUrl === "" ? this.#directDispatcher : this.#proxyDispatcher(proxyUrl);
    return dispatcher.dispatch(options, handler);
  }
  close(callback) {
    const closing = this.#closeAll();
    if (callback === undefined) {
      return closing;
    }
    closing.then(callback, callback);
  }
  destroy(errorOrCallback, callback) {
    const error = typeof errorOrCallback === "function" ? null : errorOrCallback ?? null;
    const destroyCallback = typeof errorOrCallback === "function" ? errorOrCallback : callback;
    const destroying = this.#destroyAll(error);
    if (destroyCallback === undefined) {
      return destroying;
    }
    destroying.then(destroyCallback, destroyCallback);
  }
  #proxyDispatcher(proxyUrl) {
    const existing = this.#proxyDispatchers.get(proxyUrl);
    if (existing !== undefined) {
      return existing;
    }
    const dispatcher = createUndiciProxyAgent(proxyUrl, this.#dispatcherOptions);
    this.#proxyDispatchers.set(proxyUrl, dispatcher);
    return dispatcher;
  }
  async #closeAll() {
    this.#closedError ??= new _undici.errors.ClientClosedError();
    const proxyDispatchers = [...this.#proxyDispatchers.values()];
    this.#proxyDispatchers.clear();
    await Promise.all([
    this.#directDispatcher.close(),
    ...proxyDispatchers.map((dispatcher) => dispatcher.close())]
    );
  }
  async #destroyAll(error) {
    this.#closedError ??= error ?? new _undici.errors.ClientDestroyedError();
    const proxyDispatchers = [...this.#proxyDispatchers.values()];
    this.#proxyDispatchers.clear();
    await Promise.all([
    this.#directDispatcher.destroy(error),
    ...proxyDispatchers.map((dispatcher) => dispatcher.destroy(error))]
    );
  }
}
class AmbientUndiciDispatcher extends _undici.Dispatcher {
  [_dispatcherBrand.PROXYLINE_DISPATCHER_BRAND] = true;
  #directDispatcher;
  #dispatcherOptions;
  #env;
  #proxyDispatchers = new Map();
  #closedError;
  constructor(env, dispatcherOptions) {
    super();
    this.#env = env;
    this.#dispatcherOptions = dispatcherOptions;
    this.#directDispatcher = createUndiciAgent(dispatcherOptions.undici);
  }
  dispatch(options, handler) {
    if (this.#closedError !== undefined) {
      return reportClosedDispatchError(handler, this.#closedError);
    }
    const url = resolveUndiciDispatchUrl(options);
    const proxyUrl = url === undefined ? undefined : (0, _env.resolveAmbientProxyForUrl)(url, this.#env);
    const dispatcher = proxyUrl === undefined ? this.#directDispatcher : this.#proxyDispatcher(proxyUrl);
    return dispatcher.dispatch(options, handler);
  }
  close(callback) {
    const closing = this.#closeAll();
    if (callback === undefined) {
      return closing;
    }
    closing.then(callback, callback);
  }
  destroy(errorOrCallback, callback) {
    const error = typeof errorOrCallback === "function" ? null : errorOrCallback ?? null;
    const destroyCallback = typeof errorOrCallback === "function" ? errorOrCallback : callback;
    const destroying = this.#destroyAll(error);
    if (destroyCallback === undefined) {
      return destroying;
    }
    destroying.then(destroyCallback, destroyCallback);
  }
  #proxyDispatcher(proxyUrl) {
    const existing = this.#proxyDispatchers.get(proxyUrl);
    if (existing !== undefined) {
      return existing;
    }
    const dispatcher = createUndiciProxyAgent(proxyUrl, this.#dispatcherOptions);
    this.#proxyDispatchers.set(proxyUrl, dispatcher);
    return dispatcher;
  }
  async #closeAll() {
    this.#closedError ??= new _undici.errors.ClientClosedError();
    const proxyDispatchers = [...this.#proxyDispatchers.values()];
    this.#proxyDispatchers.clear();
    await Promise.all([
    this.#directDispatcher.close(),
    ...proxyDispatchers.map((dispatcher) => dispatcher.close())]
    );
  }
  async #destroyAll(error) {
    this.#closedError ??= error ?? new _undici.errors.ClientDestroyedError();
    const proxyDispatchers = [...this.#proxyDispatchers.values()];
    this.#proxyDispatchers.clear();
    await Promise.all([
    this.#directDispatcher.destroy(error),
    ...proxyDispatchers.map((dispatcher) => dispatcher.destroy(error))]
    );
  }
}
function resolveUndiciDispatchUrl(options) {
  if (options.origin !== undefined) {
    const origin = options.origin.toString().replace(/\/$/, "");
    const path = options.path.startsWith("/") ? options.path : `/${options.path}`;
    return new URL(`${origin}${path}`).href;
  }
  try {
    return new URL(options.path).href;
  }
  catch {
    return undefined;
  }
}
function restoreNodeHttpSnapshot(snapshot) {
  _nodeHttp.default.request = snapshot.httpRequest;
  _nodeHttp.default.get = snapshot.httpGet;
  _nodeHttp.default.globalAgent = snapshot.httpGlobalAgent;
  _nodeHttps.default.request = snapshot.httpsRequest;
  _nodeHttps.default.get = snapshot.httpsGet;
  _nodeHttps.default.globalAgent = snapshot.httpsGlobalAgent;
}
function installRuntime(resolver, dispatcherOptions, proxyCa, options) {
  if (activeRuntime !== undefined) {
    throw new _shared.ProxylineError("RUNTIME_ALREADY_ACTIVE", "Proxyline already has an active runtime.");
  }
  const snapshot = {
    httpRequest: _nodeHttp.default.request,
    httpGet: _nodeHttp.default.get,
    httpGlobalAgent: _nodeHttp.default.globalAgent,
    httpsRequest: _nodeHttps.default.request,
    httpsGet: _nodeHttps.default.get,
    httpsGlobalAgent: _nodeHttps.default.globalAgent
  };
  const nodeHttpAgent = (0, _nodeHttp2.createNodeProxyAgent)(resolver, proxyCa, "http");
  const nodeHttpsAgent = (0, _nodeHttp2.createNodeProxyAgent)(resolver, proxyCa, "https");
  const originalDispatcher = (0, _undici.getGlobalDispatcher)();
  const originalFetch = globalThis.fetch;
  const originalFormData = globalThis.FormData;
  const originalHeaders = globalThis.Headers;
  const originalRequest = globalThis.Request;
  const originalResponse = globalThis.Response;
  const installedDispatcher = createUndiciProxyDispatcher(dispatcherOptions, {
    proxyCa,
    undici: options.undici
  });
  const runtime = {
    ambientEnv: options.ambientEnv,
    bypassPolicy: options.bypassPolicy,
    installedDispatcher,
    mode: dispatcherOptions.mode,
    nodeHttpAgent,
    nodeHttpsAgent,
    originalDispatcher,
    originalFetch,
    originalFormData,
    originalHeaders,
    originalRequest,
    originalResponse,
    proxyCa,
    proxyUrl: options.proxyUrl?.href,
    snapshot,
    undiciOptions: options.undici
  };
  activeRuntime = runtime;
  try {
    _nodeHttp.default.globalAgent = nodeHttpAgent;
    _nodeHttps.default.globalAgent = nodeHttpsAgent;
    _nodeHttp.default.request = (0, _nodeHttp2.bindNodeHttpMethod)(snapshot.httpRequest, () => (0, _nodeHttp2.createNodeProxyAgent)(resolver, proxyCa, "http"));
    _nodeHttp.default.get = (0, _nodeHttp2.bindNodeHttpMethod)(snapshot.httpGet, () => (0, _nodeHttp2.createNodeProxyAgent)(resolver, proxyCa, "http"));
    _nodeHttps.default.request = (0, _nodeHttp2.bindNodeHttpMethod)(snapshot.httpsRequest, () => (0, _nodeHttp2.createNodeProxyAgent)(resolver, proxyCa, "https"));
    _nodeHttps.default.get = (0, _nodeHttp2.bindNodeHttpMethod)(snapshot.httpsGet, () => (0, _nodeHttp2.createNodeProxyAgent)(resolver, proxyCa, "https"));
    (0, _undici.setGlobalDispatcher)(installedDispatcher);
    globalThis.fetch = proxylineFetch;
    globalThis.FormData = proxylineFormData;
    globalThis.Headers = proxylineHeaders;
    globalThis.Request = proxylineRequest;
    globalThis.Response = proxylineResponse;
  }
  catch (error) {
    restoreNodeHttpSnapshot(snapshot);
    (0, _undici.setGlobalDispatcher)(originalDispatcher);
    globalThis.fetch = originalFetch;
    globalThis.FormData = originalFormData;
    globalThis.Headers = originalHeaders;
    globalThis.Request = originalRequest;
    globalThis.Response = originalResponse;
    activeRuntime = undefined;
    void installedDispatcher.destroy();
    nodeHttpAgent.destroy();
    nodeHttpsAgent.destroy();
    throw error;
  }
  return runtime;
}
function stopRuntime(runtime) {
  if (activeRuntime !== runtime) {
    return;
  }
  restoreNodeHttpSnapshot(runtime.snapshot);
  (0, _undici.setGlobalDispatcher)(runtime.originalDispatcher);
  globalThis.fetch = runtime.originalFetch;
  globalThis.FormData = runtime.originalFormData;
  globalThis.Headers = runtime.originalHeaders;
  globalThis.Request = runtime.originalRequest;
  globalThis.Response = runtime.originalResponse;
  void runtime.installedDispatcher.destroy();
  runtime.nodeHttpAgent.destroy();
  runtime.nodeHttpsAgent.destroy();
  activeRuntime = undefined;
  activeHandle = undefined;
}
function installProxyline(options) {
  const proxyUrl = options.mode === "managed" ? normalizeProxyUrl(options.proxyUrl) : undefined;
  const ambientEnv = proxyUrl === undefined ? (0, _env.readProxyEnv)() : undefined;
  if (options.mode === "managed" && proxyUrl === undefined) {
    throw new _shared.ProxylineError("MANAGED_PROXY_URL_REQUIRED", "Proxyline managed mode requires an explicit proxyUrl.");
  }
  const activePolicy = options.ifActive ?? "error";
  if (activeRuntime !== undefined) {
    if (activePolicy === "replace") {
      activeHandle?.stop();
    } else
    if (activePolicy === "reuse-compatible" &&
    activeHandle !== undefined &&
    activeRuntime.mode === options.mode &&
    activeRuntime.proxyUrl === proxyUrl?.href &&
    proxyEnvSnapshotKey(activeRuntime.ambientEnv) === proxyEnvSnapshotKey(ambientEnv) &&
    activeRuntime.proxyCa === (0, _shared.resolveProxyTlsCa)(options.proxyTls) &&
    activeRuntime.bypassPolicy === options.bypassPolicy &&
    JSON.stringify(activeRuntime.undiciOptions ?? {}) === JSON.stringify(options.undici ?? {})) {
      return activeHandle;
    } else
    {
      throw new _shared.ProxylineError("RUNTIME_ALREADY_ACTIVE", "Proxyline already has an active runtime.");
    }
  }
  let stopped = false;
  const proxyCa = (0, _shared.resolveProxyTlsCa)(options.proxyTls);
  const dynamicBypasses = createDynamicBypassRegistry();
  const resolver = proxyUrl !== undefined ?
  createManagedProxyResolver(proxyUrl, options.bypassPolicy, dynamicBypasses) :
  (0, _env.createAmbientProxyResolver)(ambientEnv ?? _env.EMPTY_PROXY_ENV);
  const redactedProxyUrl = resolver.describeProxy();
  const hasActiveProxy = resolver.active;
  const runtime = hasActiveProxy ?
  installRuntime(resolver, proxyUrl !== undefined ?
  { mode: "managed", resolver } :
  { mode: "ambient", env: ambientEnv ?? _env.EMPTY_PROXY_ENV, active: hasActiveProxy }, proxyCa, {
    ambientEnv,
    bypassPolicy: options.bypassPolicy,
    proxyUrl,
    undici: options.undici
  }) :
  undefined;
  emit(options.onEvent, {
    type: "runtime.installed",
    mode: options.mode,
    active: hasActiveProxy,
    ...(redactedProxyUrl ? { proxyUrl: redactedProxyUrl } : {})
  });
  const handle = {
    mode: options.mode,
    active: hasActiveProxy,
    ...(redactedProxyUrl ? { proxyUrl: redactedProxyUrl } : {}),
    createNodeAgent: () => {
      if (!hasActiveProxy || stopped) {
        return (0, _nodeHttp2.createDirectNodeAgent)();
      }
      return (0, _nodeHttp2.createNodeProxyAgent)(resolver, proxyCa);
    },
    createUndiciDispatcher: () => stopped ?
    createUndiciAgent(options.undici) :
    createUndiciProxyDispatcher(proxyUrl !== undefined ?
    { mode: "managed", resolver } :
    { mode: "ambient", env: ambientEnv ?? _env.EMPTY_PROXY_ENV, active: hasActiveProxy }, { proxyCa, undici: options.undici }),
    createWebSocketAgent: () => {
      if (!hasActiveProxy || stopped) {
        return (0, _nodeHttp2.createDirectNodeAgent)();
      }
      return (0, _nodeHttp2.createNodeProxyAgent)(resolver, proxyCa);
    },
    explain: (url, explainOptions) => {
      const decision = stopped ?
      {
        kind: "direct",
        reason: "runtime-stopped",
        surface: explainOptions?.surface ?? "unknown",
        url: (0, _shared.formatUrl)(url)
      } :
      resolver.explain(url, explainOptions?.surface ?? "unknown");
      emit(options.onEvent, { type: "decision", decision });
      return decision;
    },
    registerBypass: (registration) => {
      if (stopped || proxyUrl === undefined) {
        return () => {};
      }
      return dynamicBypasses.add(registration);
    },
    stop: () => {
      if (stopped) {
        return;
      }
      stopped = true;
      if (runtime !== undefined) {
        stopRuntime(runtime);
      }
      emit(options.onEvent, { type: "runtime.stopped", mode: options.mode });
    },
    withBypass: (registration, run) => {
      if (stopped || proxyUrl === undefined) {
        return run();
      }
      return dynamicBypasses.runScoped(registration, run);
    }
  };
  activeHandle = hasActiveProxy ? handle : activeHandle;
  return handle;
}
const installGlobalProxy = exports.installGlobalProxy = installProxyline; /* v9-fe36de915d836878 */
