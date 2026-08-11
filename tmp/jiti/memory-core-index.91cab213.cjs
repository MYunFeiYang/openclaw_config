"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.DEFAULT_MEMORY_FLUSH_SOFT_TOKENS = exports.DEFAULT_MEMORY_FLUSH_PROMPT = exports.DEFAULT_MEMORY_FLUSH_FORCE_TRANSCRIPT_BYTES = void 0;exports.buildMemoryFlushPlan = buildMemoryFlushPlan;exports.default = exports.buildPromptSection = void 0;var _stringCoerceBje8XVt = require("../../string-coerce-Bje8XVt9.js");
var _errorsG8SYDTCe = require("../../errors-g8SYDTCe.js");
var _sessionKeyUtilsB9qLc2A = require("../../session-key-utils-B9qLc2A8.js");
var _agentScopeRNt6KatQ = require("../../agent-scope-RNt6KatQ.js");
var _recordCoerceZvIvRO5e = require("../../record-coerce-zvIvRO5e.js");
var _zodSchemaCxqiRMUZ = require("../../zod-schema-CxqiRMUZ.js");
var _dreamingCUzWMDhQ = require("../../dreaming-CUzWMDhQ.js");
var _memoryStateMIj6In9p = require("../../memory-state-MIj6In9p.js");
var _combinedStoreGatewayD6wKl8dT = require("../../combined-store-gateway-D6wKl8dT.js");
var _tokensBIJuzXU = require("../../tokens-BIJuzXU-.js");
var _sessionVisibilityCUUyl02j = require("../../session-visibility-CUUyl02j.js");
require("../../pi-settings-CmTT0hYp.js");
var _commonWwJcpwdP = require("../../common-WwJcpwdP.js");
var _currentTimeBuke5Xti = require("../../current-time-Buke5Xti.js");
var _memorySearchCwVTNndi = require("../../memory-search-CwVTNndi.js");
require("../../text-runtime-BfJujyVf.js");
var _pluginEntryDyZc6JGI = require("../../plugin-entry-DyZc6JGI.js");
require("../../error-runtime-BSkJRsKu.js");
var _sessionTranscriptHitDTIr4UWv = require("../../session-transcript-hit-DTIr4UWv.js");
var _eventsDLaYFGKU = require("../../events-DLaYFGKU.js");
require("../../memory-core-host-events-BJezwEy1.js");
require("../../memory-core-host-status-CgCFxEwt.js");
require("../../memory-core-host-runtime-core-_eobMiu2.js");
var _shortTermPromotionBU_sr5Sj = require("../../short-term-promotion-BU_sr5Sj.js");
require("../../dreaming-shared-BKklH94W.js");
var _cliCJ5LOD0p = require("../../cli-CJ5LOD0p.js");
var _dreamingMpCcbCB = require("../../dreaming-MpCcbCB7.js");
var _managerJzSMQjEt = require("../../manager-jzSMQjEt.js");
var _runtimeProviderDwhxOi1X = require("../../runtime-provider-DwhxOi1X.js");
var _nodePath = _interopRequireDefault(require("node:path"));
var _promises = _interopRequireDefault(require("node:fs/promises"));
var _typebox = require("typebox");function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}function _interopRequireWildcard(e, t) {if ("function" == typeof WeakMap) var r = new WeakMap(),n = new WeakMap();return (_interopRequireWildcard = function (e, t) {if (!t && e && e.__esModule) return e;var o,i,f = { __proto__: null, default: e };if (null === e || "object" != typeof e && "function" != typeof e) return f;if (o = t ? n : r) {if (o.has(e)) return o.get(e);o.set(e, f);}for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]);return f;})(e, t);}
//#region extensions/memory-core/src/dreaming-command.ts
function resolveMemoryCorePluginConfig(cfg) {
  return (0, _recordCoerceZvIvRO5e.n)((0, _recordCoerceZvIvRO5e.n)(cfg.plugins?.entries?.["memory-core"])?.config) ?? {};
}
function updateDreamingEnabledInConfig(cfg, enabled) {
  const entries = { ...cfg.plugins?.entries };
  const existingEntry = (0, _recordCoerceZvIvRO5e.n)(entries["memory-core"]) ?? {};
  const existingConfig = (0, _recordCoerceZvIvRO5e.n)(existingEntry.config) ?? {};
  const existingSleep = (0, _recordCoerceZvIvRO5e.n)(existingConfig.dreaming) ?? {};
  entries["memory-core"] = {
    ...existingEntry,
    config: {
      ...existingConfig,
      dreaming: {
        ...existingSleep,
        enabled
      }
    }
  };
  return {
    ...cfg,
    plugins: {
      ...cfg.plugins,
      entries
    }
  };
}
function formatEnabled(value) {
  return value ? "on" : "off";
}
function formatPhaseGuide() {
  return [
  "- implementation detail: each sweep runs light -> REM -> deep.",
  "- deep is the only stage that writes durable entries to MEMORY.md.",
  "- DREAMS.md is for human-readable dreaming summaries and diary entries."].
  join("\n");
}
function formatStatus(cfg) {
  const pluginConfig = resolveMemoryCorePluginConfig(cfg);
  const dreaming = (0, _dreamingCUzWMDhQ.G)({
    pluginConfig,
    cfg
  });
  const deep = (0, _dreamingMpCcbCB.n)({
    pluginConfig,
    cfg
  });
  const timezone = dreaming.timezone ? ` (${dreaming.timezone})` : "";
  return [
  "Dreaming status:",
  `- enabled: ${formatEnabled(dreaming.enabled)}${timezone}`,
  `- sweep cadence: ${dreaming.frequency}`,
  `- promotion policy: score>=${deep.minScore}, recalls>=${deep.minRecallCount}, uniqueQueries>=${deep.minUniqueQueries}`].
  join("\n");
}
function formatUsage(includeStatus) {
  return [
  "Usage: /dreaming status",
  "Usage: /dreaming on|off",
  "",
  includeStatus,
  "",
  "Phases:",
  formatPhaseGuide()].
  join("\n");
}
function requiresAdminToMutateDreaming(gatewayClientScopes) {
  return Array.isArray(gatewayClientScopes) && !gatewayClientScopes.includes("operator.admin");
}
function registerDreamingCommand(api) {
  api.registerCommand({
    name: "dreaming",
    description: "Enable or disable memory dreaming.",
    acceptsArgs: true,
    handler: async (ctx) => {
      const [firstToken = ""] = (ctx.args?.trim() ?? "").split(/\s+/).filter(Boolean).map((token) => (0, _stringCoerceBje8XVt.a)(token));
      const currentConfig = api.runtime.config.current();
      if (!firstToken || firstToken === "help" || firstToken === "options" || firstToken === "phases") return { text: formatUsage(formatStatus(currentConfig)) };
      if (firstToken === "status") return { text: formatStatus(currentConfig) };
      if (firstToken === "on" || firstToken === "off") {
        if (requiresAdminToMutateDreaming(ctx.gatewayClientScopes)) return { text: "⚠️ /dreaming on|off requires operator.admin for gateway clients." };
        const enabled = firstToken === "on";
        const nextConfig = updateDreamingEnabledInConfig(currentConfig, enabled);
        await api.runtime.config.replaceConfigFile({
          nextConfig,
          afterWrite: { mode: "auto" }
        });
        return { text: [
          `Dreaming ${enabled ? "enabled" : "disabled"}.`,
          "",
          formatStatus(nextConfig)].
          join("\n") };
      }
      return { text: formatUsage(formatStatus(currentConfig)) };
    }
  });
}
//#endregion
//#region extensions/memory-core/src/flush-plan.ts
const DEFAULT_MEMORY_FLUSH_SOFT_TOKENS = exports.DEFAULT_MEMORY_FLUSH_SOFT_TOKENS = 4e3;
const DEFAULT_MEMORY_FLUSH_FORCE_TRANSCRIPT_BYTES = exports.DEFAULT_MEMORY_FLUSH_FORCE_TRANSCRIPT_BYTES = 2 * 1024 * 1024;
const MEMORY_FLUSH_TARGET_HINT = "Store durable memories only in memory/YYYY-MM-DD.md (create memory/ if needed).";
const MEMORY_FLUSH_APPEND_ONLY_HINT = "If memory/YYYY-MM-DD.md already exists, APPEND new content only and do not overwrite existing entries.";
const MEMORY_FLUSH_READ_ONLY_HINT = "Treat workspace bootstrap/reference files such as MEMORY.md, DREAMS.md, SOUL.md, TOOLS.md, and AGENTS.md as read-only during this flush; never overwrite, replace, or edit them.";
const MEMORY_FLUSH_REQUIRED_HINTS = [
MEMORY_FLUSH_TARGET_HINT,
MEMORY_FLUSH_APPEND_ONLY_HINT,
MEMORY_FLUSH_READ_ONLY_HINT];

