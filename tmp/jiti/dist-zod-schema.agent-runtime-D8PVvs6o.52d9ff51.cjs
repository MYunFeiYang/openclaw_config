"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.u = exports.t = exports.s = exports.r = exports.p = exports.o = exports.n = exports.l = exports.i = exports.f = exports.d = exports.c = exports.a = void 0;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
var _prototypeKeysCxs5UffD = require("./prototype-keys-Cxs5UffD.js");
var _schemasBmna8ihM = require("./schemas-Bmna8ihM.js");
var _compatZe2wFLca = require("./compat-ze2wFLca.js");
var _zodSchemaCoreQTf3ki3e = require("./zod-schema.core-QTf3ki3e.js");
var _zodSchemaSensitiveSjBPHVTu = require("./zod-schema.sensitive-SjBPHVTu.js");
var _parseDurationD8AJG6ba = require("./parse-duration-D8AJG6ba.js");
var _networkModeC0vIxNAK = require("./network-mode-C0vIxNAK.js");
//#region src/config/zod-schema.agent-model.ts
const AgentModelSchema = exports.f = (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.Rn)(), (0, _schemasBmna8ihM.Tn)({
  primary: (0, _schemasBmna8ihM.Rn)().optional(),
  fallbacks: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional()
}).strict()]);
const AgentToolModelSchema = exports.p = (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.Rn)(), (0, _schemasBmna8ihM.Tn)({
  primary: (0, _schemasBmna8ihM.Rn)().optional(),
  fallbacks: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
  timeoutMs: (0, _schemasBmna8ihM.wn)().int().positive().optional()
}).strict()]);
//#endregion
//#region src/config/zod-schema.agent-runtime.ts
const AgentRunRetriesConfigSchema = exports.i = (0, _schemasBmna8ihM.Tn)({
  base: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
  perProfile: (0, _schemasBmna8ihM.wn)().int().nonnegative().optional(),
  min: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
  max: (0, _schemasBmna8ihM.wn)().int().positive().optional()
}).strict().refine((data) => {
  if (data.min !== void 0 && data.max !== void 0) return data.max >= data.min;
  return true;
}, {
  message: "max must be greater than or equal to min",
  path: ["max"]
});
const HeartbeatSchema = exports.c = (0, _schemasBmna8ihM.Tn)({
  every: (0, _schemasBmna8ihM.Rn)().optional(),
  activeHours: (0, _schemasBmna8ihM.Tn)({
    start: (0, _schemasBmna8ihM.Rn)().optional(),
    end: (0, _schemasBmna8ihM.Rn)().optional(),
    timezone: (0, _schemasBmna8ihM.Rn)().optional()
  }).strict().optional(),
  model: (0, _schemasBmna8ihM.Rn)().optional(),
  session: (0, _schemasBmna8ihM.Rn)().optional(),
  includeReasoning: (0, _schemasBmna8ihM.At)().optional(),
  target: (0, _schemasBmna8ihM.Rn)().optional(),
  directPolicy: (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.dn)("allow"), (0, _schemasBmna8ihM.dn)("block")]).optional(),
  to: (0, _schemasBmna8ihM.Rn)().optional(),
  accountId: (0, _schemasBmna8ihM.Rn)().optional(),
  prompt: (0, _schemasBmna8ihM.Rn)().optional(),
  includeSystemPromptSection: (0, _schemasBmna8ihM.At)().optional(),
  ackMaxChars: (0, _schemasBmna8ihM.wn)().int().nonnegative().optional(),
  suppressToolErrorWarnings: (0, _schemasBmna8ihM.At)().optional(),
  timeoutSeconds: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
  lightContext: (0, _schemasBmna8ihM.At)().optional(),
  isolatedSession: (0, _schemasBmna8ihM.At)().optional(),
  skipWhenBusy: (0, _schemasBmna8ihM.At)().optional()
}).strict().superRefine((val, ctx) => {
  if (!val.every) return;
  try {
    (0, _parseDurationD8AJG6ba.t)(val.every, { defaultUnit: "m" });
  } catch {
    ctx.addIssue({
      code: _compatZe2wFLca.n.custom,
      path: ["every"],
      message: "invalid duration (use ms, s, m, h)"
    });
  }
  const active = val.activeHours;
  if (!active) return;
  const timePattern = /^([01]\d|2[0-3]|24):([0-5]\d)$/;
  const validateTime = (raw, opts, path) => {
    if (!raw) return;
    if (!timePattern.test(raw)) {
      ctx.addIssue({
        code: _compatZe2wFLca.n.custom,
        path: ["activeHours", path],
        message: "invalid time (use \"HH:MM\" 24h format)"
      });
      return;
    }
    const [hourStr, minuteStr] = raw.split(":");
    const hour = Number(hourStr);
    const minute = Number(minuteStr);
    if (hour === 24 && minute !== 0) {
      ctx.addIssue({
        code: _compatZe2wFLca.n.custom,
        path: ["activeHours", path],
        message: "invalid time (24:00 is the only allowed 24:xx value)"
      });
      return;
    }
    if (hour === 24 && !opts.allow24) ctx.addIssue({
      code: _compatZe2wFLca.n.custom,
      path: ["activeHours", path],
      message: "invalid time (start cannot be 24:00)"
    });
  };
  validateTime(active.start, { allow24: false }, "start");
  validateTime(active.end, { allow24: true }, "end");
}).optional();
const SandboxDockerSchema = (0, _schemasBmna8ihM.Tn)({
  image: (0, _schemasBmna8ihM.Rn)().optional(),
  containerPrefix: (0, _schemasBmna8ihM.Rn)().optional(),
  workdir: (0, _schemasBmna8ihM.Rn)().optional(),
  readOnlyRoot: (0, _schemasBmna8ihM.At)().optional(),
  tmpfs: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
  network: (0, _schemasBmna8ihM.Rn)().optional(),
  user: (0, _schemasBmna8ihM.Rn)().optional(),
  capDrop: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
  env: (0, _schemasBmna8ihM.Nn)((0, _schemasBmna8ihM.Rn)(), (0, _schemasBmna8ihM.Rn)()).optional(),
  setupCommand: (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.Rn)(), (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)())]).transform((value) => Array.isArray(value) ? value.join("\n") : value).optional(),
  pidsLimit: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
  memory: (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.Rn)(), (0, _schemasBmna8ihM.wn)()]).optional(),
  memorySwap: (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.Rn)(), (0, _schemasBmna8ihM.wn)()]).optional(),
  cpus: (0, _schemasBmna8ihM.wn)().positive().optional(),
  gpus: (0, _schemasBmna8ihM.Rn)().min(1).optional(),
  ulimits: (0, _schemasBmna8ihM.Nn)((0, _schemasBmna8ihM.Rn)(), (0, _schemasBmna8ihM.Xn)([
  (0, _schemasBmna8ihM.Rn)(),
  (0, _schemasBmna8ihM.wn)(),
  (0, _schemasBmna8ihM.Tn)({
    soft: (0, _schemasBmna8ihM.wn)().int().nonnegative().optional(),
    hard: (0, _schemasBmna8ihM.wn)().int().nonnegative().optional()
  }).strict()]
  )).optional(),
  seccompProfile: (0, _schemasBmna8ihM.Rn)().optional(),
  apparmorProfile: (0, _schemasBmna8ihM.Rn)().optional(),
  dns: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
  extraHosts: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
  binds: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
  dangerouslyAllowReservedContainerTargets: (0, _schemasBmna8ihM.At)().optional(),
  dangerouslyAllowExternalBindSources: (0, _schemasBmna8ihM.At)().optional(),
  dangerouslyAllowContainerNamespaceJoin: (0, _schemasBmna8ihM.At)().optional()
}).strict().superRefine((data, ctx) => {
  if (data.binds) for (let i = 0; i < data.binds.length; i += 1) {
    const bind = (0, _stringCoerceLndEvhRk.c)(data.binds[i]) ?? "";
    if (!bind) {
      ctx.addIssue({
        code: _compatZe2wFLca.n.custom,
        path: ["binds", i],
        message: "Sandbox security: bind mount entry must be a non-empty string."
      });
      continue;
    }
    const parsed = (0, _networkModeC0vIxNAK.c)(bind);
    const source = (parsed ? parsed.host : bind).trim();
    if (!(0, _networkModeC0vIxNAK.a)(source)) ctx.addIssue({
      code: _compatZe2wFLca.n.custom,
      path: ["binds", i],
      message: `Sandbox security: bind mount "${bind}" uses a non-absolute source path "${source}". Only absolute POSIX or Windows drive-letter paths are supported for sandbox binds.`
    });
  }
  const blockedNetworkReason = (0, _networkModeC0vIxNAK.t)({
    network: data.network,
    allowContainerNamespaceJoin: data.dangerouslyAllowContainerNamespaceJoin === true
  });
  if (blockedNetworkReason === "host") ctx.addIssue({
    code: _compatZe2wFLca.n.custom,
    path: ["network"],
    message: "Sandbox security: network mode \"host\" is blocked. Use \"bridge\" or \"none\" instead."
  });
  if (blockedNetworkReason === "container_namespace_join") ctx.addIssue({
    code: _compatZe2wFLca.n.custom,
    path: ["network"],
    message: "Sandbox security: network mode \"container:*\" is blocked by default. Use a custom bridge network, or set dangerouslyAllowContainerNamespaceJoin=true only when you fully trust this runtime."
  });
  if ((0, _stringCoerceLndEvhRk.a)(data.seccompProfile ?? "") === "unconfined") ctx.addIssue({
    code: _compatZe2wFLca.n.custom,
    path: ["seccompProfile"],
    message: "Sandbox security: seccomp profile \"unconfined\" is blocked. Use a custom seccomp profile file or omit this setting."
  });
  if ((0, _stringCoerceLndEvhRk.a)(data.apparmorProfile ?? "") === "unconfined") ctx.addIssue({
    code: _compatZe2wFLca.n.custom,
    path: ["apparmorProfile"],
    message: "Sandbox security: apparmor profile \"unconfined\" is blocked. Use a named AppArmor profile or omit this setting."
  });
}).optional();
const SandboxBrowserSchema = (0, _schemasBmna8ihM.Tn)({
  enabled: (0, _schemasBmna8ihM.At)().optional(),
  image: (0, _schemasBmna8ihM.Rn)().optional(),
  containerPrefix: (0, _schemasBmna8ihM.Rn)().optional(),
  network: (0, _schemasBmna8ihM.Rn)().optional(),
  cdpPort: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
  cdpSourceRange: (0, _schemasBmna8ihM.Rn)().optional(),
  vncPort: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
  noVncPort: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
  headless: (0, _schemasBmna8ihM.At)().optional(),
  enableNoVnc: (0, _schemasBmna8ihM.At)().optional(),
  allowHostControl: (0, _schemasBmna8ihM.At)().optional(),
  autoStart: (0, _schemasBmna8ihM.At)().optional(),
  autoStartTimeoutMs: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
  binds: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional()
}).superRefine((data, ctx) => {
  if ((0, _stringCoerceLndEvhRk.a)(data.network ?? "") === "host") ctx.addIssue({
    code: _compatZe2wFLca.n.custom,
    path: ["network"],
    message: "Sandbox security: browser network mode \"host\" is blocked. Use \"bridge\" or a custom bridge network instead."
  });
}).strict().optional();
const SandboxPruneSchema = (0, _schemasBmna8ihM.Tn)({
  idleHours: (0, _schemasBmna8ihM.wn)().int().nonnegative().optional(),
  maxAgeDays: (0, _schemasBmna8ihM.wn)().int().nonnegative().optional()
}).strict().optional();
const AgentContextLimitsSchema = exports.t = (0, _schemasBmna8ihM.Tn)({
  memoryGetMaxChars: (0, _schemasBmna8ihM.wn)().int().min(1).max(25e4).optional(),
  memoryGetDefaultLines: (0, _schemasBmna8ihM.wn)().int().min(1).max(5e3).optional(),
  toolResultMaxChars: (0, _schemasBmna8ihM.wn)().int().min(1).max(25e4).optional(),
  postCompactionMaxChars: (0, _schemasBmna8ihM.wn)().int().min(1).max(5e4).optional()
}).strict().optional();
const AgentSkillsLimitsSchema = (0, _schemasBmna8ihM.Tn)({ maxSkillsPromptChars: (0, _schemasBmna8ihM.wn)().int().min(0).optional() }).strict().optional();
const ToolPolicySchema = exports.u = (0, _schemasBmna8ihM.Tn)({
  allow: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
  alsoAllow: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
  deny: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional()
}).strict().superRefine((value, ctx) => {
  if (value.allow && value.allow.length > 0 && value.alsoAllow && value.alsoAllow.length > 0) ctx.addIssue({
    code: _compatZe2wFLca.n.custom,
    message: "tools policy cannot set both allow and alsoAllow in the same scope (merge alsoAllow into allow, or remove allow and use profile + alsoAllow)"
  });
}).optional();
const ToolPolicyBySenderSchema = (0, _schemasBmna8ihM.Nn)((0, _schemasBmna8ihM.Rn)(), ToolPolicySchema).optional();
const TrimmedOptionalConfigStringSchema = (0, _schemasBmna8ihM.Rn)().transform((value) => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : void 0;
}).optional();
const CodexAllowedDomainsSchema = (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).transform((values) => {
  const deduped = [...new Set(values.map((value) => value.trim()).filter((value) => value.length > 0))];
  return deduped.length > 0 ? deduped : void 0;
}).optional();
const CodexUserLocationSchema = (0, _schemasBmna8ihM.Tn)({
  country: TrimmedOptionalConfigStringSchema,
  region: TrimmedOptionalConfigStringSchema,
  city: TrimmedOptionalConfigStringSchema,
  timezone: TrimmedOptionalConfigStringSchema
}).strict().transform((value) => {
  return value.country || value.region || value.city || value.timezone ? value : void 0;
}).optional();
const LEGACY_WEB_SEARCH_PROVIDER_CONFIG_KEYS = new Set([
"brave",
"duckduckgo",
"exa",
"firecrawl",
"gemini",
"grok",
"kimi",
"minimax",
"ollama",
"perplexity",
"searxng",
"tavily"]
);
function isPlainRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
const BLOCKED_WEB_SEARCH_KEYS_ISSUE_FIELD = "__openclawBlockedWebSearchKeys";
const ToolsWebSchema = (0, _schemasBmna8ihM.Tn)({
  search: (0, _schemasBmna8ihM.An)((value) => {
    if (!isPlainRecord(value)) return value;
    const blockedKeys = Object.getOwnPropertyNames(value).filter((key) => (0, _prototypeKeysCxs5UffD.t)(key));
    if (blockedKeys.length === 0) return value;
    return {
      ...value,
      [BLOCKED_WEB_SEARCH_KEYS_ISSUE_FIELD]: blockedKeys
    };
  }, (0, _schemasBmna8ihM.Tn)({
    enabled: (0, _schemasBmna8ihM.At)().optional(),
    provider: (0, _schemasBmna8ihM.Rn)().optional(),
    maxResults: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
    timeoutSeconds: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
    cacheTtlMinutes: (0, _schemasBmna8ihM.wn)().nonnegative().optional(),
    apiKey: _zodSchemaCoreQTf3ki3e.C.optional().register(_zodSchemaSensitiveSjBPHVTu.t),
    openaiCodex: (0, _schemasBmna8ihM.Tn)({
      enabled: (0, _schemasBmna8ihM.At)().optional(),
      mode: (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.dn)("cached"), (0, _schemasBmna8ihM.dn)("live")]).optional(),
      allowedDomains: CodexAllowedDomainsSchema,
      contextSize: (0, _schemasBmna8ihM.Xn)([
      (0, _schemasBmna8ihM.dn)("low"),
      (0, _schemasBmna8ihM.dn)("medium"),
      (0, _schemasBmna8ihM.dn)("high")]
      ).optional(),
      userLocation: CodexUserLocationSchema
    }).strict().optional()
  }).catchall((0, _schemasBmna8ihM.Zn)()).superRefine((value, ctx) => {
    const blockedKeys = value[BLOCKED_WEB_SEARCH_KEYS_ISSUE_FIELD];
    if (Array.isArray(blockedKeys)) for (const key of blockedKeys) {
      if (typeof key !== "string") continue;
      ctx.addIssue({
        code: _compatZe2wFLca.n.custom,
        path: [key],
        message: "tools.web.search must not contain blocked object keys"
      });
    }
    for (const [key, entry] of Object.entries(value)) {
      if (key === BLOCKED_WEB_SEARCH_KEYS_ISSUE_FIELD || (0, _prototypeKeysCxs5UffD.t)(key)) continue;
      if (LEGACY_WEB_SEARCH_PROVIDER_CONFIG_KEYS.has(key) && isPlainRecord(entry)) ctx.addIssue({
        code: _compatZe2wFLca.n.custom,
        path: [key],
        message: "legacy web_search provider config must use plugins.entries.<plugin>.config.webSearch"
      });
    }
  })).optional(),
  fetch: (0, _schemasBmna8ihM.Tn)({
    enabled: (0, _schemasBmna8ihM.At)().optional(),
    provider: (0, _schemasBmna8ihM.Rn)().optional(),
    maxChars: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
    maxCharsCap: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
    maxResponseBytes: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
    timeoutSeconds: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
    cacheTtlMinutes: (0, _schemasBmna8ihM.wn)().nonnegative().optional(),
    maxRedirects: (0, _schemasBmna8ihM.wn)().int().nonnegative().optional(),
    userAgent: (0, _schemasBmna8ihM.Rn)().optional(),
    readability: (0, _schemasBmna8ihM.At)().optional(),
    useTrustedEnvProxy: (0, _schemasBmna8ihM.At)().optional(),
    ssrfPolicy: (0, _schemasBmna8ihM.Tn)({
      allowRfc2544BenchmarkRange: (0, _schemasBmna8ihM.At)().optional(),
      allowIpv6UniqueLocalRange: (0, _schemasBmna8ihM.At)().optional()
    }).strict().optional(),
    firecrawl: (0, _schemasBmna8ihM.Tn)({
      enabled: (0, _schemasBmna8ihM.At)().optional(),
      apiKey: _zodSchemaCoreQTf3ki3e.C.optional().register(_zodSchemaSensitiveSjBPHVTu.t),
      baseUrl: (0, _schemasBmna8ihM.Rn)().optional(),
      onlyMainContent: (0, _schemasBmna8ihM.At)().optional(),
      maxAgeMs: (0, _schemasBmna8ihM.wn)().int().nonnegative().optional(),
      timeoutSeconds: (0, _schemasBmna8ihM.wn)().int().positive().optional()
    }).strict().optional()
  }).strict().optional(),
  x_search: (0, _schemasBmna8ihM.Tn)({
    enabled: (0, _schemasBmna8ihM.At)().optional(),
    model: (0, _schemasBmna8ihM.Rn)().optional(),
    inlineCitations: (0, _schemasBmna8ihM.At)().optional(),
    maxTurns: (0, _schemasBmna8ihM.wn)().int().optional(),
    timeoutSeconds: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
    cacheTtlMinutes: (0, _schemasBmna8ihM.wn)().nonnegative().optional()
  }).strict().optional()
}).strict().optional();
const ToolProfileSchema = (0, _schemasBmna8ihM.Xn)([
(0, _schemasBmna8ihM.dn)("minimal"),
(0, _schemasBmna8ihM.dn)("coding"),
(0, _schemasBmna8ihM.dn)("messaging"),
(0, _schemasBmna8ihM.dn)("full")]
).optional();
function addAllowAlsoAllowConflictIssue(value, ctx, message) {
  if (value.allow && value.allow.length > 0 && value.alsoAllow && value.alsoAllow.length > 0) ctx.addIssue({
    code: _compatZe2wFLca.n.custom,
    message
  });
}
const ToolPolicyWithProfileSchema = (0, _schemasBmna8ihM.Tn)({
  allow: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
  alsoAllow: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
  deny: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
  profile: ToolProfileSchema
}).strict().superRefine((value, ctx) => {
  addAllowAlsoAllowConflictIssue(value, ctx, "tools.byProvider policy cannot set both allow and alsoAllow in the same scope (merge alsoAllow into allow, or remove allow and use profile + alsoAllow)");
});
const ElevatedAllowFromSchema = exports.s = (0, _schemasBmna8ihM.Nn)((0, _schemasBmna8ihM.Rn)(), (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.Rn)(), (0, _schemasBmna8ihM.wn)()]))).optional();
const ToolExecApplyPatchSchema = (0, _schemasBmna8ihM.Tn)({
  enabled: (0, _schemasBmna8ihM.At)().optional(),
  workspaceOnly: (0, _schemasBmna8ihM.At)().optional(),
  allowModels: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional()
}).strict().optional();
const ToolExecSafeBinProfileSchema = (0, _schemasBmna8ihM.Tn)({
  minPositional: (0, _schemasBmna8ihM.wn)().int().nonnegative().optional(),
  maxPositional: (0, _schemasBmna8ihM.wn)().int().nonnegative().optional(),
  allowedValueFlags: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
  deniedFlags: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional()
}).strict();
const ToolExecBaseShape = {
  host: (0, _schemasBmna8ihM.yt)([
  "auto",
  "sandbox",
  "gateway",
  "node"]
  ).optional(),
  security: (0, _schemasBmna8ihM.yt)([
  "deny",
  "allowlist",
  "full"]
  ).optional(),
  ask: (0, _schemasBmna8ihM.yt)([
  "off",
  "on-miss",
  "always"]
  ).optional(),
  node: (0, _schemasBmna8ihM.Rn)().optional(),
  pathPrepend: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
  safeBins: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
  strictInlineEval: (0, _schemasBmna8ihM.At)().optional(),
  commandHighlighting: (0, _schemasBmna8ihM.At)().optional(),
  safeBinTrustedDirs: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
  safeBinProfiles: (0, _schemasBmna8ihM.Nn)((0, _schemasBmna8ihM.Rn)(), ToolExecSafeBinProfileSchema).optional(),
  backgroundMs: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
  timeoutSec: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
  cleanupMs: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
  notifyOnExit: (0, _schemasBmna8ihM.At)().optional(),
  notifyOnExitEmptySuccess: (0, _schemasBmna8ihM.At)().optional(),
  applyPatch: ToolExecApplyPatchSchema
};
const AgentToolExecSchema = (0, _schemasBmna8ihM.Tn)({
  ...ToolExecBaseShape,
  approvalRunningNoticeMs: (0, _schemasBmna8ihM.wn)().int().nonnegative().optional()
}).strict().optional();
const ToolExecSchema = (0, _schemasBmna8ihM.Tn)(ToolExecBaseShape).strict().optional();
const ToolFsSchema = (0, _schemasBmna8ihM.Tn)({ workspaceOnly: (0, _schemasBmna8ihM.At)().optional() }).strict().optional();
const ToolLoopDetectionDetectorSchema = (0, _schemasBmna8ihM.Tn)({
  genericRepeat: (0, _schemasBmna8ihM.At)().optional(),
  knownPollNoProgress: (0, _schemasBmna8ihM.At)().optional(),
  pingPong: (0, _schemasBmna8ihM.At)().optional()
}).strict().optional();
const ToolLoopPostCompactionGuardSchema = (0, _schemasBmna8ihM.Tn)({ windowSize: (0, _schemasBmna8ihM.wn)().int().positive().optional() }).strict().optional();
const ToolLoopDetectionSchema = (0, _schemasBmna8ihM.Tn)({
  enabled: (0, _schemasBmna8ihM.At)().optional(),
  historySize: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
  warningThreshold: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
  unknownToolThreshold: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
  criticalThreshold: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
  globalCircuitBreakerThreshold: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
  detectors: ToolLoopDetectionDetectorSchema,
  postCompactionGuard: ToolLoopPostCompactionGuardSchema
}).strict().superRefine((value, ctx) => {
  if (value.warningThreshold !== void 0 && value.criticalThreshold !== void 0 && value.warningThreshold >= value.criticalThreshold) ctx.addIssue({
    code: _compatZe2wFLca.n.custom,
    path: ["criticalThreshold"],
    message: "tools.loopDetection.warningThreshold must be lower than criticalThreshold."
  });
  if (value.criticalThreshold !== void 0 && value.globalCircuitBreakerThreshold !== void 0 && value.criticalThreshold >= value.globalCircuitBreakerThreshold) ctx.addIssue({
    code: _compatZe2wFLca.n.custom,
    path: ["globalCircuitBreakerThreshold"],
    message: "tools.loopDetection.criticalThreshold must be lower than globalCircuitBreakerThreshold."
  });
}).optional();
const ToolSearchSchema = (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.At)(), (0, _schemasBmna8ihM.Tn)({
  enabled: (0, _schemasBmna8ihM.At)().optional(),
  mode: (0, _schemasBmna8ihM.yt)(["code", "tools"]).optional(),
  codeTimeoutMs: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
  searchDefaultLimit: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
  maxSearchLimit: (0, _schemasBmna8ihM.wn)().int().positive().optional()
}).strict()]).optional();
const CodeModeSchema = (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.At)(), (0, _schemasBmna8ihM.Tn)({
  enabled: (0, _schemasBmna8ihM.At)().optional(),
  runtime: (0, _schemasBmna8ihM.dn)("quickjs-wasi").optional(),
  mode: (0, _schemasBmna8ihM.dn)("only").optional(),
  languages: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.yt)(["javascript", "typescript"])).optional(),
  timeoutMs: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
  memoryLimitBytes: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
  maxOutputBytes: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
  maxSnapshotBytes: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
  maxPendingToolCalls: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
  snapshotTtlSeconds: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
  searchDefaultLimit: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
  maxSearchLimit: (0, _schemasBmna8ihM.wn)().int().positive().optional()
}).strict()]).optional();
const SandboxSshSchema = (0, _schemasBmna8ihM.Tn)({
  target: (0, _schemasBmna8ihM.Rn)().min(1).optional(),
  command: (0, _schemasBmna8ihM.Rn)().min(1).optional(),
  workspaceRoot: (0, _schemasBmna8ihM.Rn)().min(1).optional(),
  strictHostKeyChecking: (0, _schemasBmna8ihM.At)().optional(),
  updateHostKeys: (0, _schemasBmna8ihM.At)().optional(),
  identityFile: (0, _schemasBmna8ihM.Rn)().min(1).optional(),
  certificateFile: (0, _schemasBmna8ihM.Rn)().min(1).optional(),
  knownHostsFile: (0, _schemasBmna8ihM.Rn)().min(1).optional(),
  identityData: _zodSchemaCoreQTf3ki3e.C.optional().register(_zodSchemaSensitiveSjBPHVTu.t),
  certificateData: _zodSchemaCoreQTf3ki3e.C.optional().register(_zodSchemaSensitiveSjBPHVTu.t),
  knownHostsData: _zodSchemaCoreQTf3ki3e.C.optional().register(_zodSchemaSensitiveSjBPHVTu.t)
}).strict().optional();
const AgentSandboxSchema = exports.o = (0, _schemasBmna8ihM.Tn)({
  mode: (0, _schemasBmna8ihM.Xn)([
  (0, _schemasBmna8ihM.dn)("off"),
  (0, _schemasBmna8ihM.dn)("non-main"),
  (0, _schemasBmna8ihM.dn)("all")]
  ).optional(),
  backend: (0, _schemasBmna8ihM.Rn)().min(1).optional(),
  workspaceAccess: (0, _schemasBmna8ihM.Xn)([
  (0, _schemasBmna8ihM.dn)("none"),
  (0, _schemasBmna8ihM.dn)("ro"),
  (0, _schemasBmna8ihM.dn)("rw")]
  ).optional(),
  sessionToolsVisibility: (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.dn)("spawned"), (0, _schemasBmna8ihM.dn)("all")]).optional(),
  scope: (0, _schemasBmna8ihM.Xn)([
  (0, _schemasBmna8ihM.dn)("session"),
  (0, _schemasBmna8ihM.dn)("agent"),
  (0, _schemasBmna8ihM.dn)("shared")]
  ).optional(),
  workspaceRoot: (0, _schemasBmna8ihM.Rn)().optional(),
  docker: SandboxDockerSchema,
  ssh: SandboxSshSchema,
  browser: SandboxBrowserSchema,
  prune: SandboxPruneSchema
}).strict().superRefine((data, ctx) => {
  if ((0, _networkModeC0vIxNAK.t)({
    network: data.browser?.network,
    allowContainerNamespaceJoin: data.docker?.dangerouslyAllowContainerNamespaceJoin === true
  }) === "container_namespace_join") ctx.addIssue({
    code: _compatZe2wFLca.n.custom,
    path: ["browser", "network"],
    message: "Sandbox security: browser network mode \"container:*\" is blocked by default. Set sandbox.docker.dangerouslyAllowContainerNamespaceJoin=true only when you fully trust this runtime."
  });
}).optional();
const CommonToolPolicyFields = {
  profile: ToolProfileSchema,
  allow: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
  alsoAllow: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
  deny: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
  byProvider: (0, _schemasBmna8ihM.Nn)((0, _schemasBmna8ihM.Rn)(), ToolPolicyWithProfileSchema).optional(),
  toolsBySender: ToolPolicyBySenderSchema
};
const MessageToolConfigSchema = (0, _schemasBmna8ihM.Tn)({
  allowCrossContextSend: (0, _schemasBmna8ihM.At)().optional(),
  crossContext: (0, _schemasBmna8ihM.Tn)({
    allowWithinProvider: (0, _schemasBmna8ihM.At)().optional(),
    allowAcrossProviders: (0, _schemasBmna8ihM.At)().optional(),
    marker: (0, _schemasBmna8ihM.Tn)({
      enabled: (0, _schemasBmna8ihM.At)().optional(),
      prefix: (0, _schemasBmna8ihM.Rn)().optional(),
      suffix: (0, _schemasBmna8ihM.Rn)().optional()
    }).strict().optional()
  }).strict().optional(),
  actions: (0, _schemasBmna8ihM.Tn)({ allow: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional() }).strict().optional(),
  broadcast: (0, _schemasBmna8ihM.Tn)({ enabled: (0, _schemasBmna8ihM.At)().optional() }).strict().optional()
}).strict().optional();
const AgentToolsSchema = (0, _schemasBmna8ihM.Tn)({
  ...CommonToolPolicyFields,
  codeMode: CodeModeSchema,
  elevated: (0, _schemasBmna8ihM.Tn)({
    enabled: (0, _schemasBmna8ihM.At)().optional(),
    allowFrom: ElevatedAllowFromSchema
  }).strict().optional(),
  exec: AgentToolExecSchema,
  fs: ToolFsSchema,
  loopDetection: ToolLoopDetectionSchema,
  message: MessageToolConfigSchema,
  sandbox: (0, _schemasBmna8ihM.Tn)({ tools: ToolPolicySchema }).strict().optional()
}).strict().superRefine((value, ctx) => {
  addAllowAlsoAllowConflictIssue(value, ctx, "agent tools cannot set both allow and alsoAllow in the same scope (merge alsoAllow into allow, or remove allow and use profile + alsoAllow)");
}).optional();
const MemorySearchSchema = exports.l = (0, _schemasBmna8ihM.Tn)({
  enabled: (0, _schemasBmna8ihM.At)().optional(),
  sources: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.dn)("memory"), (0, _schemasBmna8ihM.dn)("sessions")])).optional(),
  extraPaths: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
  qmd: (0, _schemasBmna8ihM.Tn)({ extraCollections: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Tn)({
      path: (0, _schemasBmna8ihM.Rn)(),
      name: (0, _schemasBmna8ihM.Rn)().optional(),
      pattern: (0, _schemasBmna8ihM.Rn)().optional()
    }).strict()).optional() }).strict().optional(),
  multimodal: (0, _schemasBmna8ihM.Tn)({
    enabled: (0, _schemasBmna8ihM.At)().optional(),
    modalities: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Xn)([
    (0, _schemasBmna8ihM.dn)("image"),
    (0, _schemasBmna8ihM.dn)("audio"),
    (0, _schemasBmna8ihM.dn)("all")]
    )).optional(),
    maxFileBytes: (0, _schemasBmna8ihM.wn)().int().positive().optional()
  }).strict().optional(),
  experimental: (0, _schemasBmna8ihM.Tn)({ sessionMemory: (0, _schemasBmna8ihM.At)().optional() }).strict().optional(),
  provider: (0, _schemasBmna8ihM.Rn)().optional(),
  remote: (0, _schemasBmna8ihM.Tn)({
    baseUrl: (0, _schemasBmna8ihM.Rn)().optional(),
    apiKey: _zodSchemaCoreQTf3ki3e.C.optional().register(_zodSchemaSensitiveSjBPHVTu.t),
    headers: (0, _schemasBmna8ihM.Nn)((0, _schemasBmna8ihM.Rn)(), (0, _schemasBmna8ihM.Rn)()).optional(),
    nonBatchConcurrency: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
    batch: (0, _schemasBmna8ihM.Tn)({
      enabled: (0, _schemasBmna8ihM.At)().optional(),
      wait: (0, _schemasBmna8ihM.At)().optional(),
      concurrency: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
      pollIntervalMs: (0, _schemasBmna8ihM.wn)().int().nonnegative().optional(),
      timeoutMinutes: (0, _schemasBmna8ihM.wn)().int().positive().optional()
    }).strict().optional()
  }).strict().optional(),
  fallback: (0, _schemasBmna8ihM.Rn)().optional(),
  model: (0, _schemasBmna8ihM.Rn)().optional(),
  inputType: (0, _schemasBmna8ihM.Rn)().min(1).optional(),
  queryInputType: (0, _schemasBmna8ihM.Rn)().min(1).optional(),
  documentInputType: (0, _schemasBmna8ihM.Rn)().min(1).optional(),
  outputDimensionality: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
  local: (0, _schemasBmna8ihM.Tn)({
    modelPath: (0, _schemasBmna8ihM.Rn)().optional(),
    modelCacheDir: (0, _schemasBmna8ihM.Rn)().optional(),
    contextSize: (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.wn)().int().positive(), (0, _schemasBmna8ihM.dn)("auto")]).optional()
  }).strict().optional(),
  store: (0, _schemasBmna8ihM.Tn)({
    driver: (0, _schemasBmna8ihM.dn)("sqlite").optional(),
    path: (0, _schemasBmna8ihM.Rn)().optional(),
    fts: (0, _schemasBmna8ihM.Tn)({ tokenizer: (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.dn)("unicode61"), (0, _schemasBmna8ihM.dn)("trigram")]).optional() }).strict().optional(),
    vector: (0, _schemasBmna8ihM.Tn)({
      enabled: (0, _schemasBmna8ihM.At)().optional(),
      extensionPath: (0, _schemasBmna8ihM.Rn)().optional()
    }).strict().optional()
  }).strict().optional(),
  chunking: (0, _schemasBmna8ihM.Tn)({
    tokens: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
    overlap: (0, _schemasBmna8ihM.wn)().int().nonnegative().optional()
  }).strict().optional(),
  sync: (0, _schemasBmna8ihM.Tn)({
    onSessionStart: (0, _schemasBmna8ihM.At)().optional(),
    onSearch: (0, _schemasBmna8ihM.At)().optional(),
    watch: (0, _schemasBmna8ihM.At)().optional(),
    watchDebounceMs: (0, _schemasBmna8ihM.wn)().int().nonnegative().optional(),
    intervalMinutes: (0, _schemasBmna8ihM.wn)().int().nonnegative().optional(),
    embeddingBatchTimeoutSeconds: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
    sessions: (0, _schemasBmna8ihM.Tn)({
      deltaBytes: (0, _schemasBmna8ihM.wn)().int().nonnegative().optional(),
      deltaMessages: (0, _schemasBmna8ihM.wn)().int().nonnegative().optional(),
      postCompactionForce: (0, _schemasBmna8ihM.At)().optional()
    }).strict().optional()
  }).strict().optional(),
  query: (0, _schemasBmna8ihM.Tn)({
    maxResults: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
    minScore: (0, _schemasBmna8ihM.wn)().min(0).max(1).optional(),
    hybrid: (0, _schemasBmna8ihM.Tn)({
      enabled: (0, _schemasBmna8ihM.At)().optional(),
      vectorWeight: (0, _schemasBmna8ihM.wn)().min(0).max(1).optional(),
      textWeight: (0, _schemasBmna8ihM.wn)().min(0).max(1).optional(),
      candidateMultiplier: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
      mmr: (0, _schemasBmna8ihM.Tn)({
        enabled: (0, _schemasBmna8ihM.At)().optional(),
        lambda: (0, _schemasBmna8ihM.wn)().min(0).max(1).optional()
      }).strict().optional(),
      temporalDecay: (0, _schemasBmna8ihM.Tn)({
        enabled: (0, _schemasBmna8ihM.At)().optional(),
        halfLifeDays: (0, _schemasBmna8ihM.wn)().int().positive().optional()
      }).strict().optional()
    }).strict().optional()
  }).strict().optional(),
  cache: (0, _schemasBmna8ihM.Tn)({
    enabled: (0, _schemasBmna8ihM.At)().optional(),
    maxEntries: (0, _schemasBmna8ihM.wn)().int().positive().optional()
  }).strict().optional()
}).strict().optional();
const AgentRuntimeAcpSchema = (0, _schemasBmna8ihM.Tn)({
  agent: (0, _schemasBmna8ihM.Rn)().optional(),
  backend: (0, _schemasBmna8ihM.Rn)().optional(),
  mode: (0, _schemasBmna8ihM.yt)(["persistent", "oneshot"]).optional(),
  cwd: (0, _schemasBmna8ihM.Rn)().optional()
}).strict().optional();
const AgentRuntimeSchema = (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.Tn)({ type: (0, _schemasBmna8ihM.dn)("embedded") }).strict(), (0, _schemasBmna8ihM.Tn)({
  type: (0, _schemasBmna8ihM.dn)("acp"),
  acp: AgentRuntimeAcpSchema
}).strict()]).optional();
const AgentEmbeddedHarnessSchema = exports.n = (0, _schemasBmna8ihM.Tn)({ runtime: (0, _schemasBmna8ihM.Rn)().optional() }).strict().optional();
const AgentRuntimePolicySchema = exports.a = (0, _schemasBmna8ihM.Tn)({ id: (0, _schemasBmna8ihM.Rn)().optional() }).strict().optional();
const AgentEntrySchema = exports.r = (0, _schemasBmna8ihM.Tn)({
  id: (0, _schemasBmna8ihM.Rn)(),
  default: (0, _schemasBmna8ihM.At)().optional(),
  name: (0, _schemasBmna8ihM.Rn)().optional(),
  description: (0, _schemasBmna8ihM.Rn)().optional(),
  workspace: (0, _schemasBmna8ihM.Rn)().optional(),
  agentDir: (0, _schemasBmna8ihM.Rn)().optional(),
  systemPromptOverride: (0, _schemasBmna8ihM.Rn)().optional(),
  agentRuntime: AgentRuntimePolicySchema,
  embeddedHarness: AgentEmbeddedHarnessSchema,
  model: AgentModelSchema.optional(),
  models: (0, _schemasBmna8ihM.Nn)((0, _schemasBmna8ihM.Rn)(), (0, _schemasBmna8ihM.Tn)({
    alias: (0, _schemasBmna8ihM.Rn)().optional(),
    params: (0, _schemasBmna8ihM.Nn)((0, _schemasBmna8ihM.Rn)(), (0, _schemasBmna8ihM.Zn)()).optional(),
    agentRuntime: AgentRuntimePolicySchema,
    streaming: (0, _schemasBmna8ihM.At)().optional()
  }).strict()).optional(),
  thinkingDefault: (0, _schemasBmna8ihM.yt)([
  "off",
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
  "adaptive",
  "max"]
  ).optional(),
  verboseDefault: (0, _schemasBmna8ihM.yt)([
  "off",
  "on",
  "full"]
  ).optional(),
  toolProgressDetail: (0, _schemasBmna8ihM.yt)(["explain", "raw"]).optional(),
  reasoningDefault: (0, _schemasBmna8ihM.yt)([
  "on",
  "off",
  "stream"]
  ).optional(),
  fastModeDefault: (0, _schemasBmna8ihM.At)().optional(),
  contextInjection: (0, _schemasBmna8ihM.Xn)([
  (0, _schemasBmna8ihM.dn)("always"),
  (0, _schemasBmna8ihM.dn)("continuation-skip"),
  (0, _schemasBmna8ihM.dn)("never")]
  ).optional(),
  bootstrapMaxChars: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
  bootstrapTotalMaxChars: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
  experimental: (0, _schemasBmna8ihM.Tn)({ localModelLean: (0, _schemasBmna8ihM.At)().optional() }).strict().optional(),
  skills: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
  memorySearch: MemorySearchSchema,
  humanDelay: _zodSchemaCoreQTf3ki3e.d.optional(),
  tts: _zodSchemaCoreQTf3ki3e.j,
  skillsLimits: AgentSkillsLimitsSchema,
  contextLimits: AgentContextLimitsSchema,
  contextTokens: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
  heartbeat: HeartbeatSchema,
  identity: _zodSchemaCoreQTf3ki3e.f,
  groupChat: _zodSchemaCoreQTf3ki3e.c,
  subagents: (0, _schemasBmna8ihM.Tn)({
    delegationMode: (0, _schemasBmna8ihM.yt)(["suggest", "prefer"]).optional(),
    allowAgents: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
    model: AgentModelSchema.optional(),
    thinking: (0, _schemasBmna8ihM.Rn)().optional(),
    requireAgentId: (0, _schemasBmna8ihM.At)().optional()
  }).strict().optional(),
  runRetries: AgentRunRetriesConfigSchema.optional(),
  embeddedPi: (0, _schemasBmna8ihM.Tn)({ executionContract: (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.dn)("default"), (0, _schemasBmna8ihM.dn)("strict-agentic")]).optional() }).strict().optional(),
  sandbox: AgentSandboxSchema,
  params: (0, _schemasBmna8ihM.Nn)((0, _schemasBmna8ihM.Rn)(), (0, _schemasBmna8ihM.Zn)()).optional(),
  tools: AgentToolsSchema,
  runtime: AgentRuntimeSchema
}).strict();
const ToolsSchema = exports.d = (0, _schemasBmna8ihM.Tn)({
  ...CommonToolPolicyFields,
  web: ToolsWebSchema,
  media: _zodSchemaCoreQTf3ki3e.O,
  links: _zodSchemaCoreQTf3ki3e.D,
  sessions: (0, _schemasBmna8ihM.Tn)({ visibility: (0, _schemasBmna8ihM.yt)([
    "self",
    "tree",
    "agent",
    "all"]
    ).optional() }).strict().optional(),
  loopDetection: ToolLoopDetectionSchema,
  toolSearch: ToolSearchSchema,
  codeMode: CodeModeSchema,
  message: MessageToolConfigSchema,
  agentToAgent: (0, _schemasBmna8ihM.Tn)({
    enabled: (0, _schemasBmna8ihM.At)().optional(),
    allow: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional()
  }).strict().optional(),
  elevated: (0, _schemasBmna8ihM.Tn)({
    enabled: (0, _schemasBmna8ihM.At)().optional(),
    allowFrom: ElevatedAllowFromSchema
  }).strict().optional(),
  exec: ToolExecSchema,
  fs: ToolFsSchema,
  subagents: (0, _schemasBmna8ihM.Tn)({ tools: ToolPolicySchema }).strict().optional(),
  sandbox: (0, _schemasBmna8ihM.Tn)({ tools: ToolPolicySchema }).strict().optional(),
  sessions_spawn: (0, _schemasBmna8ihM.Tn)({ attachments: (0, _schemasBmna8ihM.Tn)({
      enabled: (0, _schemasBmna8ihM.At)().optional(),
      maxTotalBytes: (0, _schemasBmna8ihM.wn)().optional(),
      maxFiles: (0, _schemasBmna8ihM.wn)().optional(),
      maxFileBytes: (0, _schemasBmna8ihM.wn)().optional(),
      retainOnSessionKeep: (0, _schemasBmna8ihM.At)().optional()
    }).strict().optional() }).strict().optional(),
  experimental: (0, _schemasBmna8ihM.Tn)({ planTool: (0, _schemasBmna8ihM.At)().optional() }).strict().optional()
}).strict().superRefine((value, ctx) => {
  addAllowAlsoAllowConflictIssue(value, ctx, "tools cannot set both allow and alsoAllow in the same scope (merge alsoAllow into allow, or remove allow and use profile + alsoAllow)");
}).optional();
//#endregion /* v9-b45191367a94132e */
