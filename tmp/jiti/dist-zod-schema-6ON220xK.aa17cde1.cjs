"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = parseNonNegativeByteSize;exports.r = parseByteSize;exports.t = void 0;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
var _schemasBmna8ihM = require("./schemas-Bmna8ihM.js");
var _compatZe2wFLca = require("./compat-ze2wFLca.js");
var _zodSchemaInstallsDyO5Hbk = require("./zod-schema.installs-DyO5Hbk4.js");
var _zodSchemaCoreQTf3ki3e = require("./zod-schema.core-QTf3ki3e.js");
var _zodSchemaSensitiveSjBPHVTu = require("./zod-schema.sensitive-SjBPHVTu.js");
var _parseDurationD8AJG6ba = require("./parse-duration-D8AJG6ba.js");
var _zodSchemaAgentRuntimeD8PVvs6o = require("./zod-schema.agent-runtime-D8PVvs6o.js");
var _zodSchemaChannelsR19iUZKL = require("./zod-schema.channels-R19iUZKL.js");
var _nodePath = _interopRequireDefault(require("node:path"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}
//#region src/cli/parse-bytes.ts
const UNIT_MULTIPLIERS = {
  b: 1,
  kb: 1024,
  k: 1024,
  mb: 1024 ** 2,
  m: 1024 ** 2,
  gb: 1024 ** 3,
  g: 1024 ** 3,
  tb: 1024 ** 4,
  t: 1024 ** 4
};
function invalidByteSize(raw, reason) {
  const value = raw.trim() ? `"${raw}"` : "empty value";
  const prefix = reason ? `Invalid byte size (${reason}): ${value}.` : `Invalid byte size: ${value}.`;
  return /* @__PURE__ */new Error(`${prefix} Use values like 512kb, 10mb, 1gb, or 500.`);
}
function parseByteSize(raw, opts) {
  const trimmed = (0, _stringCoerceLndEvhRk.a)((0, _stringCoerceLndEvhRk.c)(raw) ?? "");
  if (!trimmed) throw invalidByteSize(raw, "empty");
  const m = /^(\d+(?:\.\d+)?)([a-z]+)?$/.exec(trimmed);
  if (!m) throw invalidByteSize(raw);
  const value = Number(m[1]);
  if (!Number.isFinite(value) || value < 0) throw invalidByteSize(raw);
  const unit = (0, _stringCoerceLndEvhRk.a)(m[2] ?? opts?.defaultUnit ?? "b");
  const multiplier = UNIT_MULTIPLIERS[unit];
  if (!multiplier) throw invalidByteSize(raw, `unknown unit "${unit}"`);
  const bytes = Math.round(value * multiplier);
  if (!Number.isFinite(bytes)) throw invalidByteSize(raw);
  return bytes;
}
//#endregion
//#region src/config/control-ui-css.ts
const CSS_WIDTH_KEYWORDS = new Set([
"none",
"min-content",
"max-content"]
);
const CSS_WIDTH_FUNCTIONS = new Set([
"calc",
"clamp",
"fit-content",
"max",
"min"]
);
const CSS_WIDTH_UNITS = new Set([
"ch",
"em",
"rem",
"vh",
"vmax",
"vmin",
"vw",
"px"]
);
const CSS_WIDTH_ALLOWED_CHARS = /^[0-9A-Za-z.%+\-*/(),\s]+$/;
const CSS_WIDTH_IDENTIFIER_RE = /[A-Za-z][A-Za-z0-9-]*/g;
const CSS_WIDTH_SIMPLE_RE = /^(?:\d+(?:\.\d+)?|\.\d+)(?:px|rem|em|ch|vw|vh|vmin|vmax|%)$/i;
const CSS_WIDTH_MAX_LENGTH = 96;
function hasBalancedParentheses(value) {
  let depth = 0;
  for (const char of value) if (char === "(") depth++;else
  if (char === ")") {
    depth--;
    if (depth < 0) return false;
  }
  return depth === 0;
}
function hasAllowedIdentifiers(value) {
  for (const match of value.matchAll(CSS_WIDTH_IDENTIFIER_RE)) {
    const identifier = match[0].toLowerCase();
    if (!CSS_WIDTH_FUNCTIONS.has(identifier) && !CSS_WIDTH_KEYWORDS.has(identifier) && !CSS_WIDTH_UNITS.has(identifier)) return false;
  }
  return true;
}
function normalizeControlUiChatMessageMaxWidth(value) {
  return value.trim().replace(/\s+/g, " ");
}
function isValidControlUiChatMessageMaxWidth(value) {
  const normalized = normalizeControlUiChatMessageMaxWidth(value);
  if (normalized.length === 0 || normalized.length > CSS_WIDTH_MAX_LENGTH) return false;
  if (CSS_WIDTH_KEYWORDS.has(normalized.toLowerCase())) return true;
  if (CSS_WIDTH_SIMPLE_RE.test(normalized)) return true;
  if (!CSS_WIDTH_ALLOWED_CHARS.test(normalized)) return false;
  if (!hasBalancedParentheses(normalized) || !hasAllowedIdentifiers(normalized)) return false;
  return /^(?:calc|clamp|fit-content|max|min)\(.+\)$/i.test(normalized);
}
//#endregion
//#region src/config/byte-size.ts
/**
* Parse an optional byte-size value from config.
* Accepts non-negative numbers or strings like "2mb".
*/
function parseNonNegativeByteSize(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    const int = Math.floor(value);
    return int >= 0 ? int : null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    try {
      const bytes = parseByteSize(trimmed, { defaultUnit: "b" });
      return bytes >= 0 ? bytes : null;
    } catch {
      return null;
    }
  }
  return null;
}
function isValidNonNegativeByteSizeString(value) {
  return parseNonNegativeByteSize(value) !== null;
}
//#endregion
//#region src/config/zod-schema.agent-defaults.ts
const SilentReplyPolicySchema = (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.dn)("allow"), (0, _schemasBmna8ihM.dn)("disallow")]);
const NonNegativeByteSizeSchema = (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.wn)().int().nonnegative(), (0, _schemasBmna8ihM.Rn)().refine(isValidNonNegativeByteSizeString, "Expected byte size string like 2mb")]);
const OptionalBootstrapFileNameSchema = (0, _schemasBmna8ihM.yt)([
"SOUL.md",
"USER.md",
"HEARTBEAT.md",
"IDENTITY.md"]
);
const SilentReplyPolicyConfigSchema = (0, _schemasBmna8ihM.Tn)({
  group: SilentReplyPolicySchema.optional(),
  internal: SilentReplyPolicySchema.optional()
}).strict();
const AgentDefaultsSchema = (0, _schemasBmna8ihM.Tn)({
  /** Global default provider params applied to all models before per-model and per-agent overrides. */
  params: (0, _schemasBmna8ihM.Nn)((0, _schemasBmna8ihM.Rn)(), (0, _schemasBmna8ihM.Zn)()).optional(),
  agentRuntime: _zodSchemaAgentRuntimeD8PVvs6o.a,
  embeddedHarness: _zodSchemaAgentRuntimeD8PVvs6o.n,
  model: _zodSchemaAgentRuntimeD8PVvs6o.f.optional(),
  imageModel: _zodSchemaAgentRuntimeD8PVvs6o.p.optional(),
  imageGenerationModel: _zodSchemaAgentRuntimeD8PVvs6o.p.optional(),
  videoGenerationModel: _zodSchemaAgentRuntimeD8PVvs6o.p.optional(),
  musicGenerationModel: _zodSchemaAgentRuntimeD8PVvs6o.p.optional(),
  mediaGenerationAutoProviderFallback: (0, _schemasBmna8ihM.At)().optional(),
  pdfModel: _zodSchemaAgentRuntimeD8PVvs6o.p.optional(),
  pdfMaxBytesMb: (0, _schemasBmna8ihM.wn)().positive().optional(),
  pdfMaxPages: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
  models: (0, _schemasBmna8ihM.Nn)((0, _schemasBmna8ihM.Rn)(), (0, _schemasBmna8ihM.Tn)({
    alias: (0, _schemasBmna8ihM.Rn)().optional(),
    /** Provider-specific API parameters (e.g., GLM-4.7 thinking mode). */
    params: (0, _schemasBmna8ihM.Nn)((0, _schemasBmna8ihM.Rn)(), (0, _schemasBmna8ihM.Zn)()).optional(),
    agentRuntime: _zodSchemaAgentRuntimeD8PVvs6o.a,
    /** Enable streaming for this model (default: true, false for Ollama to avoid SDK issue #1205). */
    streaming: (0, _schemasBmna8ihM.At)().optional()
  }).strict()).optional(),
  workspace: (0, _schemasBmna8ihM.Rn)().optional(),
  skills: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
  silentReply: SilentReplyPolicyConfigSchema.optional(),
  repoRoot: (0, _schemasBmna8ihM.Rn)().optional(),
  systemPromptOverride: (0, _schemasBmna8ihM.Rn)().optional(),
  promptOverlays: (0, _schemasBmna8ihM.Tn)({ gpt5: (0, _schemasBmna8ihM.Tn)({ personality: (0, _schemasBmna8ihM.Xn)([
      (0, _schemasBmna8ihM.dn)("friendly"),
      (0, _schemasBmna8ihM.dn)("on"),
      (0, _schemasBmna8ihM.dn)("off")]
      ).optional() }).strict().optional() }).strict().optional(),
  skipBootstrap: (0, _schemasBmna8ihM.At)().optional(),
  skipOptionalBootstrapFiles: (0, _schemasBmna8ihM.Et)(OptionalBootstrapFileNameSchema).optional(),
  contextInjection: (0, _schemasBmna8ihM.Xn)([
  (0, _schemasBmna8ihM.dn)("always"),
  (0, _schemasBmna8ihM.dn)("continuation-skip"),
  (0, _schemasBmna8ihM.dn)("never")]
  ).optional(),
  bootstrapMaxChars: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
  bootstrapTotalMaxChars: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
  experimental: (0, _schemasBmna8ihM.Tn)({ localModelLean: (0, _schemasBmna8ihM.At)().optional() }).strict().optional(),
  bootstrapPromptTruncationWarning: (0, _schemasBmna8ihM.Xn)([
  (0, _schemasBmna8ihM.dn)("off"),
  (0, _schemasBmna8ihM.dn)("once"),
  (0, _schemasBmna8ihM.dn)("always")]
  ).optional(),
  userTimezone: (0, _schemasBmna8ihM.Rn)().optional(),
  startupContext: (0, _schemasBmna8ihM.Tn)({
    enabled: (0, _schemasBmna8ihM.At)().optional(),
    applyOn: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.dn)("new"), (0, _schemasBmna8ihM.dn)("reset")])).optional(),
    dailyMemoryDays: (0, _schemasBmna8ihM.wn)().int().min(1).max(14).optional(),
    maxFileBytes: (0, _schemasBmna8ihM.wn)().int().min(1).max(64 * 1024).optional(),
    maxFileChars: (0, _schemasBmna8ihM.wn)().int().min(1).max(1e4).optional(),
    maxTotalChars: (0, _schemasBmna8ihM.wn)().int().min(1).max(5e4).optional()
  }).strict().optional(),
  contextLimits: _zodSchemaAgentRuntimeD8PVvs6o.t,
  timeFormat: (0, _schemasBmna8ihM.Xn)([
  (0, _schemasBmna8ihM.dn)("auto"),
  (0, _schemasBmna8ihM.dn)("12"),
  (0, _schemasBmna8ihM.dn)("24")]
  ).optional(),
  envelopeTimezone: (0, _schemasBmna8ihM.Rn)().optional(),
  envelopeTimestamp: (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.dn)("on"), (0, _schemasBmna8ihM.dn)("off")]).optional(),
  envelopeElapsed: (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.dn)("on"), (0, _schemasBmna8ihM.dn)("off")]).optional(),
  contextTokens: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
  cliBackends: (0, _schemasBmna8ihM.Nn)((0, _schemasBmna8ihM.Rn)(), _zodSchemaCoreQTf3ki3e.r).optional(),
  memorySearch: _zodSchemaAgentRuntimeD8PVvs6o.l,
  contextPruning: (0, _schemasBmna8ihM.Tn)({
    mode: (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.dn)("off"), (0, _schemasBmna8ihM.dn)("cache-ttl")]).optional(),
    ttl: (0, _schemasBmna8ihM.Rn)().optional(),
    keepLastAssistants: (0, _schemasBmna8ihM.wn)().int().nonnegative().optional(),
    softTrimRatio: (0, _schemasBmna8ihM.wn)().min(0).max(1).optional(),
    hardClearRatio: (0, _schemasBmna8ihM.wn)().min(0).max(1).optional(),
    minPrunableToolChars: (0, _schemasBmna8ihM.wn)().int().nonnegative().optional(),
    tools: (0, _schemasBmna8ihM.Tn)({
      allow: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
      deny: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional()
    }).strict().optional(),
    softTrim: (0, _schemasBmna8ihM.Tn)({
      maxChars: (0, _schemasBmna8ihM.wn)().int().nonnegative().optional(),
      headChars: (0, _schemasBmna8ihM.wn)().int().nonnegative().optional(),
      tailChars: (0, _schemasBmna8ihM.wn)().int().nonnegative().optional()
    }).strict().optional(),
    hardClear: (0, _schemasBmna8ihM.Tn)({
      enabled: (0, _schemasBmna8ihM.At)().optional(),
      placeholder: (0, _schemasBmna8ihM.Rn)().optional()
    }).strict().optional()
  }).strict().optional(),
  compaction: (0, _schemasBmna8ihM.Tn)({
    mode: (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.dn)("default"), (0, _schemasBmna8ihM.dn)("safeguard")]).optional(),
    provider: (0, _schemasBmna8ihM.Rn)().optional(),
    reserveTokens: (0, _schemasBmna8ihM.wn)().int().nonnegative().optional(),
    keepRecentTokens: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
    reserveTokensFloor: (0, _schemasBmna8ihM.wn)().int().nonnegative().optional(),
    maxHistoryShare: (0, _schemasBmna8ihM.wn)().min(.1).max(.9).optional(),
    customInstructions: (0, _schemasBmna8ihM.Rn)().optional(),
    identifierPolicy: (0, _schemasBmna8ihM.Xn)([
    (0, _schemasBmna8ihM.dn)("strict"),
    (0, _schemasBmna8ihM.dn)("off"),
    (0, _schemasBmna8ihM.dn)("custom")]
    ).optional(),
    identifierInstructions: (0, _schemasBmna8ihM.Rn)().optional(),
    recentTurnsPreserve: (0, _schemasBmna8ihM.wn)().int().min(0).max(12).optional(),
    qualityGuard: (0, _schemasBmna8ihM.Tn)({
      enabled: (0, _schemasBmna8ihM.At)().optional(),
      maxRetries: (0, _schemasBmna8ihM.wn)().int().nonnegative().optional()
    }).strict().optional(),
    midTurnPrecheck: (0, _schemasBmna8ihM.Tn)({ enabled: (0, _schemasBmna8ihM.At)().optional() }).strict().optional(),
    postIndexSync: (0, _schemasBmna8ihM.yt)([
    "off",
    "async",
    "await"]
    ).optional(),
    postCompactionSections: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
    model: (0, _schemasBmna8ihM.Rn)().optional(),
    timeoutSeconds: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
    memoryFlush: (0, _schemasBmna8ihM.Tn)({
      enabled: (0, _schemasBmna8ihM.At)().optional(),
      model: (0, _schemasBmna8ihM.Rn)().optional(),
      softThresholdTokens: (0, _schemasBmna8ihM.wn)().int().nonnegative().optional(),
      forceFlushTranscriptBytes: NonNegativeByteSizeSchema.optional(),
      prompt: (0, _schemasBmna8ihM.Rn)().optional(),
      systemPrompt: (0, _schemasBmna8ihM.Rn)().optional()
    }).strict().optional(),
    truncateAfterCompaction: (0, _schemasBmna8ihM.At)().optional(),
    maxActiveTranscriptBytes: NonNegativeByteSizeSchema.optional(),
    notifyUser: (0, _schemasBmna8ihM.At)().optional()
  }).strict().optional(),
  runRetries: _zodSchemaAgentRuntimeD8PVvs6o.i.optional(),
  embeddedPi: (0, _schemasBmna8ihM.Tn)({
    projectSettingsPolicy: (0, _schemasBmna8ihM.Xn)([
    (0, _schemasBmna8ihM.dn)("trusted"),
    (0, _schemasBmna8ihM.dn)("sanitize"),
    (0, _schemasBmna8ihM.dn)("ignore")]
    ).optional(),
    executionContract: (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.dn)("default"), (0, _schemasBmna8ihM.dn)("strict-agentic")]).optional()
  }).strict().optional(),
  thinkingDefault: (0, _schemasBmna8ihM.Xn)([
  (0, _schemasBmna8ihM.dn)("off"),
  (0, _schemasBmna8ihM.dn)("minimal"),
  (0, _schemasBmna8ihM.dn)("low"),
  (0, _schemasBmna8ihM.dn)("medium"),
  (0, _schemasBmna8ihM.dn)("high"),
  (0, _schemasBmna8ihM.dn)("xhigh"),
  (0, _schemasBmna8ihM.dn)("adaptive"),
  (0, _schemasBmna8ihM.dn)("max")]
  ).optional(),
  verboseDefault: (0, _schemasBmna8ihM.Xn)([
  (0, _schemasBmna8ihM.dn)("off"),
  (0, _schemasBmna8ihM.dn)("on"),
  (0, _schemasBmna8ihM.dn)("full")]
  ).optional(),
  toolProgressDetail: (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.dn)("explain"), (0, _schemasBmna8ihM.dn)("raw")]).optional(),
  reasoningDefault: (0, _schemasBmna8ihM.Xn)([
  (0, _schemasBmna8ihM.dn)("off"),
  (0, _schemasBmna8ihM.dn)("on"),
  (0, _schemasBmna8ihM.dn)("stream")]
  ).optional(),
  elevatedDefault: (0, _schemasBmna8ihM.Xn)([
  (0, _schemasBmna8ihM.dn)("off"),
  (0, _schemasBmna8ihM.dn)("on"),
  (0, _schemasBmna8ihM.dn)("ask"),
  (0, _schemasBmna8ihM.dn)("full")]
  ).optional(),
  blockStreamingDefault: (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.dn)("off"), (0, _schemasBmna8ihM.dn)("on")]).optional(),
  blockStreamingBreak: (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.dn)("text_end"), (0, _schemasBmna8ihM.dn)("message_end")]).optional(),
  blockStreamingChunk: _zodSchemaCoreQTf3ki3e.t.optional(),
  blockStreamingCoalesce: _zodSchemaCoreQTf3ki3e.n.optional(),
  humanDelay: _zodSchemaCoreQTf3ki3e.d.optional(),
  timeoutSeconds: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
  mediaMaxMb: (0, _schemasBmna8ihM.wn)().positive().optional(),
  imageMaxDimensionPx: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
  typingIntervalSeconds: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
  typingMode: _zodSchemaCoreQTf3ki3e.P.optional(),
  heartbeat: _zodSchemaAgentRuntimeD8PVvs6o.c,
  maxConcurrent: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
  subagents: (0, _schemasBmna8ihM.Tn)({
    delegationMode: (0, _schemasBmna8ihM.yt)(["suggest", "prefer"]).optional(),
    allowAgents: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
    maxConcurrent: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
    maxSpawnDepth: (0, _schemasBmna8ihM.wn)().int().min(1).max(5).optional().describe("Maximum nesting depth for sub-agent spawning. 1 = no nesting (default), 2 = sub-agents can spawn sub-sub-agents."),
    maxChildrenPerAgent: (0, _schemasBmna8ihM.wn)().int().min(1).max(20).optional().describe("Maximum number of active children a single agent session can spawn (default: 5)."),
    archiveAfterMinutes: (0, _schemasBmna8ihM.wn)().int().min(0).optional(),
    model: _zodSchemaAgentRuntimeD8PVvs6o.f.optional(),
    thinking: (0, _schemasBmna8ihM.Rn)().optional(),
    runTimeoutSeconds: (0, _schemasBmna8ihM.wn)().int().min(0).optional(),
    announceTimeoutMs: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
    requireAgentId: (0, _schemasBmna8ihM.At)().optional()
  }).strict().optional(),
  sandbox: _zodSchemaAgentRuntimeD8PVvs6o.o
}).strict().optional();
//#endregion
//#region src/config/zod-schema.agents.ts
const AgentsSchema = (0, _schemasBmna8ihM.Tn)({
  defaults: (0, _schemasBmna8ihM.un)(() => AgentDefaultsSchema).optional(),
  list: (0, _schemasBmna8ihM.Et)(_zodSchemaAgentRuntimeD8PVvs6o.r).optional()
}).strict().optional();
const BindingMatchSchema = (0, _schemasBmna8ihM.Tn)({
  channel: (0, _schemasBmna8ihM.Rn)(),
  accountId: (0, _schemasBmna8ihM.Rn)().optional(),
  peer: (0, _schemasBmna8ihM.Tn)({
    kind: (0, _schemasBmna8ihM.Xn)([
    (0, _schemasBmna8ihM.dn)("direct"),
    (0, _schemasBmna8ihM.dn)("group"),
    (0, _schemasBmna8ihM.dn)("channel"),
    (0, _schemasBmna8ihM.dn)("dm")]
    ),
    id: (0, _schemasBmna8ihM.Rn)()
  }).strict().optional(),
  guildId: (0, _schemasBmna8ihM.Rn)().optional(),
  teamId: (0, _schemasBmna8ihM.Rn)().optional(),
  roles: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional()
}).strict();
const BindingSessionSchema = (0, _schemasBmna8ihM.Tn)({ dmScope: (0, _schemasBmna8ihM.Xn)([
  (0, _schemasBmna8ihM.dn)("main"),
  (0, _schemasBmna8ihM.dn)("per-peer"),
  (0, _schemasBmna8ihM.dn)("per-channel-peer"),
  (0, _schemasBmna8ihM.dn)("per-account-channel-peer")]
  ).optional() }).strict();
