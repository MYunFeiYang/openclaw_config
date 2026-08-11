"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.i = seedHistoricalDailyMemorySignals;exports.n = resolveShortTermPromotionDreamingConfig;exports.r = previewRemDreaming;exports.t = registerShortTermPromotionDreaming;var _stringCoerceBje8XVt = require("./string-coerce-Bje8XVt9.js");
var _errorsG8SYDTCe = require("./errors-g8SYDTCe.js");
var _recordCoerceZvIvRO5e = require("./record-coerce-zvIvRO5e.js");
var _dreamingCUzWMDhQ = require("./dreaming-CUzWMDhQ.js");
var _artifactsC4Ry7YwM = require("./artifacts-C4Ry7YwM.js");
var _systemEventsCAt6m2Yr = require("./system-events-CAt6m2Yr.js");
require("./text-runtime-BfJujyVf.js");
require("./system-event-runtime-DoVi2ZhZ.js");
var _engineQmdBLLUNP_T = require("./engine-qmd-BLLUNP_T.js");
require("./memory-core-host-engine-qmd-pqGSGtPW.js");
var _eventsDLaYFGKU = require("./events-DLaYFGKU.js");
require("./memory-core-host-status-CgCFxEwt.js");
require("./memory-host-events-CML-gofk.js");
var _memoryHostMarkdownBsORuAsw = require("./memory-host-markdown-BsORuAsw.js");
var _shortTermPromotionBU_sr5Sj = require("./short-term-promotion-BU_sr5Sj.js");
var _dreamingSharedBKklH94W = require("./dreaming-shared-BKklH94W.js");
var _dreamingNarrativeCtUXKufb = require("./dreaming-narrative-CtUXKufb.js");
var _nodePath = _interopRequireDefault(require("node:path"));
var _promises = _interopRequireDefault(require("node:fs/promises"));
var _nodeCrypto = require("node:crypto");function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}
//#region extensions/memory-core/src/dreaming-markdown.ts
const DAILY_PHASE_HEADINGS = {
  light: "## Light Sleep",
  rem: "## REM Sleep"
};
const DAILY_PHASE_LABELS = {
  light: "light",
  rem: "rem"
};
function resolvePhaseMarkers(phase) {
  const label = DAILY_PHASE_LABELS[phase];
  return {
    start: `<!-- openclaw:dreaming:${label}:start -->`,
    end: `<!-- openclaw:dreaming:${label}:end -->`
  };
}
function resolveDailyMemoryPath(workspaceDir, epochMs, timezone) {
  const isoDay = (0, _dreamingCUzWMDhQ.V)(epochMs, timezone);
  return _nodePath.default.join(workspaceDir, "memory", `${isoDay}.md`);
}
function resolveSeparateReportPath(workspaceDir, phase, epochMs, timezone) {
  const isoDay = (0, _dreamingCUzWMDhQ.V)(epochMs, timezone);
  return _nodePath.default.join(workspaceDir, "memory", "dreaming", phase, `${isoDay}.md`);
}
function shouldWriteInline(storage) {
  return storage.mode === "inline" || storage.mode === "both";
}
function shouldWriteSeparate(storage) {
  return storage.mode === "separate" || storage.mode === "both" || storage.separateReports;
}
async function writeDailyDreamingPhaseBlock(params) {
  const nowMs = Number.isFinite(params.nowMs) ? params.nowMs : Date.now();
  const body = params.bodyLines.length > 0 ? params.bodyLines.join("\n") : "- No notable updates.";
  let inlinePath;
  let reportPath;
  if (shouldWriteInline(params.storage)) {
    inlinePath = resolveDailyMemoryPath(params.workspaceDir, nowMs, params.timezone);
    await _promises.default.mkdir(_nodePath.default.dirname(inlinePath), { recursive: true });
    const original = await _promises.default.readFile(inlinePath, "utf-8").catch((err) => {
      if (err?.code === "ENOENT") return "";
      throw err;
    });
    const markers = resolvePhaseMarkers(params.phase);
    const updated = (0, _memoryHostMarkdownBsORuAsw.t)({
      original,
      heading: DAILY_PHASE_HEADINGS[params.phase],
      startMarker: markers.start,
      endMarker: markers.end,
      body
    });
    await _promises.default.writeFile(inlinePath, (0, _memoryHostMarkdownBsORuAsw.n)(updated), "utf-8");
  }
  if (shouldWriteSeparate(params.storage)) {
    reportPath = resolveSeparateReportPath(params.workspaceDir, params.phase, nowMs, params.timezone);
    await _promises.default.mkdir(_nodePath.default.dirname(reportPath), { recursive: true });
    const report = [
    `# ${params.phase === "light" ? "Light Sleep" : "REM Sleep"}`,
    "",
    body,
    ""].
    join("\n");
    await _promises.default.writeFile(reportPath, report, "utf-8");
  }
  await (0, _eventsDLaYFGKU.n)(params.workspaceDir, {
    type: "memory.dream.completed",
    timestamp: new Date(nowMs).toISOString(),
    phase: params.phase,
    ...(inlinePath ? { inlinePath } : {}),
    ...(reportPath ? { reportPath } : {}),
    lineCount: params.bodyLines.length,
    storageMode: params.storage.mode
  });
  return {
    ...(inlinePath ? { inlinePath } : {}),
    ...(reportPath ? { reportPath } : {})
  };
}
async function writeDeepDreamingReport(params) {
  if (!shouldWriteSeparate(params.storage)) return;
  const nowMs = Number.isFinite(params.nowMs) ? params.nowMs : Date.now();
  const reportPath = resolveSeparateReportPath(params.workspaceDir, "deep", nowMs, params.timezone);
  await _promises.default.mkdir(_nodePath.default.dirname(reportPath), { recursive: true });
  const body = params.bodyLines.length > 0 ? params.bodyLines.join("\n") : "- No durable changes.";
  await _promises.default.writeFile(reportPath, `# Deep Sleep\n\n${body}\n`, "utf-8");
  await (0, _eventsDLaYFGKU.n)(params.workspaceDir, {
    type: "memory.dream.completed",
    timestamp: new Date(nowMs).toISOString(),
    phase: "deep",
    reportPath,
    lineCount: params.bodyLines.length,
    storageMode: params.storage.mode
  });
  return reportPath;
}
//#endregion
//#region extensions/memory-core/src/dreaming-phases.ts
const DAILY_MEMORY_FILENAME_RE = /^(\d{4}-\d{2}-\d{2})\.md$/;
const DAILY_INGESTION_STATE_RELATIVE_PATH = _nodePath.default.join("memory", ".dreams", "daily-ingestion.json");
const DAILY_INGESTION_SCORE = .62;
const DAILY_INGESTION_MAX_SNIPPET_CHARS = 280;
const DAILY_INGESTION_MIN_SNIPPET_CHARS = 8;
const DAILY_INGESTION_MAX_CHUNK_LINES = 4;
const SESSION_INGESTION_STATE_RELATIVE_PATH = _nodePath.default.join("memory", ".dreams", "session-ingestion.json");
const SESSION_CORPUS_RELATIVE_DIR = _nodePath.default.join("memory", ".dreams", "session-corpus");
const SESSION_INGESTION_SCORE = .58;
const SESSION_INGESTION_MAX_SNIPPET_CHARS = 280;
const SESSION_INGESTION_MIN_SNIPPET_CHARS = 12;
const SESSION_INGESTION_MAX_MESSAGES_PER_SWEEP = 240;
const SESSION_INGESTION_MAX_MESSAGES_PER_FILE = 80;
const SESSION_INGESTION_MIN_MESSAGES_PER_FILE = 12;
const SESSION_INGESTION_MAX_TRACKED_MESSAGES_PER_SESSION = 4096;
const SESSION_INGESTION_MAX_TRACKED_SCOPES = 2048;
const SESSION_CHECKPOINT_TRANSCRIPT_FILENAME_RE = /\.checkpoint\..+\.jsonl$/i;
const GENERIC_DAY_HEADING_RE = /^(?:(?:mon|monday|tue|tues|tuesday|wed|wednesday|thu|thur|thurs|thursday|fri|friday|sat|saturday|sun|sunday)(?:,\s+)?)?(?:(?:jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\s+\d{1,2}(?:st|nd|rd|th)?(?:,\s*\d{4})?|\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?|\d{4}[/-]\d{2}[/-]\d{2})$/i;
const MANAGED_DAILY_DREAMING_BLOCKS = [{
  heading: "## Light Sleep",
  startMarker: "<!-- openclaw:dreaming:light:start -->",
  endMarker: "<!-- openclaw:dreaming:light:end -->"
}, {
  heading: "## REM Sleep",
  startMarker: "<!-- openclaw:dreaming:rem:start -->",
  endMarker: "<!-- openclaw:dreaming:rem:end -->"
}];
function calculateLookbackCutoffMs(nowMs, lookbackDays) {
  return nowMs - Math.max(0, lookbackDays) * 24 * 60 * 60 * 1e3;
}
function isDayWithinLookback(day, cutoffMs) {
  const dayMs = Date.parse(`${day}T23:59:59.999Z`);
  return Number.isFinite(dayMs) && dayMs >= cutoffMs;
}
function normalizeDailyListMarker(line) {
  return line.replace(/^\d+\.\s+/, "").replace(/^[-*+]\s+/, "").trim();
}
function normalizeDailyHeading(line) {
  const match = line.trim().match(/^#{1,6}\s+(.+)$/);
  if (!match) return null;
  const heading = match[1] ? normalizeDailyListMarker(match[1]) : "";
  if (!heading || DAILY_MEMORY_FILENAME_RE.test(heading) || isGenericDailyHeading(heading)) return null;
  return heading.slice(0, DAILY_INGESTION_MAX_SNIPPET_CHARS).replace(/\s+/g, " ");
}
function isGenericDailyHeading(heading) {
  const normalized = heading.trim().replace(/\s+/g, " ");
  if (!normalized) return true;
  const lower = normalized.toLowerCase();
  if (lower === "today" || lower === "yesterday" || lower === "tomorrow") return true;
  if (lower === "morning" || lower === "afternoon" || lower === "evening" || lower === "night") return true;
  return GENERIC_DAY_HEADING_RE.test(normalized);
}
function normalizeDailySnippet(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("<!--")) return null;
  const withoutListMarker = normalizeDailyListMarker(trimmed);
  if (withoutListMarker.length < DAILY_INGESTION_MIN_SNIPPET_CHARS) return null;
  return withoutListMarker.slice(0, DAILY_INGESTION_MAX_SNIPPET_CHARS).replace(/\s+/g, " ");
}
const REM_REFLECTION_TAG_BLACKLIST = new Set([
"assistant",
"user",
"system",
"subagent",
"the"]
);
function buildDailyChunkSnippet(heading, chunkLines, chunkKind) {
  const joiner = chunkKind === "list" ? "; " : " ";
  const body = chunkLines.join(joiner).trim();
  return (heading ? `${heading}: ${body}` : body).slice(0, DAILY_INGESTION_MAX_SNIPPET_CHARS).replace(/\s+/g, " ").trim();
}
function buildDailySnippetChunks(lines, limit) {
  const chunks = [];
  let activeHeading = null;
  let chunkLines = [];
  let chunkKind = null;
  let chunkStartLine = 0;
  let chunkEndLine = 0;
  const flushChunk = () => {
    if (chunkLines.length === 0) {
      chunkKind = null;
      chunkStartLine = 0;
      chunkEndLine = 0;
      return;
    }
    const snippet = buildDailyChunkSnippet(activeHeading, chunkLines, chunkKind);
    if (snippet.length >= DAILY_INGESTION_MIN_SNIPPET_CHARS) chunks.push({
      startLine: chunkStartLine,
      endLine: chunkEndLine,
      snippet
    });
    chunkLines = [];
    chunkKind = null;
    chunkStartLine = 0;
    chunkEndLine = 0;
  };
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (typeof line !== "string") continue;
    const heading = normalizeDailyHeading(line);
    if (heading) {
      flushChunk();
      activeHeading = heading;
      continue;
    }
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("<!--")) {
      flushChunk();
      continue;
    }
    const snippet = normalizeDailySnippet(line);
    if (!snippet) {
      flushChunk();
      continue;
    }
    const nextKind = /^([-*+]\s+|\d+\.\s+)/.test(trimmed) ? "list" : "paragraph";
    const nextChunkLines = chunkLines.length === 0 ? [snippet] : [...chunkLines, snippet];
    const candidateSnippet = buildDailyChunkSnippet(activeHeading, nextChunkLines, nextKind);
    if (chunkLines.length > 0 && (chunkKind !== nextKind || chunkLines.length >= DAILY_INGESTION_MAX_CHUNK_LINES || candidateSnippet.length > DAILY_INGESTION_MAX_SNIPPET_CHARS)) flushChunk();
    if (chunkLines.length === 0) {
      chunkStartLine = index + 1;
      chunkKind = nextKind;
    }
    chunkLines.push(snippet);
    chunkEndLine = index + 1;
    if (chunks.length >= limit) break;
  }
  flushChunk();
  return chunks.slice(0, limit);
}
function findManagedDailyDreamingHeadingIndex(lines, startIndex, heading) {
  for (let index = startIndex - 1; index >= 0; index -= 1) {
    const trimmed = lines[index]?.trim() ?? "";
    if (!trimmed) continue;
    return trimmed === heading ? index : null;
  }
  return null;
}
function isManagedDailyDreamingBoundary(line, blockByStartMarker) {
  const trimmed = line.trim();
  return /^#{1,6}\s+/.test(trimmed) || blockByStartMarker.has(trimmed);
}
function stripManagedDailyDreamingLines(lines) {
  const blockByStartMarker = new Map(MANAGED_DAILY_DREAMING_BLOCKS.map((block) => [block.startMarker, block]));
  const sanitized = [...lines];
  for (let index = 0; index < sanitized.length; index += 1) {
    const block = blockByStartMarker.get(sanitized[index]?.trim() ?? "");
    if (!block) continue;
    let stripUntilIndex = -1;
    for (let cursor = index + 1; cursor < sanitized.length; cursor += 1) {
      const line = sanitized[cursor];
      if ((line?.trim() ?? "") === block.endMarker) {
        stripUntilIndex = cursor;
        break;
      }
      if (line && isManagedDailyDreamingBoundary(line, blockByStartMarker)) {
        stripUntilIndex = cursor - 1;
        break;
      }
    }
    if (stripUntilIndex < index) continue;
    const startIndex = findManagedDailyDreamingHeadingIndex(lines, index, block.heading) ?? index;
    for (let cursor = startIndex; cursor <= stripUntilIndex; cursor += 1) sanitized[cursor] = "";
    index = stripUntilIndex;
  }
  return sanitized;
}
function entryWithinLookback(entry, cutoffMs) {
  if ((entry.recallDays ?? []).some((day) => isDayWithinLookback(day, cutoffMs))) return true;
  const lastRecalledAtMs = Date.parse(entry.lastRecalledAt);
  return Number.isFinite(lastRecalledAtMs) && lastRecalledAtMs >= cutoffMs;
}
function resolveDailyIngestionStatePath(workspaceDir) {
  return _nodePath.default.join(workspaceDir, DAILY_INGESTION_STATE_RELATIVE_PATH);
}
function normalizeDailyIngestionState(raw) {
  const filesRaw = (0, _recordCoerceZvIvRO5e.n)((0, _recordCoerceZvIvRO5e.n)(raw)?.files);
  if (!filesRaw) return {
    version: 1,
    files: {}
  };
  const files = {};
  for (const [key, value] of Object.entries(filesRaw)) {
    const file = (0, _recordCoerceZvIvRO5e.n)(value);
    if (!file || typeof key !== "string" || key.trim().length === 0) continue;
    const mtimeMs = Number(file.mtimeMs);
    const size = Number(file.size);
    if (!Number.isFinite(mtimeMs) || mtimeMs < 0 || !Number.isFinite(size) || size < 0) continue;
    files[key] = {
      mtimeMs: Math.floor(mtimeMs),
      size: Math.floor(size)
    };
  }
  return {
    version: 1,
    files
  };
}
async function readDailyIngestionState(workspaceDir) {
  const statePath = resolveDailyIngestionStatePath(workspaceDir);
  try {
    const raw = await _promises.default.readFile(statePath, "utf-8");
    return normalizeDailyIngestionState(JSON.parse(raw));
  } catch (err) {
    if (err?.code === "ENOENT" || err instanceof SyntaxError) return {
      version: 1,
      files: {}
    };
    throw err;
  }
}
async function writeDailyIngestionState(workspaceDir, state) {
  const statePath = resolveDailyIngestionStatePath(workspaceDir);
  await _promises.default.mkdir(_nodePath.default.dirname(statePath), { recursive: true });
  const tmpPath = `${statePath}.${process.pid}.${Date.now()}.tmp`;
  await _promises.default.writeFile(tmpPath, `${JSON.stringify(state, null, 2)}\n`, "utf-8");
  await _promises.default.rename(tmpPath, statePath);
}
function normalizeWorkspaceKey(workspaceDir) {
  const resolved = _nodePath.default.resolve(workspaceDir).replace(/\\/g, "/");
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}
function resolveSessionIngestionStatePath(workspaceDir) {
  return _nodePath.default.join(workspaceDir, SESSION_INGESTION_STATE_RELATIVE_PATH);
}
function normalizeSessionIngestionState(raw) {
  const record = (0, _recordCoerceZvIvRO5e.n)(raw);
  const filesRaw = (0, _recordCoerceZvIvRO5e.n)(record?.files);
  const files = {};
  if (filesRaw) for (const [key, value] of Object.entries(filesRaw)) {
    const file = (0, _recordCoerceZvIvRO5e.n)(value);
    if (!file || key.trim().length === 0) continue;
    const mtimeMs = Number(file.mtimeMs);
    const size = Number(file.size);
    if (!Number.isFinite(mtimeMs) || mtimeMs < 0 || !Number.isFinite(size) || size < 0) continue;
    const lineCountRaw = Number(file.lineCount);
    const lastContentLineRaw = Number(file.lastContentLine);
    const lineCount = Number.isFinite(lineCountRaw) && lineCountRaw >= 0 ? Math.floor(lineCountRaw) : 0;
    const lastContentLine = Number.isFinite(lastContentLineRaw) && lastContentLineRaw >= 0 ? Math.floor(lastContentLineRaw) : 0;
    files[key] = {
      mtimeMs: Math.floor(mtimeMs),
      size: Math.floor(size),
      contentHash: typeof file.contentHash === "string" ? file.contentHash.trim() : "",
      lineCount,
      lastContentLine: Math.min(lineCount, lastContentLine)
    };
  }
  const seenMessagesRaw = (0, _recordCoerceZvIvRO5e.n)(record?.seenMessages);
  const seenMessages = {};
  if (seenMessagesRaw) for (const [scope, value] of Object.entries(seenMessagesRaw)) {
    if (scope.trim().length === 0 || !Array.isArray(value)) continue;
    const unique = [...new Set(value.filter((entry) => typeof entry === "string"))].map((entry) => entry.trim()).filter(Boolean).slice(-SESSION_INGESTION_MAX_TRACKED_MESSAGES_PER_SESSION);
    if (unique.length > 0) seenMessages[scope] = unique;
  }
  return {
    version: 3,
    files,
    seenMessages
  };
}
async function readSessionIngestionState(workspaceDir) {
  const statePath = resolveSessionIngestionStatePath(workspaceDir);
  try {
    const raw = await _promises.default.readFile(statePath, "utf-8");
    return normalizeSessionIngestionState(JSON.parse(raw));
  } catch (err) {
    if (err?.code === "ENOENT" || err instanceof SyntaxError) return {
      version: 3,
      files: {},
      seenMessages: {}
    };
    throw err;
  }
}
async function writeSessionIngestionState(workspaceDir, state) {
  const statePath = resolveSessionIngestionStatePath(workspaceDir);
  await _promises.default.mkdir(_nodePath.default.dirname(statePath), { recursive: true });
  const tmpPath = `${statePath}.${process.pid}.${Date.now()}.tmp`;
  await _promises.default.writeFile(tmpPath, `${JSON.stringify(state, null, 2)}\n`, "utf-8");
  await _promises.default.rename(tmpPath, statePath);
}
function trimTrackedSessionScopes(seenMessages) {
  const keys = Object.keys(seenMessages);
  if (keys.length <= SESSION_INGESTION_MAX_TRACKED_SCOPES) return seenMessages;
  const keep = new Set(keys.toSorted().slice(-SESSION_INGESTION_MAX_TRACKED_SCOPES));
  const next = {};
  for (const [scope, hashes] of Object.entries(seenMessages)) if (keep.has(scope)) next[scope] = hashes;
  return next;
}
function normalizeSessionCorpusSnippet(value) {
  return value.replace(/\s+/g, " ").trim().slice(0, SESSION_INGESTION_MAX_SNIPPET_CHARS);
}
function hashSessionMessageId(value) {
  return (0, _nodeCrypto.createHash)("sha1").update(value).digest("hex");
}
function buildSessionScopeKey(agentId, absolutePath) {
  const fileName = _nodePath.default.basename(absolutePath);
  return `${agentId}:${(0, _artifactsC4Ry7YwM.d)(fileName) ?? fileName}`;
}
function mergeTrackedMessageHashes(existing, additions) {
  if (additions.length === 0) return existing;
  const seen = new Set(existing);
  const next = existing.slice();
  for (const hash of additions) if (!seen.has(hash)) {
    seen.add(hash);
    next.push(hash);
  }
  if (next.length <= SESSION_INGESTION_MAX_TRACKED_MESSAGES_PER_SESSION) return next;
  return next.slice(-SESSION_INGESTION_MAX_TRACKED_MESSAGES_PER_SESSION);
}
function areStringArraysEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let index = 0; index < a.length; index += 1) if (a[index] !== b[index]) return false;
  return true;
}
function buildSessionStateKey(agentId, absolutePath) {
  return `${agentId}:${(0, _engineQmdBLLUNP_T.p)(absolutePath)}`;
}
function isCheckpointSessionTranscriptPath(absolutePath) {
  return SESSION_CHECKPOINT_TRANSCRIPT_FILENAME_RE.test(_nodePath.default.basename(absolutePath));
}
function buildSessionRenderedLine(params) {
  return `[${`${params.agentId}/${params.sessionPath}#L${params.lineNumber}`}] ${params.snippet}`.slice(0, SESSION_INGESTION_MAX_SNIPPET_CHARS + 64);
}
function resolveSessionAgentsForWorkspace(cfg, workspaceDir) {
  if (!cfg) return [];
  const target = normalizeWorkspaceKey(workspaceDir);
  const match = (0, _dreamingCUzWMDhQ.J)(cfg).find((entry) => normalizeWorkspaceKey(entry.workspaceDir) === target);
  if (!match) return [];
  return match.agentIds.filter((agentId, index, all) => agentId.trim().length > 0 && all.indexOf(agentId) === index).toSorted();
}
async function appendSessionCorpusLines(params) {
  if (params.lines.length === 0) return [];
  const relativePath = _nodePath.default.posix.join("memory", ".dreams", "session-corpus", `${params.day}.txt`);
  const absolutePath = _nodePath.default.join(params.workspaceDir, SESSION_CORPUS_RELATIVE_DIR, `${params.day}.txt`);
  await _promises.default.mkdir(_nodePath.default.dirname(absolutePath), { recursive: true });
  let existing = "";
  try {
    existing = await _promises.default.readFile(absolutePath, "utf-8");
  } catch (err) {
    if (err?.code !== "ENOENT") throw err;
  }
  const normalizedExisting = existing.replace(/\r\n/g, "\n");
  const existingLineCount = normalizedExisting.length === 0 ? 0 : normalizedExisting.endsWith("\n") ? normalizedExisting.slice(0, -1).split("\n").length : normalizedExisting.split("\n").length;
  const payload = `${params.lines.map((entry) => entry.rendered).join("\n")}\n`;
  await _promises.default.appendFile(absolutePath, payload, "utf-8");
  return params.lines.map((entry, index) => {
    const lineNumber = existingLineCount + index + 1;
    return {
      path: relativePath,
      startLine: lineNumber,
      endLine: lineNumber,
      score: SESSION_INGESTION_SCORE,
      snippet: entry.snippet,
      source: "memory"
    };
  });
}
async function collectSessionIngestionBatches(params) {
  if (!params.cfg) return {
    batches: [],
    nextState: {
      version: 3,
      files: {},
      seenMessages: {}
    },
    changed: Object.keys(params.state.files).length > 0 || Object.keys(params.state.seenMessages).length > 0
  };
  const agentIds = resolveSessionAgentsForWorkspace(params.cfg, params.workspaceDir);
  const cutoffMs = calculateLookbackCutoffMs(params.nowMs, params.lookbackDays);
  const batchByDay = /* @__PURE__ */new Map();
  const nextFiles = {};
  const nextSeenMessages = { ...params.state.seenMessages };
  let changed = false;
  const sessionFiles = [];
  for (const agentId of agentIds) {
    const files = await (0, _engineQmdBLLUNP_T.l)(agentId);
    const transcriptClassification = files.length > 0 ? (0, _engineQmdBLLUNP_T.d)(agentId) : {
      dreamingNarrativeTranscriptPaths: /* @__PURE__ */new Set(),
      cronRunTranscriptPaths: /* @__PURE__ */new Set()
    };
    for (const absolutePath of files) {
      if (isCheckpointSessionTranscriptPath(absolutePath)) continue;
      const normalizedPath = (0, _engineQmdBLLUNP_T.f)(absolutePath);
      sessionFiles.push({
        agentId,
        absolutePath,
        generatedByDreamingNarrative: transcriptClassification.dreamingNarrativeTranscriptPaths.has(normalizedPath),
        generatedByCronRun: transcriptClassification.cronRunTranscriptPaths.has(normalizedPath),
        sessionPath: (0, _engineQmdBLLUNP_T.p)(absolutePath)
      });
    }
  }
  const sortedFiles = sessionFiles.toSorted((a, b) => {
    if (a.agentId !== b.agentId) return a.agentId.localeCompare(b.agentId);
    return a.sessionPath.localeCompare(b.sessionPath);
  });
  const totalCap = SESSION_INGESTION_MAX_MESSAGES_PER_SWEEP;
  let remaining = totalCap;
  const perFileCap = Math.min(SESSION_INGESTION_MAX_MESSAGES_PER_FILE, Math.max(SESSION_INGESTION_MIN_MESSAGES_PER_FILE, Math.ceil(totalCap / Math.max(1, sortedFiles.length))));
  for (const file of sortedFiles) {
    if (remaining <= 0) break;
    const stateKey = buildSessionStateKey(file.agentId, file.absolutePath);
    const previous = params.state.files[stateKey];
    const stat = await _promises.default.stat(file.absolutePath).catch((err) => {
      if (err?.code === "ENOENT") return null;
      throw err;
    });
    if (!stat) {
      if (previous) changed = true;
      continue;
    }
    const fingerprint = {
      mtimeMs: Math.floor(Math.max(0, stat.mtimeMs)),
      size: Math.floor(Math.max(0, stat.size))
    };
    const cursorAtEnd = previous !== void 0 && previous.lastContentLine >= previous.lineCount;
    if (Boolean(previous) && previous.mtimeMs === fingerprint.mtimeMs && previous.size === fingerprint.size && previous.contentHash.length > 0 && cursorAtEnd) {
      nextFiles[stateKey] = previous;
      continue;
    }
    const entry = await (0, _engineQmdBLLUNP_T.c)(file.absolutePath, {
      generatedByDreamingNarrative: file.generatedByDreamingNarrative,
      generatedByCronRun: file.generatedByCronRun
    });
    if (!entry) continue;
    if (entry.generatedByDreamingNarrative || entry.generatedByCronRun) {
      nextFiles[stateKey] = {
        mtimeMs: fingerprint.mtimeMs,
        size: fingerprint.size,
        contentHash: entry.hash.trim(),
        lineCount: entry.lineMap.length,
        lastContentLine: entry.lineMap.length
      };
      if (!previous || previous.mtimeMs !== fingerprint.mtimeMs || previous.size !== fingerprint.size || previous.contentHash !== entry.hash.trim() || previous.lineCount !== entry.lineMap.length || previous.lastContentLine !== entry.lineMap.length) changed = true;
      continue;
    }
    const contentHash = entry.hash.trim();
    if (previous && previous.mtimeMs === fingerprint.mtimeMs && previous.size === fingerprint.size && previous.contentHash === contentHash && previous.lineCount === entry.lineMap.length && previous.lastContentLine >= previous.lineCount) {
      nextFiles[stateKey] = previous;
      continue;
    }
    const sessionScope = buildSessionScopeKey(file.agentId, file.absolutePath);
    const previousSeen = nextSeenMessages[sessionScope] ?? [];
    let seenSet = new Set(previousSeen);
    const newSeenHashes = [];
    const lines = entry.content.length > 0 ? entry.content.split("\n") : [];
    const lineCount = lines.length;
    let cursor = previous && previous.mtimeMs === fingerprint.mtimeMs && previous.size === fingerprint.size && previous.contentHash === contentHash && previous.lineCount === lineCount ? Math.max(0, Math.min(previous.lastContentLine, lineCount)) : 0;
    const fileCap = Math.max(1, Math.min(perFileCap, remaining));
    let fileCount = 0;
    let lastScannedContentLine = cursor;
    for (let index = cursor; index < lines.length; index += 1) {
      if (fileCount >= fileCap || remaining <= 0) break;
      lastScannedContentLine = index + 1;
      const snippet = normalizeSessionCorpusSnippet(lines[index] ?? "");
      if (snippet.length < SESSION_INGESTION_MIN_SNIPPET_CHARS) continue;
      const lineNumber = entry.lineMap[index] ?? index + 1;
      const messageTimestampMs = entry.messageTimestampsMs[index] ?? 0;
      const day = (0, _dreamingCUzWMDhQ.V)(messageTimestampMs > 0 ? messageTimestampMs : fingerprint.mtimeMs, params.timezone);
      if (!isDayWithinLookback(day, cutoffMs)) continue;
      const messageHash = hashSessionMessageId(`${sessionScope}\n${messageTimestampMs > 0 ? `ts:${Math.floor(messageTimestampMs)}` : `line:${lineNumber}`}\n${snippet}`);
      if (seenSet.has(messageHash)) continue;
      const rendered = buildSessionRenderedLine({
        agentId: file.agentId,
        sessionPath: file.sessionPath,
        lineNumber,
        snippet
      });
      const bucket = batchByDay.get(day) ?? [];
      bucket.push({
        day,
        snippet,
        rendered
      });
      batchByDay.set(day, bucket);
      seenSet.add(messageHash);
      newSeenHashes.push(messageHash);
      fileCount += 1;
      remaining -= 1;
    }
    if (lastScannedContentLine < cursor) lastScannedContentLine = cursor;
    cursor = Math.max(0, Math.min(lastScannedContentLine, lineCount));
    nextFiles[stateKey] = {
      mtimeMs: fingerprint.mtimeMs,
      size: fingerprint.size,
      contentHash,
      lineCount,
      lastContentLine: cursor
    };
    const mergedSeen = mergeTrackedMessageHashes(previousSeen, newSeenHashes);
    nextSeenMessages[sessionScope] = mergedSeen;
    if (!areStringArraysEqual(mergedSeen, previousSeen)) changed = true;
    if (!previous || previous.mtimeMs !== fingerprint.mtimeMs || previous.size !== fingerprint.size || previous.contentHash !== contentHash || previous.lineCount !== lineCount || previous.lastContentLine !== cursor) changed = true;
  }
  for (const [key, state] of Object.entries(params.state.files)) {
    if (!Object.hasOwn(nextFiles, key)) {
      changed = true;
      continue;
    }
    const next = nextFiles[key];
    if (!next || next.mtimeMs !== state.mtimeMs || next.size !== state.size) changed = true;
    if (next && typeof state.contentHash === "string" && state.contentHash.trim().length > 0 && next.contentHash !== state.contentHash) changed = true;
    if (!next || next.lineCount !== state.lineCount || next.lastContentLine !== state.lastContentLine) changed = true;
  }
  const trimmedSeenMessages = trimTrackedSessionScopes(nextSeenMessages);
  for (const [scope, hashes] of Object.entries(trimmedSeenMessages)) if (!areStringArraysEqual(params.state.seenMessages[scope] ?? [], hashes)) changed = true;
  for (const scope of Object.keys(params.state.seenMessages)) if (!Object.hasOwn(trimmedSeenMessages, scope)) changed = true;
  const batches = [];
  for (const day of [...batchByDay.keys()].toSorted()) {
    const lines = batchByDay.get(day) ?? [];
    if (lines.length === 0) continue;
    const results = await appendSessionCorpusLines({
      workspaceDir: params.workspaceDir,
      day,
      lines
    });
    if (results.length > 0) batches.push({
      day,
      results
    });
  }
  return {
    batches,
    nextState: {
      version: 3,
      files: nextFiles,
      seenMessages: trimmedSeenMessages
    },
    changed
  };
}
async function ingestSessionTranscriptSignals(params) {
  const state = await readSessionIngestionState(params.workspaceDir);
  const collected = await collectSessionIngestionBatches({
    workspaceDir: params.workspaceDir,
    cfg: params.cfg,
    lookbackDays: params.lookbackDays,
    nowMs: params.nowMs,
    timezone: params.timezone,
    state
  });
  const ingestionDayBucket = (0, _dreamingCUzWMDhQ.V)(params.nowMs, params.timezone);
  for (const batch of collected.batches) await (0, _shortTermPromotionBU_sr5Sj.l)({
    workspaceDir: params.workspaceDir,
    query: `__dreaming_sessions__:${batch.day}`,
    results: batch.results,
    signalType: "daily",
    dedupeByQueryPerDay: true,
    dayBucket: ingestionDayBucket,
    nowMs: params.nowMs,
    timezone: params.timezone
  });
  if (collected.changed) await writeSessionIngestionState(params.workspaceDir, collected.nextState);
}
async function collectDailyIngestionBatches(params) {
  const memoryDir = _nodePath.default.join(params.workspaceDir, "memory");
  const cutoffMs = calculateLookbackCutoffMs(params.nowMs, params.lookbackDays);
  const files = (await _promises.default.readdir(memoryDir, { withFileTypes: true }).catch((err) => {
    if (err?.code === "ENOENT") return [];
    throw err;
  })).filter((entry) => entry.isFile()).map((entry) => {
    const match = entry.name.match(DAILY_MEMORY_FILENAME_RE);
    if (!match) return null;
    const day = match[1];
    if (!isDayWithinLookback(day, cutoffMs)) return null;
    return {
      fileName: entry.name,
      day
    };
  }).filter((entry) => entry !== null).toSorted((a, b) => b.day.localeCompare(a.day));
  const batches = [];
  const nextFiles = {};
  let changed = false;
  const totalCap = Math.max(20, params.limit * 4);
  const perFileCap = Math.max(6, Math.ceil(totalCap / Math.max(1, Math.max(files.length, 1))));
  let total = 0;
  for (const file of files) {
    const relativePath = `memory/${file.fileName}`;
    const filePath = _nodePath.default.join(memoryDir, file.fileName);
    const stat = await _promises.default.stat(filePath).catch((err) => {
      if (err?.code === "ENOENT") return null;
      throw err;
    });
    if (!stat) continue;
    const fingerprint = {
      mtimeMs: Math.floor(Math.max(0, stat.mtimeMs)),
      size: Math.floor(Math.max(0, stat.size))
    };
    nextFiles[relativePath] = fingerprint;
    const previous = params.state.files[relativePath];
    if (!(previous !== void 0 && previous.mtimeMs === fingerprint.mtimeMs && previous.size === fingerprint.size)) changed = true;else
    continue;
    const raw = await _promises.default.readFile(filePath, "utf-8").catch((err) => {
      if (err?.code === "ENOENT") return "";
      throw err;
    });
    if (!raw) continue;
    const chunks = buildDailySnippetChunks(stripManagedDailyDreamingLines(raw.split(/\r?\n/)), perFileCap);
    const results = [];
    for (const chunk of chunks) {
      results.push({
        path: relativePath,
        startLine: chunk.startLine,
        endLine: chunk.endLine,
        score: DAILY_INGESTION_SCORE,
        snippet: chunk.snippet,
        source: "memory"
      });
      if (results.length >= perFileCap || total + results.length >= totalCap) break;
    }
    if (results.length === 0) continue;
    batches.push({
      day: file.day,
      results
    });
    total += results.length;
    if (total >= totalCap) break;
  }
  if (!changed) {
    const previousKeys = Object.keys(params.state.files);
    const nextKeys = Object.keys(nextFiles);
    if (previousKeys.length !== nextKeys.length || previousKeys.some((key) => !Object.hasOwn(nextFiles, key))) changed = true;
  }
  return {
    batches,
    nextState: {
      version: 1,
      files: nextFiles
    },
    changed
  };
}
async function ingestDailyMemorySignals(params) {
  const state = await readDailyIngestionState(params.workspaceDir);
  const collected = await collectDailyIngestionBatches({
    workspaceDir: params.workspaceDir,
    lookbackDays: params.lookbackDays,
    limit: params.limit,
    nowMs: params.nowMs,
    state
  });
  const ingestionDayBucket = (0, _dreamingCUzWMDhQ.V)(params.nowMs, params.timezone);
  for (const batch of collected.batches) await (0, _shortTermPromotionBU_sr5Sj.l)({
    workspaceDir: params.workspaceDir,
    query: `__dreaming_daily__:${batch.day}`,
    results: batch.results,
    signalType: "daily",
    dedupeByQueryPerDay: true,
    dayBucket: ingestionDayBucket,
    nowMs: params.nowMs,
    timezone: params.timezone
  });
  if (collected.changed) await writeDailyIngestionState(params.workspaceDir, collected.nextState);
}
async function seedHistoricalDailyMemorySignals(params) {
  const normalizedPaths = [...new Set(params.filePaths.map((entry) => entry.trim()).filter(Boolean))];
  if (normalizedPaths.length === 0) return {
    importedFileCount: 0,
    importedSignalCount: 0,
    skippedPaths: []
  };
  const resolved = normalizedPaths.map((filePath) => {
    const match = _nodePath.default.basename(filePath).match(DAILY_MEMORY_FILENAME_RE);
    if (!match) return {
      filePath,
      day: null
    };
    return {
      filePath,
      day: match[1] ?? null
    };
  }).toSorted((a, b) => {
    if (a.day && b.day) return b.day.localeCompare(a.day);
    if (a.day) return -1;
    if (b.day) return 1;
    return a.filePath.localeCompare(b.filePath);
  });
  const valid = resolved.filter((entry) => Boolean(entry.day));
  const skippedPaths = resolved.filter((entry) => !entry.day).map((entry) => entry.filePath);
  const totalCap = Math.max(20, params.limit * 4);
  const perFileCap = Math.max(6, Math.ceil(totalCap / Math.max(1, valid.length)));
  let importedSignalCount = 0;
  let importedFileCount = 0;
  for (const entry of valid) {
    if (importedSignalCount >= totalCap) break;
    const raw = await _promises.default.readFile(entry.filePath, "utf-8").catch((err) => {
      if (err?.code === "ENOENT") {
        skippedPaths.push(entry.filePath);
        return "";
      }
      throw err;
    });
    if (!raw) continue;
    const chunks = buildDailySnippetChunks(stripManagedDailyDreamingLines(raw.split(/\r?\n/)), perFileCap);
    const results = [];
    for (const chunk of chunks) {
      results.push({
        path: `memory/${entry.day}.md`,
        startLine: chunk.startLine,
        endLine: chunk.endLine,
        score: DAILY_INGESTION_SCORE,
        snippet: chunk.snippet,
        source: "memory"
      });
      if (results.length >= perFileCap || importedSignalCount + results.length >= totalCap) break;
    }
    if (results.length === 0) continue;
    await (0, _shortTermPromotionBU_sr5Sj.l)({
      workspaceDir: params.workspaceDir,
      query: `__dreaming_daily__:${entry.day}`,
      results,
      signalType: "daily",
      dedupeByQueryPerDay: true,
      dayBucket: (0, _dreamingCUzWMDhQ.V)(params.nowMs, params.timezone),
      nowMs: params.nowMs,
      timezone: params.timezone
    });
    importedSignalCount += results.length;
    importedFileCount += 1;
  }
  return {
    importedFileCount,
    importedSignalCount,
    skippedPaths
  };
}
function entryAverageScore(entry) {
  const signalCount = Math.max(0, Math.floor(entry.recallCount ?? 0) + Math.floor(entry.dailyCount ?? 0) + Math.floor(entry.groundedCount ?? 0));
  return signalCount > 0 ? Math.max(0, Math.min(1, entry.totalScore / signalCount)) : 0;
}
function tokenizeSnippet(snippet) {
  return new Set(snippet.toLowerCase().split(/[^a-z0-9]+/i).map((token) => token.trim()).filter(Boolean));
}
function jaccardSimilarity(left, right) {
  const leftTokens = tokenizeSnippet(left);
  const rightTokens = tokenizeSnippet(right);
  if (leftTokens.size === 0 || rightTokens.size === 0) return left.trim().toLowerCase() === right.trim().toLowerCase() ? 1 : 0;
  let intersection = 0;
  for (const token of leftTokens) if (rightTokens.has(token)) intersection += 1;
  const union = new Set([...leftTokens, ...rightTokens]).size;
  return union > 0 ? intersection / union : 0;
}
function dedupeEntries(entries, threshold) {
  const deduped = [];
  for (const entry of entries) {
    const duplicate = deduped.find((candidate) => candidate.path === entry.path && jaccardSimilarity(candidate.snippet, entry.snippet) >= threshold);
    if (duplicate) {
      if (entry.recallCount > duplicate.recallCount) duplicate.recallCount = entry.recallCount;
      duplicate.totalScore = Math.max(duplicate.totalScore, entry.totalScore);
      duplicate.maxScore = Math.max(duplicate.maxScore, entry.maxScore);
      duplicate.queryHashes = [...new Set([...duplicate.queryHashes, ...entry.queryHashes])];
      duplicate.recallDays = [...new Set([...duplicate.recallDays, ...entry.recallDays])].toSorted();
      duplicate.conceptTags = [...new Set([...duplicate.conceptTags, ...entry.conceptTags])];
      duplicate.lastRecalledAt = Date.parse(entry.lastRecalledAt) > Date.parse(duplicate.lastRecalledAt) ? entry.lastRecalledAt : duplicate.lastRecalledAt;
      continue;
    }
    deduped.push({ ...entry });
  }
  return deduped;
}
function buildLightDreamingBody(entries) {
  if (entries.length === 0) return ["- No notable updates."];
  const lines = [];
  for (const entry of entries) {
    const snippet = entry.snippet || "(no snippet captured)";
    lines.push(`- Candidate: ${snippet}`);
    lines.push(`  - confidence: ${entryAverageScore(entry).toFixed(2)}`);
    lines.push(`  - evidence: ${entry.path}:${entry.startLine}-${entry.endLine}`);
    lines.push(`  - recalls: ${entry.recallCount}`);
    lines.push(`  - status: staged`);
  }
  return lines;
}
function calculateCandidateTruthConfidence(entry) {
  const recallStrength = Math.min(1, Math.log1p(entry.recallCount) / Math.log1p(6));
  const averageScore = entryAverageScore(entry);
  const consolidation = Math.min(1, (entry.recallDays?.length ?? 0) / 3);
  const conceptual = Math.min(1, (entry.conceptTags?.length ?? 0) / 6);
  return Math.max(0, Math.min(1, averageScore * .45 + recallStrength * .25 + consolidation * .2 + conceptual * .1));
}
function selectRemCandidateTruths(entries, limit) {
  if (limit <= 0) return [];
  return dedupeEntries(entries.filter((entry) => !entry.promotedAt), .88).map((entry) => ({
    key: entry.key,
    snippet: entry.snippet || "(no snippet captured)",
    confidence: calculateCandidateTruthConfidence(entry),
    evidence: `${entry.path}:${entry.startLine}-${entry.endLine}`
  })).filter((entry) => entry.confidence >= .45).toSorted((a, b) => b.confidence - a.confidence || a.snippet.localeCompare(b.snippet)).slice(0, limit);
}
function buildRemReflections(entries, limit, minPatternStrength) {
  const tagStats = /* @__PURE__ */new Map();
  for (const entry of entries) for (const tag of entry.conceptTags) {
    if (!tag || REM_REFLECTION_TAG_BLACKLIST.has(tag.toLowerCase())) continue;
    const stat = tagStats.get(tag) ?? {
      count: 0,
      evidence: /* @__PURE__ */new Set()
    };
    stat.count += 1;
    stat.evidence.add(`${entry.path}:${entry.startLine}-${entry.endLine}`);
    tagStats.set(tag, stat);
  }
  const ranked = [...tagStats.entries()].map(([tag, stat]) => {
    return {
      tag,
      strength: Math.min(1, stat.count / Math.max(1, entries.length) * 2),
      stat
    };
  }).filter((entry) => entry.strength >= minPatternStrength).toSorted((a, b) => b.strength - a.strength || b.stat.count - a.stat.count || a.tag.localeCompare(b.tag)).slice(0, limit);
  if (ranked.length === 0) return ["- No strong patterns surfaced."];
  const lines = [];
  for (const entry of ranked) {
    lines.push(`- Theme: \`${entry.tag}\` kept surfacing across ${entry.stat.count} memories.`);
    lines.push(`  - confidence: ${entry.strength.toFixed(2)}`);
    lines.push(`  - evidence: ${[...entry.stat.evidence].slice(0, 3).join(", ")}`);
    lines.push(`  - note: reflection`);
  }
  return lines;
}
function previewRemDreaming(params) {
  const reflections = buildRemReflections(params.entries, params.limit, params.minPatternStrength);
  const candidateSelections = selectRemCandidateTruths(params.entries, Math.max(1, Math.min(3, params.limit)));
  const candidateTruths = candidateSelections.map((entry) => ({
    snippet: entry.snippet,
    confidence: entry.confidence,
    evidence: entry.evidence
  }));
  const candidateKeys = [...new Set(candidateSelections.map((entry) => entry.key))];
  const bodyLines = [
  "### Reflections",
  ...reflections,
  "",
  "### Possible Lasting Truths",
  ...(candidateTruths.length > 0 ? candidateTruths.map((entry) => `- ${entry.snippet} [confidence=${entry.confidence.toFixed(2)} evidence=${entry.evidence}]`) : ["- No strong candidate truths surfaced."])];

  return {
    sourceEntryCount: params.entries.length,
    reflections,
    candidateTruths,
    candidateKeys,
    bodyLines
  };
}
async function runLightDreaming(params) {
  const nowMs = Number.isFinite(params.nowMs) ? params.nowMs : Date.now();
  const cutoffMs = calculateLookbackCutoffMs(nowMs, params.config.lookbackDays);
  await ingestDailyMemorySignals({
    workspaceDir: params.workspaceDir,
    lookbackDays: params.config.lookbackDays,
    limit: params.config.limit,
    nowMs,
    timezone: params.config.timezone
  });
  await ingestSessionTranscriptSignals({
    workspaceDir: params.workspaceDir,
    cfg: params.cfg,
    lookbackDays: params.config.lookbackDays,
    nowMs,
    timezone: params.config.timezone
  });
  const entries = dedupeEntries((await (0, _shortTermPromotionBU_sr5Sj.i)({
    workspaceDir: params.workspaceDir,
    entries: (await (0, _shortTermPromotionBU_sr5Sj.o)({
      workspaceDir: params.workspaceDir,
      nowMs
    })).filter((entry) => entryWithinLookback(entry, cutoffMs))
  })).toSorted((a, b) => {
    const byTime = Date.parse(b.lastRecalledAt) - Date.parse(a.lastRecalledAt);
    if (byTime !== 0) return byTime;
    return b.recallCount - a.recallCount;
  }).slice(0, params.config.limit), params.config.dedupeSimilarity);
  const capped = entries.slice(0, params.config.limit);
  const bodyLines = buildLightDreamingBody(capped);
  await writeDailyDreamingPhaseBlock({
    workspaceDir: params.workspaceDir,
    phase: "light",
    bodyLines,
    nowMs,
    timezone: params.config.timezone,
    storage: params.config.storage
  });
  await (0, _shortTermPromotionBU_sr5Sj.s)({
    workspaceDir: params.workspaceDir,
    phase: "light",
    keys: capped.map((entry) => entry.key),
    nowMs
  });
  if (params.config.enabled && entries.length > 0 && params.config.storage.mode !== "separate") params.logger.info(`memory-core: light dreaming staged ${Math.min(entries.length, params.config.limit)} candidate(s) [workspace=${params.workspaceDir}].`);
  if (params.subagent && capped.length > 0) {
    const themes = [...new Set(capped.flatMap((e) => e.conceptTags).filter(Boolean))];
    const data = {
      phase: "light",
      snippets: capped.map((e) => e.snippet).filter(Boolean),
      ...(themes.length > 0 ? { themes } : {})
    };
    if (params.detachNarratives) (0, _dreamingNarrativeCtUXKufb.i)({
      subagent: params.subagent,
      workspaceDir: params.workspaceDir,
      data,
      nowMs,
      timezone: params.config.timezone,
      model: params.config.execution?.model,
      logger: params.logger
    });else
    await (0, _dreamingNarrativeCtUXKufb.n)({
      subagent: params.subagent,
      workspaceDir: params.workspaceDir,
      data,
      nowMs,
      timezone: params.config.timezone,
      model: params.config.execution?.model,
      logger: params.logger
    });
  }
}
async function runRemDreaming(params) {
  const nowMs = Number.isFinite(params.nowMs) ? params.nowMs : Date.now();
  const cutoffMs = calculateLookbackCutoffMs(nowMs, params.config.lookbackDays);
  await ingestDailyMemorySignals({
    workspaceDir: params.workspaceDir,
    lookbackDays: params.config.lookbackDays,
    limit: params.config.limit,
    nowMs,
    timezone: params.config.timezone
  });
  await ingestSessionTranscriptSignals({
    workspaceDir: params.workspaceDir,
    cfg: params.cfg,
    lookbackDays: params.config.lookbackDays,
    nowMs,
    timezone: params.config.timezone
  });
  const entries = await (0, _shortTermPromotionBU_sr5Sj.i)({
    workspaceDir: params.workspaceDir,
    entries: (await (0, _shortTermPromotionBU_sr5Sj.o)({
      workspaceDir: params.workspaceDir,
      nowMs
    })).filter((entry) => entryWithinLookback(entry, cutoffMs))
  });
  const preview = previewRemDreaming({
    entries,
    limit: params.config.limit,
    minPatternStrength: params.config.minPatternStrength
  });
  await writeDailyDreamingPhaseBlock({
    workspaceDir: params.workspaceDir,
    phase: "rem",
    bodyLines: preview.bodyLines,
    nowMs,
    timezone: params.config.timezone,
    storage: params.config.storage
  });
  await (0, _shortTermPromotionBU_sr5Sj.s)({
    workspaceDir: params.workspaceDir,
    phase: "rem",
    keys: preview.candidateKeys,
    nowMs
  });
  if (params.config.enabled && entries.length > 0 && params.config.storage.mode !== "separate") params.logger.info(`memory-core: REM dreaming wrote reflections from ${entries.length} recent memory trace(s) [workspace=${params.workspaceDir}].`);
  if (params.subagent && entries.length > 0) {
    const snippets = preview.candidateTruths.map((t) => t.snippet).filter(Boolean);
    const themes = preview.reflections.filter((r) => !r.startsWith("- No strong") && !r.startsWith("  -"));
    const data = {
      phase: "rem",
      snippets: snippets.length > 0 ? snippets : entries.slice(0, 8).map((e) => e.snippet).filter(Boolean),
      ...(themes.length > 0 ? { themes } : {})
    };
    if (params.detachNarratives) (0, _dreamingNarrativeCtUXKufb.i)({
      subagent: params.subagent,
      workspaceDir: params.workspaceDir,
      data,
      nowMs,
      timezone: params.config.timezone,
      model: params.config.execution?.model,
      logger: params.logger
    });else
    await (0, _dreamingNarrativeCtUXKufb.n)({
      subagent: params.subagent,
      workspaceDir: params.workspaceDir,
      data,
      nowMs,
      timezone: params.config.timezone,
      model: params.config.execution?.model,
      logger: params.logger
    });
  }
}
async function runDreamingSweepPhases(params) {
  const sweepNowMs = Number.isFinite(params.nowMs) ? params.nowMs : Date.now();
  const light = (0, _dreamingCUzWMDhQ.Y)({
    pluginConfig: params.pluginConfig,
    cfg: params.cfg
  });
  if (light.enabled && light.limit > 0) await runLightDreaming({
    workspaceDir: params.workspaceDir,
    cfg: params.cfg,
    config: light,
    logger: params.logger,
    subagent: params.subagent,
    nowMs: sweepNowMs,
    detachNarratives: params.detachNarratives
  });
  const rem = (0, _dreamingCUzWMDhQ.X)({
    pluginConfig: params.pluginConfig,
    cfg: params.cfg
  });
  if (rem.enabled && rem.limit > 0) await runRemDreaming({
    workspaceDir: params.workspaceDir,
    cfg: params.cfg,
    config: rem,
    logger: params.logger,
    subagent: params.subagent,
    nowMs: sweepNowMs,
    detachNarratives: params.detachNarratives
  });
}
//#endregion
//#region extensions/memory-core/src/dreaming.ts
const RUNTIME_CRON_RECONCILE_INTERVAL_MS = 6e4;
const HEARTBEAT_ISOLATED_SESSION_SUFFIX = ":heartbeat";
function formatRepairSummary(repair) {
  const actions = [];
  if (repair.rewroteStore) actions.push(`rewrote recall store${repair.removedInvalidEntries > 0 ? ` (-${repair.removedInvalidEntries} invalid)` : ""}`);
  if (repair.removedStaleLock) actions.push("removed stale promotion lock");
  return actions.join(", ");
}
function resolveManagedCronDescription(config) {
  const recencyHalfLifeDays = config.recencyHalfLifeDays ?? 14;
  return `${_dreamingCUzWMDhQ.z} Promote weighted short-term recalls into MEMORY.md (limit=${config.limit}, minScore=${config.minScore.toFixed(3)}, minRecallCount=${config.minRecallCount}, minUniqueQueries=${config.minUniqueQueries}, recencyHalfLifeDays=${recencyHalfLifeDays}, maxAgeDays=${config.maxAgeDays ?? "none"}).`;
}
function buildManagedDreamingCronJob(config) {
  return {
    name: _dreamingCUzWMDhQ.R,
    description: resolveManagedCronDescription(config),
    enabled: true,
    schedule: {
      kind: "cron",
      expr: config.cron,
      ...(config.timezone ? { tz: config.timezone } : {})
    },
    sessionTarget: "isolated",
    wakeMode: "now",
    payload: {
      kind: "agentTurn",
      message: _dreamingCUzWMDhQ.B,
      lightContext: true
    },
    delivery: { mode: "none" }
  };
}
function resolveManagedDreamingPayloadToken(payload) {
  const payloadKind = (0, _stringCoerceBje8XVt.a)((0, _dreamingSharedBKklH94W.n)(payload?.kind));
  if (payloadKind === "systemevent") return (0, _dreamingSharedBKklH94W.n)(payload?.text);
  if (payloadKind === "agentturn") return (0, _dreamingSharedBKklH94W.n)(payload?.message);
}
function isManagedDreamingJob(job) {
  if ((0, _dreamingSharedBKklH94W.n)(job.description)?.includes("[managed-by=memory-core.short-term-promotion]")) return true;
  const name = (0, _dreamingSharedBKklH94W.n)(job.name);
  const payloadToken = resolveManagedDreamingPayloadToken(job.payload);
  return name === "Memory Dreaming Promotion" && payloadToken === "__openclaw_memory_core_short_term_promotion_dream__";
}
function isLegacyPhaseDreamingJob(job) {
  const description = (0, _dreamingSharedBKklH94W.n)(job.description);
  if (description?.includes("[managed-by=memory-core.dreaming.light]") || description?.includes("[managed-by=memory-core.dreaming.rem]")) return true;
  const name = (0, _dreamingSharedBKklH94W.n)(job.name);
  const payloadText = (0, _dreamingSharedBKklH94W.n)(job.payload?.text);
  if (name === "Memory Light Dreaming" && payloadText === "__openclaw_memory_core_light_sleep__") return true;
  return name === "Memory REM Dreaming" && payloadText === "__openclaw_memory_core_rem_sleep__";
}
function compareOptionalStrings(a, b) {
  return a === b;
}
async function migrateLegacyPhaseDreamingCronJobs(params) {
  let migrated = 0;
  for (const job of params.legacyJobs) try {
    if ((await params.cron.remove(job.id)).removed === true) migrated += 1;
  } catch (err) {
    params.logger.warn(`memory-core: failed to migrate legacy phase dreaming cron job ${job.id}: ${(0, _errorsG8SYDTCe.i)(err)}`);
  }
  if (migrated > 0) if (params.mode === "enabled") params.logger.info(`memory-core: migrated ${migrated} legacy phase dreaming cron job(s) to the unified dreaming controller.`);else
  params.logger.info(`memory-core: completed legacy phase dreaming cron migration while unified dreaming is disabled (${migrated} job(s) removed).`);
  return migrated;
}
function buildManagedDreamingPatch(job, desired) {
  const patch = {};
  if (!compareOptionalStrings((0, _dreamingSharedBKklH94W.n)(job.name), desired.name)) patch.name = desired.name;
  if (!compareOptionalStrings((0, _dreamingSharedBKklH94W.n)(job.description), desired.description)) patch.description = desired.description;
  if (job.enabled !== true) patch.enabled = true;
  const scheduleKind = (0, _stringCoerceBje8XVt.a)((0, _dreamingSharedBKklH94W.n)(job.schedule?.kind));
  const scheduleExpr = (0, _dreamingSharedBKklH94W.n)(job.schedule?.expr);
  const scheduleTz = (0, _dreamingSharedBKklH94W.n)(job.schedule?.tz);
  if (scheduleKind !== "cron" || !compareOptionalStrings(scheduleExpr, desired.schedule.expr) || !compareOptionalStrings(scheduleTz, desired.schedule.tz)) patch.schedule = desired.schedule;
  if ((0, _stringCoerceBje8XVt.a)((0, _dreamingSharedBKklH94W.n)(job.sessionTarget)) !== desired.sessionTarget) patch.sessionTarget = desired.sessionTarget;
  if ((0, _stringCoerceBje8XVt.a)((0, _dreamingSharedBKklH94W.n)(job.wakeMode)) !== "now") patch.wakeMode = "now";
  const payloadKind = (0, _stringCoerceBje8XVt.a)((0, _dreamingSharedBKklH94W.n)(job.payload?.kind));
  const payloadToken = resolveManagedDreamingPayloadToken(job.payload);
  const desiredPayloadToken = desired.payload.kind === "systemEvent" ? desired.payload.text : desired.payload.message;
  if (payloadKind !== (0, _stringCoerceBje8XVt.a)(desired.payload.kind) || !compareOptionalStrings(payloadToken, desiredPayloadToken) || desired.payload.kind === "agentTurn" && job.payload?.lightContext !== desired.payload.lightContext) patch.payload = desired.payload;
  if ((0, _stringCoerceBje8XVt.a)((0, _dreamingSharedBKklH94W.n)(job.delivery?.mode)) !== "none") patch.delivery = desired.delivery;
  return Object.keys(patch).length > 0 ? patch : null;
}
function sortManagedJobs(managed) {
  return managed.toSorted((a, b) => {
    const aCreated = typeof a.createdAtMs === "number" && Number.isFinite(a.createdAtMs) ? a.createdAtMs : Number.MAX_SAFE_INTEGER;
    const bCreated = typeof b.createdAtMs === "number" && Number.isFinite(b.createdAtMs) ? b.createdAtMs : Number.MAX_SAFE_INTEGER;
    if (aCreated !== bCreated) return aCreated - bCreated;
    return a.id.localeCompare(b.id);
  });
}
function resolveCronServiceFromCandidate(candidate) {
  if (!candidate || typeof candidate !== "object") return null;
  const cron = candidate;
  if (typeof cron.list !== "function" || typeof cron.add !== "function" || typeof cron.update !== "function" || typeof cron.remove !== "function") return null;
  return cron;
}
function resolveCronServiceFromGatewayContext(context) {
  return resolveCronServiceFromCandidate(context?.getCron?.());
}
function resolveDreamingTriggerSessionKeys(sessionKey) {
  const normalized = (0, _dreamingSharedBKklH94W.n)(sessionKey);
  if (!normalized) return [];
  const keys = [normalized];
  if (normalized.endsWith(HEARTBEAT_ISOLATED_SESSION_SUFFIX)) {
    const baseSessionKey = normalized.slice(0, -10).trim();
    if (baseSessionKey) keys.push(baseSessionKey);
  }
  return Array.from(new Set(keys));
}
function hasPendingManagedDreamingCronEvent(sessionKey) {
  return resolveDreamingTriggerSessionKeys(sessionKey).some((candidateSessionKey) => (0, _systemEventsCAt6m2Yr.s)(candidateSessionKey).some((event) => event.contextKey?.startsWith("cron:") === true && (0, _dreamingSharedBKklH94W.n)(event.text) === "__openclaw_memory_core_short_term_promotion_dream__"));
}
function resolveShortTermPromotionDreamingConfig(params) {
  const resolved = (0, _dreamingCUzWMDhQ.W)(params);
  return {
    enabled: resolved.enabled,
    cron: resolved.cron,
    ...(resolved.timezone ? { timezone: resolved.timezone } : {}),
    limit: resolved.limit,
    minScore: resolved.minScore,
    minRecallCount: resolved.minRecallCount,
    minUniqueQueries: resolved.minUniqueQueries,
    recencyHalfLifeDays: resolved.recencyHalfLifeDays,
    ...(typeof resolved.maxAgeDays === "number" ? { maxAgeDays: resolved.maxAgeDays } : {}),
    verboseLogging: resolved.verboseLogging,
    storage: resolved.storage,
    ...(resolved.execution.model ? { execution: { model: resolved.execution.model } } : {})
  };
}
async function reconcileShortTermDreamingCronJob(params) {
  const cron = params.cron;
  if (!cron) return {
    status: "unavailable",
    removed: 0
  };
  const allJobs = await cron.list({ includeDisabled: true });
  const managed = allJobs.filter(isManagedDreamingJob);
  const legacyPhaseJobs = allJobs.filter(isLegacyPhaseDreamingJob);
  if (!params.config.enabled) {
    let removed = await migrateLegacyPhaseDreamingCronJobs({
      cron,
      legacyJobs: legacyPhaseJobs,
      logger: params.logger,
      mode: "disabled"
    });
    for (const job of managed) try {
      if ((await cron.remove(job.id)).removed === true) removed += 1;
    } catch (err) {
      params.logger.warn(`memory-core: failed to remove managed dreaming cron job ${job.id}: ${(0, _errorsG8SYDTCe.i)(err)}`);
    }
    if (removed > 0) params.logger.info(`memory-core: removed ${removed} managed dreaming cron job(s).`);
    return {
      status: "disabled",
      removed
    };
  }
  const desired = buildManagedDreamingCronJob(params.config);
  if (managed.length === 0) {
    await cron.add(desired);
    const migratedLegacy = await migrateLegacyPhaseDreamingCronJobs({
      cron,
      legacyJobs: legacyPhaseJobs,
      logger: params.logger,
      mode: "enabled"
    });
    params.logger.info("memory-core: created managed dreaming cron job.");
    return {
      status: "added",
      removed: migratedLegacy
    };
  }
  const [primary, ...duplicates] = sortManagedJobs(managed);
  let removed = await migrateLegacyPhaseDreamingCronJobs({
    cron,
    legacyJobs: legacyPhaseJobs,
    logger: params.logger,
    mode: "enabled"
  });
  for (const duplicate of duplicates) try {
    if ((await cron.remove(duplicate.id)).removed === true) removed += 1;
  } catch (err) {
    params.logger.warn(`memory-core: failed to prune duplicate managed dreaming cron job ${duplicate.id}: ${(0, _errorsG8SYDTCe.i)(err)}`);
  }
  const patch = buildManagedDreamingPatch(primary, desired);
  if (!patch) {
    if (removed > 0) params.logger.info("memory-core: pruned duplicate managed dreaming cron jobs.");
    return {
      status: "noop",
      removed
    };
  }
  await cron.update(primary.id, patch);
  params.logger.info("memory-core: updated managed dreaming cron job.");
  return {
    status: "updated",
    removed
  };
}
async function runShortTermDreamingPromotionIfTriggered(params) {
  if (params.trigger !== "heartbeat" && params.trigger !== "cron") return;
  if (!(0, _dreamingSharedBKklH94W.t)(params.cleanedBody, "__openclaw_memory_core_short_term_promotion_dream__")) return;
  if (!params.config.enabled) return {
    handled: true,
    reason: "memory-core: short-term dreaming disabled"
  };
  const recencyHalfLifeDays = params.config.recencyHalfLifeDays ?? 14;
  const workspaceCandidates = params.cfg ? (0, _dreamingCUzWMDhQ.J)(params.cfg).map((entry) => entry.workspaceDir) : [];
  const seenWorkspaces = /* @__PURE__ */new Set();
  const workspaces = workspaceCandidates.filter((workspaceDir) => {
    if (seenWorkspaces.has(workspaceDir)) return false;
    seenWorkspaces.add(workspaceDir);
    return true;
  });
  const fallbackWorkspaceDir = (0, _dreamingSharedBKklH94W.n)(params.workspaceDir);
  if (workspaces.length === 0 && fallbackWorkspaceDir) workspaces.push(fallbackWorkspaceDir);
  if (workspaces.length === 0) {
    params.logger.warn("memory-core: dreaming promotion skipped because no memory workspace is available.");
    return {
      handled: true,
      reason: "memory-core: short-term dreaming missing workspace"
    };
  }
  if (params.config.limit === 0) {
    params.logger.info("memory-core: dreaming promotion skipped because limit=0.");
    return {
      handled: true,
      reason: "memory-core: short-term dreaming disabled by limit"
    };
  }
  if (params.config.verboseLogging) params.logger.info(`memory-core: dreaming verbose enabled (cron=${params.config.cron}, limit=${params.config.limit}, minScore=${params.config.minScore.toFixed(3)}, minRecallCount=${params.config.minRecallCount}, minUniqueQueries=${params.config.minUniqueQueries}, recencyHalfLifeDays=${recencyHalfLifeDays}, maxAgeDays=${params.config.maxAgeDays ?? "none"}, workspaces=${workspaces.length}).`);
  let totalCandidates = 0;
  let totalApplied = 0;
  let failedWorkspaces = 0;
  const pluginConfig = params.cfg ? (0, _dreamingCUzWMDhQ.U)(params.cfg) : void 0;
  const detachNarratives = params.trigger === "cron";
  for (const workspaceDir of workspaces) try {
    const sweepNowMs = Date.now();
    await runDreamingSweepPhases({
      workspaceDir,
      pluginConfig,
      cfg: params.cfg,
      logger: params.logger,
      subagent: params.subagent,
      detachNarratives,
      nowMs: sweepNowMs
    });
    const reportLines = [];
    const repair = await (0, _shortTermPromotionBU_sr5Sj.d)({ workspaceDir });
    if (repair.changed) {
      params.logger.info(`memory-core: normalized recall artifacts before dreaming (${formatRepairSummary(repair)}) [workspace=${workspaceDir}].`);
      reportLines.push(`- Repaired recall artifacts: ${formatRepairSummary(repair)}.`);
    }
    const candidates = await (0, _shortTermPromotionBU_sr5Sj.a)({
      workspaceDir,
      limit: params.config.limit,
      minScore: params.config.minScore,
      minRecallCount: params.config.minRecallCount,
      minUniqueQueries: params.config.minUniqueQueries,
      recencyHalfLifeDays,
      maxAgeDays: params.config.maxAgeDays,
      nowMs: sweepNowMs
    });
    totalCandidates += candidates.length;
    reportLines.push(`- Ranked ${candidates.length} candidate(s) for durable promotion.`);
    if (params.config.verboseLogging) {
      const candidateSummary = candidates.length > 0 ? candidates.map((candidate) => `${candidate.path}:${candidate.startLine}-${candidate.endLine} score=${candidate.score.toFixed(3)} recalls=${candidate.recallCount} queries=${candidate.uniqueQueries} components={freq=${candidate.components.frequency.toFixed(3)},rel=${candidate.components.relevance.toFixed(3)},div=${candidate.components.diversity.toFixed(3)},rec=${candidate.components.recency.toFixed(3)},cons=${candidate.components.consolidation.toFixed(3)},concept=${candidate.components.conceptual.toFixed(3)}}`).join(" | ") : "none";
      params.logger.info(`memory-core: dreaming candidate details [workspace=${workspaceDir}] ${candidateSummary}`);
    }
    const applied = await (0, _shortTermPromotionBU_sr5Sj.n)({
      workspaceDir,
      candidates,
      limit: params.config.limit,
      minScore: params.config.minScore,
      minRecallCount: params.config.minRecallCount,
      minUniqueQueries: params.config.minUniqueQueries,
      maxAgeDays: params.config.maxAgeDays,
      timezone: params.config.timezone,
      nowMs: sweepNowMs
    });
    totalApplied += applied.applied;
    reportLines.push(`- Promoted ${applied.applied} candidate(s) into MEMORY.md.`);
    if (params.config.verboseLogging) {
      const appliedSummary = applied.appliedCandidates.length > 0 ? applied.appliedCandidates.map((candidate) => `${candidate.path}:${candidate.startLine}-${candidate.endLine} score=${candidate.score.toFixed(3)} recalls=${candidate.recallCount}`).join(" | ") : "none";
      params.logger.info(`memory-core: dreaming applied details [workspace=${workspaceDir}] ${appliedSummary}`);
    }
    await writeDeepDreamingReport({
      workspaceDir,
      bodyLines: reportLines,
      nowMs: sweepNowMs,
      timezone: params.config.timezone,
      storage: params.config.storage ?? {
        mode: "separate",
        separateReports: false
      }
    });
    if (params.subagent && (candidates.length > 0 || applied.applied > 0)) {
      const data = {
        phase: "deep",
        snippets: candidates.map((c) => c.snippet).filter(Boolean),
        promotions: applied.appliedCandidates.map((c) => c.snippet).filter(Boolean)
      };
      if (detachNarratives) (0, _dreamingNarrativeCtUXKufb.i)({
        subagent: params.subagent,
        workspaceDir,
        data,
        nowMs: sweepNowMs,
        timezone: params.config.timezone,
        model: params.config.execution?.model,
        logger: params.logger
      });else
      await (0, _dreamingNarrativeCtUXKufb.n)({
        subagent: params.subagent,
        workspaceDir,
        data,
        nowMs: sweepNowMs,
        timezone: params.config.timezone,
        model: params.config.execution?.model,
        logger: params.logger
      });
    }
  } catch (err) {
    failedWorkspaces += 1;
    params.logger.error(`memory-core: dreaming promotion failed for workspace ${workspaceDir}: ${(0, _errorsG8SYDTCe.i)(err)}`);
  }
  params.logger.info(`memory-core: dreaming promotion complete (workspaces=${workspaces.length}, candidates=${totalCandidates}, applied=${totalApplied}, failed=${failedWorkspaces}).`);
  return {
    handled: true,
    reason: "memory-core: short-term dreaming processed"
  };
}
function registerShortTermPromotionDreaming(api) {
  let resolveStartupCron = null;
  let gatewayContext = null;
  let unavailableCronWarningEmitted = false;
  let lastRuntimeReconcileAtMs = 0;
  let lastRuntimeConfigKey = null;
  let lastRuntimeCronRef = null;
  const resolveCurrentConfig = () => api.runtime.config?.current?.() ?? api.config;
  const runtimeConfigKey = (config) => [
  config.enabled ? "enabled" : "disabled",
  config.cron,
  config.timezone ?? "",
  String(config.limit),
  String(config.minScore),
  String(config.minRecallCount),
  String(config.minUniqueQueries),
  String(config.recencyHalfLifeDays ?? ""),
  String(config.maxAgeDays ?? ""),
  config.verboseLogging ? "verbose" : "quiet",
  config.storage?.mode ?? "",
  config.storage?.separateReports ? "separate" : "inline"].
  join("|");
  const reconcileManagedDreamingCron = async (params) => {
    const startupCfg = params.reason === "startup" ? params.startupConfig ?? api.config : resolveCurrentConfig();
    const config = resolveShortTermPromotionDreamingConfig({
      pluginConfig: params.reason === "runtime" ? (0, _dreamingCUzWMDhQ.U)(startupCfg) : (0, _dreamingCUzWMDhQ.U)(startupCfg) ?? (0, _dreamingCUzWMDhQ.U)(api.config) ?? api.pluginConfig,
      cfg: startupCfg
    });
    if (params.reason === "startup") resolveStartupCron = params.startupCron ?? null;
    let cron = resolveStartupCron?.() ?? null;
    if (!cron && params.reason === "runtime" && gatewayContext) try {
      cron = resolveCronServiceFromGatewayContext(gatewayContext);
      if (cron) resolveStartupCron = () => cron;
    } catch {}
    const configKey = runtimeConfigKey(config);
    if (!cron && config.enabled && !unavailableCronWarningEmitted) if (params.reason === "startup") api.logger.debug?.("memory-core: cron service not yet available at gateway_start; deferring to runtime reconciliation.");else
    {
      api.logger.warn("memory-core: managed dreaming cron could not be reconciled (cron service unavailable).");
      unavailableCronWarningEmitted = true;
    }
    if (cron) unavailableCronWarningEmitted = false;
    if (params.reason === "runtime") {
      const now = Date.now();
      if (now - lastRuntimeReconcileAtMs < RUNTIME_CRON_RECONCILE_INTERVAL_MS && lastRuntimeConfigKey === configKey && lastRuntimeCronRef === cron) return config;
      lastRuntimeReconcileAtMs = now;
      lastRuntimeConfigKey = configKey;
      lastRuntimeCronRef = cron;
    }
    await reconcileShortTermDreamingCronJob({
      cron,
      config,
      logger: api.logger
    });
    return config;
  };
  api.on("gateway_start", async (_event, ctx) => {
    gatewayContext = ctx;
    try {
      await reconcileManagedDreamingCron({
        reason: "startup",
        startupConfig: ctx.config,
        startupCron: () => resolveCronServiceFromGatewayContext(ctx)
      });
    } catch (err) {
      api.logger.error(`memory-core: dreaming startup reconciliation failed: ${(0, _errorsG8SYDTCe.i)(err)}`);
    }
  });
  api.on("before_agent_reply", async (event, ctx) => {
    try {
      if (ctx.trigger !== "heartbeat" && ctx.trigger !== "cron") return;
      const currentConfig = resolveCurrentConfig();
      const config = await reconcileManagedDreamingCron({ reason: "runtime" });
      const hasManagedDreamingToken = (0, _dreamingSharedBKklH94W.t)(event.cleanedBody, _dreamingCUzWMDhQ.B);
      const isManagedHeartbeatTrigger = ctx.trigger === "heartbeat" && hasPendingManagedDreamingCronEvent(ctx.sessionKey);
      const isManagedCronTrigger = ctx.trigger === "cron";
      if (!hasManagedDreamingToken || !isManagedHeartbeatTrigger && !isManagedCronTrigger) return;
      return await runShortTermDreamingPromotionIfTriggered({
        cleanedBody: event.cleanedBody,
        trigger: ctx.trigger,
        workspaceDir: ctx.workspaceDir,
        cfg: currentConfig,
        config,
        logger: api.logger,
        subagent: config.enabled ? api.runtime?.subagent : void 0
      });
    } catch (err) {
      api.logger.error(`memory-core: dreaming trigger failed: ${(0, _errorsG8SYDTCe.i)(err)}`);
      return;
    }
  });
}
//#endregion /* v9-22739c54eca74741 */
