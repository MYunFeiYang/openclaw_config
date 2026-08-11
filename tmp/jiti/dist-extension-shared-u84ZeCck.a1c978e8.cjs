"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = coerceStatusIssueAccountId;exports.c = mapPluginConfigIssues;exports.d = readStatusIssueFields;exports.f = requireChannelOpenAllowFrom;exports.h = runStoppablePassiveMonitor;exports.i = canResolveEnvSecretRefInReadOnlyPath;exports.l = normalizePluginConfigIssuePath;exports.m = resolveLoggerBackedRuntime;exports.n = buildPassiveProbedChannelStatusSummary;exports.o = createDeferred;exports.p = resolveAmbientNodeProxyAgent;exports.r = buildTrafficStatusSummary;exports.s = formatPluginConfigIssue;exports.t = buildPassiveChannelStatusSummary;exports.u = readPluginPackageVersion;var _refContractBR8wwaMv = require("./ref-contract-BR8wwaMv.js");
var _managedProxyUndiciD1ROMSCC = require("./managed-proxy-undici-D1ROMSCC.js");
require("./fetch-timeout-CzT_eJ6W.js");
var _channelLifecycleCoreRM58wUwe = require("./channel-lifecycle.core-rM58wUwe.js");
var _runtimeLoggerCoWV_R4Q = require("./runtime-logger-CoWV_R4Q.js");
var _proxyline = require("@openclaw/proxyline");
//#region src/plugin-sdk/extension-shared.ts
function buildPassiveChannelStatusSummary(snapshot, extra) {
  return {
    configured: snapshot.configured ?? false,
    ...(extra ?? {}),
    running: snapshot.running ?? false,
    lastStartAt: snapshot.lastStartAt ?? null,
    lastStopAt: snapshot.lastStopAt ?? null,
    lastError: snapshot.lastError ?? null
  };
}
function buildPassiveProbedChannelStatusSummary(snapshot, extra) {
  return {
    ...buildPassiveChannelStatusSummary(snapshot, extra),
    probe: snapshot.probe,
    lastProbeAt: snapshot.lastProbeAt ?? null
  };
}
function buildTrafficStatusSummary(snapshot) {
  return {
    lastInboundAt: snapshot?.lastInboundAt ?? null,
    lastOutboundAt: snapshot?.lastOutboundAt ?? null
  };
}
async function runStoppablePassiveMonitor(params) {
  await (0, _channelLifecycleCoreRM58wUwe.i)({
    abortSignal: params.abortSignal,
    start: params.start,
    stop: async (monitor) => {
      monitor.stop();
    }
  });
}
function resolveLoggerBackedRuntime(runtime, logger) {
  return runtime ?? (0, _runtimeLoggerCoWV_R4Q.t)({
    logger,
    exitError: () => /* @__PURE__ */new Error("Runtime exit not available")
  });
}
function requireChannelOpenAllowFrom(params) {
  params.requireOpenAllowFrom({
    policy: params.policy,
    allowFrom: params.allowFrom,
    ctx: params.ctx,
    path: ["allowFrom"],
    message: `channels.${params.channel}.dmPolicy="open" requires channels.${params.channel}.allowFrom to include "*"`
  });
}
function readStatusIssueFields(value, fields) {
  if (!value || typeof value !== "object") return null;
  const record = value;
  const result = {};
  for (const field of fields) result[field] = record[field];
  return result;
}
function coerceStatusIssueAccountId(value) {
  return typeof value === "string" ? value : typeof value === "number" ? String(value) : void 0;
}
function createDeferred() {
  let resolve;
  let reject;
  return {
    promise: new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    }),
    resolve,
    reject
  };
}
const DEFAULT_PACKAGE_JSON_VERSION_CANDIDATES = [
"../package.json",
"./package.json",
"../../package.json"];

function formatPluginConfigIssue(issue, options) {
  if (!issue) return options?.invalidConfigMessage ?? "invalid config";
  if (issue.code === "unrecognized_keys" && issue.keys.length > 0) return options?.unknownKeyMessage?.(issue.keys[0]) ?? `unknown config key: ${issue.keys[0]}`;
  if (issue.code === "invalid_type" && issue.path.length === 0) return options?.rootInvalidTypeMessage ?? "expected config object";
  return issue.message;
}
function normalizePluginConfigIssuePath(path) {
  return path.filter((segment) => {
    const kind = typeof segment;
    return kind === "string" || kind === "number";
  });
}
function mapPluginConfigIssues(issues, options) {
  return issues.map((issue) => ({
    path: normalizePluginConfigIssuePath(issue.path),
    message: formatPluginConfigIssue(issue, options)
  }));
}
function canResolveEnvSecretRefInReadOnlyPath(params) {
  const providerConfig = params.cfg?.secrets?.providers?.[params.provider];
  if (!providerConfig) return params.provider === (0, _refContractBR8wwaMv.l)(params.cfg ?? {}, "env");
  if (providerConfig.source !== "env") return false;
  const allowlist = providerConfig.allowlist;
  return !allowlist || allowlist.includes(params.id);
}
function readPluginPackageVersion(params) {
  for (const candidate of params.candidates ?? DEFAULT_PACKAGE_JSON_VERSION_CANDIDATES) try {
    const version = params.require(candidate).version;
    if (typeof version === "string" && version.trim().length > 0) return version;
  } catch {}
  return params.fallback ?? "unknown";
}
async function resolveAmbientNodeProxyAgent(params) {
  const protocol = params?.protocol ?? "https";
  if (!(0, _proxyline.hasAmbientNodeProxyConfigured)({ protocol })) return;
  try {
    const proxyTls = (0, _managedProxyUndiciD1ROMSCC.n)();
    const agent = (0, _proxyline.createAmbientNodeProxyAgent)({
      protocol,
      ...(proxyTls ? { proxyTls } : {})
    });
    if (agent === void 0) return;
    params?.onUsingProxy?.();
    return agent;
  } catch (error) {
    params?.onError?.(error);
    return;
  }
}
//#endregion /* v9-3555dd8447e918f5 */