const BindingsSchema = (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.Tn)({
  type: (0, _schemasBmna8ihM.dn)("route").optional(),
  agentId: (0, _schemasBmna8ihM.Rn)(),
  comment: (0, _schemasBmna8ihM.Rn)().optional(),
  match: BindingMatchSchema,
  session: BindingSessionSchema.optional()
}).strict(), (0, _schemasBmna8ihM.Tn)({
  type: (0, _schemasBmna8ihM.dn)("acp"),
  agentId: (0, _schemasBmna8ihM.Rn)(),
  comment: (0, _schemasBmna8ihM.Rn)().optional(),
  match: BindingMatchSchema,
  acp: (0, _schemasBmna8ihM.Tn)({
    mode: (0, _schemasBmna8ihM.yt)(["persistent", "oneshot"]).optional(),
    label: (0, _schemasBmna8ihM.Rn)().optional(),
    cwd: (0, _schemasBmna8ihM.Rn)().optional(),
    backend: (0, _schemasBmna8ihM.Rn)().optional()
  }).strict().optional()
}).strict().superRefine((value, ctx) => {
  if (!((0, _stringCoerceLndEvhRk.c)(value.match.peer?.id) ?? "")) {
    ctx.addIssue({
      code: _compatZe2wFLca.n.custom,
      path: ["match", "peer"],
      message: "ACP bindings require match.peer.id to target a concrete conversation."
    });
    return;
  }
})])).optional();
const BroadcastSchema = (0, _schemasBmna8ihM.Tn)({ strategy: (0, _schemasBmna8ihM.yt)(["parallel", "sequential"]).optional() }).catchall((0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)())).optional();
const AudioSchema = (0, _schemasBmna8ihM.Tn)({ transcription: _zodSchemaCoreQTf3ki3e.k }).strict().optional();
//#endregion
//#region src/config/zod-schema.approvals.ts
const ExecApprovalForwardTargetSchema = (0, _schemasBmna8ihM.Tn)({
  channel: (0, _schemasBmna8ihM.Rn)().min(1),
  to: (0, _schemasBmna8ihM.Rn)().min(1),
  accountId: (0, _schemasBmna8ihM.Rn)().optional(),
  threadId: (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.Rn)(), (0, _schemasBmna8ihM.wn)()]).optional()
}).strict();
const ExecApprovalForwardingSchema = (0, _schemasBmna8ihM.Tn)({
  enabled: (0, _schemasBmna8ihM.At)().optional(),
  mode: (0, _schemasBmna8ihM.Xn)([
  (0, _schemasBmna8ihM.dn)("session"),
  (0, _schemasBmna8ihM.dn)("targets"),
  (0, _schemasBmna8ihM.dn)("both")]
  ).optional(),
  agentFilter: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
  sessionFilter: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
  targets: (0, _schemasBmna8ihM.Et)(ExecApprovalForwardTargetSchema).optional()
}).strict().optional();
const ApprovalsSchema = (0, _schemasBmna8ihM.Tn)({
  exec: ExecApprovalForwardingSchema,
  plugin: ExecApprovalForwardingSchema
}).strict().optional();
//#endregion
//#region src/config/zod-schema.channels-config.ts
const ChannelModelByChannelSchema = (0, _schemasBmna8ihM.Nn)((0, _schemasBmna8ihM.Rn)(), (0, _schemasBmna8ihM.Nn)((0, _schemasBmna8ihM.Rn)(), (0, _schemasBmna8ihM.Rn)())).optional();
const ChannelBotLoopProtectionSchema = (0, _schemasBmna8ihM.Tn)({
  enabled: (0, _schemasBmna8ihM.At)().optional(),
  maxEventsPerWindow: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
  windowSeconds: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
  cooldownSeconds: (0, _schemasBmna8ihM.wn)().int().positive().optional()
}).strict();
function addLegacyChannelAcpBindingIssues(value, ctx, path = []) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((entry, index) => addLegacyChannelAcpBindingIssues(entry, ctx, [...path, index]));
    return;
  }
  const record = value;
  const bindings = record.bindings;
  if (bindings && typeof bindings === "object" && !Array.isArray(bindings)) {
    const acp = bindings.acp;
    if (acp && typeof acp === "object") ctx.addIssue({
      code: _compatZe2wFLca.n.custom,
      path: [
      ...path,
      "bindings",
      "acp"],

      message: "Legacy channel-local ACP bindings were removed; use top-level bindings[] entries."
    });
  }
  for (const [key, entry] of Object.entries(record)) addLegacyChannelAcpBindingIssues(entry, ctx, [...path, key]);
}
const ChannelsSchema = (0, _schemasBmna8ihM.Tn)({
  defaults: (0, _schemasBmna8ihM.Tn)({
    groupPolicy: _zodSchemaCoreQTf3ki3e.l.optional(),
    contextVisibility: _zodSchemaCoreQTf3ki3e.i.optional(),
    heartbeat: _zodSchemaChannelsR19iUZKL.n,
    botLoopProtection: ChannelBotLoopProtectionSchema.optional()
  }).strict().optional(),
  modelByChannel: ChannelModelByChannelSchema
}).passthrough().superRefine((value, ctx) => {
  addLegacyChannelAcpBindingIssues(value, ctx);
}).optional();
//#endregion
//#region src/config/zod-schema.hooks.ts
function isSafeRelativeModulePath(raw) {
  const value = raw.trim();
  if (!value) return false;
  if (_nodePath.default.isAbsolute(value)) return false;
  if (value.startsWith("~")) return false;
  if (value.includes(":")) return false;
  if (value.split(/[\\/]+/g).some((part) => part === "..")) return false;
  return true;
}
const SafeRelativeModulePathSchema = (0, _schemasBmna8ihM.Rn)().refine(isSafeRelativeModulePath, "module must be a safe relative path (no absolute paths)");
const HookMappingSchema = (0, _schemasBmna8ihM.Tn)({
  id: (0, _schemasBmna8ihM.Rn)().optional(),
  match: (0, _schemasBmna8ihM.Tn)({
    path: (0, _schemasBmna8ihM.Rn)().optional(),
    source: (0, _schemasBmna8ihM.Rn)().optional()
  }).optional(),
  action: (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.dn)("wake"), (0, _schemasBmna8ihM.dn)("agent")]).optional(),
  wakeMode: (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.dn)("now"), (0, _schemasBmna8ihM.dn)("next-heartbeat")]).optional(),
  name: (0, _schemasBmna8ihM.Rn)().optional(),
  agentId: (0, _schemasBmna8ihM.Rn)().optional(),
  sessionKey: (0, _schemasBmna8ihM.Rn)().optional().register(_zodSchemaSensitiveSjBPHVTu.t),
  messageTemplate: (0, _schemasBmna8ihM.Rn)().optional(),
  textTemplate: (0, _schemasBmna8ihM.Rn)().optional(),
  deliver: (0, _schemasBmna8ihM.At)().optional(),
  allowUnsafeExternalContent: (0, _schemasBmna8ihM.At)().optional(),
  channel: (0, _schemasBmna8ihM.Rn)().trim().min(1).optional(),
  to: (0, _schemasBmna8ihM.Rn)().optional(),
  model: (0, _schemasBmna8ihM.Rn)().optional(),
  thinking: (0, _schemasBmna8ihM.Rn)().optional(),
  timeoutSeconds: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
  transform: (0, _schemasBmna8ihM.Tn)({
    module: SafeRelativeModulePathSchema,
    export: (0, _schemasBmna8ihM.Rn)().optional()
  }).strict().optional()
}).strict().optional();
const InternalHookHandlerSchema = (0, _schemasBmna8ihM.Tn)({
  event: (0, _schemasBmna8ihM.Rn)(),
  module: SafeRelativeModulePathSchema,
  export: (0, _schemasBmna8ihM.Rn)().optional()
}).strict();
const HookConfigSchema = (0, _schemasBmna8ihM.Tn)({
  enabled: (0, _schemasBmna8ihM.At)().optional(),
  env: (0, _schemasBmna8ihM.Nn)((0, _schemasBmna8ihM.Rn)(), (0, _schemasBmna8ihM.Rn)()).optional()
}).passthrough();
const HookInstallRecordSchema = (0, _schemasBmna8ihM.Tn)({
  ..._zodSchemaInstallsDyO5Hbk.t,
  hooks: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional()
}).strict();
const InternalHooksSchema = (0, _schemasBmna8ihM.Tn)({
  enabled: (0, _schemasBmna8ihM.At)().optional(),
  handlers: (0, _schemasBmna8ihM.Et)(InternalHookHandlerSchema).optional(),
  entries: (0, _schemasBmna8ihM.Nn)((0, _schemasBmna8ihM.Rn)(), HookConfigSchema).optional(),
  load: (0, _schemasBmna8ihM.Tn)({ extraDirs: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional() }).strict().optional(),
  installs: (0, _schemasBmna8ihM.Nn)((0, _schemasBmna8ihM.Rn)(), HookInstallRecordSchema).optional()
}).strict().optional();
const HooksGmailSchema = (0, _schemasBmna8ihM.Tn)({
  account: (0, _schemasBmna8ihM.Rn)().optional(),
  label: (0, _schemasBmna8ihM.Rn)().optional(),
  topic: (0, _schemasBmna8ihM.Rn)().optional(),
  subscription: (0, _schemasBmna8ihM.Rn)().optional(),
  pushToken: (0, _schemasBmna8ihM.Rn)().optional().register(_zodSchemaSensitiveSjBPHVTu.t),
  hookUrl: (0, _schemasBmna8ihM.Rn)().optional(),
  includeBody: (0, _schemasBmna8ihM.At)().optional(),
  maxBytes: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
  renewEveryMinutes: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
  allowUnsafeExternalContent: (0, _schemasBmna8ihM.At)().optional(),
  serve: (0, _schemasBmna8ihM.Tn)({
    bind: (0, _schemasBmna8ihM.Rn)().optional(),
    port: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
    path: (0, _schemasBmna8ihM.Rn)().optional()
  }).strict().optional(),
  tailscale: (0, _schemasBmna8ihM.Tn)({
    mode: (0, _schemasBmna8ihM.Xn)([
    (0, _schemasBmna8ihM.dn)("off"),
    (0, _schemasBmna8ihM.dn)("serve"),
    (0, _schemasBmna8ihM.dn)("funnel")]
    ).optional(),
    path: (0, _schemasBmna8ihM.Rn)().optional(),
    target: (0, _schemasBmna8ihM.Rn)().optional()
  }).strict().optional(),
  model: (0, _schemasBmna8ihM.Rn)().optional(),
  thinking: (0, _schemasBmna8ihM.Xn)([
  (0, _schemasBmna8ihM.dn)("off"),
  (0, _schemasBmna8ihM.dn)("minimal"),
  (0, _schemasBmna8ihM.dn)("low"),
  (0, _schemasBmna8ihM.dn)("medium"),
  (0, _schemasBmna8ihM.dn)("high")]
  ).optional()
}).strict().optional();
//#endregion
//#region src/config/zod-schema.proxy.ts
function isHttpOrHttpsProxyUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
const ProxyLoopbackModeSchema = (0, _schemasBmna8ihM.yt)([
"gateway-only",
"proxy",
"block"]
);
const ProxyTlsConfigSchema = (0, _schemasBmna8ihM.Tn)({ caFile: (0, _schemasBmna8ihM.Rn)().min(1).optional() }).strict().optional();
const ProxyConfigSchema = (0, _schemasBmna8ihM.Tn)({
  enabled: (0, _schemasBmna8ihM.At)().optional(),
  proxyUrl: (0, _schemasBmna8ihM.Qn)().refine(isHttpOrHttpsProxyUrl, { message: "proxyUrl must use http:// or https://" }).register(_zodSchemaSensitiveSjBPHVTu.t).optional(),
  tls: ProxyTlsConfigSchema,
  loopbackMode: ProxyLoopbackModeSchema.optional()
}).strict().optional();
//#endregion
//#region src/config/zod-schema.session.ts
const SessionResetConfigSchema = (0, _schemasBmna8ihM.Tn)({
  mode: (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.dn)("daily"), (0, _schemasBmna8ihM.dn)("idle")]).optional(),
  atHour: (0, _schemasBmna8ihM.wn)().int().min(0).max(23).optional(),
  idleMinutes: (0, _schemasBmna8ihM.wn)().int().positive().optional()
}).strict();
const SessionSendPolicySchema = (0, _zodSchemaCoreQTf3ki3e.z)();
const SessionSchema = (0, _schemasBmna8ihM.Tn)({
  scope: (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.dn)("per-sender"), (0, _schemasBmna8ihM.dn)("global")]).optional(),
  dmScope: (0, _schemasBmna8ihM.Xn)([
  (0, _schemasBmna8ihM.dn)("main"),
  (0, _schemasBmna8ihM.dn)("per-peer"),
  (0, _schemasBmna8ihM.dn)("per-channel-peer"),
  (0, _schemasBmna8ihM.dn)("per-account-channel-peer")]
  ).optional(),
  identityLinks: (0, _schemasBmna8ihM.Nn)((0, _schemasBmna8ihM.Rn)(), (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)())).optional(),
  resetTriggers: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
  idleMinutes: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
  reset: SessionResetConfigSchema.optional(),
  resetByType: (0, _schemasBmna8ihM.Tn)({
    direct: SessionResetConfigSchema.optional(),
    /** @deprecated Use `direct` instead. Kept for backward compatibility. */
    dm: SessionResetConfigSchema.optional(),
    group: SessionResetConfigSchema.optional(),
    thread: SessionResetConfigSchema.optional()
  }).strict().optional(),
  resetByChannel: (0, _schemasBmna8ihM.Nn)((0, _schemasBmna8ihM.Rn)(), SessionResetConfigSchema).optional(),
  store: (0, _schemasBmna8ihM.Rn)().optional(),
  typingIntervalSeconds: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
  typingMode: _zodSchemaCoreQTf3ki3e.P.optional(),
  mainKey: (0, _schemasBmna8ihM.Rn)().optional(),
  sendPolicy: SessionSendPolicySchema.optional(),
  writeLock: (0, _schemasBmna8ihM.Tn)({
    acquireTimeoutMs: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
    staleMs: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
    maxHoldMs: (0, _schemasBmna8ihM.wn)().int().positive().optional()
  }).strict().optional(),
  agentToAgent: (0, _schemasBmna8ihM.Tn)({ maxPingPongTurns: (0, _schemasBmna8ihM.wn)().int().min(0).max(20).optional() }).strict().optional(),
  threadBindings: (0, _schemasBmna8ihM.Tn)({
    enabled: (0, _schemasBmna8ihM.At)().optional(),
    idleHours: (0, _schemasBmna8ihM.wn)().nonnegative().optional(),
    maxAgeHours: (0, _schemasBmna8ihM.wn)().nonnegative().optional(),
    spawnSessions: (0, _schemasBmna8ihM.At)().optional(),
    defaultSpawnContext: (0, _schemasBmna8ihM.yt)(["isolated", "fork"]).optional()
  }).strict().optional(),
  maintenance: (0, _schemasBmna8ihM.Tn)({
    mode: (0, _schemasBmna8ihM.yt)(["enforce", "warn"]).optional(),
    pruneAfter: (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.Rn)(), (0, _schemasBmna8ihM.wn)()]).optional(),
    /** @deprecated Use pruneAfter instead. */
    pruneDays: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
    maxEntries: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
    rotateBytes: (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.Rn)(), (0, _schemasBmna8ihM.wn)()]).optional(),
    resetArchiveRetention: (0, _schemasBmna8ihM.Xn)([
    (0, _schemasBmna8ihM.Rn)(),
    (0, _schemasBmna8ihM.wn)(),
    (0, _schemasBmna8ihM.dn)(false)]
    ).optional(),
    maxDiskBytes: (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.Rn)(), (0, _schemasBmna8ihM.wn)()]).optional(),
    highWaterBytes: (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.Rn)(), (0, _schemasBmna8ihM.wn)()]).optional()
  }).strict().superRefine((val, ctx) => {
    if (val.pruneAfter !== void 0) try {
      (0, _parseDurationD8AJG6ba.t)((0, _stringCoerceLndEvhRk.d)(val.pruneAfter) ?? "", { defaultUnit: "d" });
    } catch {
      ctx.addIssue({
        code: _compatZe2wFLca.n.custom,
        path: ["pruneAfter"],
        message: "invalid duration (use ms, s, m, h, d)"
      });
    }
    if (val.resetArchiveRetention !== void 0 && val.resetArchiveRetention !== false) try {
      (0, _parseDurationD8AJG6ba.t)((0, _stringCoerceLndEvhRk.d)(val.resetArchiveRetention) ?? "", { defaultUnit: "d" });
    } catch {
      ctx.addIssue({
        code: _compatZe2wFLca.n.custom,
        path: ["resetArchiveRetention"],
        message: "invalid duration (use ms, s, m, h, d)"
      });
    }
    if (val.maxDiskBytes !== void 0) try {
      parseByteSize((0, _stringCoerceLndEvhRk.d)(val.maxDiskBytes) ?? "", { defaultUnit: "b" });
    } catch {
      ctx.addIssue({
        code: _compatZe2wFLca.n.custom,
        path: ["maxDiskBytes"],
        message: "invalid size (use b, kb, mb, gb, tb)"
      });
    }
    if (val.highWaterBytes !== void 0) try {
      parseByteSize((0, _stringCoerceLndEvhRk.d)(val.highWaterBytes) ?? "", { defaultUnit: "b" });
    } catch {
      ctx.addIssue({
        code: _compatZe2wFLca.n.custom,
        path: ["highWaterBytes"],
        message: "invalid size (use b, kb, mb, gb, tb)"
      });
    }
  }).optional()
}).strict().optional();
const MessagesSchema = (0, _schemasBmna8ihM.Tn)({
  messagePrefix: (0, _schemasBmna8ihM.Rn)().optional(),
  visibleReplies: _zodSchemaCoreQTf3ki3e.F.optional(),
  responsePrefix: (0, _schemasBmna8ihM.Rn)().optional(),
  groupChat: _zodSchemaCoreQTf3ki3e.c,
  queue: _zodSchemaCoreQTf3ki3e.y,
  inbound: _zodSchemaCoreQTf3ki3e.p,
  ackReaction: (0, _schemasBmna8ihM.Rn)().optional(),
  ackReactionScope: (0, _schemasBmna8ihM.yt)([
  "group-mentions",
  "group-all",
  "direct",
  "all",
  "off",
  "none"]
  ).optional(),
  removeAckAfterReply: (0, _schemasBmna8ihM.At)().optional(),
  statusReactions: (0, _schemasBmna8ihM.Tn)({
    enabled: (0, _schemasBmna8ihM.At)().optional(),
    emojis: (0, _schemasBmna8ihM.Tn)({
      thinking: (0, _schemasBmna8ihM.Rn)().optional(),
      tool: (0, _schemasBmna8ihM.Rn)().optional(),
      coding: (0, _schemasBmna8ihM.Rn)().optional(),
      web: (0, _schemasBmna8ihM.Rn)().optional(),
      deploy: (0, _schemasBmna8ihM.Rn)().optional(),
      build: (0, _schemasBmna8ihM.Rn)().optional(),
      concierge: (0, _schemasBmna8ihM.Rn)().optional(),
      done: (0, _schemasBmna8ihM.Rn)().optional(),
      error: (0, _schemasBmna8ihM.Rn)().optional(),
      stallSoft: (0, _schemasBmna8ihM.Rn)().optional(),
      stallHard: (0, _schemasBmna8ihM.Rn)().optional(),
      compacting: (0, _schemasBmna8ihM.Rn)().optional()
    }).strict().optional(),
    timing: (0, _schemasBmna8ihM.Tn)({
      debounceMs: (0, _schemasBmna8ihM.wn)().int().min(0).optional(),
      stallSoftMs: (0, _schemasBmna8ihM.wn)().int().min(0).optional(),
      stallHardMs: (0, _schemasBmna8ihM.wn)().int().min(0).optional(),
      doneHoldMs: (0, _schemasBmna8ihM.wn)().int().min(0).optional(),
      errorHoldMs: (0, _schemasBmna8ihM.wn)().int().min(0).optional()
    }).strict().optional()
  }).strict().optional(),
  suppressToolErrors: (0, _schemasBmna8ihM.At)().optional(),
  tts: _zodSchemaCoreQTf3ki3e.j
}).strict().optional();
const CommandsSchema = (0, _schemasBmna8ihM.Tn)({
  native: _zodSchemaCoreQTf3ki3e._.optional().default("auto"),
  nativeSkills: _zodSchemaCoreQTf3ki3e._.optional().default("auto"),
  text: (0, _schemasBmna8ihM.At)().optional(),
  bash: (0, _schemasBmna8ihM.At)().optional(),
  bashForegroundMs: (0, _schemasBmna8ihM.wn)().int().min(0).max(3e4).optional(),
  config: (0, _schemasBmna8ihM.At)().optional(),
  mcp: (0, _schemasBmna8ihM.At)().optional(),
  plugins: (0, _schemasBmna8ihM.At)().optional(),
  debug: (0, _schemasBmna8ihM.At)().optional(),
  restart: (0, _schemasBmna8ihM.At)().optional().default(true),
  useAccessGroups: (0, _schemasBmna8ihM.At)().optional(),
  ownerAllowFrom: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.Rn)(), (0, _schemasBmna8ihM.wn)()])).optional(),
  ownerDisplay: (0, _schemasBmna8ihM.yt)(["raw", "hash"]).optional().default("raw"),
  ownerDisplaySecret: (0, _schemasBmna8ihM.Rn)().optional().register(_zodSchemaSensitiveSjBPHVTu.t),
  allowFrom: _zodSchemaAgentRuntimeD8PVvs6o.s.optional()
}).strict().optional().default(() => ({
  native: "auto",
  nativeSkills: "auto",
  restart: true,
  ownerDisplay: "raw"
}));
//#endregion
//#region src/config/zod-schema.ts
const BrowserSnapshotDefaultsSchema = (0, _schemasBmna8ihM.Tn)({ mode: (0, _schemasBmna8ihM.dn)("efficient").optional() }).strict().optional();
const NodeHostSchema = (0, _schemasBmna8ihM.Tn)({ browserProxy: (0, _schemasBmna8ihM.Tn)({
    enabled: (0, _schemasBmna8ihM.At)().optional(),
    allowProfiles: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional()
  }).strict().optional() }).strict().optional();
