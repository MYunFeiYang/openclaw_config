"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = canonicalizeAbsoluteSessionFilePath;exports.c = resolveSessionLifecycleTimestamps;exports.i = serializeSessionCleanupResult;exports.l = resolveMainSessionKeyFromConfig;exports.n = resolveSessionCleanupAction;exports.o = rewriteSessionFileForNewSessionId;exports.r = runSessionsCleanup;exports.s = readSessionHeaderStartedAtMs;exports.t = purgeAgentSessionStoreEntries;exports.u = extractDeliveryInfo;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
require("./agent-scope-DMMelGwC.js");
var _sessionKeyUtilsCJRKuBJA = require("./session-key-utils-CJRKuBJA.js");
var _sessionKeyCQewiu8n = require("./session-key-CQewiu8n.js");
var _agentScopeConfigDCRwWQZy = require("./agent-scope-config-DCRwWQZy.js");
var _loggerD7Ndr2M = require("./logger-D7Ndr2M8.js");
var _ioCiCdMMvQ = require("./io-CiCdMMvQ.js");
var _mainSessionBIlePcj = require("./main-session-BIlePcj4.js");
var _combinedStoreGatewayDHN_Y2YM = require("./combined-store-gateway-DHN_Y2YM.js");
var _deliveryContextSharedMTeaAgYN = require("./delivery-context.shared-MTeaAgYN.js");
var _pathsRbVDOqFp = require("./paths-RbVDOqFp.js");
var _storeLoadBzczsLeI = require("./store-load-BzczsLeI.js");
var _storeC86lM9dg = require("./store-C86lM9dg.js");
var _targetsB3qI57M = require("./targets-b-3qI57M.js");
require("./reset-CMlTzEqB.js");
require("./session-key-CJLGS4wM.js");
require("./transcript-DP6h7JQH.js");
var _nodeFs = _interopRequireDefault(require("node:fs"));
var _nodePath = _interopRequireDefault(require("node:path"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}
//#region src/config/sessions/delivery-info.ts
function hasRoutableDeliveryContext(context) {
  return Boolean(context?.channel && context?.to);
}
function extractDeliveryInfo(sessionKey, options) {
  const { baseSessionKey, threadId } = (0, _storeLoadBzczsLeI.S)(sessionKey);
  if (!sessionKey || !baseSessionKey) return {
    deliveryContext: void 0,
    threadId
  };
  let deliveryContext;
  try {
    const lookup = loadDeliverySessionEntry({
      cfg: options?.cfg ?? (0, _ioCiCdMMvQ.i)(),
      sessionKey,
      baseSessionKey
    });
    let entry = lookup.entry;
    let storedDeliveryContext = (0, _deliveryContextSharedMTeaAgYN.n)(entry);
    if (!hasRoutableDeliveryContext(storedDeliveryContext) && baseSessionKey !== sessionKey) {
      entry = lookup.baseEntry;
      storedDeliveryContext = (0, _deliveryContextSharedMTeaAgYN.n)(entry);
    }
    if (hasRoutableDeliveryContext(storedDeliveryContext)) deliveryContext = {
      channel: storedDeliveryContext.channel,
      to: storedDeliveryContext.to,
      accountId: storedDeliveryContext.accountId,
      threadId: storedDeliveryContext.threadId
    };
  } catch {}
  return {
    deliveryContext,
    threadId
  };
}
function resolveDeliveryStorePaths(cfg, agentId) {
  const paths = /* @__PURE__ */new Set();
  paths.add((0, _pathsRbVDOqFp.u)(cfg.session?.store, { agentId }));
  for (const target of (0, _targetsB3qI57M.i)(cfg)) if (target.agentId === agentId) paths.add(target.storePath);
  return [...paths];
}
function findSessionEntryInStore(store, keys) {
  let normalizedIndex;
  let bestEntry;
  let bestUpdatedAt = 0;
  let bestRoutable = false;
  const acceptCandidate = (candidate) => {
    if (!candidate) return;
    const candidateRoutable = hasRoutableDeliveryContext((0, _deliveryContextSharedMTeaAgYN.n)(candidate));
    const candidateUpdatedAt = candidate.updatedAt ?? 0;
    if (!bestEntry || candidateRoutable && !bestRoutable || candidateRoutable === bestRoutable && candidateUpdatedAt > bestUpdatedAt) {
      bestEntry = candidate;
      bestUpdatedAt = candidateUpdatedAt;
      bestRoutable = candidateRoutable;
    }
  };
  for (const key of keys) {
    const trimmed = key.trim();
    const normalized = (0, _storeLoadBzczsLeI.k)(key);
    const foldedLegacyKey = (0, _stringCoerceLndEvhRk.a)(normalized);
    let foundRoutableCandidate = false;
    if (Object.prototype.hasOwnProperty.call(store, normalized)) {
      foundRoutableCandidate ||= hasRoutableDeliveryContext((0, _deliveryContextSharedMTeaAgYN.n)(store[normalized]));
      acceptCandidate(store[normalized]);
    }
    if (foldedLegacyKey !== normalized && Object.prototype.hasOwnProperty.call(store, foldedLegacyKey)) {
      foundRoutableCandidate ||= hasRoutableDeliveryContext((0, _deliveryContextSharedMTeaAgYN.n)(store[foldedLegacyKey]));
      acceptCandidate(store[foldedLegacyKey]);
    }
    if (trimmed !== normalized && Object.prototype.hasOwnProperty.call(store, trimmed)) {
      foundRoutableCandidate ||= hasRoutableDeliveryContext((0, _deliveryContextSharedMTeaAgYN.n)(store[trimmed]));
      acceptCandidate(store[trimmed]);
    }
    if (trimmed !== normalized || !foundRoutableCandidate) {
      normalizedIndex ??= buildFreshestSessionEntryIndex(store);
      acceptCandidate(normalizedIndex.get(normalized));
      if (foldedLegacyKey !== normalized) acceptCandidate(normalizedIndex.get(foldedLegacyKey));
    }
  }
  return bestEntry;
}
function buildFreshestSessionEntryIndex(store) {
  const index = /* @__PURE__ */new Map();
  for (const [key, entry] of Object.entries(store)) {
    const normalized = (0, _storeLoadBzczsLeI.k)(key);
    const existing = index.get(normalized);
    const entryRoutable = hasRoutableDeliveryContext((0, _deliveryContextSharedMTeaAgYN.n)(entry));
    const existingRoutable = hasRoutableDeliveryContext((0, _deliveryContextSharedMTeaAgYN.n)(existing));
    if (!existing || entryRoutable && !existingRoutable || entryRoutable === existingRoutable && (entry.updatedAt ?? 0) > (existing.updatedAt ?? 0)) index.set(normalized, entry);
    const foldedLegacyKey = (0, _stringCoerceLndEvhRk.a)(normalized);
    if (foldedLegacyKey === normalized) continue;
    const foldedExisting = index.get(foldedLegacyKey);
    const foldedExistingRoutable = hasRoutableDeliveryContext((0, _deliveryContextSharedMTeaAgYN.n)(foldedExisting));
    if (!foldedExisting || entryRoutable && !foldedExistingRoutable || entryRoutable === foldedExistingRoutable && (entry.updatedAt ?? 0) > (foldedExisting.updatedAt ?? 0)) index.set(foldedLegacyKey, entry);
  }
  return index;
}
function loadDeliverySessionEntry(params) {
  const canonicalKey = (0, _combinedStoreGatewayDHN_Y2YM.a)({
    cfg: params.cfg,
    sessionKey: params.sessionKey
  });
  const canonicalBaseKey = (0, _combinedStoreGatewayDHN_Y2YM.a)({
    cfg: params.cfg,
    sessionKey: params.baseSessionKey
  });
  const agentId = (0, _combinedStoreGatewayDHN_Y2YM.i)(params.cfg, canonicalKey);
  const sessionKeys = [params.sessionKey, canonicalKey];
  const baseKeys = [params.baseSessionKey, canonicalBaseKey];
  let fallback;
  for (const storePath of resolveDeliveryStorePaths(params.cfg, agentId)) {
    const store = (0, _storeLoadBzczsLeI.t)(storePath);
    const entry = findSessionEntryInStore(store, sessionKeys);
    const baseEntry = findSessionEntryInStore(store, baseKeys);
    if (!entry && !baseEntry) continue;
    fallback ??= {
      entry,
      baseEntry
    };
    if (hasRoutableDeliveryContext((0, _deliveryContextSharedMTeaAgYN.n)(entry)) || hasRoutableDeliveryContext((0, _deliveryContextSharedMTeaAgYN.n)(baseEntry))) return {
      entry,
      baseEntry
    };
  }
  return fallback ?? {
    entry: void 0,
    baseEntry: void 0
  };
}
//#endregion
//#region src/config/sessions/main-session.runtime.ts
function resolveMainSessionKeyFromConfig() {
  return (0, _mainSessionBIlePcj.i)((0, _ioCiCdMMvQ.i)());
}
//#endregion
//#region src/config/sessions/lifecycle.ts
function resolveTimestamp(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : void 0;
}
function parseTimestampMs(value) {
  if (typeof value === "number") return resolveTimestamp(value);
  if (typeof value !== "string" || !value.trim()) return;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : void 0;
}
function readFirstLine(filePath) {
  try {
    const fd = _nodeFs.default.openSync(filePath, "r");
    try {
      const buffer = Buffer.alloc(8192);
      const bytesRead = _nodeFs.default.readSync(fd, buffer, 0, buffer.length, 0);
      if (bytesRead <= 0) return;
      const chunk = buffer.subarray(0, bytesRead).toString("utf8");
      const newline = chunk.indexOf("\n");
      return newline >= 0 ? chunk.slice(0, newline) : chunk;
    } finally {
      _nodeFs.default.closeSync(fd);
    }
  } catch {
    return;
  }
}
function readSessionHeaderStartedAtMs(params) {
  const sessionId = params.entry?.sessionId?.trim();
  if (!sessionId) return;
  const pathOptions = params.pathOptions ?? (0, _pathsRbVDOqFp.a)({
    agentId: params.agentId,
    storePath: params.storePath
  });
  let sessionFile;
  try {
    sessionFile = (0, _pathsRbVDOqFp.i)(sessionId, params.entry, pathOptions);
  } catch {
    return;
  }
  const firstLine = readFirstLine(sessionFile);
  if (!firstLine) return;
  try {
    const header = JSON.parse(firstLine);
    if (header.type !== "session") return;
    if (typeof header.id === "string" && header.id.trim() && header.id !== sessionId) return;
    return parseTimestampMs(header.timestamp);
  } catch {
    return;
  }
}
function resolveSessionLifecycleTimestamps(params) {
  const entry = params.entry;
  if (!entry) return {};
  return {
    sessionStartedAt: resolveTimestamp(entry.sessionStartedAt) ?? readSessionHeaderStartedAtMs({
      entry,
      agentId: params.agentId,
      storePath: params.storePath,
      pathOptions: params.pathOptions
    }),
    lastInteractionAt: resolveTimestamp(entry.lastInteractionAt)
  };
}
//#endregion
//#region src/config/sessions/session-file-rotation.ts
function rewriteSessionFileForNewSessionId(params) {
  const trimmed = (0, _stringCoerceLndEvhRk.c)(params.sessionFile);
  if (!trimmed) return;
  const base = _nodePath.default.basename(trimmed);
  if (!base.endsWith(".jsonl")) return;
  const withoutExt = base.slice(0, -6);
  if (withoutExt === params.previousSessionId) return _nodePath.default.join(_nodePath.default.dirname(trimmed), `${params.nextSessionId}.jsonl`);
  if (withoutExt.startsWith(`${params.previousSessionId}-topic-`)) return _nodePath.default.join(_nodePath.default.dirname(trimmed), `${params.nextSessionId}${base.slice(params.previousSessionId.length)}`);
  const forkMatch = withoutExt.match(/^(\d{4}-\d{2}-\d{2}T[\w-]+(?:Z|[+-]\d{2}(?:-\d{2})?)?)_(.+)$/);
  if (forkMatch?.[2] === params.previousSessionId) return _nodePath.default.join(_nodePath.default.dirname(trimmed), `${forkMatch[1]}_${params.nextSessionId}.jsonl`);
}
function canonicalizeAbsoluteSessionFilePath(filePath) {
  const resolved = _nodePath.default.resolve(filePath);
  const missingSegments = [];
  let cursor = resolved;
  while (true) try {
    return _nodePath.default.join(_nodeFs.default.realpathSync(cursor), ...missingSegments.toReversed());
  } catch {
    const parent = _nodePath.default.dirname(cursor);
    if (parent === cursor) return resolved;
    missingSegments.push(_nodePath.default.basename(cursor));
    cursor = parent;
  }
}
//#endregion
//#region src/config/sessions/cleanup-service.ts
function resolveSessionCleanupAction(params) {
  if (params.dmScopeRetiredKeys.has(params.key)) return "retire-dm-scope";
  if (params.missingKeys.has(params.key)) return "prune-missing";
  if (params.staleKeys.has(params.key)) return "prune-stale";
  if (params.cappedKeys.has(params.key)) return "cap-overflow";
  if (params.budgetEvictedKeys.has(params.key)) return "evict-budget";
  return "keep";
}
function isMainScopeStaleDirectSessionKey(params) {
  if ((params.cfg.session?.dmScope ?? "main") !== "main") return false;
  if (params.activeKey && params.key === params.activeKey) return false;
  const parsed = (0, _sessionKeyUtilsCJRKuBJA.c)(params.key);
  if (!parsed || (0, _sessionKeyCQewiu8n.c)(parsed.agentId) !== (0, _sessionKeyCQewiu8n.c)(params.targetAgentId)) return false;
  const parts = parsed.rest.split(":").filter(Boolean);
  return parts.length === 2 && parts[0] === "direct" || parts.length === 3 && parts[1] === "direct" || parts.length === 4 && parts[2] === "direct";
}
function rememberRemovedSessionFile(removedSessionFiles, entry) {
  if (entry?.sessionId) removedSessionFiles.set(entry.sessionId, entry.sessionFile);
}
function retireMainScopeDirectSessionEntries(params) {
  let retired = 0;
  for (const [key, entry] of Object.entries(params.store)) if (isMainScopeStaleDirectSessionKey({
    cfg: params.cfg,
    targetAgentId: params.targetAgentId,
    key,
    activeKey: params.activeKey
  })) {
    params.onRetired?.(key, entry);
    delete params.store[key];
    retired += 1;
  }
  return retired;
}
function serializeSessionCleanupResult(params) {
  if (params.summaries.length === 1) return params.summaries[0] ?? {};
  return {
    allAgents: true,
    mode: params.mode,
    dryRun: params.dryRun,
    stores: params.summaries
  };
}
function pruneMissingTranscriptEntries(params) {
  const sessionPathOpts = (0, _pathsRbVDOqFp.a)({ storePath: params.storePath });
  let removed = 0;
  for (const [key, entry] of Object.entries(params.store)) {
    if (!entry?.sessionId) {
      if ((0, _sessionKeyUtilsCJRKuBJA.c)(key)) continue;
      delete params.store[key];
      removed += 1;
      params.onPruned?.(key);
      continue;
    }
    let transcriptPath;
    try {
      transcriptPath = (0, _pathsRbVDOqFp.i)(entry.sessionId, entry, sessionPathOpts);
    } catch {}
    if (!transcriptPath || !_nodeFs.default.existsSync(transcriptPath)) {
      delete params.store[key];
      removed += 1;
      params.onPruned?.(key);
    }
  }
  return removed;
}
function addEntryArtifactPathsToSet(params) {
  const sessionsDir = _nodePath.default.dirname(params.storePath);
  for (const key of params.keys) {
    const entry = params.store[key];
    if (!entry) continue;
    for (const artifactPath of (0, _storeC86lM9dg.y)({
      sessionsDir,
      entry
    })) params.paths.add(artifactPath);
  }
}
async function previewStoreCleanup(params) {
  const beforeStore = (0, _storeLoadBzczsLeI.t)(params.target.storePath, { skipCache: true });
  const previewStore = (0, _storeLoadBzczsLeI.c)(beforeStore);
  const staleKeys = /* @__PURE__ */new Set();
  const cappedKeys = /* @__PURE__ */new Set();
  const missingKeys = /* @__PURE__ */new Set();
  const dmScopeRetiredKeys = /* @__PURE__ */new Set();
  const missing = params.fixMissing === true ? pruneMissingTranscriptEntries({
    store: previewStore,
    storePath: params.target.storePath,
    onPruned: (key) => {
      missingKeys.add(key);
    }
  }) : 0;
  const dmScopeRetired = params.fixDmScope === true ? retireMainScopeDirectSessionEntries({
    cfg: params.cfg,
    store: previewStore,
    targetAgentId: params.target.agentId,
    activeKey: params.activeKey,
    onRetired: (key) => {
      dmScopeRetiredKeys.add(key);
    }
  }) : 0;
  const preserveSessionKeys = (0, _storeLoadBzczsLeI.i)([params.activeKey]);
  const pruned = (0, _storeLoadBzczsLeI.v)(previewStore, params.maintenance.pruneAfterMs, {
    log: false,
    preserveKeys: preserveSessionKeys,
    onPruned: ({ key }) => {
      staleKeys.add(key);
    }
  });
  const capped = (0, _storeLoadBzczsLeI.h)(previewStore, params.maintenance.maxEntries, {
    log: false,
    preserveKeys: preserveSessionKeys,
    onCapped: ({ key }) => {
      cappedKeys.add(key);
    }
  });
  const entryCleanupArtifactPaths = /* @__PURE__ */new Set();
  addEntryArtifactPathsToSet({
    paths: entryCleanupArtifactPaths,
    store: beforeStore,
    storePath: params.target.storePath,
    keys: staleKeys
  });
  addEntryArtifactPathsToSet({
    paths: entryCleanupArtifactPaths,
    store: beforeStore,
    storePath: params.target.storePath,
    keys: cappedKeys
  });
  addEntryArtifactPathsToSet({
    paths: entryCleanupArtifactPaths,
    store: beforeStore,
    storePath: params.target.storePath,
    keys: dmScopeRetiredKeys
  });
  const beforeBudgetStore = (0, _storeLoadBzczsLeI.c)(previewStore);
  const budgetRemovedFilePaths = /* @__PURE__ */new Set();
  const diskBudget = await (0, _storeC86lM9dg._)({
    store: previewStore,
    storePath: params.target.storePath,
    activeSessionKey: params.activeKey,
    preserveKeys: preserveSessionKeys,
    maintenance: params.maintenance,
    warnOnly: false,
    dryRun: true,
    onRemoveFile: (canonicalPath) => {
      budgetRemovedFilePaths.add(canonicalPath);
    }
  });
  const unreferencedArtifacts = await (0, _storeC86lM9dg.v)({
    store: previewStore,
    storePath: params.target.storePath,
    olderThanMs: params.maintenance.pruneAfterMs,
    dryRun: true,
    excludeCanonicalPaths: new Set([...budgetRemovedFilePaths, ...entryCleanupArtifactPaths])
  });
  const budgetEvictedKeys = /* @__PURE__ */new Set();
  for (const key of Object.keys(beforeBudgetStore)) if (!Object.hasOwn(previewStore, key)) budgetEvictedKeys.add(key);
  const beforeCount = Object.keys(beforeStore).length;
  const afterPreviewCount = Object.keys(previewStore).length;
  const wouldMutate = missing > 0 || dmScopeRetired > 0 || pruned > 0 || capped > 0 || unreferencedArtifacts.removedFiles > 0 || (diskBudget?.removedEntries ?? 0) > 0 || (diskBudget?.removedFiles ?? 0) > 0;
  return {
    summary: {
      agentId: params.target.agentId,
      storePath: params.target.storePath,
      mode: params.mode,
      dryRun: params.dryRun,
      beforeCount,
      afterCount: afterPreviewCount,
      missing,
      dmScopeRetired,
      pruned,
      capped,
      unreferencedArtifacts,
      diskBudget,
      wouldMutate
    },
    beforeStore,
    missingKeys,
    staleKeys,
    cappedKeys,
    budgetEvictedKeys,
    dmScopeRetiredKeys
  };
}
async function runSessionsCleanup(params) {
  const { cfg, opts } = params;
  const maintenance = (0, _storeLoadBzczsLeI.r)();
  const mode = opts.enforce ? "enforce" : maintenance.mode;
  const targets = params.targets ?? (0, _targetsB3qI57M.a)(cfg, {
    store: opts.store,
    agent: opts.agent,
    allAgents: opts.allAgents
  });
  const previewResults = [];
  for (const target of targets) {
    const result = await previewStoreCleanup({
      cfg,
      target,
      maintenance,
      mode,
      dryRun: Boolean(opts.dryRun),
      activeKey: opts.activeKey,
      fixMissing: Boolean(opts.fixMissing),
      fixDmScope: Boolean(opts.fixDmScope)
    });
    previewResults.push(result);
  }
  const appliedSummaries = [];
  if (!opts.dryRun) for (const target of targets) {
    const appliedReportRef = { current: null };
    const dmScopeRemovedSessionFiles = /* @__PURE__ */new Map();
    let missingApplied = 0;
    let dmScopeRetiredApplied = 0;
    await (0, _storeC86lM9dg.s)(target.storePath, async (store) => {
      let removed = 0;
      if (opts.fixMissing) {
        missingApplied = pruneMissingTranscriptEntries({
          store,
          storePath: target.storePath
        });
        removed += missingApplied;
      }
      if (opts.fixDmScope) {
        dmScopeRetiredApplied = retireMainScopeDirectSessionEntries({
          cfg,
          store,
          targetAgentId: target.agentId,
          activeKey: opts.activeKey,
          onRetired: (_key, entry) => {
            rememberRemovedSessionFile(dmScopeRemovedSessionFiles, entry);
          }
        });
        removed += dmScopeRetiredApplied;
      }
      return removed;
    }, {
      activeSessionKey: opts.activeKey,
      maintenanceOverride: { mode },
      onMaintenanceApplied: (report) => {
        appliedReportRef.current = report;
      }
    });
    if (dmScopeRemovedSessionFiles.size > 0) {
      const storeAfterDmScopeRetire = (0, _storeLoadBzczsLeI.t)(target.storePath, { skipCache: true });
      await (0, _storeC86lM9dg.t)({
        removedSessionFiles: dmScopeRemovedSessionFiles,
        referencedSessionIds: new Set(Object.values(storeAfterDmScopeRetire).map((entry) => entry?.sessionId).filter((id) => Boolean(id))),
        storePath: target.storePath,
        reason: "deleted",
        restrictToStoreDir: true
      });
    }
    const afterStore = (0, _storeLoadBzczsLeI.t)(target.storePath, { skipCache: true });
    const unreferencedArtifacts = mode === "warn" ? {
      scannedFiles: 0,
      removedFiles: 0,
      freedBytes: 0,
      olderThanMs: maintenance.pruneAfterMs
    } : await (0, _storeC86lM9dg.v)({
      store: afterStore,
      storePath: target.storePath,
      olderThanMs: maintenance.pruneAfterMs,
      dryRun: false
    });
    const preview = previewResults.find((result) => result.summary.storePath === target.storePath);
    const appliedReport = appliedReportRef.current;
    const summary = appliedReport === null ? {
      ...(preview?.summary ?? {
        agentId: target.agentId,
        storePath: target.storePath,
        mode,
        dryRun: false,
        beforeCount: 0,
        afterCount: 0,
        missing: 0,
        dmScopeRetired: 0,
        pruned: 0,
        capped: 0,
        unreferencedArtifacts,
        diskBudget: null,
        wouldMutate: false
      }),
      dryRun: false,
      unreferencedArtifacts,
      wouldMutate: (preview?.summary.wouldMutate ?? false) || unreferencedArtifacts.removedFiles > 0,
      applied: true,
      appliedCount: Object.keys(afterStore).length
    } : {
      agentId: target.agentId,
      storePath: target.storePath,
      mode: appliedReport.mode,
      dryRun: false,
      beforeCount: appliedReport.beforeCount,
      afterCount: appliedReport.afterCount,
      missing: missingApplied,
      dmScopeRetired: dmScopeRetiredApplied,
      pruned: appliedReport.pruned,
      capped: appliedReport.capped,
      unreferencedArtifacts,
      diskBudget: appliedReport.diskBudget,
      wouldMutate: missingApplied > 0 || dmScopeRetiredApplied > 0 || appliedReport.pruned > 0 || appliedReport.capped > 0 || unreferencedArtifacts.removedFiles > 0 || (appliedReport.diskBudget?.removedEntries ?? 0) > 0 || (appliedReport.diskBudget?.removedFiles ?? 0) > 0,
      applied: true,
      appliedCount: Object.keys(afterStore).length
    };
    appliedSummaries.push(summary);
  }
  return {
    mode,
    previewResults,
    appliedSummaries
  };
}
/** Purge session store entries for a deleted agent (#65524). Best-effort. */
async function purgeAgentSessionStoreEntries(cfg, agentId) {
  try {
    const normalizedAgentId = (0, _sessionKeyCQewiu8n.c)(agentId);
    const storeConfig = cfg.session?.store;
    const storeAgentId = typeof storeConfig === "string" && storeConfig.includes("{agentId}") ? normalizedAgentId : (0, _sessionKeyCQewiu8n.c)((0, _agentScopeConfigDCRwWQZy.c)(cfg));
    await (0, _storeC86lM9dg.s)((0, _pathsRbVDOqFp.u)(cfg.session?.store, { agentId: normalizedAgentId }), (store) => {
      for (const key of Object.keys(store)) if ((0, _combinedStoreGatewayDHN_Y2YM.s)({
        cfg,
        agentId: storeAgentId,
        sessionKey: key
      }) === normalizedAgentId) delete store[key];
    });
  } catch (err) {
    (0, _loggerD7Ndr2M.i)().debug("session store purge skipped during agent delete", err);
  }
}
//#endregion /* v9-0ce0f8246c846260 */
