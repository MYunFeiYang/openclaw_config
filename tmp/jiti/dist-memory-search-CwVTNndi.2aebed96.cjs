"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = resolveMemorySearchSyncConfig;exports.t = resolveMemorySearchConfig;var _pathsB2cMKWd = require("./paths-B2cMK-wd.js");
var _utilsDvkbxKCZ = require("./utils-DvkbxKCZ.js");
var _providerIdDMUF3fJY = require("./provider-id-DMUF3fJY.js");
var _agentScopeRNt6KatQ = require("./agent-scope-RNt6KatQ.js");
var _memoryEmbeddingProvidersD8pp5pMx = require("./memory-embedding-providers-D8pp5pMx.js");
var _multimodalBR2nwsNX = require("./multimodal-BR2nwsNX.js");
var _nodePath = _interopRequireDefault(require("node:path"));
var _nodeOs = _interopRequireDefault(require("node:os"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}
//#region src/agents/memory-search.ts
const DEFAULT_CHUNK_TOKENS = 400;
const DEFAULT_CHUNK_OVERLAP = 80;
const DEFAULT_WATCH_DEBOUNCE_MS = 1500;
const DEFAULT_SESSION_DELTA_BYTES = 1e5;
const DEFAULT_SESSION_DELTA_MESSAGES = 50;
const DEFAULT_MAX_RESULTS = 6;
const DEFAULT_MIN_SCORE = .35;
const DEFAULT_HYBRID_ENABLED = true;
const DEFAULT_HYBRID_VECTOR_WEIGHT = .7;
const DEFAULT_HYBRID_TEXT_WEIGHT = .3;
const DEFAULT_HYBRID_CANDIDATE_MULTIPLIER = 4;
const DEFAULT_MMR_ENABLED = false;
const DEFAULT_MMR_LAMBDA = .7;
const DEFAULT_TEMPORAL_DECAY_ENABLED = false;
const DEFAULT_TEMPORAL_DECAY_HALF_LIFE_DAYS = 30;
const DEFAULT_CACHE_ENABLED = true;
const DEFAULT_SOURCES = ["memory"];
function normalizeSources(sources, sessionMemoryEnabled) {
  const normalized = /* @__PURE__ */new Set();
  const input = sources?.length ? sources : DEFAULT_SOURCES;
  for (const source of input) {
    if (source === "memory") normalized.add("memory");
    if (source === "sessions" && sessionMemoryEnabled) normalized.add("sessions");
  }
  if (normalized.size === 0) normalized.add("memory");
  return Array.from(normalized);
}
function resolveStorePath(agentId, raw) {
  const stateDir = (0, _pathsB2cMKWd._)(process.env, _nodeOs.default.homedir);
  const fallback = _nodePath.default.join(stateDir, "memory", `${agentId}.sqlite`);
  if (!raw) return fallback;
  return (0, _utilsDvkbxKCZ.p)(raw.includes("{agentId}") ? raw.replaceAll("{agentId}", agentId) : raw);
}
function getConfiguredMemoryEmbeddingProvider(providerId, cfg) {
  const directAdapter = (0, _memoryEmbeddingProvidersD8pp5pMx.n)(providerId);
  if (directAdapter) return directAdapter;
  const ownerApi = (0, _providerIdDMUF3fJY.n)(cfg.models?.providers, providerId)?.api?.trim();
  if (!ownerApi) return;
  const normalizedProvider = (0, _providerIdDMUF3fJY.r)(providerId);
  const normalizedOwner = (0, _providerIdDMUF3fJY.r)(ownerApi);
  if (!normalizedOwner || normalizedOwner === normalizedProvider) return;
  return (0, _memoryEmbeddingProvidersD8pp5pMx.n)(normalizedOwner);
}
function mergeConfig(cfg, defaults, overrides, agentId) {
  const enabled = overrides?.enabled ?? defaults?.enabled ?? true;
  const sessionMemory = overrides?.experimental?.sessionMemory ?? defaults?.experimental?.sessionMemory ?? false;
  const provider = overrides?.provider ?? defaults?.provider ?? "auto";
  const primaryAdapter = provider === "auto" ? void 0 : getConfiguredMemoryEmbeddingProvider(provider, cfg);
  const defaultRemote = defaults?.remote;
  const overrideRemote = overrides?.remote;
  const fallback = overrides?.fallback ?? defaults?.fallback ?? "none";
  const fallbackAdapter = fallback && fallback !== "none" ? getConfiguredMemoryEmbeddingProvider(fallback, cfg) : void 0;
  const includeRemote = Boolean(overrideRemote?.baseUrl || overrideRemote?.apiKey || overrideRemote?.headers || overrideRemote?.nonBatchConcurrency != null || defaultRemote?.baseUrl || defaultRemote?.apiKey || defaultRemote?.headers || defaultRemote?.nonBatchConcurrency != null) || provider === "auto" || primaryAdapter?.transport !== "local" || fallbackAdapter?.transport === "remote";
  const batch = {
    enabled: overrideRemote?.batch?.enabled ?? defaultRemote?.batch?.enabled ?? false,
    wait: overrideRemote?.batch?.wait ?? defaultRemote?.batch?.wait ?? true,
    concurrency: Math.max(1, overrideRemote?.batch?.concurrency ?? defaultRemote?.batch?.concurrency ?? 2),
    pollIntervalMs: overrideRemote?.batch?.pollIntervalMs ?? defaultRemote?.batch?.pollIntervalMs ?? 2e3,
    timeoutMinutes: overrideRemote?.batch?.timeoutMinutes ?? defaultRemote?.batch?.timeoutMinutes ?? 60
  };
  const remote = includeRemote ? {
    baseUrl: overrideRemote?.baseUrl ?? defaultRemote?.baseUrl,
    apiKey: overrideRemote?.apiKey ?? defaultRemote?.apiKey,
    headers: overrideRemote?.headers ?? defaultRemote?.headers,
    nonBatchConcurrency: overrideRemote?.nonBatchConcurrency ?? defaultRemote?.nonBatchConcurrency,
    batch
  } : void 0;
  const modelDefault = provider === "auto" ? void 0 : primaryAdapter?.defaultModel;
  const model = overrides?.model ?? defaults?.model ?? modelDefault ?? "";
  const inputType = overrides?.inputType?.trim() || defaults?.inputType?.trim() || void 0;
  const queryInputType = overrides?.queryInputType?.trim() || defaults?.queryInputType?.trim() || void 0;
  const documentInputType = overrides?.documentInputType?.trim() || defaults?.documentInputType?.trim() || void 0;
  const outputDimensionality = overrides?.outputDimensionality ?? defaults?.outputDimensionality;
  const local = {
    modelPath: overrides?.local?.modelPath ?? defaults?.local?.modelPath,
    modelCacheDir: overrides?.local?.modelCacheDir ?? defaults?.local?.modelCacheDir,
    contextSize: overrides?.local?.contextSize ?? defaults?.local?.contextSize
  };
  const sources = normalizeSources(overrides?.sources ?? defaults?.sources, sessionMemory);
  const rawPaths = [...(defaults?.extraPaths ?? []), ...(overrides?.extraPaths ?? [])].map((value) => value.trim()).filter(Boolean);
  const extraPaths = Array.from(new Set(rawPaths));
  const multimodal = (0, _multimodalBR2nwsNX.o)({
    enabled: overrides?.multimodal?.enabled ?? defaults?.multimodal?.enabled,
    modalities: overrides?.multimodal?.modalities ?? defaults?.multimodal?.modalities,
    maxFileBytes: overrides?.multimodal?.maxFileBytes ?? defaults?.multimodal?.maxFileBytes
  });
  const vector = {
    enabled: overrides?.store?.vector?.enabled ?? defaults?.store?.vector?.enabled ?? true,
    extensionPath: overrides?.store?.vector?.extensionPath ?? defaults?.store?.vector?.extensionPath
  };
  const fts = { tokenizer: overrides?.store?.fts?.tokenizer ?? defaults?.store?.fts?.tokenizer ?? "unicode61" };
  const store = {
    driver: overrides?.store?.driver ?? defaults?.store?.driver ?? "sqlite",
    path: resolveStorePath(agentId, overrides?.store?.path ?? defaults?.store?.path),
    fts,
    vector
  };
  const chunking = {
    tokens: overrides?.chunking?.tokens ?? defaults?.chunking?.tokens ?? DEFAULT_CHUNK_TOKENS,
    overlap: overrides?.chunking?.overlap ?? defaults?.chunking?.overlap ?? DEFAULT_CHUNK_OVERLAP
  };
  const sync = resolveSyncConfig(defaults, overrides);
  const query = {
    maxResults: overrides?.query?.maxResults ?? defaults?.query?.maxResults ?? DEFAULT_MAX_RESULTS,
    minScore: overrides?.query?.minScore ?? defaults?.query?.minScore ?? DEFAULT_MIN_SCORE
  };
  const hybrid = {
    enabled: overrides?.query?.hybrid?.enabled ?? defaults?.query?.hybrid?.enabled ?? DEFAULT_HYBRID_ENABLED,
    vectorWeight: overrides?.query?.hybrid?.vectorWeight ?? defaults?.query?.hybrid?.vectorWeight ?? DEFAULT_HYBRID_VECTOR_WEIGHT,
    textWeight: overrides?.query?.hybrid?.textWeight ?? defaults?.query?.hybrid?.textWeight ?? DEFAULT_HYBRID_TEXT_WEIGHT,
    candidateMultiplier: overrides?.query?.hybrid?.candidateMultiplier ?? defaults?.query?.hybrid?.candidateMultiplier ?? DEFAULT_HYBRID_CANDIDATE_MULTIPLIER,
    mmr: {
      enabled: overrides?.query?.hybrid?.mmr?.enabled ?? defaults?.query?.hybrid?.mmr?.enabled ?? DEFAULT_MMR_ENABLED,
      lambda: overrides?.query?.hybrid?.mmr?.lambda ?? defaults?.query?.hybrid?.mmr?.lambda ?? DEFAULT_MMR_LAMBDA
    },
    temporalDecay: {
      enabled: overrides?.query?.hybrid?.temporalDecay?.enabled ?? defaults?.query?.hybrid?.temporalDecay?.enabled ?? DEFAULT_TEMPORAL_DECAY_ENABLED,
      halfLifeDays: overrides?.query?.hybrid?.temporalDecay?.halfLifeDays ?? defaults?.query?.hybrid?.temporalDecay?.halfLifeDays ?? DEFAULT_TEMPORAL_DECAY_HALF_LIFE_DAYS
    }
  };
  const cache = {
    enabled: overrides?.cache?.enabled ?? defaults?.cache?.enabled ?? DEFAULT_CACHE_ENABLED,
    maxEntries: overrides?.cache?.maxEntries ?? defaults?.cache?.maxEntries
  };
  const overlap = (0, _utilsDvkbxKCZ.i)(chunking.overlap, 0, Math.max(0, chunking.tokens - 1));
  const minScore = (0, _utilsDvkbxKCZ.i)(query.minScore, 0, 1);
  const vectorWeight = (0, _utilsDvkbxKCZ.i)(hybrid.vectorWeight, 0, 1);
  const textWeight = (0, _utilsDvkbxKCZ.i)(hybrid.textWeight, 0, 1);
  const sum = vectorWeight + textWeight;
  const normalizedVectorWeight = sum > 0 ? vectorWeight / sum : DEFAULT_HYBRID_VECTOR_WEIGHT;
  const normalizedTextWeight = sum > 0 ? textWeight / sum : DEFAULT_HYBRID_TEXT_WEIGHT;
  const candidateMultiplier = (0, _utilsDvkbxKCZ.r)(hybrid.candidateMultiplier, 1, 20);
  const temporalDecayHalfLifeDays = Math.max(1, Math.floor(Number.isFinite(hybrid.temporalDecay.halfLifeDays) ? hybrid.temporalDecay.halfLifeDays : DEFAULT_TEMPORAL_DECAY_HALF_LIFE_DAYS));
  const deltaBytes = (0, _utilsDvkbxKCZ.r)(sync.sessions.deltaBytes, 0, Number.MAX_SAFE_INTEGER);
  const deltaMessages = (0, _utilsDvkbxKCZ.r)(sync.sessions.deltaMessages, 0, Number.MAX_SAFE_INTEGER);
  const postCompactionForce = sync.sessions.postCompactionForce;
  return {
    enabled,
    sources,
    extraPaths,
    multimodal,
    provider,
    remote,
    experimental: { sessionMemory },
    fallback,
    model,
    inputType,
    queryInputType,
    documentInputType,
    outputDimensionality,
    local,
    store,
    chunking: {
      tokens: Math.max(1, chunking.tokens),
      overlap
    },
    sync: {
      ...sync,
      sessions: {
        deltaBytes,
        deltaMessages,
        postCompactionForce
      }
    },
    query: {
      ...query,
      minScore,
      hybrid: {
        enabled: hybrid.enabled,
        vectorWeight: normalizedVectorWeight,
        textWeight: normalizedTextWeight,
        candidateMultiplier,
        mmr: {
          enabled: hybrid.mmr.enabled,
          lambda: Number.isFinite(hybrid.mmr.lambda) ? Math.max(0, Math.min(1, hybrid.mmr.lambda)) : DEFAULT_MMR_LAMBDA
        },
        temporalDecay: {
          enabled: hybrid.temporalDecay.enabled,
          halfLifeDays: temporalDecayHalfLifeDays
        }
      }
    },
    cache: {
      enabled: cache.enabled,
      maxEntries: typeof cache.maxEntries === "number" && Number.isFinite(cache.maxEntries) ? Math.max(1, Math.floor(cache.maxEntries)) : void 0
    }
  };
}
function resolveSyncConfig(defaults, overrides) {
  return {
    onSessionStart: overrides?.sync?.onSessionStart ?? defaults?.sync?.onSessionStart ?? true,
    onSearch: overrides?.sync?.onSearch ?? defaults?.sync?.onSearch ?? true,
    watch: overrides?.sync?.watch ?? defaults?.sync?.watch ?? true,
    watchDebounceMs: overrides?.sync?.watchDebounceMs ?? defaults?.sync?.watchDebounceMs ?? DEFAULT_WATCH_DEBOUNCE_MS,
    intervalMinutes: overrides?.sync?.intervalMinutes ?? defaults?.sync?.intervalMinutes ?? 0,
    embeddingBatchTimeoutSeconds: overrides?.sync?.embeddingBatchTimeoutSeconds ?? defaults?.sync?.embeddingBatchTimeoutSeconds,
    sessions: {
      deltaBytes: overrides?.sync?.sessions?.deltaBytes ?? defaults?.sync?.sessions?.deltaBytes ?? DEFAULT_SESSION_DELTA_BYTES,
      deltaMessages: overrides?.sync?.sessions?.deltaMessages ?? defaults?.sync?.sessions?.deltaMessages ?? DEFAULT_SESSION_DELTA_MESSAGES,
      postCompactionForce: overrides?.sync?.sessions?.postCompactionForce ?? defaults?.sync?.sessions?.postCompactionForce ?? true
    }
  };
}
function resolveMemorySearchConfig(cfg, agentId) {
  const defaults = cfg.agents?.defaults?.memorySearch;
  const overrides = (0, _agentScopeRNt6KatQ.v)(cfg, agentId)?.memorySearch;
  const resolved = mergeConfig(cfg, defaults, overrides, agentId);
  if (!resolved.enabled) return null;
  const multimodalActive = (0, _multimodalBR2nwsNX.a)(resolved.multimodal);
  const multimodalProvider = resolved.provider === "auto" ? void 0 : getConfiguredMemoryEmbeddingProvider(resolved.provider, cfg);
  if (multimodalActive && multimodalProvider && !(multimodalProvider.supportsMultimodalEmbeddings?.({ model: resolved.model }) ?? false)) throw new Error("agents.*.memorySearch.multimodal requires a provider adapter that supports multimodal embeddings for the configured model.");
  if (multimodalActive && resolved.fallback !== "none") throw new Error("agents.*.memorySearch.multimodal does not support memorySearch.fallback. Set fallback to \"none\".");
  return resolved;
}
function resolveMemorySearchSyncConfig(cfg, agentId) {
  const defaults = cfg.agents?.defaults?.memorySearch;
  const overrides = (0, _agentScopeRNt6KatQ.v)(cfg, agentId)?.memorySearch;
  if (!(overrides?.enabled ?? defaults?.enabled ?? true)) return null;
  return resolveSyncConfig(defaults, overrides);
}
//#endregion /* v9-07ba5d5cf51f65e2 */