const DEFAULT_MEMORY_FLUSH_PROMPT = exports.DEFAULT_MEMORY_FLUSH_PROMPT = [
"Pre-compaction memory flush.",
MEMORY_FLUSH_TARGET_HINT,
MEMORY_FLUSH_READ_ONLY_HINT,
MEMORY_FLUSH_APPEND_ONLY_HINT,
"Do NOT create timestamped variant files (e.g., YYYY-MM-DD-HHMM.md); always use the canonical YYYY-MM-DD.md filename.",
`If nothing to store, reply with ${_tokensBIJuzXU.n}.`].
join(" ");
const DEFAULT_MEMORY_FLUSH_SYSTEM_PROMPT = [
"Pre-compaction memory flush turn.",
"The session is near auto-compaction; capture durable memories to disk.",
MEMORY_FLUSH_TARGET_HINT,
MEMORY_FLUSH_READ_ONLY_HINT,
MEMORY_FLUSH_APPEND_ONLY_HINT,
`You may reply, but usually ${_tokensBIJuzXU.n} is correct.`].
join(" ");
function formatDateStampInTimezone(nowMs, timezone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date(nowMs));
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  if (year && month && day) return `${year}-${month}-${day}`;
  return new Date(nowMs).toISOString().slice(0, 10);
}
function normalizeNonNegativeInt(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const int = Math.floor(value);
  return int >= 0 ? int : null;
}
function ensureNoReplyHint(text) {
  if (text.includes("NO_REPLY")) return text;
  return `${text}\n\nIf no user-visible reply is needed, start with ${_tokensBIJuzXU.n}.`;
}
function ensureMemoryFlushSafetyHints(text) {
  let next = text.trim();
  for (const hint of MEMORY_FLUSH_REQUIRED_HINTS) if (!next.includes(hint)) next = next ? `${next}\n\n${hint}` : hint;
  return next;
}
function appendCurrentTimeLine(text, timeLine) {
  const trimmed = text.trimEnd();
  if (!trimmed) return timeLine;
  if (trimmed.includes("Current time:")) return trimmed;
  return `${trimmed}\n${timeLine}`;
}
function buildMemoryFlushPlan(params = {}) {
  const resolved = params;
  const nowMs = Number.isFinite(resolved.nowMs) ? resolved.nowMs : Date.now();
  const cfg = resolved.cfg;
  const defaults = cfg?.agents?.defaults?.compaction?.memoryFlush;
  if (defaults?.enabled === false) return null;
  const softThresholdTokens = normalizeNonNegativeInt(defaults?.softThresholdTokens) ?? 4e3;
  const forceFlushTranscriptBytes = (0, _zodSchemaCxqiRMUZ.n)(defaults?.forceFlushTranscriptBytes) ?? 2097152;
  const reserveTokensFloor = normalizeNonNegativeInt(cfg?.agents?.defaults?.compaction?.reserveTokensFloor) ?? 2e4;
  const { timeLine, userTimezone } = (0, _currentTimeBuke5Xti.n)(cfg ?? {}, nowMs);
  const dateStamp = formatDateStampInTimezone(nowMs, userTimezone);
  const relativePath = `memory/${dateStamp}.md`;
  const promptBase = ensureNoReplyHint(ensureMemoryFlushSafetyHints(defaults?.prompt?.trim() || DEFAULT_MEMORY_FLUSH_PROMPT));
  const systemPrompt = ensureNoReplyHint(ensureMemoryFlushSafetyHints(defaults?.systemPrompt?.trim() || DEFAULT_MEMORY_FLUSH_SYSTEM_PROMPT));
  return {
    softThresholdTokens,
    forceFlushTranscriptBytes,
    reserveTokensFloor,
    model: defaults?.model?.trim() || void 0,
    prompt: appendCurrentTimeLine(promptBase.replaceAll("YYYY-MM-DD", dateStamp), timeLine),
    systemPrompt: systemPrompt.replaceAll("YYYY-MM-DD", dateStamp),
    relativePath
  };
}
//#endregion
//#region extensions/memory-core/src/prompt-section.ts
const buildPromptSection = ({ availableTools, citationsMode }) => {
  const hasMemorySearch = availableTools.has("memory_search");
  const hasMemoryGet = availableTools.has("memory_get");
  if (!hasMemorySearch && !hasMemoryGet) return [];
  let toolGuidance;
  if (hasMemorySearch && hasMemoryGet) toolGuidance = "Before answering anything about prior work, decisions, dates, people, preferences, or todos: run memory_search on MEMORY.md + memory/*.md + indexed session transcripts; then use memory_get to pull only the needed lines. If low confidence after search, say you checked.";else
  if (hasMemorySearch) toolGuidance = "Before answering anything about prior work, decisions, dates, people, preferences, or todos: run memory_search on MEMORY.md + memory/*.md + indexed session transcripts and answer from the matching results. If low confidence after search, say you checked.";else
  toolGuidance = "Before answering anything about prior work, decisions, dates, people, preferences, or todos that already point to a specific memory file or note: run memory_get to pull only the needed lines. If low confidence after reading them, say you checked.";
  const lines = ["## Memory Recall", toolGuidance];
  if (citationsMode === "off") lines.push("Citations are disabled: do not mention file paths or line numbers in replies unless the user explicitly asks.");else
  lines.push("Citations: include Source: <path#line> when it helps the user verify memory snippets.");
  lines.push("");
  return lines;
};
//#endregion
//#region extensions/memory-core/src/public-artifacts.ts
exports.buildPromptSection = buildPromptSection;async function pathExists(inputPath) {
  try {
    await _promises.default.access(inputPath);
    return true;
  } catch {
    return false;
  }
}
async function listMarkdownFilesRecursive(rootDir) {
  const entries = await _promises.default.readdir(rootDir, { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const entry of entries) {
    const fullPath = _nodePath.default.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listMarkdownFilesRecursive(fullPath)));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".md")) files.push(fullPath);
  }
  return files.toSorted((left, right) => left.localeCompare(right));
}
async function collectWorkspaceArtifacts(params) {
  const artifacts = [];
  const workspaceEntries = new Set((await _promises.default.readdir(params.workspaceDir, { withFileTypes: true }).catch(() => [])).filter((entry) => entry.isFile()).map((entry) => entry.name));
  for (const relativePath of ["MEMORY.md"]) {
    if (!workspaceEntries.has(relativePath)) continue;
    const absolutePath = _nodePath.default.join(params.workspaceDir, relativePath);
    artifacts.push({
      kind: "memory-root",
      workspaceDir: params.workspaceDir,
      relativePath,
      absolutePath,
      agentIds: [...params.agentIds],
      contentType: "markdown"
    });
  }
  const memoryDir = _nodePath.default.join(params.workspaceDir, "memory");
  for (const absolutePath of await listMarkdownFilesRecursive(memoryDir)) {
    const relativePath = _nodePath.default.relative(params.workspaceDir, absolutePath).replace(/\\/g, "/");
    artifacts.push({
      kind: relativePath.startsWith("memory/dreaming/") ? "dream-report" : "daily-note",
      workspaceDir: params.workspaceDir,
      relativePath,
      absolutePath,
      agentIds: [...params.agentIds],
      contentType: "markdown"
    });
  }
  const eventLogPath = (0, _eventsDLaYFGKU.i)(params.workspaceDir);
  if (await pathExists(eventLogPath)) artifacts.push({
    kind: "event-log",
    workspaceDir: params.workspaceDir,
    relativePath: _nodePath.default.relative(params.workspaceDir, eventLogPath).replace(/\\/g, "/"),
    absolutePath: eventLogPath,
    agentIds: [...params.agentIds],
    contentType: "json"
  });
  const deduped = /* @__PURE__ */new Map();
  for (const artifact of artifacts) deduped.set(`${artifact.workspaceDir}\0${artifact.relativePath}\0${artifact.kind}`, artifact);
  return [...deduped.values()];
}
async function listMemoryCorePublicArtifacts(params) {
  const workspaces = (0, _dreamingCUzWMDhQ.J)(params.cfg);
  const artifacts = [];
  for (const workspace of workspaces) artifacts.push(...(await collectWorkspaceArtifacts({
    workspaceDir: workspace.workspaceDir,
    agentIds: workspace.agentIds
  })));
  return artifacts;
}
//#endregion
//#region extensions/memory-core/src/session-search-visibility.ts
async function filterMemorySearchHitsBySessionVisibility(params) {
  const visibility = (0, _sessionVisibilityCUUyl02j.a)({
    cfg: params.cfg,
    sandboxed: params.sandboxed
  });
  const a2aPolicy = (0, _sessionVisibilityCUUyl02j.t)(params.cfg);
  const guard = params.requesterSessionKey ? await (0, _sessionVisibilityCUUyl02j.r)({
    action: "history",
    requesterSessionKey: params.requesterSessionKey,
    visibility,
    a2aPolicy
  }) : null;
  const { store: combinedSessionStore } = (0, _combinedStoreGatewayD6wKl8dT.t)(params.cfg);
  const next = [];
  for (const hit of params.hits) {
    if (hit.source !== "sessions") {
      next.push(hit);
      continue;
    }
    if (!params.requesterSessionKey || !guard) continue;
    const stem = (0, _sessionTranscriptHitDTIr4UWv.t)(hit.path);
    if (!stem) continue;
    const keys = (0, _sessionTranscriptHitDTIr4UWv.n)({
      store: combinedSessionStore,
      stem
    });
    if (keys.length === 0) continue;
    if (!keys.some((key) => guard.check(key).allowed)) continue;
    next.push(hit);
  }
  return next;
}
//#endregion
//#region extensions/memory-core/src/tools.citations.ts
function resolveMemoryCitationsMode(cfg) {
  const mode = cfg.memory?.citations;
  if (mode === "on" || mode === "off" || mode === "auto") return mode;
  return "auto";
}
function decorateCitations(results, include) {
  if (!include) return results.map((entry) => ({
    ...entry,
    citation: void 0
  }));
  return results.map((entry) => {
    const citation = formatCitation(entry);
    const snippet = `${entry.snippet.trim()}\n\nSource: ${citation}`;
    return {
      ...entry,
      citation,
      snippet
    };
  });
}
function formatCitation(entry) {
  const lineRange = entry.startLine === entry.endLine ? `#L${entry.startLine}` : `#L${entry.startLine}-L${entry.endLine}`;
  return `${entry.path}${lineRange}`;
}
function clampResultsByInjectedChars(results, budget) {
  if (!budget || budget <= 0) return results;
  let remaining = budget;
  const clamped = [];
  for (const entry of results) {
    if (remaining <= 0) break;
    const snippet = entry.snippet ?? "";
    if (snippet.length <= remaining) {
      clamped.push(entry);
      remaining -= snippet.length;
    } else {
      const trimmed = snippet.slice(0, Math.max(0, remaining));
      clamped.push({
        ...entry,
        snippet: trimmed
      });
      break;
    }
  }
  return clamped;
}
function shouldIncludeCitations(params) {
  if (params.mode === "on") return true;
  if (params.mode === "off") return false;
  return deriveChatTypeFromSessionKey(params.sessionKey) === "direct";
}
function deriveChatTypeFromSessionKey(sessionKey) {
  const parsed = (0, _sessionKeyUtilsB9qLc2A.o)(sessionKey);
  if (!parsed?.rest) return "direct";
  const tokens = new Set((0, _stringCoerceBje8XVt.a)(parsed.rest).split(":").filter(Boolean));
  if (tokens.has("channel")) return "channel";
  if (tokens.has("group")) return "group";
  return "direct";
}
//#endregion
//#region extensions/memory-core/src/tools.shared.ts
let memoryToolRuntimePromise = null;
async function loadMemoryToolRuntime() {
  memoryToolRuntimePromise ??= Promise.resolve().then(() => jitiImport("../../tools.runtime-CB2bohzf.js").then((m) => _interopRequireWildcard(m)));
  return await memoryToolRuntimePromise;
}
const MemorySearchSchema = _typebox.Type.Object({
  query: _typebox.Type.String(),
  maxResults: _typebox.Type.Optional(_typebox.Type.Number()),
  minScore: _typebox.Type.Optional(_typebox.Type.Number()),
  corpus: _typebox.Type.Optional(_typebox.Type.Union([
  _typebox.Type.Literal("memory"),
  _typebox.Type.Literal("wiki"),
  _typebox.Type.Literal("all"),
  _typebox.Type.Literal("sessions")]
  ))
});
const MemoryGetSchema = _typebox.Type.Object({
  path: _typebox.Type.String(),
  from: _typebox.Type.Optional(_typebox.Type.Number()),
  lines: _typebox.Type.Optional(_typebox.Type.Number()),
  corpus: _typebox.Type.Optional(_typebox.Type.Union([
  _typebox.Type.Literal("memory"),
  _typebox.Type.Literal("wiki"),
  _typebox.Type.Literal("all")]
  ))
});
function resolveMemoryToolContext(options) {
  const cfg = options.getConfig?.() ?? options.config;
  if (!cfg) return null;
  const agentId = (0, _agentScopeRNt6KatQ.p)({
    sessionKey: options.agentSessionKey,
    config: cfg
  });
  if (!(0, _memorySearchCwVTNndi.t)(cfg, agentId)) return null;
  return {
    cfg,
    agentId
  };
}
async function getMemoryManagerContext(params) {
  return await getMemoryManagerContextWithPurpose({
    ...params,
    purpose: void 0
  });
}
async function getMemoryManagerContextWithPurpose(params) {
  const { getMemorySearchManager } = await loadMemoryToolRuntime();
  const { manager, error } = await getMemorySearchManager({
    cfg: params.cfg,
    agentId: params.agentId,
    purpose: params.purpose
  });
  return manager ? { manager } : { error };
}
function createMemoryTool(params) {
  const ctx = resolveMemoryToolContext(params.options);
  if (!ctx) return null;
  return {
    label: params.label,
    name: params.name,
    description: params.description,
    parameters: params.parameters,
    execute: async (toolCallId, toolParams) => {
      const latestCtx = resolveMemoryToolContext(params.options) ?? ctx;
      return await params.execute(latestCtx)(toolCallId, toolParams);
    }
  };
}
function buildMemorySearchUnavailableResult(error) {
  const reason = (error ?? "memory search unavailable").trim() || "memory search unavailable";
  const isQuotaError = /insufficient_quota|quota|429/.test((0, _stringCoerceBje8XVt.a)(reason));
  const warning = isQuotaError ? "Memory search is unavailable because the embedding provider quota is exhausted." : "Memory search is unavailable due to an embedding/provider error.";
  const action = isQuotaError ? "Top up or switch embedding provider, then retry memory_search." : "Check embedding provider configuration and retry memory_search.";
  return {
    results: [],
    disabled: true,
    unavailable: true,
    error: reason,
    warning,
    action,
    debug: {
      warning,
      action,
      error: reason
    }
  };
}
async function searchMemoryCorpusSupplements(params) {
  if (params.corpus === "memory" || params.corpus === "sessions") return [];
  const supplements = (0, _memoryStateMIj6In9p.l)();
  if (supplements.length === 0) return [];
  return (await Promise.all(supplements.map(async (registration) => await registration.supplement.search(params)))).flat().toSorted((left, right) => {
    if (left.score !== right.score) return right.score - left.score;
    return left.path.localeCompare(right.path);
  }).slice(0, Math.max(1, params.maxResults ?? 10));
}
async function getMemoryCorpusSupplementResult(params) {
  if (params.corpus === "memory" || params.corpus === "sessions") return null;
  for (const registration of (0, _memoryStateMIj6In9p.l)()) {
    const result = await registration.supplement.get(params);
    if (result) return result;
  }
  return null;
}
//#endregion
//#region extensions/memory-core/src/tools.ts
function buildRecallKey(result) {
  return `${result.source}:${result.path}:${result.startLine}:${result.endLine}`;
}
function resolveRecallTrackingResults(rawResults, surfacedResults) {
  if (surfacedResults.length === 0 || rawResults.length === 0) return surfacedResults;
  const rawByKey = /* @__PURE__ */new Map();
  for (const raw of rawResults) {
    const key = buildRecallKey(raw);
    if (!rawByKey.has(key)) rawByKey.set(key, raw);
  }
  return surfacedResults.map((surfaced) => rawByKey.get(buildRecallKey(surfaced)) ?? surfaced);
}
function queueShortTermRecallTracking(params) {
  const trackingResults = resolveRecallTrackingResults(params.rawResults, params.surfacedResults);
  (0, _shortTermPromotionBU_sr5Sj.l)({
    workspaceDir: params.workspaceDir,
    query: params.query,
    results: trackingResults,
    timezone: params.timezone
  }).catch(() => {});
}
function normalizeActiveMemoryQmdSearchMode(value) {
  return value === "inherit" || value === "search" || value === "vsearch" || value === "query" ? value : "search";
}
function isActiveMemorySessionKey(sessionKey) {
  return typeof sessionKey === "string" && sessionKey.includes(":active-memory:");
}
function resolveActiveMemoryQmdSearchModeOverride(cfg, sessionKey) {
  if (!isActiveMemorySessionKey(sessionKey)) return;
  const entry = cfg.plugins?.entries?.["active-memory"];
  const entryRecord = entry && typeof entry === "object" && !Array.isArray(entry) ? entry : void 0;
  const searchMode = normalizeActiveMemoryQmdSearchMode((entryRecord?.config && typeof entryRecord.config === "object" && !Array.isArray(entryRecord.config) ? entryRecord.config : void 0)?.qmd?.searchMode);
  return searchMode === "inherit" ? void 0 : searchMode;
}
async function getSupplementMemoryReadResult(params) {
  const supplement = await getMemoryCorpusSupplementResult({
    lookup: params.relPath,
    fromLine: params.from,
    lineCount: params.lines,
    agentSessionKey: params.agentSessionKey,
    corpus: params.corpus
  });
  if (!supplement) return null;
  const { content, ...rest } = supplement;
  return {
    ...rest,
    text: content
  };
}
async function resolveMemoryReadFailureResult(params) {
  if (params.requestedCorpus === "all") {
    const supplement = await getSupplementMemoryReadResult({
      relPath: params.relPath,
      from: params.from,
      lines: params.lines,
      agentSessionKey: params.agentSessionKey,
      corpus: params.requestedCorpus
    });
    if (supplement) return (0, _commonWwJcpwdP.l)(supplement);
  }
  const message = (0, _errorsG8SYDTCe.i)(params.error);
  return (0, _commonWwJcpwdP.l)({
    path: params.relPath,
    text: "",
    disabled: true,
    error: message
  });
}
async function executeMemoryReadResult(params) {
  try {
    return (0, _commonWwJcpwdP.l)(await params.read());
  } catch (error) {
    return await resolveMemoryReadFailureResult({
      error,
      requestedCorpus: params.requestedCorpus,
      relPath: params.relPath,
      from: params.from,
      lines: params.lines,
      agentSessionKey: params.agentSessionKey
    });
  }
}
function createMemorySearchTool(options) {
  return createMemoryTool({
    options,
    label: "Memory Search",
    name: "memory_search",
    description: "Mandatory recall step: semantically search MEMORY.md + memory/*.md (and optional session transcripts) before answering questions about prior work, decisions, dates, people, preferences, or todos. Optional `corpus=wiki` or `corpus=all` also searches registered compiled-wiki supplements. `corpus=memory` restricts hits to indexed memory files (excludes session transcript chunks from ranking). `corpus=sessions` restricts hits to indexed session transcripts (same visibility rules as session history tools). If response has disabled=true, memory retrieval is unavailable and should be surfaced to the user.",
    parameters: MemorySearchSchema,
    execute: ({ cfg, agentId }) => async (_toolCallId, params) => {
      const rawParams = (0, _commonWwJcpwdP.i)(params);
      const query = (0, _commonWwJcpwdP.g)(rawParams, "query", { required: true });
      const maxResults = (0, _commonWwJcpwdP.f)(rawParams, "maxResults");
      const minScore = (0, _commonWwJcpwdP.f)(rawParams, "minScore");
      const requestedCorpus = (0, _commonWwJcpwdP.g)(rawParams, "corpus");
      const { resolveMemoryBackendConfig } = await loadMemoryToolRuntime();
      const shouldQueryMemory = requestedCorpus !== "wiki";
      const shouldQuerySupplements = requestedCorpus === "wiki" || requestedCorpus === "all";
      const memory = shouldQueryMemory ? await getMemoryManagerContext({
        cfg,
        agentId
      }) : null;
      if (shouldQueryMemory && memory && "error" in memory && !shouldQuerySupplements) return (0, _commonWwJcpwdP.l)(buildMemorySearchUnavailableResult(memory.error));
      try {
        const citationsMode = resolveMemoryCitationsMode(cfg);
        const includeCitations = shouldIncludeCitations({
          mode: citationsMode,
          sessionKey: options.agentSessionKey
        });
        const searchStartedAt = Date.now();
        let rawResults = [];
        let surfacedMemoryResults = [];
        let provider;
        let model;
        let fallback;
        let searchMode;
        let searchDebug;
        if (shouldQueryMemory && memory && !("error" in memory)) {
          const runtimeDebug = [];
          const qmdSearchModeOverride = resolveActiveMemoryQmdSearchModeOverride(cfg, options.agentSessionKey);
          const searchSources = requestedCorpus === "sessions" ? ["sessions"] : requestedCorpus === "memory" ? ["memory"] : void 0;
          rawResults = await memory.manager.search(query, {
            maxResults,
            minScore,
            sessionKey: options.agentSessionKey,
            qmdSearchModeOverride,
            onDebug: (debug) => {
              runtimeDebug.push(debug);
            },
            ...(searchSources ? { sources: searchSources } : {})
          });
          rawResults = await filterMemorySearchHitsBySessionVisibility({
            cfg,
            requesterSessionKey: options.agentSessionKey,
            sandboxed: options.sandboxed === true,
            hits: rawResults
          });
          if (requestedCorpus === "sessions") rawResults = rawResults.filter((hit) => hit.source === "sessions");else
          if (requestedCorpus === "memory") rawResults = rawResults.filter((hit) => hit.source === "memory");
          const status = memory.manager.status();
          const decorated = decorateCitations(rawResults, includeCitations);
          const resolved = resolveMemoryBackendConfig({
            cfg,
            agentId
          });
          const memoryResults = status.backend === "qmd" ? clampResultsByInjectedChars(decorated, resolved.qmd?.limits.maxInjectedChars) : decorated;
          surfacedMemoryResults = memoryResults.map((result) => ({
            ...result,
            corpus: "memory"
          }));
          const sleepTimezone = (0, _dreamingCUzWMDhQ.W)({
            pluginConfig: (0, _dreamingCUzWMDhQ.U)(cfg),
            cfg
          }).timezone;
          queueShortTermRecallTracking({
            workspaceDir: status.workspaceDir,
            query,
            rawResults,
            surfacedResults: memoryResults,
            timezone: sleepTimezone
          });
          provider = status.provider;
          model = status.model;
          fallback = status.fallback;
          const latestDebug = runtimeDebug.at(-1);
          searchMode = latestDebug?.effectiveMode;
          searchDebug = {
            backend: status.backend,
            configuredMode: latestDebug?.configuredMode,
            effectiveMode: status.backend === "qmd" ? latestDebug?.effectiveMode ?? latestDebug?.configuredMode : "n/a",
            fallback: latestDebug?.fallback,
            searchMs: Math.max(0, Date.now() - searchStartedAt),
            hits: rawResults.length
          };
        }
        const supplementResults = shouldQuerySupplements ? await searchMemoryCorpusSupplements({
          query,
          maxResults,
          agentSessionKey: options.agentSessionKey,
          corpus: requestedCorpus
        }) : [];
        return (0, _commonWwJcpwdP.l)({
          results: [...surfacedMemoryResults, ...supplementResults].toSorted((left, right) => {
            if (left.score !== right.score) return right.score - left.score;
            return left.path.localeCompare(right.path);
          }).slice(0, Math.max(1, maxResults ?? 10)),
          provider,
          model,
          fallback,
          citations: citationsMode,
          mode: searchMode,
          debug: searchDebug
        });
      } catch (err) {
        return (0, _commonWwJcpwdP.l)(buildMemorySearchUnavailableResult((0, _errorsG8SYDTCe.i)(err)));
      }
    }
  });
}
function createMemoryGetTool(options) {
  return createMemoryTool({
    options,
    label: "Memory Get",
    name: "memory_get",
    description: "Safe exact excerpt read from MEMORY.md or memory/*.md. Defaults to a bounded excerpt when lines are omitted, includes truncation/continuation info when more content exists, and `corpus=wiki` reads from registered compiled-wiki supplements.",
    parameters: MemoryGetSchema,
    execute: ({ cfg, agentId }) => async (_toolCallId, params) => {
      const rawParams = (0, _commonWwJcpwdP.i)(params);
      const relPath = (0, _commonWwJcpwdP.g)(rawParams, "path", { required: true });
      const from = (0, _commonWwJcpwdP.f)(rawParams, "from", { integer: true });
      const lines = (0, _commonWwJcpwdP.f)(rawParams, "lines", { integer: true });
      const requestedCorpus = (0, _commonWwJcpwdP.g)(rawParams, "corpus");
      const { readAgentMemoryFile, resolveMemoryBackendConfig } = await loadMemoryToolRuntime();
      if (requestedCorpus === "wiki") return (0, _commonWwJcpwdP.l)((await getSupplementMemoryReadResult({
        relPath,
        from: from ?? void 0,
        lines: lines ?? void 0,
        agentSessionKey: options.agentSessionKey,
        corpus: requestedCorpus
      })) ?? {
        path: relPath,
        text: "",
        disabled: true,
        error: "wiki corpus result not found"
      });
      if (resolveMemoryBackendConfig({
        cfg,
        agentId
      }).backend === "builtin") return await executeMemoryReadResult({
        read: async () => await readAgentMemoryFile({
          cfg,
          agentId,
          relPath,
          from: from ?? void 0,
          lines: lines ?? void 0
        }),
        requestedCorpus,
        relPath,
        from: from ?? void 0,
        lines: lines ?? void 0,
        agentSessionKey: options.agentSessionKey
      });
      const memory = await getMemoryManagerContextWithPurpose({
        cfg,
        agentId,
        purpose: "status"
      });
      if ("error" in memory) return (0, _commonWwJcpwdP.l)({
        path: relPath,
        text: "",
        disabled: true,
        error: memory.error
      });
      return await executeMemoryReadResult({
        read: async () => await memory.manager.readFile({
          relPath,
          from: from ?? void 0,
          lines: lines ?? void 0
        }),
        requestedCorpus,
        relPath,
        from: from ?? void 0,
        lines: lines ?? void 0,
        agentSessionKey: options.agentSessionKey
      });
    }
  });
}
//#endregion
//#region extensions/memory-core/index.ts
var memory_core_default = exports.default = (0, _pluginEntryDyZc6JGI.t)({
  id: "memory-core",
  name: "Memory (Core)",
  description: "File-backed memory search tools and CLI",
  kind: "memory",
  register(api) {
    (0, _managerJzSMQjEt.o)(api);
    (0, _dreamingMpCcbCB.t)(api);
    registerDreamingCommand(api);
    api.registerMemoryCapability({
      promptBuilder: buildPromptSection,
      flushPlanResolver: buildMemoryFlushPlan,
      runtime: _runtimeProviderDwhxOi1X.t,
      publicArtifacts: { listArtifacts: listMemoryCorePublicArtifacts }
    });
    api.registerTool((ctx) => {
      const getConfig = () => ctx.getRuntimeConfig?.() ?? ctx.runtimeConfig ?? ctx.config;
      return createMemorySearchTool({
        config: getConfig(),
        getConfig,
        agentSessionKey: ctx.sessionKey,
        sandboxed: ctx.sandboxed
      });
    }, { names: ["memory_search"] });
    api.registerTool((ctx) => {
      const getConfig = () => ctx.getRuntimeConfig?.() ?? ctx.runtimeConfig ?? ctx.config;
      return createMemoryGetTool({
        config: getConfig(),
        getConfig,
        agentSessionKey: ctx.sessionKey
      });
    }, { names: ["memory_get"] });
    api.registerCli(({ program }) => {
      (0, _cliCJ5LOD0p.t)(program);
    }, { descriptors: [{
        name: "memory",
        description: "Search, inspect, and reindex memory files",
        hasSubcommands: true
      }] });
  }
});
//#endregion /* v9-f4728b6bd4ea2db3 */