const GatewayRemoteConfigSchema = (0, _schemasBmna8ihM.Tn)({
  enabled: (0, _schemasBmna8ihM.At)().optional(),
  url: (0, _schemasBmna8ihM.Rn)().optional(),
  transport: (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.dn)("ssh"), (0, _schemasBmna8ihM.dn)("direct")]).optional(),
  remotePort: (0, _schemasBmna8ihM.wn)().int().min(1).max(65535).optional(),
  token: _zodSchemaCoreQTf3ki3e.C.optional().register(_zodSchemaSensitiveSjBPHVTu.t),
  password: _zodSchemaCoreQTf3ki3e.C.optional().register(_zodSchemaSensitiveSjBPHVTu.t),
  tlsFingerprint: (0, _schemasBmna8ihM.Rn)().optional(),
  sshTarget: (0, _schemasBmna8ihM.Rn)().optional(),
  sshIdentity: (0, _schemasBmna8ihM.Rn)().optional()
}).strict().optional();
const LegacyCanvasHostSchema = (0, _schemasBmna8ihM.Tn)({
  enabled: (0, _schemasBmna8ihM.At)().optional(),
  root: (0, _schemasBmna8ihM.Rn)().optional(),
  port: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
  liveReload: (0, _schemasBmna8ihM.At)().optional()
}).strict().optional();
const SecuritySchema = (0, _schemasBmna8ihM.Tn)({ audit: (0, _schemasBmna8ihM.Tn)({ suppressions: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Tn)({
      checkId: (0, _schemasBmna8ihM.Rn)().min(1),
      titleIncludes: (0, _schemasBmna8ihM.Rn)().min(1).optional(),
      detailIncludes: (0, _schemasBmna8ihM.Rn)().min(1).optional(),
      reason: (0, _schemasBmna8ihM.Rn)().min(1).optional()
    }).strict()).optional() }).strict().optional() }).strict().optional();
