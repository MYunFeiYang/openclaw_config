"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = loadManagedProxyTlsOptionsSync;exports.i = loadManagedProxyTlsOptions;exports.n = resolveActiveManagedProxyTlsOptions;exports.o = resolveManagedProxyCaFileForUrl;exports.r = resolveManagedEnvHttpProxyAgentOptions;exports.t = addActiveManagedProxyTlsOptions;var _proxyEnvDPHGz7yn = require("./proxy-env-DPHGz7yn.js");
var _activeProxyStateFoSqrlSF = require("./active-proxy-state-foSqrlSF.js");
var _nodeFs = require("node:fs");
var _promises = require("node:fs/promises");
//#region src/infra/net/proxy/proxy-tls.ts
function normalizeOptionalPath(value) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : void 0;
}
function formatReadError(err) {
  return err instanceof Error ? err.message : String(err);
}
function isHttpsProxyUrl(value) {
  if (!value) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
function resolveManagedProxyCaFile(params) {
  return normalizeOptionalPath(params.caFileOverride) ?? normalizeOptionalPath(params.config?.tls?.caFile);
}
function resolveManagedProxyCaFileForUrl(params) {
  if (!isHttpsProxyUrl(params.proxyUrl)) return;
  return resolveManagedProxyCaFile({
    config: params.config,
    caFileOverride: params.caFileOverride
  });
}
async function loadManagedProxyTlsOptions(caFile) {
  if (!caFile) return;
  try {
    return { ca: await (0, _promises.readFile)(caFile, "utf8") };
  } catch (err) {
    throw new Error(`proxy CA file could not be read (${caFile}): ${formatReadError(err)}`, { cause: err });
  }
}
function loadManagedProxyTlsOptionsSync(caFile) {
  if (!caFile) return;
  try {
    return { ca: (0, _nodeFs.readFileSync)(caFile, "utf8") };
  } catch (err) {
    throw new Error(`proxy CA file could not be read (${caFile}): ${formatReadError(err)}`, { cause: err });
  }
}
//#endregion
//#region src/infra/net/proxy/managed-proxy-undici.ts
function isProxyTlsRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function readProxyTlsRecord(options) {
  if (!options || !("proxyTls" in options)) return;
  return isProxyTlsRecord(options.proxyTls) ? options.proxyTls : void 0;
}
function readProxyUrlFromOptions(options) {
  if (!options) return;
  if ("uri" in options) {
    const uri = Reflect.get(options, "uri");
    return uri instanceof URL ? uri.href : typeof uri === "string" ? uri : void 0;
  }
  if ("httpsProxy" in options || "httpProxy" in options) {
    const httpsProxy = Reflect.get(options, "httpsProxy");
    const httpProxy = Reflect.get(options, "httpProxy");
    return typeof httpsProxy === "string" ? httpsProxy : typeof httpProxy === "string" ? httpProxy : void 0;
  }
}
function normalizeProxyUrl(value) {
  if (!value) return;
  try {
    return new URL(value).href;
  } catch {
    return;
  }
}
function resolveManagedProxyUrl(env = process.env) {
  const activeProxyUrl = (0, _activeProxyStateFoSqrlSF.r)();
  if (activeProxyUrl) return activeProxyUrl.href;
  if (env["OPENCLAW_PROXY_ACTIVE"] !== "1") return;
  return normalizeProxyUrl((0, _proxyEnvDPHGz7yn.s)("https", env));
}
function resolveActiveManagedProxyTlsOptions(params) {
  const env = params?.env ?? process.env;
  const managedProxyUrl = resolveManagedProxyUrl(env);
  const targetProxyUrl = normalizeProxyUrl(params?.proxyUrl ?? (0, _proxyEnvDPHGz7yn.s)("https", env));
  if (!managedProxyUrl || targetProxyUrl !== managedProxyUrl) return;
  const activeProxyTls = (0, _activeProxyStateFoSqrlSF.n)();
  if (activeProxyTls) return activeProxyTls;
  const proxyCaFile = resolveManagedProxyCaFileForUrl({
    proxyUrl: managedProxyUrl,
    caFileOverride: env["OPENCLAW_PROXY_CA_FILE"]
  });
  try {
    return loadManagedProxyTlsOptionsSync(proxyCaFile);
  } catch {
    return;
  }
}
function addActiveManagedProxyTlsOptions(options, params) {
  const proxyTls = resolveActiveManagedProxyTlsOptions({
    proxyUrl: readProxyUrlFromOptions(options),
    env: params?.env
  });
  if (!proxyTls) return options;
  const existingProxyTls = readProxyTlsRecord(options);
  return {
    ...options,
    proxyTls: {
      ...proxyTls,
      ...existingProxyTls
    }
  };
}
function resolveManagedEnvHttpProxyAgentOptions(env = process.env) {
  return addActiveManagedProxyTlsOptions((0, _proxyEnvDPHGz7yn.o)(env), { env });
}
//#endregion /* v9-5860139727486170 */
