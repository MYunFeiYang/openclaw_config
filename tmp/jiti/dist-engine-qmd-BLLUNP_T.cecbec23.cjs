"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = deriveQmdScopeChatType;exports.c = buildSessionEntry;exports.d = loadSessionTranscriptClassificationForAgent;exports.f = normalizeSessionTranscriptPathForComparison;exports.i = deriveQmdScopeChannel;exports.l = listSessionFilesForAgent;exports.n = resolveCliSpawnInvocation;exports.o = isQmdScopeAllowed;exports.p = sessionPathForFile;exports.r = runCliCommand;exports.s = parseQmdQueryJson;exports.t = checkQmdBinaryAvailability;exports.u = loadDreamingNarrativeTranscriptPathSetForAgent;var _redactDVSkTguP = require("./redact-DVSkTguP.js");
var _subsystemIzrDYZz = require("./subsystem-Izr-DYZz.js");
var _sessionKeyUtilsB9qLc2A = require("./session-key-utils-B9qLc2A8.js");
var _inputProvenanceDj8S9UNT = require("./input-provenance-Dj8S9UNT.js");
var _artifactsC4Ry7YwM = require("./artifacts-C4Ry7YwM.js");
var _pathsBg_QeV2r = require("./paths-Bg_QeV2r.js");
var _internalRuntimeContextCAhrFMl = require("./internal-runtime-context-CAhrFMl2.js");
var _stripInboundMetaByzEWAV = require("./strip-inbound-meta-ByzEWAV3.js");
var _tokensBIJuzXU = require("./tokens-BIJuzXU-.js");
require("./heartbeat-CxHCYc7v.js");
var _heartbeatFilterDaEmg3YT = require("./heartbeat-filter-DaEmg3YT.js");
var _stringUtilsDoQjWCc = require("./string-utils-DoQjWCc3.js");
require("./query-expansion-Cic3aAyO.js");
var _heartbeatEventsFilterU2D4z_sl = require("./heartbeat-events-filter-U2D4z_sl.js");
var _errorUtilsBO7VfQAm = require("./error-utils-BO7VfQAm.js");
require("./openclaw-runtime-io-BKzO6ggj.js");
var _hashB7y7CIO = require("./hash-B7y7C-iO.js");
require("./openclaw-runtime-session-WvROUWxe.js");
var _nodeFs = _interopRequireWildcard(require("node:fs"));
var _nodePath = _interopRequireDefault(require("node:path"));
var _promises = _interopRequireDefault(require("node:fs/promises"));
var _nodeChild_process = require("node:child_process");function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}function _interopRequireWildcard(e, t) {if ("function" == typeof WeakMap) var r = new WeakMap(),n = new WeakMap();return (_interopRequireWildcard = function (e, t) {if (!t && e && e.__esModule) return e;var o,i,f = { __proto__: null, default: e };if (null === e || "object" != typeof e && "function" != typeof e) return f;if (o = t ? n : r) {if (o.has(e)) return o.get(e);o.set(e, f);}for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]);return f;})(e, t);}
//#region packages/memory-host-sdk/src/host/session-files.ts
const DREAMING_NARRATIVE_RUN_PREFIX = "dreaming-narrative-";
const SESSION_EXPORT_CONTENT_WRAP_CHARS = 800;
const DIRECT_CRON_PROMPT_RE = /^\[cron:[^\]]+\]\s*/;
function shouldSkipTranscriptFileForDreaming(absPath) {
  const fileName = _nodePath.default.basename(absPath);
  return (0, _artifactsC4Ry7YwM.i)(fileName) || (0, _artifactsC4Ry7YwM.n)(fileName);
}
function isDreamingNarrativeBootstrapRecord(record) {
  if (!record || typeof record !== "object" || Array.isArray(record)) return false;
  const candidate = record;
  if (candidate.type !== "custom" || candidate.customType !== "openclaw:bootstrap-context:full" || !candidate.data || typeof candidate.data !== "object" || Array.isArray(candidate.data)) return false;
  const runId = candidate.data.runId;
  return typeof runId === "string" && runId.startsWith(DREAMING_NARRATIVE_RUN_PREFIX);
}
function hasDreamingNarrativeRunId(value) {
  return typeof value === "string" && value.startsWith(DREAMING_NARRATIVE_RUN_PREFIX);
}
function isDreamingNarrativeGeneratedRecord(record) {
  if (isDreamingNarrativeBootstrapRecord(record)) return true;
  if (!record || typeof record !== "object" || Array.isArray(record)) return false;
  const candidate = record;
  if (hasDreamingNarrativeRunId(candidate.runId) || hasDreamingNarrativeRunId(candidate.sessionKey)) return true;
  if (!candidate.data || typeof candidate.data !== "object" || Array.isArray(candidate.data)) return false;
  const nested = candidate.data;
  return hasDreamingNarrativeRunId(nested.runId) || hasDreamingNarrativeRunId(nested.sessionKey);
}
function isDreamingNarrativeSessionStoreKey(sessionKey) {
  const trimmed = sessionKey.trim();
  if (!trimmed) return false;
  const firstSeparator = trimmed.indexOf(":");
  if (firstSeparator < 0) return trimmed.startsWith(DREAMING_NARRATIVE_RUN_PREFIX);
  const secondSeparator = trimmed.indexOf(":", firstSeparator + 1);
  return (secondSeparator < 0 ? trimmed : trimmed.slice(secondSeparator + 1)).startsWith(DREAMING_NARRATIVE_RUN_PREFIX);
}
function normalizeComparablePath(pathname) {
  const resolved = _nodePath.default.resolve(pathname);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}