const AccessGroupsSchema = (0, _schemasBmna8ihM.Nn)((0, _schemasBmna8ihM.Rn)().min(1), (0, _schemasBmna8ihM.Bt)("type", [(0, _schemasBmna8ihM.Tn)({
  type: (0, _schemasBmna8ihM.dn)("discord.channelAudience"),
  guildId: (0, _schemasBmna8ihM.Rn)().min(1),
  channelId: (0, _schemasBmna8ihM.Rn)().min(1),
  membership: (0, _schemasBmna8ihM.dn)("canViewChannel").optional()
}).strict(), (0, _schemasBmna8ihM.Tn)({
  type: (0, _schemasBmna8ihM.dn)("message.senders"),
  members: (0, _schemasBmna8ihM.Nn)((0, _schemasBmna8ihM.Rn)().min(1), (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)().min(1)))
}).strict()])).optional();
const MemoryQmdPathSchema = (0, _schemasBmna8ihM.Tn)({
  path: (0, _schemasBmna8ihM.Rn)(),
  name: (0, _schemasBmna8ihM.Rn)().optional(),
  pattern: (0, _schemasBmna8ihM.Rn)().optional()
}).strict();
const MemoryQmdSessionSchema = (0, _schemasBmna8ihM.Tn)({
  enabled: (0, _schemasBmna8ihM.At)().optional(),
  exportDir: (0, _schemasBmna8ihM.Rn)().optional(),
  retentionDays: (0, _schemasBmna8ihM.wn)().int().nonnegative().optional()
}).strict();
const MemoryQmdUpdateSchema = (0, _schemasBmna8ihM.Tn)({
  interval: (0, _schemasBmna8ihM.Rn)().optional(),
  debounceMs: (0, _schemasBmna8ihM.wn)().int().nonnegative().optional(),
  onBoot: (0, _schemasBmna8ihM.At)().optional(),
  startup: (0, _schemasBmna8ihM.yt)([
  "off",
  "idle",
  "immediate"]
  ).optional(),
  startupDelayMs: (0, _schemasBmna8ihM.wn)().int().nonnegative().optional(),
  waitForBootSync: (0, _schemasBmna8ihM.At)().optional(),
  embedInterval: (0, _schemasBmna8ihM.Rn)().optional(),
  commandTimeoutMs: (0, _schemasBmna8ihM.wn)().int().nonnegative().optional(),
  updateTimeoutMs: (0, _schemasBmna8ihM.wn)().int().nonnegative().optional(),
  embedTimeoutMs: (0, _schemasBmna8ihM.wn)().int().nonnegative().optional()
}).strict();
const MemoryQmdLimitsSchema = (0, _schemasBmna8ihM.Tn)({
  maxResults: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
  maxSnippetChars: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
  maxInjectedChars: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
  timeoutMs: (0, _schemasBmna8ihM.wn)().int().nonnegative().optional()
}).strict();
const MemoryQmdMcporterSchema = (0, _schemasBmna8ihM.Tn)({
  enabled: (0, _schemasBmna8ihM.At)().optional(),
  serverName: (0, _schemasBmna8ihM.Rn)().optional(),
  startDaemon: (0, _schemasBmna8ihM.At)().optional()
}).strict();
const LoggingLevelSchema = (0, _schemasBmna8ihM.Xn)([
(0, _schemasBmna8ihM.dn)("silent"),
(0, _schemasBmna8ihM.dn)("fatal"),
(0, _schemasBmna8ihM.dn)("error"),
(0, _schemasBmna8ihM.dn)("warn"),
(0, _schemasBmna8ihM.dn)("info"),
(0, _schemasBmna8ihM.dn)("debug"),
(0, _schemasBmna8ihM.dn)("trace")]
);
const MemoryQmdSchema = (0, _schemasBmna8ihM.Tn)({
  command: (0, _schemasBmna8ihM.Rn)().optional(),
  mcporter: MemoryQmdMcporterSchema.optional(),
  searchMode: (0, _schemasBmna8ihM.Xn)([
  (0, _schemasBmna8ihM.dn)("query"),
  (0, _schemasBmna8ihM.dn)("search"),
  (0, _schemasBmna8ihM.dn)("vsearch")]
  ).optional(),
  searchTool: (0, _schemasBmna8ihM.Rn)().trim().min(1).optional(),
  includeDefaultMemory: (0, _schemasBmna8ihM.At)().optional(),
  paths: (0, _schemasBmna8ihM.Et)(MemoryQmdPathSchema).optional(),
  sessions: MemoryQmdSessionSchema.optional(),
  update: MemoryQmdUpdateSchema.optional(),
  limits: MemoryQmdLimitsSchema.optional(),
  scope: SessionSendPolicySchema.optional()
}).strict();
const MemorySchema = (0, _schemasBmna8ihM.Tn)({
  backend: (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.dn)("builtin"), (0, _schemasBmna8ihM.dn)("qmd")]).optional(),
  citations: (0, _schemasBmna8ihM.Xn)([
  (0, _schemasBmna8ihM.dn)("auto"),
  (0, _schemasBmna8ihM.dn)("on"),
  (0, _schemasBmna8ihM.dn)("off")]
  ).optional(),
  qmd: MemoryQmdSchema.optional()
}).strict().optional();
const HttpUrlSchema = (0, _schemasBmna8ihM.Rn)().url().refine((value) => {
  const protocol = new URL(value).protocol;
  return protocol === "http:" || protocol === "https:";
}, "Expected http:// or https:// URL");
const ResponsesEndpointUrlFetchShape = {
  allowUrl: (0, _schemasBmna8ihM.At)().optional(),
  urlAllowlist: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
  allowedMimes: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
  maxBytes: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
  maxRedirects: (0, _schemasBmna8ihM.wn)().int().nonnegative().optional(),
  timeoutMs: (0, _schemasBmna8ihM.wn)().int().positive().optional()
};
const SkillEntrySchema = (0, _schemasBmna8ihM.Tn)({
  enabled: (0, _schemasBmna8ihM.At)().optional(),
  apiKey: _zodSchemaCoreQTf3ki3e.C.optional().register(_zodSchemaSensitiveSjBPHVTu.t),
  env: (0, _schemasBmna8ihM.Nn)((0, _schemasBmna8ihM.Rn)(), (0, _schemasBmna8ihM.Rn)()).optional(),
  config: (0, _schemasBmna8ihM.Nn)((0, _schemasBmna8ihM.Rn)(), (0, _schemasBmna8ihM.Zn)()).optional()
}).strict();
const PluginEntrySchema = (0, _schemasBmna8ihM.Tn)({
  enabled: (0, _schemasBmna8ihM.At)().optional(),
  hooks: (0, _schemasBmna8ihM.Tn)({
    allowPromptInjection: (0, _schemasBmna8ihM.At)().optional(),
    allowConversationAccess: (0, _schemasBmna8ihM.At)().optional(),
    timeoutMs: (0, _schemasBmna8ihM.wn)().int().positive().max(6e5).optional(),
    timeouts: (0, _schemasBmna8ihM.Nn)((0, _schemasBmna8ihM.Rn)(), (0, _schemasBmna8ihM.wn)().int().positive().max(6e5)).optional()
  }).strict().optional(),
  subagent: (0, _schemasBmna8ihM.Tn)({
    allowModelOverride: (0, _schemasBmna8ihM.At)().optional(),
    allowedModels: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional()
  }).strict().optional(),
  llm: (0, _schemasBmna8ihM.Tn)({
    allowModelOverride: (0, _schemasBmna8ihM.At)().optional(),
    allowedModels: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
    allowAgentIdOverride: (0, _schemasBmna8ihM.At)().optional()
  }).strict().optional(),
  config: (0, _schemasBmna8ihM.Nn)((0, _schemasBmna8ihM.Rn)(), (0, _schemasBmna8ihM.Zn)()).optional()
}).strict();
const TalkProviderEntrySchema = (0, _schemasBmna8ihM.Tn)({ apiKey: _zodSchemaCoreQTf3ki3e.C.optional().register(_zodSchemaSensitiveSjBPHVTu.t) }).catchall((0, _schemasBmna8ihM.Zn)());
const TalkRealtimeSchema = (0, _schemasBmna8ihM.Tn)({
  provider: (0, _schemasBmna8ihM.Rn)().optional(),
  providers: (0, _schemasBmna8ihM.Nn)((0, _schemasBmna8ihM.Rn)(), TalkProviderEntrySchema).optional(),
  model: (0, _schemasBmna8ihM.Rn)().optional(),
  voice: (0, _schemasBmna8ihM.Rn)().optional(),
  instructions: (0, _schemasBmna8ihM.Rn)().optional(),
  mode: (0, _schemasBmna8ihM.yt)([
  "realtime",
  "stt-tts",
  "transcription"]
  ).optional(),
  transport: (0, _schemasBmna8ihM.yt)([
  "webrtc",
  "provider-websocket",
  "gateway-relay",
  "managed-room"]
  ).optional(),
  brain: (0, _schemasBmna8ihM.yt)([
  "agent-consult",
  "direct-tools",
  "none"]
  ).optional()
}).strict().superRefine((realtime, ctx) => {
  const provider = (0, _stringCoerceLndEvhRk.a)(realtime.provider ?? "");
  const providers = realtime.providers ? Object.keys(realtime.providers) : [];
  if (provider && providers.length > 0 && !(provider in realtime.providers)) ctx.addIssue({
    code: _compatZe2wFLca.n.custom,
    path: ["provider"],
    message: `talk.realtime.provider must match a key in talk.realtime.providers (missing "${provider}")`
  });
  if (!provider && providers.length > 1) ctx.addIssue({
    code: _compatZe2wFLca.n.custom,
    path: ["provider"],
    message: "talk.realtime.provider is required when talk.realtime.providers defines multiple providers"
  });
});
const TalkSchema = (0, _schemasBmna8ihM.Tn)({
  provider: (0, _schemasBmna8ihM.Rn)().optional(),
  providers: (0, _schemasBmna8ihM.Nn)((0, _schemasBmna8ihM.Rn)(), TalkProviderEntrySchema).optional(),
  realtime: TalkRealtimeSchema.optional(),
  consultThinkingLevel: (0, _schemasBmna8ihM.yt)([
  "off",
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
  "adaptive",
  "max"]
  ).optional(),
  consultFastMode: (0, _schemasBmna8ihM.At)().optional(),
  speechLocale: (0, _schemasBmna8ihM.Rn)().optional(),
  interruptOnSpeech: (0, _schemasBmna8ihM.At)().optional(),
  silenceTimeoutMs: (0, _schemasBmna8ihM.wn)().int().positive().optional()
}).strict().superRefine((talk, ctx) => {
  const provider = (0, _stringCoerceLndEvhRk.a)(talk.provider ?? "");
  const providers = talk.providers ? Object.keys(talk.providers) : [];
  if (provider && providers.length > 0 && !(provider in talk.providers)) ctx.addIssue({
    code: _compatZe2wFLca.n.custom,
    path: ["provider"],
    message: `talk.provider must match a key in talk.providers (missing "${provider}")`
  });
  if (!provider && providers.length > 1) ctx.addIssue({
    code: _compatZe2wFLca.n.custom,
    path: ["provider"],
    message: "talk.provider is required when talk.providers defines multiple providers"
  });
});
const McpServerSchema = (0, _schemasBmna8ihM.Tn)({
  command: (0, _schemasBmna8ihM.Rn)().optional(),
  args: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
  env: (0, _schemasBmna8ihM.Nn)((0, _schemasBmna8ihM.Rn)(), (0, _schemasBmna8ihM.Xn)([
  (0, _schemasBmna8ihM.Rn)(),
  (0, _schemasBmna8ihM.wn)(),
  (0, _schemasBmna8ihM.At)()]
  )).optional(),
  cwd: (0, _schemasBmna8ihM.Rn)().optional(),
  workingDirectory: (0, _schemasBmna8ihM.Rn)().optional(),
  url: HttpUrlSchema.optional(),
  transport: (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.dn)("sse"), (0, _schemasBmna8ihM.dn)("streamable-http")]).optional(),
  headers: (0, _schemasBmna8ihM.Nn)((0, _schemasBmna8ihM.Rn)(), (0, _schemasBmna8ihM.Xn)([
  (0, _schemasBmna8ihM.Rn)().register(_zodSchemaSensitiveSjBPHVTu.t),
  (0, _schemasBmna8ihM.wn)(),
  (0, _schemasBmna8ihM.At)()]
  ).register(_zodSchemaSensitiveSjBPHVTu.t)).optional(),
  codex: (0, _schemasBmna8ihM.Tn)({
    agents: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)().trim().regex(/^[a-z0-9][a-z0-9_-]{0,63}$/i)).min(1).optional(),
    defaultToolsApprovalMode: (0, _schemasBmna8ihM.yt)([
    "auto",
    "prompt",
    "approve"]
    ).optional(),
    default_tools_approval_mode: (0, _schemasBmna8ihM.yt)([
    "auto",
    "prompt",
    "approve"]
    ).optional()
  }).strict().optional()
}).catchall((0, _schemasBmna8ihM.Zn)());
const McpConfigSchema = (0, _schemasBmna8ihM.Tn)({
  servers: (0, _schemasBmna8ihM.Nn)((0, _schemasBmna8ihM.Rn)(), McpServerSchema).optional(),
  sessionIdleTtlMs: (0, _schemasBmna8ihM.wn)().finite().min(0).optional()
}).strict().optional();
const CrestodianSchema = (0, _schemasBmna8ihM.Tn)({ rescue: (0, _schemasBmna8ihM.Tn)({
    enabled: (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.dn)("auto"), (0, _schemasBmna8ihM.At)()]).optional(),
    ownerDmOnly: (0, _schemasBmna8ihM.At)().optional(),
    pendingTtlMinutes: (0, _schemasBmna8ihM.wn)().int().positive().optional()
  }).strict().optional() }).strict().optional();
