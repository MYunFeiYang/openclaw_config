"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.C = resolveMemorySearchConfig;exports.S = resolveAgentWorkspaceDir;exports.T = splitShellArgs;exports._ = splitTextToUtf8ByteLimit;exports.a = ensureDir;exports.b = parseDurationMs;exports.c = normalizeExtraMemoryPaths;exports.d = runWithConcurrency;exports.f = isFileMissingError;exports.g = estimateUtf8Bytes;exports.h = estimateStructuredEmbeddingInputBytes;exports.i = cosineSimilarity;exports.l = parseEmbedding;exports.m = hasNonTextEmbeddingParts;exports.n = buildMultimodalChunkForIndexing;exports.o = isMemoryPath;exports.p = statRegularFile;exports.r = chunkMarkdown;exports.s = listMemoryFiles;exports.t = buildFileEntry;exports.u = remapChunkLines;exports.v = void 0;exports.w = resolveUserPath;exports.x = resolveAgentContextLimits;exports.y = normalizeAgentId;var _runWithConcurrencyB6E2CnAh = require("./run-with-concurrency-B6E2CnAh.js");
var _mimeSrMFIJPy = require("./mime-srMFIJPy.js");
var _rootMemoryFilesYefKNHwl = require("./root-memory-files-YefKNHwl.js");
var _stringUtilsDoQjWCc = require("./string-utils-DoQjWCc3.js");
var _cjkCharsDDVSR4kt = require("./cjk-chars-DDVSR4kt.js");
var _multimodalBR2nwsNX = require("./multimodal-BR2nwsNX.js");
require("./openclaw-runtime-memory-BOFICnHi.js");
require("./openclaw-runtime-io-BKzO6ggj.js");
var _hashB7y7CIO = require("./hash-B7y7C-iO.js");
var _nodeFs = _interopRequireDefault(require("node:fs"));
var _nodePath = _interopRequireDefault(require("node:path"));
var _promises = _interopRequireDefault(require("node:fs/promises"));
var _nodeOs = _interopRequireDefault(require("node:os"));
var _nodeCrypto = _interopRequireDefault(require("node:crypto"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}
//#region packages/memory-host-sdk/src/host/config-utils.ts
const CANONICAL_ROOT_MEMORY_FILENAME = exports.v = "MEMORY.md";
const DEFAULT_AGENT_ID = "main";
const VALID_ID_RE = /^[a-z0-9][a-z0-9_-]{0,63}$/i;
const INVALID_CHARS_RE = /[^a-z0-9_-]+/g;
const LEADING_DASH_RE = /^-+/;
const TRAILING_DASH_RE = /-+$/;
const LEGACY_STATE_DIRNAMES = [".clawdbot"];
const NEW_STATE_DIRNAME = ".openclaw";
const DURATION_MULTIPLIERS = {
  ms: 1,
  s: 1e3,
  m: 6e4,
  h: 36e5,
  d: 864e5
};
function normalizeAgentId(value) {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return DEFAULT_AGENT_ID;
  const normalized = (0, _stringUtilsDoQjWCc.t)(trimmed);
  if (VALID_ID_RE.test(trimmed)) return normalized;
  return normalized.replace(INVALID_CHARS_RE, "-").replace(LEADING_DASH_RE, "").replace(TRAILING_DASH_RE, "").slice(0, 64) || DEFAULT_AGENT_ID;
}
function normalizeHomeValue(value) {
  const trimmed = (0, _stringUtilsDoQjWCc.r)(value);
  if (!trimmed || trimmed === "undefined" || trimmed === "null") return;
  return trimmed;
}
function resolveRawOsHomeDir(env, homedir) {
  return normalizeHomeValue(env.HOME) ?? normalizeHomeValue(env.USERPROFILE) ?? normalizeHomeValue(homedir());
}
function resolveRequiredHomeDir(env = process.env, homedir = _nodeOs.default.homedir) {
  const explicitHome = normalizeHomeValue(env.OPENCLAW_HOME);
  const rawHome = explicitHome ? explicitHome.replace(/^~(?=$|[\\/])/, resolveRawOsHomeDir(env, homedir) ?? "") : resolveRawOsHomeDir(env, homedir);
  return rawHome ? _nodePath.default.resolve(rawHome) : _nodePath.default.resolve(process.cwd());
}
function resolveUserPath(input, env = process.env, homedir = _nodeOs.default.homedir) {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith("~")) return _nodePath.default.resolve(trimmed.replace(/^~(?=$|[\\/])/, resolveRequiredHomeDir(env, homedir)));
  return _nodePath.default.resolve(trimmed);
}
function legacyStateDirs(homedir) {
  return LEGACY_STATE_DIRNAMES.map((dir) => _nodePath.default.join(homedir(), dir));
}
function resolveStateDir(env = process.env, homedir = _nodeOs.default.homedir) {
  const override = env.OPENCLAW_STATE_DIR?.trim();
  if (override) return resolveUserPath(override, env, homedir);
  const effectiveHome = () => resolveRequiredHomeDir(env, homedir);
  const nextDir = _nodePath.default.join(effectiveHome(), NEW_STATE_DIRNAME);
  if (env.OPENCLAW_TEST_FAST === "1" || _nodeFs.default.existsSync(nextDir)) return nextDir;
  return legacyStateDirs(effectiveHome).find((dir) => {
    try {
      return _nodeFs.default.existsSync(dir);
    } catch {
      return false;
    }
  }) ?? nextDir;
}
function resolveDefaultAgentWorkspaceDir(env = process.env) {
  const home = resolveRequiredHomeDir(env, _nodeOs.default.homedir);
  const profile = env.OPENCLAW_PROFILE?.trim();
  if (profile && (0, _stringUtilsDoQjWCc.t)(profile) !== "default") return _nodePath.default.join(home, ".openclaw", `workspace-${profile}`);
  return _nodePath.default.join(home, ".openclaw", "workspace");
}
function listAgentEntries(cfg) {
  return Array.isArray(cfg.agents?.list) ? cfg.agents.list.filter((entry) => Boolean(entry)) : [];
}
function resolveDefaultAgentId(cfg) {
  const agents = listAgentEntries(cfg);
  if (agents.length === 0) return DEFAULT_AGENT_ID;
  const chosen = (agents.find((agent) => agent.default) ?? agents[0])?.id;
  return normalizeAgentId(chosen || DEFAULT_AGENT_ID);
}
function resolveAgentConfig(cfg, agentId) {
  const id = normalizeAgentId(agentId);
  return listAgentEntries(cfg).find((entry) => normalizeAgentId(entry.id) === id);
}
function stripNullBytes(value) {
  return value.replaceAll("\0", "");
}
function resolveAgentWorkspaceDir(cfg, agentId, env = process.env) {
  const id = normalizeAgentId(agentId);
  const configured = resolveAgentConfig(cfg, id)?.workspace?.trim();
  if (configured) return stripNullBytes(resolveUserPath(configured, env));
  const fallback = cfg.agents?.defaults?.workspace?.trim();
  if (id === resolveDefaultAgentId(cfg)) return stripNullBytes(fallback ? resolveUserPath(fallback, env) : resolveDefaultAgentWorkspaceDir(env));
  if (fallback) return stripNullBytes(_nodePath.default.join(resolveUserPath(fallback, env), id));
  return stripNullBytes(_nodePath.default.join(resolveStateDir(env), `workspace-${id}`));
}
function resolveAgentContextLimits(cfg, agentId) {
  const defaults = cfg?.agents?.defaults?.contextLimits;
  if (!cfg || !agentId) return defaults;
  return resolveAgentConfig(cfg, agentId)?.contextLimits ?? defaults;
}
function resolveMemorySearchConfig(cfg, agentId) {
  const defaults = cfg.agents?.defaults?.memorySearch;
  const overrides = resolveAgentConfig(cfg, agentId)?.memorySearch;
  const enabled = overrides?.enabled ?? defaults?.enabled ?? true;
  if (!enabled) return null;
  const rawPaths = [...(defaults?.extraPaths ?? []), ...(overrides?.extraPaths ?? [])].map((value) => value.trim()).filter(Boolean);
  return {
    enabled,
    extraPaths: Array.from(new Set(rawPaths))
  };
}
function parseDurationMs(raw, opts) {
  const trimmed = (0, _stringUtilsDoQjWCc.t)((0, _stringUtilsDoQjWCc.r)(raw) ?? "");
  if (!trimmed) throw new Error("invalid duration (empty)");
  const single = /^(\d+(?:\.\d+)?)(ms|s|m|h|d)?$/.exec(trimmed);
  if (single) {
    const value = Number(single[1]);
    if (!Number.isFinite(value) || value < 0) throw new Error(`invalid duration: ${raw}`);
    const unit = single[2] ?? opts?.defaultUnit ?? "ms";
    return Math.round(value * (DURATION_MULTIPLIERS[unit] ?? 1));
  }
  let totalMs = 0;
  let consumed = 0;
  for (const match of trimmed.matchAll(/(\d+(?:\.\d+)?)(ms|s|m|h|d)/g)) {
    const [full, valueRaw, unitRaw] = match;
    const index = match.index ?? -1;
    if (!full || !valueRaw || !unitRaw || index !== consumed) throw new Error(`invalid duration: ${raw}`);
    const value = Number(valueRaw);
    const multiplier = DURATION_MULTIPLIERS[unitRaw];
    if (!Number.isFinite(value) || value < 0 || !multiplier) throw new Error(`invalid duration: ${raw}`);
    totalMs += value * multiplier;
    consumed += full.length;
  }
  if (consumed !== trimmed.length || consumed === 0) throw new Error(`invalid duration: ${raw}`);
  return Math.round(totalMs);
}
const DOUBLE_QUOTE_ESCAPES = new Set([
"\\",
"\"",
"$",
"`",
"\n",
"\r"]
);
function splitShellArgs(raw) {
  const tokens = [];
  let buf = "";
  let inSingle = false;
  let inDouble = false;
  let escaped = false;
  const pushToken = () => {
    if (buf.length > 0) {
      tokens.push(buf);
      buf = "";
    }
  };
  for (let i = 0; i < raw.length; i += 1) {
    const ch = raw[i];
    if (escaped) {
      buf += ch;
      escaped = false;
      continue;
    }
    if (!inSingle && !inDouble && ch === "\\") {
      escaped = true;
      continue;
    }
    if (inSingle) {
      if (ch === "'") inSingle = false;else
      buf += ch;
      continue;
    }
    if (inDouble) {
      const next = raw[i + 1];
      if (ch === "\\" && next && DOUBLE_QUOTE_ESCAPES.has(next)) {
        buf += next;
        i += 1;
      } else if (ch === "\"") inDouble = false;else
      buf += ch;
      continue;
    }
    if (ch === "'") inSingle = true;else
    if (ch === "\"") inDouble = true;else
    if (ch === "#" && buf.length === 0) break;else
    if (/\s/.test(ch)) pushToken();else
    buf += ch;
  }
  if (escaped || inSingle || inDouble) return null;
  pushToken();
  return tokens;
}
//#endregion
//#region packages/memory-host-sdk/src/host/embedding-input-limits.ts
function estimateUtf8Bytes(text) {
  if (!text) return 0;
  return Buffer.byteLength(text, "utf8");
}
function estimateStructuredEmbeddingInputBytes(input) {
  if (!input.parts?.length) return estimateUtf8Bytes(input.text);
  let total = 0;
  for (const part of input.parts) {
    if (part.type === "text") {
      total += estimateUtf8Bytes(part.text);
      continue;
    }
    total += estimateUtf8Bytes(part.mimeType);
    total += estimateUtf8Bytes(part.data);
  }
  return total;
}
function splitTextToUtf8ByteLimit(text, maxUtf8Bytes) {
  if (maxUtf8Bytes <= 0) return [text];
  if (estimateUtf8Bytes(text) <= maxUtf8Bytes) return [text];
  const parts = [];
  let cursor = 0;
  while (cursor < text.length) {
    let low = cursor + 1;
    let high = Math.min(text.length, cursor + maxUtf8Bytes);
    let best = cursor;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (estimateUtf8Bytes(text.slice(cursor, mid)) <= maxUtf8Bytes) {
        best = mid;
        low = mid + 1;
      } else high = mid - 1;
    }
    if (best <= cursor) best = Math.min(text.length, cursor + 1);
    if (best < text.length && best > cursor && text.charCodeAt(best - 1) >= 55296 && text.charCodeAt(best - 1) <= 56319 && text.charCodeAt(best) >= 56320 && text.charCodeAt(best) <= 57343) best -= 1;
    const part = text.slice(cursor, best);
    if (!part) break;
    parts.push(part);
    cursor = best;
  }
  return parts;
}
//#endregion
//#region packages/memory-host-sdk/src/host/embedding-inputs.ts
function buildTextEmbeddingInput(text) {
  return { text };
}
function isInlineDataEmbeddingInputPart(part) {
  return part.type === "inline-data";
}
function hasNonTextEmbeddingParts(input) {
  if (!input?.parts?.length) return false;
  return input.parts.some((part) => isInlineDataEmbeddingInputPart(part));
}
//#endregion
//#region packages/memory-host-sdk/src/host/fs-utils.ts
function isFileMissingError(err) {
  return Boolean(err && typeof err === "object" && "code" in err && err.code === "ENOENT");
}
async function statRegularFile(absPath) {
  let stat;
  try {
    stat = await _promises.default.lstat(absPath);
  } catch (err) {
    if (isFileMissingError(err)) return { missing: true };
    throw err;
  }
  if (stat.isSymbolicLink() || !stat.isFile()) throw new Error("path required");
  return {
    missing: false,
    stat
  };
}
//#endregion
//#region packages/memory-host-sdk/src/host/internal.ts
const DISABLED_MULTIMODAL_SETTINGS = {
  enabled: false,
  modalities: [],
  maxFileBytes: 0
};
function ensureDir(dir) {
  try {
    _nodeFs.default.mkdirSync(dir, { recursive: true });
  } catch {}
  return dir;
}
function normalizeRelPath(value) {
  return value.trim().replace(/^[./]+/, "").replace(/\\/g, "/");
}
function normalizeExtraMemoryPaths(workspaceDir, extraPaths) {
  if (!extraPaths?.length) return [];
  const resolved = extraPaths.map((value) => value.trim()).filter(Boolean).map((value) => _nodePath.default.isAbsolute(value) ? _nodePath.default.resolve(value) : _nodePath.default.resolve(workspaceDir, value));
  return Array.from(new Set(resolved));
}
function isMemoryPath(relPath) {
  const normalized = normalizeRelPath(relPath);
  if (!normalized) return false;
  if (normalized === "MEMORY.md" || normalized === "dreams.md") return true;
  return normalized.startsWith("memory/");
}
function isAllowedMemoryFilePath(filePath, multimodal) {
  if (filePath.endsWith(".md")) return true;
  return (0, _multimodalBR2nwsNX.r)(filePath, multimodal ?? DISABLED_MULTIMODAL_SETTINGS) !== null;
}
async function walkDir(dir, files, multimodal, shouldSkipPath) {
  const entries = await _promises.default.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = _nodePath.default.join(dir, entry.name);
    if (shouldSkipPath?.(full)) continue;
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) {
      if (entry.name === ".openclaw-repair") continue;
      await walkDir(full, files, multimodal, shouldSkipPath);
      continue;
    }
    if (!entry.isFile()) continue;
    if (!isAllowedMemoryFilePath(full, multimodal)) continue;
    files.push(full);
  }
}
async function listMemoryFiles(workspaceDir, extraPaths, multimodal) {
  const result = [];
  const memoryDir = _nodePath.default.join(workspaceDir, "memory");
  const shouldSkipWorkspaceMemoryPath = (absPath) => (0, _rootMemoryFilesYefKNHwl.c)({
    workspaceDir,
    absPath
  });
  const addMarkdownFile = async (absPath) => {
    try {
      const stat = await _promises.default.lstat(absPath);
      if (stat.isSymbolicLink() || !stat.isFile()) return;
      if (!absPath.endsWith(".md")) return;
      result.push(absPath);
    } catch {}
  };
  const memoryFile = await (0, _rootMemoryFilesYefKNHwl.i)(workspaceDir);
  if (memoryFile) await addMarkdownFile(memoryFile);
  try {
    const dirStat = await _promises.default.lstat(memoryDir);
    if (!dirStat.isSymbolicLink() && dirStat.isDirectory()) await walkDir(memoryDir, result, multimodal, shouldSkipWorkspaceMemoryPath);
  } catch {}
  const normalizedExtraPaths = normalizeExtraMemoryPaths(workspaceDir, extraPaths);
  if (normalizedExtraPaths.length > 0) for (const inputPath of normalizedExtraPaths) {
    if (shouldSkipWorkspaceMemoryPath(inputPath)) continue;
    try {
      const stat = await _promises.default.lstat(inputPath);
      if (stat.isSymbolicLink()) continue;
      if (stat.isDirectory()) {
        await walkDir(inputPath, result, multimodal, shouldSkipWorkspaceMemoryPath);
        continue;
      }
      if (stat.isFile() && isAllowedMemoryFilePath(inputPath, multimodal)) result.push(inputPath);
    } catch {}
  }
  if (result.length <= 1) return result;
  const seen = /* @__PURE__ */new Set();
  const deduped = [];
  for (const entry of result) {
    let key = entry;
    try {
      key = await _promises.default.realpath(entry);
    } catch {}
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(entry);
  }
  return deduped;
}
async function buildFileEntry(absPath, workspaceDir, multimodal) {
  let stat;
  try {
    stat = await _promises.default.stat(absPath);
  } catch (err) {
    if (isFileMissingError(err)) return null;
    throw err;
  }
  const normalizedPath = _nodePath.default.relative(workspaceDir, absPath).replace(/\\/g, "/");
  const multimodalSettings = multimodal ?? DISABLED_MULTIMODAL_SETTINGS;
  const modality = (0, _multimodalBR2nwsNX.r)(absPath, multimodalSettings);
  if (modality) {
    if (stat.size > multimodalSettings.maxFileBytes) return null;
    let buffer;
    try {
      buffer = await _promises.default.readFile(absPath);
    } catch (err) {
      if (isFileMissingError(err)) return null;
      throw err;
    }
    const mimeType = await (0, _mimeSrMFIJPy.n)({
      buffer: buffer.subarray(0, 512),
      filePath: absPath
    });
    if (!mimeType || !mimeType.startsWith(`${modality}/`)) return null;
    const contentText = (0, _multimodalBR2nwsNX.n)(modality, normalizedPath);
    const dataHash = _nodeCrypto.default.createHash("sha256").update(buffer).digest("hex");
    const chunkHash = (0, _hashB7y7CIO.t)(JSON.stringify({
      path: normalizedPath,
      contentText,
      mimeType,
      dataHash
    }));
    return {
      path: normalizedPath,
      absPath,
      mtimeMs: stat.mtimeMs,
      size: stat.size,
      hash: chunkHash,
      dataHash,
      kind: "multimodal",
      contentText,
      modality,
      mimeType
    };
  }
  let content;
  try {
    content = await _promises.default.readFile(absPath, "utf-8");
  } catch (err) {
    if (isFileMissingError(err)) return null;
    throw err;
  }
  const hash = (0, _hashB7y7CIO.t)(content);
  return {
    path: normalizedPath,
    absPath,
    mtimeMs: stat.mtimeMs,
    size: stat.size,
    hash,
    kind: "markdown"
  };
}
async function loadMultimodalEmbeddingInput(entry) {
  if (entry.kind !== "multimodal" || !entry.contentText || !entry.mimeType) return null;
  let stat;
  try {
    stat = await _promises.default.stat(entry.absPath);
  } catch (err) {
    if (isFileMissingError(err)) return null;
    throw err;
  }
  if (stat.size !== entry.size) return null;
  let buffer;
  try {
    buffer = await _promises.default.readFile(entry.absPath);
  } catch (err) {
    if (isFileMissingError(err)) return null;
    throw err;
  }
  const dataHash = _nodeCrypto.default.createHash("sha256").update(buffer).digest("hex");
  if (entry.dataHash && entry.dataHash !== dataHash) return null;
  return {
    text: entry.contentText,
    parts: [{
      type: "text",
      text: entry.contentText
    }, {
      type: "inline-data",
      mimeType: entry.mimeType,
      data: buffer.toString("base64")
    }]
  };
}
async function buildMultimodalChunkForIndexing(entry) {
  const embeddingInput = await loadMultimodalEmbeddingInput(entry);
  if (!embeddingInput) return null;
  return {
    chunk: {
      startLine: 1,
      endLine: 1,
      text: entry.contentText ?? embeddingInput.text,
      hash: entry.hash,
      embeddingInput
    },
    structuredInputBytes: estimateStructuredEmbeddingInputBytes(embeddingInput)
  };
}
function chunkMarkdown(content, chunking) {
  const lines = content.split("\n");
  if (lines.length === 0) return [];
  const maxChars = Math.max(32, chunking.tokens * 4);
  const overlapChars = Math.max(0, chunking.overlap * 4);
  const chunks = [];
  let current = [];
  let currentChars = 0;
  const flush = () => {
    if (current.length === 0) return;
    const firstEntry = current[0];
    const lastEntry = current[current.length - 1];
    if (!firstEntry || !lastEntry) return;
    const text = current.map((entry) => entry.line).join("\n");
    const startLine = firstEntry.lineNo;
    const endLine = lastEntry.lineNo;
    chunks.push({
      startLine,
      endLine,
      text,
      hash: (0, _hashB7y7CIO.t)(text),
      embeddingInput: buildTextEmbeddingInput(text)
    });
  };
  const carryOverlap = () => {
    if (overlapChars <= 0 || current.length === 0) {
      current = [];
      currentChars = 0;
      return;
    }
    let acc = 0;
    const kept = [];
    for (let i = current.length - 1; i >= 0; i -= 1) {
      const entry = current[i];
      if (!entry) continue;
      acc += (0, _cjkCharsDDVSR4kt.t)(entry.line) + 1;
      kept.unshift(entry);
      if (acc >= overlapChars) break;
    }
    current = kept;
    currentChars = acc;
  };
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    const lineNo = i + 1;
    const segments = [];
    if (line.length === 0) segments.push("");else
    for (let start = 0; start < line.length; start += maxChars) {
      const coarse = line.slice(start, start + maxChars);
      if ((0, _cjkCharsDDVSR4kt.t)(coarse) > maxChars) {
        const fineStep = Math.max(1, chunking.tokens);
        for (let j = 0; j < coarse.length;) {
          let end = Math.min(j + fineStep, coarse.length);
          if (end < coarse.length) {
            const code = coarse.charCodeAt(end - 1);
            if (code >= 55296 && code <= 56319) end += 1;
          }
          segments.push(coarse.slice(j, end));
          j = end;
        }
      } else segments.push(coarse);
    }
    for (const segment of segments) {
      const lineSize = (0, _cjkCharsDDVSR4kt.t)(segment) + 1;
      if (currentChars + lineSize > maxChars && current.length > 0) {
        flush();
        carryOverlap();
      }
      current.push({
        line: segment,
        lineNo
      });
      currentChars += lineSize;
    }
  }
  flush();
  return chunks;
}
/**
* Remap chunk startLine/endLine from content-relative positions to original
* source file positions using a lineMap.  Each entry in lineMap gives the
* 1-indexed source line for the corresponding 0-indexed content line.
*
* This is used for session JSONL files where buildSessionEntry() flattens
* messages into a plain-text string before chunking.  Without remapping the
* stored line numbers would reference positions in the flattened text rather
* than the original JSONL file.
*/
function remapChunkLines(chunks, lineMap) {
  if (!lineMap || lineMap.length === 0) return;
  for (const chunk of chunks) {
    chunk.startLine = lineMap[chunk.startLine - 1] ?? chunk.startLine;
    chunk.endLine = lineMap[chunk.endLine - 1] ?? chunk.endLine;
  }
}
function parseEmbedding(raw) {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function cosineSimilarity(a, b) {
  if (a.length === 0 || b.length === 0) return 0;
  const len = Math.min(a.length, b.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < len; i += 1) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
async function runWithConcurrency(tasks, limit) {
  const { results, firstError, hasError } = await (0, _runWithConcurrencyB6E2CnAh.t)({
    tasks,
    limit,
    errorMode: "stop"
  });
  if (hasError) throw firstError;
  return results;
}
//#endregion /* v9-882a0b1c7e336c17 */