function normalizeSessionTranscriptPathForComparison(pathname) {
  return normalizeComparablePath(pathname);
}
function resolveSessionStoreTranscriptPath(sessionsDir, entry) {
  if (typeof entry?.sessionFile === "string" && entry.sessionFile.trim().length > 0) {
    const sessionFile = entry.sessionFile.trim();
    return normalizeComparablePath(_nodePath.default.isAbsolute(sessionFile) ? sessionFile : _nodePath.default.resolve(sessionsDir, sessionFile));
  }
  if (typeof entry?.sessionId === "string" && entry.sessionId.trim().length > 0) return normalizeComparablePath(_nodePath.default.join(sessionsDir, `${entry.sessionId.trim()}.jsonl`));
  return null;
}
function loadSessionTranscriptClassificationForSessionsDir(sessionsDir) {
  const store = readSessionTranscriptClassificationStore(_nodePath.default.join(sessionsDir, "sessions.json"));
  const dreamingTranscriptPaths = /* @__PURE__ */new Set();
  const cronRunTranscriptPaths = /* @__PURE__ */new Set();
  for (const [sessionKey, entry] of Object.entries(store)) {
    const transcriptPath = resolveSessionStoreTranscriptPath(sessionsDir, entry);
    if (!transcriptPath) continue;
    if (isDreamingNarrativeSessionStoreKey(sessionKey)) dreamingTranscriptPaths.add(transcriptPath);
    if ((0, _sessionKeyUtilsB9qLc2A.r)(sessionKey)) cronRunTranscriptPaths.add(transcriptPath);
  }
  return {
    dreamingNarrativeTranscriptPaths: dreamingTranscriptPaths,
    cronRunTranscriptPaths
  };
}
function readSessionTranscriptClassificationStore(storePath) {
  try {
    const parsed = JSON.parse(_nodeFs.default.readFileSync(storePath, "utf-8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed;
  } catch {
    return {};
  }
}
function loadDreamingNarrativeTranscriptPathSetForAgent(agentId) {
  return loadSessionTranscriptClassificationForAgent(agentId).dreamingNarrativeTranscriptPaths;
}
function loadSessionTranscriptClassificationForAgent(agentId) {
  return loadSessionTranscriptClassificationForSessionsDir((0, _pathsBg_QeV2r.l)(agentId));
}
function classifySessionTranscriptFromSessionStore(absPath) {
  const sessionsDir = _nodePath.default.dirname(absPath);
  const normalizedAbsPath = normalizeComparablePath(absPath);
  const classification = loadSessionTranscriptClassificationForSessionsDir(sessionsDir);
  return {
    generatedByDreamingNarrative: classification.dreamingNarrativeTranscriptPaths.has(normalizedAbsPath),
    generatedByCronRun: classification.cronRunTranscriptPaths.has(normalizedAbsPath)
  };
}
async function listSessionFilesForAgent(agentId) {
  const dir = (0, _pathsBg_QeV2r.l)(agentId);
  try {
    return (await _promises.default.readdir(dir, { withFileTypes: true })).filter((entry) => entry.isFile()).map((entry) => entry.name).filter((name) => (0, _artifactsC4Ry7YwM.c)(name)).map((name) => _nodePath.default.join(dir, name));
  } catch {
    return [];
  }
}
function sessionPathForFile(absPath) {
  return _nodePath.default.join("sessions", _nodePath.default.basename(absPath)).replace(/\\/g, "/");
}
async function logSessionFileReadFailure(absPath, err) {
  (0, _subsystemIzrDYZz.t)("memory").debug(`Failed reading session file ${absPath}: ${String(err)}`);
}
function normalizeSessionText(value) {
  return value.replace(/\s*\n+\s*/g, " ").replace(/\s+/g, " ").trim();
}
function collectRawSessionText(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return null;
  const parts = [];
  for (const block of content) {
    if (!block || typeof block !== "object") continue;
    const record = block;
    if (record.type === "text" && typeof record.text === "string") parts.push(record.text);
  }
  return parts.length > 0 ? parts.join("\n") : null;
}
function isHighSurrogate(code) {
  return code >= 55296 && code <= 56319;
}
function isLowSurrogate(code) {
  return code >= 56320 && code <= 57343;
}
function splitLongSessionLine(text, maxChars = SESSION_EXPORT_CONTENT_WRAP_CHARS) {
  const normalized = text.trim();
  if (!normalized) return [];
  if (normalized.length <= maxChars) return [normalized];
  const segments = [];
  let cursor = 0;
  while (cursor < normalized.length) {
    if (normalized.length - cursor <= maxChars) {
      segments.push(normalized.slice(cursor).trim());
      break;
    }
    const limit = cursor + maxChars;
    let splitAt = limit;
    for (let index = limit; index > cursor; index -= 1) if (normalized[index] === " ") {
      splitAt = index;
      break;
    }
    if (splitAt < normalized.length && splitAt > cursor && isHighSurrogate(normalized.charCodeAt(splitAt - 1)) && isLowSurrogate(normalized.charCodeAt(splitAt))) splitAt -= 1;
    segments.push(normalized.slice(cursor, splitAt).trim());
    cursor = splitAt;
    while (cursor < normalized.length && normalized[cursor] === " ") cursor += 1;
  }
  return segments.filter(Boolean);
}
function renderSessionExportLines(label, text) {
  return splitLongSessionLine(text).map((segment) => `${label}: ${segment}`);
}
/**
* Strip OpenClaw-injected inbound metadata envelopes from a raw text block.
*
* User-role messages arriving from external channels (Telegram, Discord,
* Slack, …) are stored with a multi-line prefix containing Conversation info,
* Sender info, and other AI-facing metadata blocks. These envelopes must be
* removed BEFORE normalization, because `stripInboundMetadata` relies on
* newline structure and fenced `json` code fences to locate sentinels; once
* `normalizeSessionText` collapses newlines into spaces, stripping is
* impossible.
*
* See: https://github.com/openclaw/openclaw/issues/63921
*/
function stripInboundMetadataForUserRole(text, role) {
  if (role !== "user") return text;
  return (0, _stripInboundMetaByzEWAV.n)(text);
}
const GENERATED_SYSTEM_MESSAGE_RE = /^System(?: \(untrusted\))?: \[[^\]]+\]\s*/;
function isGeneratedSystemWrapperMessage(text, role) {
  if (role !== "user") return false;
  return GENERATED_SYSTEM_MESSAGE_RE.test(text);
}
function isGeneratedCronPromptMessage(text, role) {
  if (role !== "user") return false;
  return DIRECT_CRON_PROMPT_RE.test(text);
}
function isGeneratedHeartbeatPromptMessage(text, role) {
  return role === "user" && (0, _heartbeatFilterDaEmg3YT.r)({
    role,
    content: text
  }, "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.");
}
function sanitizeSessionText(text, role) {
  const normalized = normalizeSessionText((0, _internalRuntimeContextCAhrFMl.l)(stripInboundMetadataForUserRole(text, role)));
  if (!normalized) return null;
  if (isGeneratedSystemWrapperMessage(normalized, role)) return null;
  if (isGeneratedCronPromptMessage(normalized, role)) return null;
  if (isGeneratedHeartbeatPromptMessage(normalized, role)) return null;
  if ((0, _tokensBIJuzXU.r)(normalized)) return null;
  if (role === "assistant" && normalized === "HEARTBEAT_OK") return null;
  if ((0, _heartbeatEventsFilterU2D4z_sl.i)(normalized.replace(GENERATED_SYSTEM_MESSAGE_RE, "").trim())) return null;
  return normalized;
}
function parseSessionTimestampMs(record, message) {
  const candidates = [message.timestamp, record.timestamp];
  for (const value of candidates) {
    if (typeof value === "number" && Number.isFinite(value)) {
      const ms = value > 0 && value < 1e11 ? value * 1e3 : value;
      if (Number.isFinite(ms) && ms > 0) return ms;
    }
    if (typeof value === "string") {
      const parsed = Date.parse(value);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
  }
  return 0;
}
async function buildSessionEntry(absPath, opts = {}) {
  try {
    const stat = await _promises.default.stat(absPath);
    if (shouldSkipTranscriptFileForDreaming(absPath)) return {
      path: sessionPathForFile(absPath),
      absPath,
      mtimeMs: stat.mtimeMs,
      size: stat.size,
      hash: (0, _hashB7y7CIO.t)("\n\n"),
      content: "",
      lineMap: [],
      messageTimestampsMs: []
    };
    const lines = (await _promises.default.readFile(absPath, "utf-8")).split("\n");
    const collected = [];
    const lineMap = [];
    const messageTimestampsMs = [];
    const sessionStoreClassification = opts.generatedByDreamingNarrative === void 0 || opts.generatedByCronRun === void 0 ? classifySessionTranscriptFromSessionStore(absPath) : null;
    let generatedByDreamingNarrative = opts.generatedByDreamingNarrative ?? sessionStoreClassification?.generatedByDreamingNarrative ?? false;
    const generatedByCronRun = opts.generatedByCronRun ?? sessionStoreClassification?.generatedByCronRun ?? false;
    for (let jsonlIdx = 0; jsonlIdx < lines.length; jsonlIdx++) {
      const line = lines[jsonlIdx];
      if (!line.trim()) continue;
      let record;
      try {
        record = JSON.parse(line);
      } catch {
        continue;
      }
      if (!generatedByDreamingNarrative && isDreamingNarrativeGeneratedRecord(record)) generatedByDreamingNarrative = true;
      if (!record || typeof record !== "object" || record.type !== "message") continue;
      const message = record.message;
      if (!message || typeof message.role !== "string") continue;
      if (message.role !== "user" && message.role !== "assistant") continue;
      if (message.role === "user" && (0, _inputProvenanceDj8S9UNT.r)(message)) continue;
      const rawText = collectRawSessionText(message.content);
      if (rawText === null) continue;
      const text = sanitizeSessionText(rawText, message.role);
      if (!text) continue;
      if (generatedByDreamingNarrative || generatedByCronRun) continue;
      const safe = (0, _redactDVSkTguP.r)(text, { mode: "tools" });
      const renderedLines = renderSessionExportLines(message.role === "user" ? "User" : "Assistant", safe);
      const timestampMs = parseSessionTimestampMs(record, message);
      collected.push(...renderedLines);
      lineMap.push(...renderedLines.map(() => jsonlIdx + 1));
      messageTimestampsMs.push(...renderedLines.map(() => timestampMs));
    }
    const content = collected.join("\n");
    return {
      path: sessionPathForFile(absPath),
      absPath,
      mtimeMs: stat.mtimeMs,
      size: stat.size,
      hash: (0, _hashB7y7CIO.t)(content + "\n" + lineMap.join(",") + "\n" + messageTimestampsMs.join(",")),
      content,
      lineMap,
      messageTimestampsMs,
      ...(generatedByDreamingNarrative ? { generatedByDreamingNarrative: true } : {}),
      ...(generatedByCronRun ? { generatedByCronRun: true } : {})
    };
  } catch (err) {
    logSessionFileReadFailure(absPath, err);
    return null;
  }
}
//#endregion
//#region packages/memory-host-sdk/src/host/qmd-query-parser.ts
function parseQmdQueryJson(stdout, stderr) {
  const trimmedStdout = stdout.trim();
  const trimmedStderr = stderr.trim();
  const stdoutIsMarker = trimmedStdout.length > 0 && isQmdNoResultsOutput(trimmedStdout);
  const stderrIsMarker = trimmedStderr.length > 0 && isQmdNoResultsOutput(trimmedStderr);
  if (stdoutIsMarker || !trimmedStdout && stderrIsMarker) return [];
  if (!trimmedStdout) {
    const message = `stdout empty${trimmedStderr ? ` (stderr: ${summarizeQmdStderr(trimmedStderr)})` : ""}`;
    warnQmdQueryParseError(message);
    throw new Error(`qmd query returned invalid JSON: ${message}`);
  }
  try {
    const parsed = parseQmdQueryResultArray(trimmedStdout);
    if (parsed !== null) return parsed;
    const noisyPayload = extractFirstJsonArray(trimmedStdout);
    if (!noisyPayload) throw new Error("qmd query JSON response was not an array");
    const fallback = parseQmdQueryResultArray(noisyPayload);
    if (fallback !== null) return fallback;
    throw new Error("qmd query JSON response was not an array");
  } catch (err) {
    const message = (0, _errorUtilsBO7VfQAm.t)(err);
    warnQmdQueryParseError(message);
    throw new Error(`qmd query returned invalid JSON: ${message}`, { cause: err });
  }
}
function warnQmdQueryParseError(message) {
  if (process.env.VITEST || false) return;
  process.stderr.write(`qmd query returned invalid JSON: ${message}\n`);
}
function isQmdNoResultsOutput(raw) {
  return raw.split(/\r?\n/).map((line) => (0, _stringUtilsDoQjWCc.t)(line).replace(/\s+/g, " ")).filter((line) => line.length > 0).some((line) => isQmdNoResultsLine(line));
}
function isQmdNoResultsLine(line) {
  if (line === "no results found" || line === "no results found.") return true;
  return /^(?:\[[^\]]+\]\s*)?(?:(?:warn(?:ing)?|info|error|qmd)\s*:\s*)+no results found\.?$/.test(line);
}
function summarizeQmdStderr(raw) {
  return raw.length <= 120 ? raw : `${raw.slice(0, 117)}...`;
}
function parseQmdQueryResultArray(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.map((item) => {
      if (typeof item !== "object" || item === null) return item;
      const record = item;
      return {
        docid: typeof record.docid === "string" ? record.docid : void 0,
        score: typeof record.score === "number" && Number.isFinite(record.score) ? record.score : void 0,
        collection: typeof record.collection === "string" ? record.collection : void 0,
        file: typeof record.file === "string" ? record.file : void 0,
        snippet: typeof record.snippet === "string" ? record.snippet : void 0,
        body: typeof record.body === "string" ? record.body : void 0,
        startLine: parseQmdLineNumber(record.start_line ?? record.startLine),
        endLine: parseQmdLineNumber(record.end_line ?? record.endLine)
      };
    });
  } catch {
    return null;
  }
}
function parseQmdLineNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : void 0;
}
function extractFirstJsonArray(raw) {
  const start = raw.indexOf("[");
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < raw.length; i += 1) {
    const char = raw[i];
    if (char === void 0) break;
    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") escaped = true;else
      if (char === "\"") inString = false;
      continue;
    }
    if (char === "\"") {
      inString = true;
      continue;
    }
    if (char === "[") depth += 1;else
    if (char === "]") {
      depth -= 1;
      if (depth === 0) return raw.slice(start, i + 1);
    }
  }
  return null;
}
//#endregion
//#region packages/memory-host-sdk/src/host/qmd-scope.ts
function isQmdScopeAllowed(scope, sessionKey) {
  if (!scope) return true;
  const parsed = parseQmdSessionScope(sessionKey);
  const channel = parsed.channel;
  const chatType = parsed.chatType;
  const normalizedKey = parsed.normalizedKey ?? "";
  const rawKey = (0, _stringUtilsDoQjWCc.t)(sessionKey ?? "");
  for (const rule of scope.rules ?? []) {
    if (!rule) continue;
    const match = rule.match ?? {};
    if (match.channel && match.channel !== channel) continue;
    if (match.chatType && match.chatType !== chatType) continue;
    const normalizedPrefix = (0, _stringUtilsDoQjWCc.n)(match.keyPrefix) || void 0;
    const rawPrefix = (0, _stringUtilsDoQjWCc.n)(match.rawKeyPrefix) || void 0;
    if (rawPrefix && !rawKey.startsWith(rawPrefix)) continue;
    if (normalizedPrefix) {
      if (normalizedPrefix.startsWith("agent:")) {
        if (!rawKey.startsWith(normalizedPrefix)) continue;
      } else if (!normalizedKey.startsWith(normalizedPrefix)) continue;
    }
    return rule.action === "allow";
  }
  return (scope.default ?? "allow") === "allow";
}
function deriveQmdScopeChannel(key) {
  return parseQmdSessionScope(key).channel;
}
function deriveQmdScopeChatType(key) {
  return parseQmdSessionScope(key).chatType;
}
function parseQmdSessionScope(key) {
  const normalized = normalizeQmdSessionKey(key);
  if (!normalized) return {};
  const parts = normalized.split(":").filter(Boolean);
  let chatType;
  if (parts.length >= 2 && (parts[1] === "group" || parts[1] === "channel" || parts[1] === "direct" || parts[1] === "dm")) {
    if (parts.includes("group")) chatType = "group";else
    if (parts.includes("channel")) chatType = "channel";
    return {
      normalizedKey: normalized,
      channel: (0, _stringUtilsDoQjWCc.n)(parts[0]),
      chatType: chatType ?? "direct"
    };
  }
  if (normalized.includes(":group:")) return {
    normalizedKey: normalized,
    chatType: "group"
  };
  if (normalized.includes(":channel:")) return {
    normalizedKey: normalized,
    chatType: "channel"
  };
  return {
    normalizedKey: normalized,
    chatType: "direct"
  };
}
function normalizeQmdSessionKey(key) {
  if (!key) return;
  const trimmed = key.trim();
  if (!trimmed) return;
  const normalized = (0, _stringUtilsDoQjWCc.t)(parseAgentSessionKey(trimmed)?.rest ?? trimmed);
  if (normalized.startsWith("subagent:")) return;
  return normalized;
}
function parseAgentSessionKey(sessionKey) {
  const raw = (0, _stringUtilsDoQjWCc.n)(sessionKey);
  if (!raw) return null;
  const parts = raw.split(":").filter(Boolean);
  if (parts.length < 3 || parts[0] !== "agent") return null;
  const rest = parts.slice(2).join(":");
  return rest ? { rest } : null;
}
//#endregion
//#region packages/memory-host-sdk/src/host/windows-spawn.ts
function isFilePath(candidate) {
  try {
    return (0, _nodeFs.statSync)(candidate).isFile();
  } catch {
    return false;
  }
}
function resolveWindowsExecutablePath(command, env) {
  if (command.includes("/") || command.includes("\\") || _nodePath.default.isAbsolute(command)) return command;
  const pathEntries = (env.PATH ?? env.Path ?? process.env.PATH ?? process.env.Path ?? "").split(";").map((entry) => entry.trim()).filter(Boolean);
  const hasExtension = _nodePath.default.extname(command).length > 0;
  const pathExtRaw = env.PATHEXT ?? env.Pathext ?? process.env.PATHEXT ?? process.env.Pathext ?? ".EXE;.CMD;.BAT;.COM";
  const pathExt = hasExtension ? [""] : pathExtRaw.split(";").map((ext) => ext.trim()).filter(Boolean).map((ext) => ext.startsWith(".") ? ext : `.${ext}`);
  for (const dir of pathEntries) for (const ext of pathExt) {
    const normalizedExt = (0, _stringUtilsDoQjWCc.t)(ext);
    const uppercaseExt = ext.toUpperCase();
    for (const candidateExt of [
    ext,
    normalizedExt,
    uppercaseExt])
    {
      const candidate = _nodePath.default.join(dir, `${command}${candidateExt}`);
      if (isFilePath(candidate)) return candidate;
    }
  }
  return command;
}
function resolveEntrypointFromCmdShim(wrapperPath) {
  if (!isFilePath(wrapperPath)) return null;
  try {
    const content = (0, _nodeFs.readFileSync)(wrapperPath, "utf8");
    const candidates = [];
    for (const match of content.matchAll(/"([^"\r\n]*)"/g)) {
      const relative = (match[1] ?? "").match(/%~?dp0%?\s*[\\/]*(.*)$/i)?.[1]?.trim();
      if (!relative) continue;
      const normalizedRelative = relative.replace(/[\\/]+/g, _nodePath.default.sep).replace(/^[\\/]+/, "");
      const candidate = _nodePath.default.resolve(_nodePath.default.dirname(wrapperPath), normalizedRelative);
      if (isFilePath(candidate)) candidates.push(candidate);
    }
    return candidates.find((candidate) => {
      const base = (0, _stringUtilsDoQjWCc.t)(_nodePath.default.basename(candidate));
      return base !== "node.exe" && base !== "node";
    }) ?? null;
  } catch {
    return null;
  }
}
function resolveBinEntry(packageName, binField) {
  if (typeof binField === "string") return (0, _stringUtilsDoQjWCc.r)(binField) ?? null;
  if (!binField || typeof binField !== "object") return null;
  if (packageName) {
    const preferred = binField[packageName];
    const normalizedPreferred = typeof preferred === "string" ? (0, _stringUtilsDoQjWCc.r)(preferred) : void 0;
    if (normalizedPreferred) return normalizedPreferred;
  }
  for (const value of Object.values(binField)) {
    const normalizedValue = typeof value === "string" ? (0, _stringUtilsDoQjWCc.r)(value) : void 0;
    if (normalizedValue) return normalizedValue;
  }
  return null;
}
function resolveEntrypointFromPackageJson(wrapperPath, packageName) {
  if (!packageName) return null;
  const wrapperDir = _nodePath.default.dirname(wrapperPath);
  const packageDirs = [_nodePath.default.resolve(wrapperDir, "..", packageName), _nodePath.default.resolve(wrapperDir, "node_modules", packageName)];
  for (const packageDir of packageDirs) {
    const packageJsonPath = _nodePath.default.join(packageDir, "package.json");
    if (!isFilePath(packageJsonPath)) continue;
    try {
      const entryRel = resolveBinEntry(packageName, JSON.parse((0, _nodeFs.readFileSync)(packageJsonPath, "utf8")).bin);
      if (!entryRel) continue;
      const entryPath = _nodePath.default.resolve(packageDir, entryRel);
      if (isFilePath(entryPath)) return entryPath;
    } catch {}
  }
  return null;
}
function resolveWindowsSpawnProgramCandidate(params) {
  const platform = params.platform ?? process.platform;
  const env = params.env ?? process.env;
  const execPath = params.execPath ?? process.execPath;
  if (platform !== "win32") return {
    command: params.command,
    leadingArgv: [],
    resolution: "direct"
  };
  const resolvedCommand = resolveWindowsExecutablePath(params.command, env);
  const ext = (0, _stringUtilsDoQjWCc.t)(_nodePath.default.extname(resolvedCommand));
  if (ext === ".js" || ext === ".cjs" || ext === ".mjs") return {
    command: execPath,
    leadingArgv: [resolvedCommand],
    resolution: "node-entrypoint",
    windowsHide: true
  };
  if (ext === ".cmd" || ext === ".bat") {
    const entrypoint = resolveEntrypointFromCmdShim(resolvedCommand) ?? resolveEntrypointFromPackageJson(resolvedCommand, params.packageName);
    if (entrypoint) {
      if ((0, _stringUtilsDoQjWCc.t)(_nodePath.default.extname(entrypoint)) === ".exe") return {
        command: entrypoint,
        leadingArgv: [],
        resolution: "exe-entrypoint",
        windowsHide: true
      };
      return {
        command: execPath,
        leadingArgv: [entrypoint],
        resolution: "node-entrypoint",
        windowsHide: true
      };
    }
    return {
      command: resolvedCommand,
      leadingArgv: [],
      resolution: "unresolved-wrapper"
    };
  }
  return {
    command: resolvedCommand,
    leadingArgv: [],
    resolution: "direct"
  };
}
function resolveWindowsSpawnProgram(params) {
  const candidate = resolveWindowsSpawnProgramCandidate(params);
  if (candidate.resolution !== "unresolved-wrapper") return {
    command: candidate.command,
    leadingArgv: candidate.leadingArgv,
    resolution: candidate.resolution,
    windowsHide: candidate.windowsHide
  };
  if (params.allowShellFallback === true) return {
    command: candidate.command,
    leadingArgv: [],
    resolution: "shell-fallback",
    shell: true
  };
  throw new Error(`${_nodePath.default.basename(candidate.command)} wrapper resolved, but no executable/Node entrypoint could be resolved without shell execution.`);
}
function materializeWindowsSpawnProgram(program, argv) {
  return {
    command: program.command,
    argv: [...program.leadingArgv, ...argv],
    resolution: program.resolution,
    shell: program.shell,
    windowsHide: program.windowsHide
  };
}
//#endregion
//#region packages/memory-host-sdk/src/host/qmd-process.ts
function resolveCliSpawnInvocation(params) {
  return materializeWindowsSpawnProgram(resolveWindowsSpawnProgram({
    command: params.command,
    platform: process.platform,
    env: params.env,
    execPath: process.execPath,
    packageName: params.packageName,
    allowShellFallback: false
  }), params.args);
}
async function checkQmdBinaryAvailability(params) {
  let spawnInvocation;
  try {
    spawnInvocation = resolveCliSpawnInvocation({
      command: params.command,
      args: [],
      env: params.env,
      packageName: "qmd"
    });
  } catch (err) {
    return {
      available: false,
      error: formatQmdAvailabilityError(err)
    };
  }
  return await new Promise((resolve) => {
    let settled = false;
    let didSpawn = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      resolve(result);
    };
    const child = (0, _nodeChild_process.spawn)(spawnInvocation.command, spawnInvocation.argv, {
      env: params.env,
      cwd: params.cwd ?? process.cwd(),
      shell: spawnInvocation.shell,
      windowsHide: spawnInvocation.windowsHide,
      stdio: "ignore"
    });
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      finish({
        available: false,
        error: `spawn ${params.command} timed out after ${params.timeoutMs ?? 2e3}ms`
      });
    }, params.timeoutMs ?? 2e3);
    child.once("error", (err) => {
      finish({
        available: false,
        error: formatQmdAvailabilityError(err)
      });
    });
    child.once("spawn", () => {
      didSpawn = true;
      child.kill();
      finish({ available: true });
    });
    child.once("close", () => {
      if (!didSpawn) return;
      finish({ available: true });
    });
  });
}
async function runCliCommand(params) {
  return await new Promise((resolve, reject) => {
    const child = (0, _nodeChild_process.spawn)(params.spawnInvocation.command, params.spawnInvocation.argv, {
      env: params.env,
      cwd: params.cwd,
      shell: params.spawnInvocation.shell,
      windowsHide: params.spawnInvocation.windowsHide
    });
    let stdout = "";
    let stderr = "";
    let stdoutTruncated = false;
    let stderrTruncated = false;
    const discardStdout = params.discardStdout === true;
    const timer = params.timeoutMs ? setTimeout(() => {
      child.kill("SIGKILL");
      reject(/* @__PURE__ */new Error(`${params.commandSummary} timed out after ${params.timeoutMs}ms`));
    }, params.timeoutMs) : null;
    child.stdout.on("data", (data) => {
      if (discardStdout) return;
      const next = appendOutputWithCap(stdout, data.toString("utf8"), params.maxOutputChars);
      stdout = next.text;
      stdoutTruncated = stdoutTruncated || next.truncated;
    });
    child.stderr.on("data", (data) => {
      const next = appendOutputWithCap(stderr, data.toString("utf8"), params.maxOutputChars);
      stderr = next.text;
      stderrTruncated = stderrTruncated || next.truncated;
    });
    child.on("error", (err) => {
      if (timer) clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code) => {
      if (timer) clearTimeout(timer);
      if (!discardStdout && (stdoutTruncated || stderrTruncated)) {
        reject(/* @__PURE__ */new Error(`${params.commandSummary} produced too much output (limit ${params.maxOutputChars} chars)`));
        return;
      }
      if (code === 0) resolve({
        stdout,
        stderr
      });else
      reject(/* @__PURE__ */new Error(`${params.commandSummary} failed (code ${code}): ${stderr || stdout}`));
    });
  });
}
function appendOutputWithCap(current, chunk, maxChars) {
  const appended = current + chunk;
  if (appended.length <= maxChars) return {
    text: appended,
    truncated: false
  };
  return {
    text: appended.slice(-maxChars),
    truncated: true
  };
}
function formatQmdAvailabilityError(err) {
  if (err instanceof Error && err.message) return err.message;
  return String(err);
}
//#endregion /* v9-4312ed8f3d4e1206 */