const CommitmentsSchema = (0, _schemasBmna8ihM.Tn)({
  enabled: (0, _schemasBmna8ihM.At)().optional(),
  maxPerDay: (0, _schemasBmna8ihM.wn)().int().positive().optional()
}).strict().optional();
const OpenClawSchema = exports.t = (0, _schemasBmna8ihM.Tn)({
  $schema: (0, _schemasBmna8ihM.Rn)().optional(),
  meta: (0, _schemasBmna8ihM.Tn)({
    lastTouchedVersion: (0, _schemasBmna8ihM.Rn)().optional(),
    lastTouchedAt: (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.Rn)(), (0, _schemasBmna8ihM.wn)().transform((n, ctx) => {
      const d = new Date(n);
      if (Number.isNaN(d.getTime())) {
        ctx.addIssue({
          code: _compatZe2wFLca.n.custom,
          message: "Invalid timestamp"
        });
        return _schemasBmna8ihM.Si;
      }
      return d.toISOString();
    })]).optional()
  }).strict().optional(),
  env: (0, _schemasBmna8ihM.Tn)({
    shellEnv: (0, _schemasBmna8ihM.Tn)({
      enabled: (0, _schemasBmna8ihM.At)().optional(),
      timeoutMs: (0, _schemasBmna8ihM.wn)().int().nonnegative().optional()
    }).strict().optional(),
    vars: (0, _schemasBmna8ihM.Nn)((0, _schemasBmna8ihM.Rn)(), (0, _schemasBmna8ihM.Rn)()).optional()
  }).catchall((0, _schemasBmna8ihM.Rn)()).optional(),
  wizard: (0, _schemasBmna8ihM.Tn)({
    lastRunAt: (0, _schemasBmna8ihM.Rn)().optional(),
    lastRunVersion: (0, _schemasBmna8ihM.Rn)().optional(),
    lastRunCommit: (0, _schemasBmna8ihM.Rn)().optional(),
    lastRunCommand: (0, _schemasBmna8ihM.Rn)().optional(),
    lastRunMode: (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.dn)("local"), (0, _schemasBmna8ihM.dn)("remote")]).optional()
  }).strict().optional(),
  diagnostics: (0, _schemasBmna8ihM.Tn)({
    enabled: (0, _schemasBmna8ihM.At)().optional(),
    flags: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
    stuckSessionWarnMs: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
    stuckSessionAbortMs: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
    memoryPressureSnapshot: (0, _schemasBmna8ihM.At)().optional(),
    otel: (0, _schemasBmna8ihM.Tn)({
      enabled: (0, _schemasBmna8ihM.At)().optional(),
      endpoint: (0, _schemasBmna8ihM.Rn)().optional(),
      tracesEndpoint: (0, _schemasBmna8ihM.Rn)().optional(),
      metricsEndpoint: (0, _schemasBmna8ihM.Rn)().optional(),
      logsEndpoint: (0, _schemasBmna8ihM.Rn)().optional(),
      protocol: (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.dn)("http/protobuf"), (0, _schemasBmna8ihM.dn)("grpc")]).optional(),
      headers: (0, _schemasBmna8ihM.Nn)((0, _schemasBmna8ihM.Rn)(), (0, _schemasBmna8ihM.Rn)()).optional(),
      serviceName: (0, _schemasBmna8ihM.Rn)().optional(),
      traces: (0, _schemasBmna8ihM.At)().optional(),
      metrics: (0, _schemasBmna8ihM.At)().optional(),
      logs: (0, _schemasBmna8ihM.At)().optional(),
      sampleRate: (0, _schemasBmna8ihM.wn)().min(0).max(1).optional(),
      flushIntervalMs: (0, _schemasBmna8ihM.wn)().int().nonnegative().optional(),
      captureContent: (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.At)(), (0, _schemasBmna8ihM.Tn)({
        enabled: (0, _schemasBmna8ihM.At)().optional(),
        inputMessages: (0, _schemasBmna8ihM.At)().optional(),
        outputMessages: (0, _schemasBmna8ihM.At)().optional(),
        toolInputs: (0, _schemasBmna8ihM.At)().optional(),
        toolOutputs: (0, _schemasBmna8ihM.At)().optional(),
        systemPrompt: (0, _schemasBmna8ihM.At)().optional()
      }).strict()]).optional()
    }).strict().optional(),
    cacheTrace: (0, _schemasBmna8ihM.Tn)({
      enabled: (0, _schemasBmna8ihM.At)().optional(),
      filePath: (0, _schemasBmna8ihM.Rn)().optional(),
      includeMessages: (0, _schemasBmna8ihM.At)().optional(),
      includePrompt: (0, _schemasBmna8ihM.At)().optional(),
      includeSystem: (0, _schemasBmna8ihM.At)().optional()
    }).strict().optional()
  }).strict().optional(),
  logging: (0, _schemasBmna8ihM.Tn)({
    level: LoggingLevelSchema.optional(),
    file: (0, _schemasBmna8ihM.Rn)().optional(),
    maxFileBytes: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
    consoleLevel: LoggingLevelSchema.optional(),
    consoleStyle: (0, _schemasBmna8ihM.Xn)([
    (0, _schemasBmna8ihM.dn)("pretty"),
    (0, _schemasBmna8ihM.dn)("compact"),
    (0, _schemasBmna8ihM.dn)("json")]
    ).optional(),
    redactSensitive: (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.dn)("off"), (0, _schemasBmna8ihM.dn)("tools")]).optional(),
    redactPatterns: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional()
  }).strict().optional(),
  cli: (0, _schemasBmna8ihM.Tn)({ banner: (0, _schemasBmna8ihM.Tn)({ taglineMode: (0, _schemasBmna8ihM.Xn)([
      (0, _schemasBmna8ihM.dn)("random"),
      (0, _schemasBmna8ihM.dn)("default"),
      (0, _schemasBmna8ihM.dn)("off")]
      ).optional() }).strict().optional() }).strict().optional(),
  crestodian: CrestodianSchema,
  update: (0, _schemasBmna8ihM.Tn)({
    channel: (0, _schemasBmna8ihM.Xn)([
    (0, _schemasBmna8ihM.dn)("stable"),
    (0, _schemasBmna8ihM.dn)("beta"),
    (0, _schemasBmna8ihM.dn)("dev")]
    ).optional(),
    checkOnStart: (0, _schemasBmna8ihM.At)().optional(),
    auto: (0, _schemasBmna8ihM.Tn)({
      enabled: (0, _schemasBmna8ihM.At)().optional(),
      stableDelayHours: (0, _schemasBmna8ihM.wn)().nonnegative().max(168).optional(),
      stableJitterHours: (0, _schemasBmna8ihM.wn)().nonnegative().max(168).optional(),
      betaCheckIntervalHours: (0, _schemasBmna8ihM.wn)().positive().max(24).optional()
    }).strict().optional()
  }).strict().optional(),
  browser: (0, _schemasBmna8ihM.Tn)({
    enabled: (0, _schemasBmna8ihM.At)().optional(),
    evaluateEnabled: (0, _schemasBmna8ihM.At)().optional(),
    cdpUrl: (0, _schemasBmna8ihM.Rn)().optional(),
    remoteCdpTimeoutMs: (0, _schemasBmna8ihM.wn)().int().nonnegative().optional(),
    remoteCdpHandshakeTimeoutMs: (0, _schemasBmna8ihM.wn)().int().nonnegative().optional(),
    localLaunchTimeoutMs: (0, _schemasBmna8ihM.wn)().int().positive().max(12e4).optional(),
    localCdpReadyTimeoutMs: (0, _schemasBmna8ihM.wn)().int().positive().max(12e4).optional(),
    actionTimeoutMs: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
    color: (0, _schemasBmna8ihM.Rn)().optional(),
    executablePath: (0, _schemasBmna8ihM.Rn)().optional(),
    headless: (0, _schemasBmna8ihM.At)().optional(),
    noSandbox: (0, _schemasBmna8ihM.At)().optional(),
    attachOnly: (0, _schemasBmna8ihM.At)().optional(),
    cdpPortRangeStart: (0, _schemasBmna8ihM.wn)().int().min(1).max(65535).optional(),
    defaultProfile: (0, _schemasBmna8ihM.Rn)().optional(),
    snapshotDefaults: BrowserSnapshotDefaultsSchema,
    ssrfPolicy: (0, _schemasBmna8ihM.Tn)({
      dangerouslyAllowPrivateNetwork: (0, _schemasBmna8ihM.At)().optional(),
      allowedHostnames: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
      hostnameAllowlist: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional()
    }).strict().optional(),
    profiles: (0, _schemasBmna8ihM.Nn)((0, _schemasBmna8ihM.Rn)().regex(/^[a-z0-9-]+$/, "Profile names must be alphanumeric with hyphens only"), (0, _schemasBmna8ihM.Tn)({
      cdpPort: (0, _schemasBmna8ihM.wn)().int().min(1).max(65535).optional(),
      cdpUrl: (0, _schemasBmna8ihM.Rn)().optional(),
      userDataDir: (0, _schemasBmna8ihM.Rn)().optional(),
      mcpCommand: (0, _schemasBmna8ihM.Rn)().optional(),
      mcpArgs: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
      driver: (0, _schemasBmna8ihM.Xn)([
      (0, _schemasBmna8ihM.dn)("openclaw"),
      (0, _schemasBmna8ihM.dn)("clawd"),
      (0, _schemasBmna8ihM.dn)("existing-session")]
      ).optional(),
      headless: (0, _schemasBmna8ihM.At)().optional(),
      executablePath: (0, _schemasBmna8ihM.Rn)().optional(),
      attachOnly: (0, _schemasBmna8ihM.At)().optional(),
      color: _zodSchemaCoreQTf3ki3e.u
    }).strict().refine((value) => value.driver === "existing-session" || value.cdpPort || value.cdpUrl, { message: "Profile must set cdpPort or cdpUrl" }).refine((value) => value.driver === "existing-session" || !value.userDataDir, { message: "Profile userDataDir is only supported with driver=\"existing-session\"" })).optional(),
    extraArgs: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
    tabCleanup: (0, _schemasBmna8ihM.Tn)({
      enabled: (0, _schemasBmna8ihM.At)().optional(),
      idleMinutes: (0, _schemasBmna8ihM.wn)().int().nonnegative().optional(),
      maxTabsPerSession: (0, _schemasBmna8ihM.wn)().int().nonnegative().optional(),
      sweepMinutes: (0, _schemasBmna8ihM.wn)().int().positive().optional()
    }).strict().optional()
  }).strict().optional(),
  ui: (0, _schemasBmna8ihM.Tn)({
    seamColor: _zodSchemaCoreQTf3ki3e.u.optional(),
    assistant: (0, _schemasBmna8ihM.Tn)({
      name: (0, _schemasBmna8ihM.Rn)().max(50).optional(),
      avatar: (0, _schemasBmna8ihM.Rn)().max(2e6).optional()
    }).strict().optional()
  }).strict().optional(),
  secrets: _zodSchemaCoreQTf3ki3e.E,
  auth: (0, _schemasBmna8ihM.Tn)({
    profiles: (0, _schemasBmna8ihM.Nn)((0, _schemasBmna8ihM.Rn)(), (0, _schemasBmna8ihM.Tn)({
      provider: (0, _schemasBmna8ihM.Rn)(),
      mode: (0, _schemasBmna8ihM.Xn)([
      (0, _schemasBmna8ihM.dn)("api_key"),
      (0, _schemasBmna8ihM.dn)("aws-sdk"),
      (0, _schemasBmna8ihM.dn)("oauth"),
      (0, _schemasBmna8ihM.dn)("token")]
      ),
      email: (0, _schemasBmna8ihM.Rn)().optional(),
      displayName: (0, _schemasBmna8ihM.Rn)().optional()
    }).strict()).optional(),
    order: (0, _schemasBmna8ihM.Nn)((0, _schemasBmna8ihM.Rn)(), (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)())).optional(),
    cooldowns: (0, _schemasBmna8ihM.Tn)({
      billingBackoffHours: (0, _schemasBmna8ihM.wn)().positive().optional(),
      billingBackoffHoursByProvider: (0, _schemasBmna8ihM.Nn)((0, _schemasBmna8ihM.Rn)(), (0, _schemasBmna8ihM.wn)().positive()).optional(),
      billingMaxHours: (0, _schemasBmna8ihM.wn)().positive().optional(),
      authPermanentBackoffMinutes: (0, _schemasBmna8ihM.wn)().positive().optional(),
      authPermanentMaxMinutes: (0, _schemasBmna8ihM.wn)().positive().optional(),
      failureWindowHours: (0, _schemasBmna8ihM.wn)().positive().optional(),
      overloadedProfileRotations: (0, _schemasBmna8ihM.wn)().int().nonnegative().optional(),
      overloadedBackoffMs: (0, _schemasBmna8ihM.wn)().int().nonnegative().optional(),
      rateLimitedProfileRotations: (0, _schemasBmna8ihM.wn)().int().nonnegative().optional()
    }).strict().optional()
  }).strict().optional(),
  accessGroups: AccessGroupsSchema,
  acp: (0, _schemasBmna8ihM.Tn)({
    enabled: (0, _schemasBmna8ihM.At)().optional(),
    dispatch: (0, _schemasBmna8ihM.Tn)({ enabled: (0, _schemasBmna8ihM.At)().optional() }).strict().optional(),
    backend: (0, _schemasBmna8ihM.Rn)().optional(),
    fallbacks: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
    defaultAgent: (0, _schemasBmna8ihM.Rn)().optional(),
    allowedAgents: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
    maxConcurrentSessions: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
    stream: (0, _schemasBmna8ihM.Tn)({
      coalesceIdleMs: (0, _schemasBmna8ihM.wn)().int().nonnegative().optional(),
      maxChunkChars: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
      repeatSuppression: (0, _schemasBmna8ihM.At)().optional(),
      deliveryMode: (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.dn)("live"), (0, _schemasBmna8ihM.dn)("final_only")]).optional(),
      hiddenBoundarySeparator: (0, _schemasBmna8ihM.Xn)([
      (0, _schemasBmna8ihM.dn)("none"),
      (0, _schemasBmna8ihM.dn)("space"),
      (0, _schemasBmna8ihM.dn)("newline"),
      (0, _schemasBmna8ihM.dn)("paragraph")]
      ).optional(),
      maxOutputChars: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
      maxSessionUpdateChars: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
      tagVisibility: (0, _schemasBmna8ihM.Nn)((0, _schemasBmna8ihM.Rn)(), (0, _schemasBmna8ihM.At)()).optional()
    }).strict().optional(),
    runtime: (0, _schemasBmna8ihM.Tn)({
      ttlMinutes: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
      installCommand: (0, _schemasBmna8ihM.Rn)().optional()
    }).strict().optional()
  }).strict().optional(),
  models: _zodSchemaCoreQTf3ki3e.g,
  nodeHost: NodeHostSchema,
  agents: AgentsSchema,
  tools: _zodSchemaAgentRuntimeD8PVvs6o.d,
  security: SecuritySchema,
  bindings: BindingsSchema,
  broadcast: BroadcastSchema,
  audio: AudioSchema,
  media: (0, _schemasBmna8ihM.Tn)({
    preserveFilenames: (0, _schemasBmna8ihM.At)().optional(),
    ttlHours: (0, _schemasBmna8ihM.wn)().int().min(1).max(168).optional()
  }).strict().optional(),
  messages: MessagesSchema,
  commands: CommandsSchema,
  approvals: ApprovalsSchema,
  session: SessionSchema,
  cron: (0, _schemasBmna8ihM.Tn)({
    enabled: (0, _schemasBmna8ihM.At)().optional(),
    store: (0, _schemasBmna8ihM.Rn)().optional(),
    maxConcurrentRuns: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
    retry: (0, _schemasBmna8ihM.Tn)({
      maxAttempts: (0, _schemasBmna8ihM.wn)().int().min(0).max(10).optional(),
      backoffMs: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.wn)().int().nonnegative()).min(1).max(10).optional(),
      retryOn: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.yt)([
      "rate_limit",
      "overloaded",
      "network",
      "timeout",
      "server_error"]
      )).min(1).optional()
    }).strict().optional(),
    webhook: HttpUrlSchema.optional(),
    webhookToken: _zodSchemaCoreQTf3ki3e.C.optional().register(_zodSchemaSensitiveSjBPHVTu.t),
    sessionRetention: (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.Rn)(), (0, _schemasBmna8ihM.dn)(false)]).optional(),
    runLog: (0, _schemasBmna8ihM.Tn)({
      maxBytes: (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.Rn)(), (0, _schemasBmna8ihM.wn)()]).optional(),
      keepLines: (0, _schemasBmna8ihM.wn)().int().positive().optional()
    }).strict().optional(),
    failureAlert: (0, _schemasBmna8ihM.Tn)({
      enabled: (0, _schemasBmna8ihM.At)().optional(),
      after: (0, _schemasBmna8ihM.wn)().int().min(1).optional(),
      cooldownMs: (0, _schemasBmna8ihM.wn)().int().min(0).optional(),
      includeSkipped: (0, _schemasBmna8ihM.At)().optional(),
      mode: (0, _schemasBmna8ihM.yt)(["announce", "webhook"]).optional(),
      accountId: (0, _schemasBmna8ihM.Rn)().optional()
    }).strict().optional(),
    failureDestination: (0, _schemasBmna8ihM.Tn)({
      channel: (0, _schemasBmna8ihM.Rn)().optional(),
      to: (0, _schemasBmna8ihM.Rn)().optional(),
      accountId: (0, _schemasBmna8ihM.Rn)().optional(),
      mode: (0, _schemasBmna8ihM.yt)(["announce", "webhook"]).optional()
    }).strict().optional()
  }).strict().superRefine((val, ctx) => {
    if (val.sessionRetention !== void 0 && val.sessionRetention !== false) try {
      (0, _parseDurationD8AJG6ba.t)((0, _stringCoerceLndEvhRk.d)(val.sessionRetention) ?? "", { defaultUnit: "h" });
    } catch {
      ctx.addIssue({
        code: _compatZe2wFLca.n.custom,
        path: ["sessionRetention"],
        message: "invalid duration (use ms, s, m, h, d)"
      });
    }
    if (val.runLog?.maxBytes !== void 0) try {
      parseByteSize((0, _stringCoerceLndEvhRk.d)(val.runLog.maxBytes) ?? "", { defaultUnit: "b" });
    } catch {
      ctx.addIssue({
        code: _compatZe2wFLca.n.custom,
        path: ["runLog", "maxBytes"],
        message: "invalid size (use b, kb, mb, gb, tb)"
      });
    }
  }).optional(),
  commitments: CommitmentsSchema,
  hooks: (0, _schemasBmna8ihM.Tn)({
    enabled: (0, _schemasBmna8ihM.At)().optional(),
    path: (0, _schemasBmna8ihM.Rn)().optional(),
    token: (0, _schemasBmna8ihM.Rn)().optional().register(_zodSchemaSensitiveSjBPHVTu.t),
    defaultSessionKey: (0, _schemasBmna8ihM.Rn)().optional(),
    allowRequestSessionKey: (0, _schemasBmna8ihM.At)().optional(),
    allowedSessionKeyPrefixes: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
    allowedAgentIds: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
    maxBodyBytes: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
    presets: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
    transformsDir: (0, _schemasBmna8ihM.Rn)().optional(),
    mappings: (0, _schemasBmna8ihM.Et)(HookMappingSchema).optional(),
    gmail: HooksGmailSchema,
    internal: InternalHooksSchema
  }).strict().optional(),
  web: (0, _schemasBmna8ihM.Tn)({
    enabled: (0, _schemasBmna8ihM.At)().optional(),
    heartbeatSeconds: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
    reconnect: (0, _schemasBmna8ihM.Tn)({
      initialMs: (0, _schemasBmna8ihM.wn)().positive().optional(),
      maxMs: (0, _schemasBmna8ihM.wn)().positive().optional(),
      factor: (0, _schemasBmna8ihM.wn)().positive().optional(),
      jitter: (0, _schemasBmna8ihM.wn)().min(0).max(1).optional(),
      maxAttempts: (0, _schemasBmna8ihM.wn)().int().min(0).optional()
    }).strict().optional(),
    whatsapp: (0, _schemasBmna8ihM.Tn)({
      keepAliveIntervalMs: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
      connectTimeoutMs: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
      defaultQueryTimeoutMs: (0, _schemasBmna8ihM.wn)().int().positive().optional()
    }).strict().optional()
  }).strict().optional(),
  channels: ChannelsSchema,
  discovery: (0, _schemasBmna8ihM.Tn)({
    wideArea: (0, _schemasBmna8ihM.Tn)({
      enabled: (0, _schemasBmna8ihM.At)().optional(),
      domain: (0, _schemasBmna8ihM.Rn)().optional()
    }).strict().optional(),
    mdns: (0, _schemasBmna8ihM.Tn)({ mode: (0, _schemasBmna8ihM.yt)([
      "off",
      "minimal",
      "full"]
      ).optional() }).strict().optional()
  }).strict().optional(),
  talk: TalkSchema.optional(),
  gateway: (0, _schemasBmna8ihM.Tn)({
    port: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
    mode: (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.dn)("local"), (0, _schemasBmna8ihM.dn)("remote")]).optional(),
    bind: (0, _schemasBmna8ihM.Xn)([
    (0, _schemasBmna8ihM.dn)("auto"),
    (0, _schemasBmna8ihM.dn)("lan"),
    (0, _schemasBmna8ihM.dn)("loopback"),
    (0, _schemasBmna8ihM.dn)("custom"),
    (0, _schemasBmna8ihM.dn)("tailnet")]
    ).optional(),
    customBindHost: (0, _schemasBmna8ihM.Rn)().optional(),
    controlUi: (0, _schemasBmna8ihM.Tn)({
      enabled: (0, _schemasBmna8ihM.At)().optional(),
      basePath: (0, _schemasBmna8ihM.Rn)().optional(),
      root: (0, _schemasBmna8ihM.Rn)().optional(),
      embedSandbox: (0, _schemasBmna8ihM.Xn)([
      (0, _schemasBmna8ihM.dn)("strict"),
      (0, _schemasBmna8ihM.dn)("scripts"),
      (0, _schemasBmna8ihM.dn)("trusted")]
      ).optional(),
      allowExternalEmbedUrls: (0, _schemasBmna8ihM.At)().optional(),
      chatMessageMaxWidth: (0, _schemasBmna8ihM.Rn)().transform((value) => normalizeControlUiChatMessageMaxWidth(value)).refine((value) => isValidControlUiChatMessageMaxWidth(value), { message: "Expected a CSS width value such as 960px, 82%, min(1280px, 82%), or calc(100% - 2rem)" }).optional(),
      allowedOrigins: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
      dangerouslyAllowHostHeaderOriginFallback: (0, _schemasBmna8ihM.At)().optional(),
      allowInsecureAuth: (0, _schemasBmna8ihM.At)().optional(),
      dangerouslyDisableDeviceAuth: (0, _schemasBmna8ihM.At)().optional()
    }).strict().optional(),
    auth: (0, _schemasBmna8ihM.Tn)({
      mode: (0, _schemasBmna8ihM.Xn)([
      (0, _schemasBmna8ihM.dn)("none"),
      (0, _schemasBmna8ihM.dn)("token"),
      (0, _schemasBmna8ihM.dn)("password"),
      (0, _schemasBmna8ihM.dn)("trusted-proxy")]
      ).optional(),
      token: _zodSchemaCoreQTf3ki3e.C.optional().register(_zodSchemaSensitiveSjBPHVTu.t),
      password: _zodSchemaCoreQTf3ki3e.C.optional().register(_zodSchemaSensitiveSjBPHVTu.t),
      allowTailscale: (0, _schemasBmna8ihM.At)().optional(),
      rateLimit: (0, _schemasBmna8ihM.Tn)({
        maxAttempts: (0, _schemasBmna8ihM.wn)().optional(),
        windowMs: (0, _schemasBmna8ihM.wn)().optional(),
        lockoutMs: (0, _schemasBmna8ihM.wn)().optional(),
        exemptLoopback: (0, _schemasBmna8ihM.At)().optional()
      }).strict().optional(),
      trustedProxy: (0, _schemasBmna8ihM.Tn)({
        userHeader: (0, _schemasBmna8ihM.Rn)().min(1, "userHeader is required for trusted-proxy mode"),
        requiredHeaders: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
        allowUsers: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
        allowLoopback: (0, _schemasBmna8ihM.At)().optional()
      }).strict().optional()
    }).strict().optional(),
    trustedProxies: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
    allowRealIpFallback: (0, _schemasBmna8ihM.At)().optional(),
    tools: (0, _schemasBmna8ihM.Tn)({
      deny: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
      allow: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional()
    }).strict().optional(),
    webchat: (0, _schemasBmna8ihM.Tn)({ chatHistoryMaxChars: (0, _schemasBmna8ihM.wn)().int().positive().max(5e5).optional() }).strict().optional(),
    handshakeTimeoutMs: (0, _schemasBmna8ihM.wn)().int().min(1).optional(),
    channelHealthCheckMinutes: (0, _schemasBmna8ihM.wn)().int().min(0).optional(),
    channelStaleEventThresholdMinutes: (0, _schemasBmna8ihM.wn)().int().min(1).optional(),
    channelMaxRestartsPerHour: (0, _schemasBmna8ihM.wn)().int().min(1).optional(),
    tailscale: (0, _schemasBmna8ihM.Tn)({
      mode: (0, _schemasBmna8ihM.Xn)([
      (0, _schemasBmna8ihM.dn)("off"),
      (0, _schemasBmna8ihM.dn)("serve"),
      (0, _schemasBmna8ihM.dn)("funnel")]
      ).optional(),
      resetOnExit: (0, _schemasBmna8ihM.At)().optional(),
      preserveFunnel: (0, _schemasBmna8ihM.At)().optional()
    }).strict().optional(),
    remote: GatewayRemoteConfigSchema,
    reload: (0, _schemasBmna8ihM.Tn)({
      mode: (0, _schemasBmna8ihM.Xn)([
      (0, _schemasBmna8ihM.dn)("off"),
      (0, _schemasBmna8ihM.dn)("restart"),
      (0, _schemasBmna8ihM.dn)("hot"),
      (0, _schemasBmna8ihM.dn)("hybrid")]
      ).optional(),
      debounceMs: (0, _schemasBmna8ihM.wn)().int().min(0).optional(),
      deferralTimeoutMs: (0, _schemasBmna8ihM.wn)().int().min(0).optional()
    }).strict().optional(),
    tls: (0, _schemasBmna8ihM.Tn)({
      enabled: (0, _schemasBmna8ihM.At)().optional(),
      autoGenerate: (0, _schemasBmna8ihM.At)().optional(),
      certPath: (0, _schemasBmna8ihM.Rn)().optional(),
      keyPath: (0, _schemasBmna8ihM.Rn)().optional(),
      caPath: (0, _schemasBmna8ihM.Rn)().optional()
    }).optional(),
    http: (0, _schemasBmna8ihM.Tn)({
      endpoints: (0, _schemasBmna8ihM.Tn)({
        chatCompletions: (0, _schemasBmna8ihM.Tn)({
          enabled: (0, _schemasBmna8ihM.At)().optional(),
          maxBodyBytes: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
          maxImageParts: (0, _schemasBmna8ihM.wn)().int().nonnegative().optional(),
          maxTotalImageBytes: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
          images: (0, _schemasBmna8ihM.Tn)({ ...ResponsesEndpointUrlFetchShape }).strict().optional()
        }).strict().optional(),
        responses: (0, _schemasBmna8ihM.Tn)({
          enabled: (0, _schemasBmna8ihM.At)().optional(),
          maxBodyBytes: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
          maxUrlParts: (0, _schemasBmna8ihM.wn)().int().nonnegative().optional(),
          files: (0, _schemasBmna8ihM.Tn)({
            ...ResponsesEndpointUrlFetchShape,
            maxChars: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
            pdf: (0, _schemasBmna8ihM.Tn)({
              maxPages: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
              maxPixels: (0, _schemasBmna8ihM.wn)().int().positive().optional(),
              minTextChars: (0, _schemasBmna8ihM.wn)().int().nonnegative().optional()
            }).strict().optional()
          }).strict().optional(),
          images: (0, _schemasBmna8ihM.Tn)({ ...ResponsesEndpointUrlFetchShape }).strict().optional()
        }).strict().optional()
      }).strict().optional(),
      securityHeaders: (0, _schemasBmna8ihM.Tn)({ strictTransportSecurity: (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.Rn)(), (0, _schemasBmna8ihM.dn)(false)]).optional() }).strict().optional()
    }).strict().optional(),
    push: (0, _schemasBmna8ihM.Tn)({ apns: (0, _schemasBmna8ihM.Tn)({ relay: (0, _schemasBmna8ihM.Tn)({
          baseUrl: (0, _schemasBmna8ihM.Rn)().optional(),
          timeoutMs: (0, _schemasBmna8ihM.wn)().int().positive().optional()
        }).strict().optional() }).strict().optional() }).strict().optional(),
    nodes: (0, _schemasBmna8ihM.Tn)({
      browser: (0, _schemasBmna8ihM.Tn)({
        mode: (0, _schemasBmna8ihM.Xn)([
        (0, _schemasBmna8ihM.dn)("auto"),
        (0, _schemasBmna8ihM.dn)("manual"),
        (0, _schemasBmna8ihM.dn)("off")]
        ).optional(),
        node: (0, _schemasBmna8ihM.Rn)().optional()
      }).strict().optional(),
      pairing: (0, _schemasBmna8ihM.Tn)({ autoApproveCidrs: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional() }).strict().optional(),
      allowCommands: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
      denyCommands: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional()
    }).strict().optional()
  }).strict().superRefine((gateway, ctx) => {
    const effectiveHealthCheckMinutes = gateway.channelHealthCheckMinutes ?? 5;
    if (gateway.channelStaleEventThresholdMinutes != null && effectiveHealthCheckMinutes !== 0 && gateway.channelStaleEventThresholdMinutes < effectiveHealthCheckMinutes) ctx.addIssue({
      code: _compatZe2wFLca.n.custom,
      path: ["channelStaleEventThresholdMinutes"],
      message: "channelStaleEventThresholdMinutes should be >= channelHealthCheckMinutes to avoid delayed stale detection"
    });
  }).optional(),
  memory: MemorySchema,
  mcp: McpConfigSchema,
  skills: (0, _schemasBmna8ihM.Tn)({
    allowBundled: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
    load: (0, _schemasBmna8ihM.Tn)({
      extraDirs: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
      allowSymlinkTargets: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
      watch: (0, _schemasBmna8ihM.At)().optional(),
      watchDebounceMs: (0, _schemasBmna8ihM.wn)().int().min(0).optional()
    }).strict().optional(),
    install: (0, _schemasBmna8ihM.Tn)({
      preferBrew: (0, _schemasBmna8ihM.At)().optional(),
      nodeManager: (0, _schemasBmna8ihM.Xn)([
      (0, _schemasBmna8ihM.dn)("npm"),
      (0, _schemasBmna8ihM.dn)("pnpm"),
      (0, _schemasBmna8ihM.dn)("yarn"),
      (0, _schemasBmna8ihM.dn)("bun")]
      ).optional(),
      allowUploadedArchives: (0, _schemasBmna8ihM.At)().optional()
    }).strict().optional(),
    limits: (0, _schemasBmna8ihM.Tn)({
      maxCandidatesPerRoot: (0, _schemasBmna8ihM.wn)().int().min(1).optional(),
      maxSkillsLoadedPerSource: (0, _schemasBmna8ihM.wn)().int().min(1).optional(),
      maxSkillsInPrompt: (0, _schemasBmna8ihM.wn)().int().min(0).optional(),
      maxSkillsPromptChars: (0, _schemasBmna8ihM.wn)().int().min(0).optional(),
      maxSkillFileBytes: (0, _schemasBmna8ihM.wn)().int().min(0).optional()
    }).strict().optional(),
    entries: (0, _schemasBmna8ihM.Nn)((0, _schemasBmna8ihM.Rn)(), SkillEntrySchema).optional()
  }).strict().optional(),
  plugins: (0, _schemasBmna8ihM.Tn)({
    enabled: (0, _schemasBmna8ihM.At)().optional(),
    allow: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
    deny: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional(),
    load: (0, _schemasBmna8ihM.Tn)({ paths: (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Rn)()).optional() }).strict().optional(),
    slots: (0, _schemasBmna8ihM.Tn)({
      memory: (0, _schemasBmna8ihM.Rn)().optional(),
      contextEngine: (0, _schemasBmna8ihM.Rn)().optional()
    }).strict().optional(),
    entries: (0, _schemasBmna8ihM.Nn)((0, _schemasBmna8ihM.Rn)(), PluginEntrySchema).optional(),
    bundledDiscovery: (0, _schemasBmna8ihM.yt)(["compat", "allowlist"]).optional()
  }).strict().optional(),
  canvasHost: LegacyCanvasHostSchema,
  surfaces: (0, _schemasBmna8ihM.Nn)((0, _schemasBmna8ihM.Rn)(), (0, _schemasBmna8ihM.Tn)({ silentReply: SilentReplyPolicyConfigSchema.optional() }).strict()).optional(),
  proxy: ProxyConfigSchema
}).strict().superRefine((cfg, ctx) => {
  const agents = cfg.agents?.list ?? [];
  if (agents.length === 0) return;
  const agentIds = new Set(agents.map((agent) => agent.id));
  const broadcast = cfg.broadcast;
  if (!broadcast) return;
  for (const [peerId, ids] of Object.entries(broadcast)) {
    if (peerId === "strategy") continue;
    if (!Array.isArray(ids)) continue;
    for (let idx = 0; idx < ids.length; idx += 1) {
      const agentId = ids[idx];
      if (!agentIds.has(agentId)) ctx.addIssue({
        code: _compatZe2wFLca.n.custom,
        path: [
        "broadcast",
        peerId,
        idx],

        message: `Unknown agent id "${agentId}" (not in agents.list).`
      });
    }
  }
});
//#endregion /* v9-10296a9541101c24 */
