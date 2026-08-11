"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.i = exports.a = void 0;exports.n = readAgentMemoryFile;exports.o = buildMemoryReadResult;exports.r = readMemoryFile;exports.s = buildMemoryReadResultFromSlice;exports.t = resolveMemoryBackendConfig;var _stringUtilsDoQjWCc = require("./string-utils-DoQjWCc3.js");
var _internalBhQAXls = require("./internal-BhQAXls3.js");
var _nodeFs = _interopRequireDefault(require("node:fs"));
var _nodePath = _interopRequireDefault(require("node:path"));
var _promises = _interopRequireDefault(require("node:fs/promises"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}
//#region packages/memory-host-sdk/src/host/read-file-shared.ts
const DEFAULT_MEMORY_READ_LINES = exports.i = 120;
const DEFAULT_MEMORY_READ_MAX_CHARS = exports.a = 12e3;
function buildContinuationNotice(params) {
  const base = typeof params.nextFrom === "number" ? `[More content available. Use from=${params.nextFrom} to continue.]` : "[More content available. Requested excerpt exceeded the default maxChars budget.]";
  const fallback = params.suggestReadFallback ? " If you need the full raw line, use read on the source file." : "";
  return `\n\n${base.slice(0, -1)}${fallback}]`;
}
function fitLinesToCharBudget(params) {
  const { lines, maxChars } = params;
  if (lines.length === 0) return {
    text: "",
    includedLines: 0,
    hardTruncatedSingleLine: false
  };
  let includedLines = lines.length;
  let text = lines.join("\n");
  while (includedLines > 1 && text.length > maxChars) {
    includedLines -= 1;
    text = lines.slice(0, includedLines).join("\n");
  }
  if (text.length <= maxChars) return {
    text,
    includedLines,
    hardTruncatedSingleLine: false
  };
  return {
    text: text.slice(0, maxChars),
    includedLines: 1,
    hardTruncatedSingleLine: true
  };
}
function buildMemoryReadResultFromSlice(params) {
  const start = Math.max(1, params.startLine);
  const fitted = fitLinesToCharBudget({
    lines: params.selectedLines,
    maxChars: Math.max(1, params.maxChars ?? 12e3)
  });
  const moreSourceLinesRemain = params.moreSourceLinesRemain ?? false;
  const charCapTruncated = fitted.hardTruncatedSingleLine || fitted.includedLines < params.selectedLines.length;
  const nextFrom = !fitted.hardTruncatedSingleLine && (moreSourceLinesRemain || fitted.includedLines < params.selectedLines.length) ? start + fitted.includedLines : void 0;
  const truncated = charCapTruncated || moreSourceLinesRemain;
  return {
    text: truncated && fitted.text ? `${fitted.text}${buildContinuationNotice({
      nextFrom,
      suggestReadFallback: fitted.hardTruncatedSingleLine && params.suggestReadFallback
    })}` : fitted.text,
    path: params.relPath,
    from: start,
    lines: fitted.includedLines,
    ...(truncated ? { truncated: true } : {}),
    ...(typeof nextFrom === "number" ? { nextFrom } : {})
  };
}
function buildMemoryReadResult(params) {
  const fileLines = params.content.split("\n");
  const start = Math.max(1, params.from ?? 1);
  const requestedCount = Math.max(1, params.lines ?? params.defaultLines ?? 120);
  const selectedLines = fileLines.slice(start - 1, start - 1 + requestedCount);
  const moreSourceLinesRemain = start - 1 + selectedLines.length < fileLines.length;
  return buildMemoryReadResultFromSlice({
    selectedLines,
    relPath: params.relPath,
    startLine: start,
    moreSourceLinesRemain,
    maxChars: params.maxChars,
    suggestReadFallback: params.suggestReadFallback
  });
}
//#endregion
//#region packages/memory-host-sdk/src/host/read-file.ts
async function readMemoryFile(params) {
  const rawPath = params.relPath.trim();
  if (!rawPath) throw new Error("path required");
  const absPath = _nodePath.default.isAbsolute(rawPath) ? _nodePath.default.resolve(rawPath) : _nodePath.default.resolve(params.workspaceDir, rawPath);
  const relPath = _nodePath.default.relative(params.workspaceDir, absPath).replace(/\\/g, "/");
  const allowedWorkspace = relPath.length > 0 && !relPath.startsWith("..") && !_nodePath.default.isAbsolute(relPath) && (0, _internalBhQAXls.o)(relPath);
  let allowedAdditional = false;
  if (!allowedWorkspace && (params.extraPaths?.length ?? 0) > 0) {
    const additionalPaths = (0, _internalBhQAXls.c)(params.workspaceDir, params.extraPaths);
    for (const additionalPath of additionalPaths) try {
      const stat = await _promises.default.lstat(additionalPath);
      if (stat.isSymbolicLink()) continue;
      if (stat.isDirectory()) {
        if (absPath === additionalPath || absPath.startsWith(`${additionalPath}${_nodePath.default.sep}`)) {
          allowedAdditional = true;
          break;
        }
        continue;
      }
      if (stat.isFile() && absPath === additionalPath && absPath.endsWith(".md")) {
        allowedAdditional = true;
        break;
      }
    } catch {}
  }
  if (!allowedWorkspace && !allowedAdditional) throw new Error("path required");
  if (!absPath.endsWith(".md")) throw new Error("path required");
  if ((await (0, _internalBhQAXls.p)(absPath)).missing) return {
    text: "",
    path: relPath
  };
  let content;
  try {
    content = await _promises.default.readFile(absPath, "utf-8");
  } catch (err) {
    if ((0, _internalBhQAXls.f)(err)) return {
      text: "",
      path: relPath
    };
    throw err;
  }
  return buildMemoryReadResult({
    content,
    relPath,
    from: params.from,
    lines: params.lines,
    defaultLines: params.defaultLines ?? 120,
    maxChars: params.maxChars,
    suggestReadFallback: allowedWorkspace
  });
}
async function readAgentMemoryFile(params) {
  const settings = (0, _internalBhQAXls.C)(params.cfg, params.agentId);
  if (!settings) throw new Error("memory search disabled");
  const contextLimits = (0, _internalBhQAXls.x)(params.cfg, params.agentId);
  return await readMemoryFile({
    workspaceDir: (0, _internalBhQAXls.S)(params.cfg, params.agentId),
    extraPaths: settings.extraPaths,
    relPath: params.relPath,
    from: params.from,
    lines: params.lines,
    defaultLines: contextLimits?.memoryGetDefaultLines,
    maxChars: contextLimits?.memoryGetMaxChars
  });
}
//#endregion
//#region packages/memory-host-sdk/src/host/backend-config.ts
const DEFAULT_BACKEND = "builtin";
const DEFAULT_CITATIONS = "auto";
const DEFAULT_QMD_INTERVAL = "5m";
const DEFAULT_QMD_DEBOUNCE_MS = 15e3;
const DEFAULT_QMD_TIMEOUT_MS = 4e3;
const DEFAULT_QMD_SEARCH_MODE = "search";
const DEFAULT_QMD_EMBED_INTERVAL = "60m";
const DEFAULT_QMD_COMMAND_TIMEOUT_MS = 3e4;
const DEFAULT_QMD_UPDATE_TIMEOUT_MS = 12e4;
const DEFAULT_QMD_EMBED_TIMEOUT_MS = 12e4;
const DEFAULT_QMD_LIMITS = {
  maxResults: 4,
  maxSnippetChars: 450,
  maxInjectedChars: 2200,
  timeoutMs: DEFAULT_QMD_TIMEOUT_MS
};
const DEFAULT_QMD_MCPORTER = {
  enabled: false,
  serverName: "qmd",
  startDaemon: true
};
const DEFAULT_QMD_SCOPE = {
  default: "deny",
  rules: [{
    action: "allow",
    match: { chatType: "direct" }
  }]
};
function sanitizeName(input) {
  return (0, _stringUtilsDoQjWCc.t)(input).replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "collection";
}
function scopeCollectionBase(base, agentId) {
  return `${base}-${sanitizeName(agentId)}`;
}
function canonicalizePathForContainment(rawPath) {
  const resolved = _nodePath.default.resolve(rawPath);
  let current = resolved;
  const suffix = [];
  while (true) try {
    const canonical = _nodePath.default.normalize(_nodeFs.default.realpathSync.native(current));
    return _nodePath.default.normalize(_nodePath.default.join(canonical, ...suffix));
  } catch {
    const parent = _nodePath.default.dirname(current);
    if (parent === current) return _nodePath.default.normalize(resolved);
    suffix.unshift(_nodePath.default.basename(current));
    current = parent;
  }
}
function isPathInsideRoot(candidatePath, rootPath) {
  const relative = _nodePath.default.relative(canonicalizePathForContainment(rootPath), canonicalizePathForContainment(candidatePath));
  return relative === "" || !relative.startsWith("..") && !_nodePath.default.isAbsolute(relative);
}
function ensureUniqueName(base, existing) {
  let name = sanitizeName(base);
  if (!existing.has(name)) {
    existing.add(name);
    return name;
  }
  let suffix = 2;
  while (existing.has(`${name}-${suffix}`)) suffix += 1;
  const unique = `${name}-${suffix}`;
  existing.add(unique);
  return unique;
}
function resolvePath(raw, workspaceDir) {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("path required");
  if (trimmed.startsWith("~") || _nodePath.default.isAbsolute(trimmed)) return _nodePath.default.normalize((0, _internalBhQAXls.w)(trimmed));
  return _nodePath.default.normalize(_nodePath.default.resolve(workspaceDir, trimmed));
}
function resolveIntervalMs(raw) {
  const value = raw?.trim();
  if (!value) return (0, _internalBhQAXls.b)(DEFAULT_QMD_INTERVAL, { defaultUnit: "m" });
  try {
    return (0, _internalBhQAXls.b)(value, { defaultUnit: "m" });
  } catch {
    return (0, _internalBhQAXls.b)(DEFAULT_QMD_INTERVAL, { defaultUnit: "m" });
  }
}
function resolveEmbedIntervalMs(raw) {
  const value = raw?.trim();
  if (!value) return (0, _internalBhQAXls.b)(DEFAULT_QMD_EMBED_INTERVAL, { defaultUnit: "m" });
  try {
    return (0, _internalBhQAXls.b)(value, { defaultUnit: "m" });
  } catch {
    return (0, _internalBhQAXls.b)(DEFAULT_QMD_EMBED_INTERVAL, { defaultUnit: "m" });
  }
}
function resolveDebounceMs(raw) {
  if (typeof raw === "number" && Number.isFinite(raw) && raw >= 0) return Math.floor(raw);
  return DEFAULT_QMD_DEBOUNCE_MS;
}
function resolveTimeoutMs(raw, fallback) {
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) return Math.floor(raw);
  return fallback;
}
function resolveLimits(raw) {
  const parsed = { ...DEFAULT_QMD_LIMITS };
  if (raw?.maxResults && raw.maxResults > 0) parsed.maxResults = Math.floor(raw.maxResults);
  if (raw?.maxSnippetChars && raw.maxSnippetChars > 0) parsed.maxSnippetChars = Math.floor(raw.maxSnippetChars);
  if (raw?.maxInjectedChars && raw.maxInjectedChars > 0) parsed.maxInjectedChars = Math.floor(raw.maxInjectedChars);
  if (raw?.timeoutMs && raw.timeoutMs > 0) parsed.timeoutMs = Math.floor(raw.timeoutMs);
  return parsed;
}
function resolveSearchMode(raw) {
  if (raw === "search" || raw === "vsearch" || raw === "query") return raw;
  return DEFAULT_QMD_SEARCH_MODE;
}
function resolveSearchTool(raw) {
  const value = raw?.trim();
  return value ? value : void 0;
}
function resolveSessionConfig(cfg, workspaceDir) {
  const enabled = Boolean(cfg?.enabled);
  const exportDirRaw = cfg?.exportDir?.trim();
  return {
    enabled,
    exportDir: exportDirRaw ? resolvePath(exportDirRaw, workspaceDir) : void 0,
    retentionDays: cfg?.retentionDays && cfg.retentionDays > 0 ? Math.floor(cfg.retentionDays) : void 0
  };
}
function resolveCustomPaths(rawPaths, workspaceDir, existing, agentId) {
  if (!rawPaths?.length) return [];
  const collections = [];
  const seenRoots = /* @__PURE__ */new Set();
  rawPaths.forEach((entry, index) => {
    const trimmedPath = entry?.path?.trim();
    if (!trimmedPath) return;
    let resolved;
    try {
      resolved = resolvePath(trimmedPath, workspaceDir);
    } catch {
      return;
    }
    const pattern = entry.pattern?.trim() || "**/*.md";
    const dedupeKey = `${resolved}\u0000${pattern}`;
    if (seenRoots.has(dedupeKey)) return;
    seenRoots.add(dedupeKey);
    const explicitName = entry.name?.trim();
    const name = ensureUniqueName(explicitName && !isPathInsideRoot(resolved, workspaceDir) ? explicitName : scopeCollectionBase(explicitName || `custom-${index + 1}`, agentId), existing);
    collections.push({
      name,
      path: resolved,
      pattern,
      kind: "custom"
    });
  });
  return collections;
}
function resolveMcporterConfig(raw) {
  const parsed = { ...DEFAULT_QMD_MCPORTER };
  if (!raw) return parsed;
  if (raw.enabled !== void 0) parsed.enabled = raw.enabled;
  if (typeof raw.serverName === "string" && raw.serverName.trim()) parsed.serverName = raw.serverName.trim();
  if (raw.startDaemon !== void 0) parsed.startDaemon = raw.startDaemon;
  if (parsed.enabled && raw.startDaemon === void 0) parsed.startDaemon = true;
  return parsed;
}
function resolveDefaultCollections(include, workspaceDir, existing, agentId) {
  if (!include) return [];
  return [{
    path: workspaceDir,
    pattern: _internalBhQAXls.v,
    base: "memory-root"
  }, {
    path: _nodePath.default.join(workspaceDir, "memory"),
    pattern: "**/*.md",
    base: "memory-dir"
  }].map((entry) => ({
    name: ensureUniqueName(scopeCollectionBase(entry.base, agentId), existing),
    path: entry.path,
    pattern: entry.pattern,
    kind: "memory"
  }));
}
function resolveMemoryBackendConfig(params) {
  const normalizedAgentId = (0, _internalBhQAXls.y)(params.agentId);
  const backend = params.cfg.memory?.backend ?? DEFAULT_BACKEND;
  const citations = params.cfg.memory?.citations ?? DEFAULT_CITATIONS;
  if (backend !== "qmd") return {
    backend: "builtin",
    citations
  };
  const workspaceDir = (0, _internalBhQAXls.S)(params.cfg, normalizedAgentId);
  const qmdCfg = params.cfg.memory?.qmd;
  const includeDefaultMemory = qmdCfg?.includeDefaultMemory !== false;
  const nameSet = /* @__PURE__ */new Set();
  const agentEntry = params.cfg.agents?.list?.find((entry) => (0, _internalBhQAXls.y)(entry?.id) === normalizedAgentId);
  const mergedExtraPaths = [...(params.cfg.agents?.defaults?.memorySearch?.extraPaths ?? []), ...(agentEntry?.memorySearch?.extraPaths ?? [])].filter((value) => typeof value === "string").map((value) => value.trim()).filter(Boolean);
  const searchExtraPaths = Array.from(new Set(mergedExtraPaths)).map((pathValue) => ({ path: pathValue }));
  const mergedExtraCollections = [...(params.cfg.agents?.defaults?.memorySearch?.qmd?.extraCollections ?? []), ...(agentEntry?.memorySearch?.qmd?.extraCollections ?? [])].filter((value) => value !== null && typeof value === "object" && typeof value.path === "string");
  const allQmdPaths = [
  ...(qmdCfg?.paths ?? []),
  ...searchExtraPaths,
  ...mergedExtraCollections];

  const collections = [...resolveDefaultCollections(includeDefaultMemory, workspaceDir, nameSet, normalizedAgentId), ...resolveCustomPaths(allQmdPaths, workspaceDir, nameSet, normalizedAgentId)];
  const rawCommand = qmdCfg?.command?.trim() || "qmd";
  return {
    backend: "qmd",
    citations,
    qmd: {
      command: (0, _internalBhQAXls.T)(rawCommand)?.[0] || rawCommand.split(/\s+/)[0] || "qmd",
      mcporter: resolveMcporterConfig(qmdCfg?.mcporter),
      searchMode: resolveSearchMode(qmdCfg?.searchMode),
      searchTool: resolveSearchTool(qmdCfg?.searchTool),
      collections,
      includeDefaultMemory,
      sessions: resolveSessionConfig(qmdCfg?.sessions, workspaceDir),
      update: {
        intervalMs: resolveIntervalMs(qmdCfg?.update?.interval),
        debounceMs: resolveDebounceMs(qmdCfg?.update?.debounceMs),
        onBoot: qmdCfg?.update?.onBoot !== false,
        waitForBootSync: qmdCfg?.update?.waitForBootSync === true,
        embedIntervalMs: resolveEmbedIntervalMs(qmdCfg?.update?.embedInterval),
        commandTimeoutMs: resolveTimeoutMs(qmdCfg?.update?.commandTimeoutMs, DEFAULT_QMD_COMMAND_TIMEOUT_MS),
        updateTimeoutMs: resolveTimeoutMs(qmdCfg?.update?.updateTimeoutMs, DEFAULT_QMD_UPDATE_TIMEOUT_MS),
        embedTimeoutMs: resolveTimeoutMs(qmdCfg?.update?.embedTimeoutMs, DEFAULT_QMD_EMBED_TIMEOUT_MS)
      },
      limits: resolveLimits(qmdCfg?.limits),
      scope: qmdCfg?.scope ?? DEFAULT_QMD_SCOPE
    }
  };
}
//#endregion /* v9-a292a2a0d100571f */
