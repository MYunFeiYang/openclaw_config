"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = transformConfigFile;exports.i = replaceConfigFile;exports.n = mutateConfigFile;exports.o = transformConfigFileWithRetry;exports.r = mutateConfigFileWithRetry;exports.t = void 0;var _pathsCnwfh6dH = require("./paths-Cnwfh6dH.js");
var _errorsIxwfrboQ = require("./errors-ixwfrboQ.js");
var _pathB5B_oAT = require("./path-B5B-_oAT.js");
var _utilsCKsuXgDI = require("./utils-CKsuXgDI.js");
var _replaceFileDfT5iHv = require("./replace-file-DfT5iHv1.js");
require("./scan-paths-BBag79CC.js");
var _ioCiCdMMvQ = require("./io-CiCdMMvQ.js");
var _includesBMPFSevO = require("./includes-BMPFSevO.js");
var _nixModeWriteGuardDxCJ9lzV = require("./nix-mode-write-guard-DxCJ9lzV.js");
var _runtimeSnapshotCXpARQsx = require("./runtime-snapshot-CXpARQsx.js");
var _fileLockCCOJxG = require("./file-lock-CCOJxG89.js");
require("./file-lock-n2tj_mjJ.js");
var _nodePath = _interopRequireDefault(require("node:path"));
var _promises = _interopRequireDefault(require("node:fs/promises"));
var _nodeUtil = require("node:util");
var _nodeAsync_hooks = require("node:async_hooks");function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}
//#region src/config/mutate.ts
const CONFIG_MUTATION_LOCK_OPTIONS = {
  retries: {
    retries: 80,
    factor: 1.2,
    minTimeout: 25,
    maxTimeout: 250,
    randomize: true
  },
  stale: 3e4
};
const DEFAULT_CONFIG_MUTATION_RETRY_ATTEMPTS = 5;
const activeConfigMutationLocks = new _nodeAsync_hooks.AsyncLocalStorage();
const configMutationQueueTails = /* @__PURE__ */new Map();
var ConfigMutationConflictError = class extends Error {
  constructor(message, params) {
    super(message);
    this.name = "ConfigMutationConflictError";
    this.currentHash = params.currentHash;
  }
};exports.t = ConfigMutationConflictError;
function assertBaseHashMatches(snapshot, expectedHash) {
  const currentHash = (0, _ioCiCdMMvQ.y)(snapshot) ?? null;
  if (expectedHash !== void 0 && expectedHash !== currentHash) throw new ConfigMutationConflictError("config changed since last load", { currentHash });
  return currentHash;
}
async function withConfigMutationLock(params, fn) {
  if (params.io) return await fn();
  const configPath = _nodePath.default.resolve(params.lockPath ?? (0, _pathsCnwfh6dH.o)());
  const activeLocks = activeConfigMutationLocks.getStore();
  if (activeLocks?.has(configPath)) return await fn();
  (0, _nixModeWriteGuardDxCJ9lzV.n)({ configPath });
  await _promises.default.mkdir(_nodePath.default.dirname(configPath), {
    recursive: true,
    mode: 448
  });
  const previousTail = configMutationQueueTails.get(configPath) ?? Promise.resolve();
  let releaseQueueSlot;
  const currentRun = new Promise((resolve) => {
    releaseQueueSlot = resolve;
  });
  const currentTail = previousTail.catch(() => void 0).then(() => currentRun);
  configMutationQueueTails.set(configPath, currentTail);
  await previousTail.catch(() => void 0);
  try {
    const nextActiveLocks = new Set(activeLocks ?? []);
    nextActiveLocks.add(configPath);
    return await activeConfigMutationLocks.run(nextActiveLocks, async () => await (0, _fileLockCCOJxG.o)(configPath, CONFIG_MUTATION_LOCK_OPTIONS, fn));
  } finally {
    releaseQueueSlot();
    if (configMutationQueueTails.get(configPath) === currentTail) configMutationQueueTails.delete(configPath);
  }
}
function markActiveConfigMutationPath(configPath) {
  activeConfigMutationLocks.getStore()?.add(_nodePath.default.resolve(configPath));
}
async function readConfigSnapshotForMutation(params) {
  if (params.io) return await params.io.readConfigFileSnapshotForWrite();
  return await (0, _ioCiCdMMvQ.d)({ skipPluginValidation: params.writeOptions?.skipPluginValidation });
}
function getChangedTopLevelKeys(base, next) {
  if (!(0, _utilsCKsuXgDI.c)(base) || !(0, _utilsCKsuXgDI.c)(next)) return (0, _nodeUtil.isDeepStrictEqual)(base, next) ? [] : ["<root>"];
  return [...new Set([...Object.keys(base), ...Object.keys(next)])].filter((key) => !(0, _nodeUtil.isDeepStrictEqual)(base[key], next[key]));
}
function getSingleTopLevelIncludeTarget(params) {
  if (!(0, _utilsCKsuXgDI.c)(params.snapshot.parsed)) return null;
  const authoredSection = params.snapshot.parsed[params.key];
  if (!(0, _utilsCKsuXgDI.c)(authoredSection)) return null;
  const keys = Object.keys(authoredSection);
  const includeValue = authoredSection[_includesBMPFSevO.r];
  if (keys.length !== 1 || typeof includeValue !== "string") return null;
  const rootDir = _nodePath.default.dirname(params.snapshot.path);
  const resolved = _nodePath.default.normalize(_nodePath.default.isAbsolute(includeValue) ? includeValue : _nodePath.default.resolve(rootDir, includeValue));
  if (!(0, _pathB5B_oAT.i)(rootDir, resolved)) return null;
  return resolved;
}
async function writeJsonFileAtomic(filePath, value) {
  await (0, _replaceFileDfT5iHv.n)({
    filePath,
    content: `${JSON.stringify(value, null, 2)}\n`,
    dirMode: 448,
    mode: 384,
    tempPrefix: _nodePath.default.basename(filePath),
    beforeRename: async () => {
      await _promises.default.access(filePath).then(async () => await (0, _ioCiCdMMvQ.q)(filePath, _promises.default), () => void 0);
    }
  });
}
async function tryWriteSingleTopLevelIncludeMutation(params) {
  const nextConfig = (0, _ioCiCdMMvQ.z)(params.nextConfig, (0, _ioCiCdMMvQ.B)(params.writeOptions?.unsetPaths));
  const changedKeys = getChangedTopLevelKeys(params.snapshot.sourceConfig, nextConfig);
  if (changedKeys.length !== 1 || changedKeys[0] === "<root>") return null;
  const key = changedKeys[0];
  const includePath = getSingleTopLevelIncludeTarget({
    snapshot: params.snapshot,
    key
  });
  if (!includePath || !(0, _utilsCKsuXgDI.c)(nextConfig) || !(key in nextConfig)) return null;
  const nextConfigRecord = nextConfig;
  const validated = (0, _ioCiCdMMvQ.T)(nextConfig, params.writeOptions?.skipPluginValidation ? { pluginValidation: "skip" } : void 0);
  if (!validated.ok) throw (0, _ioCiCdMMvQ.W)(params.snapshot.path, (0, _ioCiCdMMvQ.G)(validated.issues));
  const runtimeConfigSnapshot = (0, _runtimeSnapshotCXpARQsx.i)();
  const runtimeConfigSourceSnapshot = (0, _runtimeSnapshotCXpARQsx.s)();
  const hadRuntimeSnapshot = Boolean(runtimeConfigSnapshot);
  const hadBothSnapshots = Boolean(runtimeConfigSnapshot && runtimeConfigSourceSnapshot);
  await writeJsonFileAtomic(includePath, nextConfigRecord[key]);
  if (params.writeOptions?.skipRuntimeSnapshotRefresh && !hadRuntimeSnapshot && !(0, _runtimeSnapshotCXpARQsx.o)()) return {
    persistedHash: null,
    persistedConfig: nextConfig
  };
  const refreshedSnapshot = (await (params.io?.readConfigFileSnapshotForWrite ?? _ioCiCdMMvQ.d)(params.writeOptions?.skipPluginValidation ? { skipPluginValidation: true } : void 0)).snapshot;
  const persistedHash = (0, _ioCiCdMMvQ.y)(refreshedSnapshot);
  if (!refreshedSnapshot.valid) throw (0, _ioCiCdMMvQ.W)(params.snapshot.path, (0, _ioCiCdMMvQ.G)(refreshedSnapshot.issues));
  if (!persistedHash) throw new Error(`Config was written to ${params.snapshot.path}, but no persisted hash was available.`);
  const notifyCommittedWrite = () => {
    const currentRuntimeConfig = (0, _runtimeSnapshotCXpARQsx.i)();
    if (!currentRuntimeConfig) return;
    (0, _runtimeSnapshotCXpARQsx.u)((0, _runtimeSnapshotCXpARQsx.n)({
      configPath: params.snapshot.path,
      sourceConfig: refreshedSnapshot.sourceConfig,
      runtimeConfig: currentRuntimeConfig,
      persistedHash,
      afterWrite: params.afterWrite ?? params.writeOptions?.afterWrite
    }));
  };
  await (0, _runtimeSnapshotCXpARQsx.r)({
    nextSourceConfig: refreshedSnapshot.sourceConfig,
    refreshOptions: params.writeOptions?.runtimeRefresh,
    hadRuntimeSnapshot,
    hadBothSnapshots,
    loadFreshConfig: () => refreshedSnapshot.runtimeConfig,
    notifyCommittedWrite,
    formatRefreshError: (error) => (0, _errorsIxwfrboQ.i)(error),
    createRefreshError: (detail, cause) => new Error(`Config was written to ${params.snapshot.path}, but runtime snapshot refresh failed: ${detail}`, { cause })
  });
  return {
    persistedHash,
    persistedConfig: refreshedSnapshot.sourceConfig
  };
}
function resolveConfigWriteResult(result, fallbackConfig) {
  if (result) return {
    persistedHash: result.persistedHash,
    persistedConfig: result.persistedConfig
  };
  return {
    persistedHash: null,
    persistedConfig: fallbackConfig
  };
}
async function replaceConfigFile(params) {
  return await withConfigMutationLock({
    io: params.io,
    lockPath: params.snapshot?.path
  }, async () => await replaceConfigFileUnlocked(params));
}
async function replaceConfigFileUnlocked(params) {
  const { snapshot, writeOptions } = params.snapshot && params.writeOptions ? {
    snapshot: params.snapshot,
    writeOptions: params.writeOptions
  } : await readConfigSnapshotForMutation({
    io: params.io,
    writeOptions: params.writeOptions
  });
  (0, _nixModeWriteGuardDxCJ9lzV.n)({ configPath: snapshot.path });
  markActiveConfigMutationPath(snapshot.path);
  const previousHash = assertBaseHashMatches(snapshot, params.baseHash);
  const afterWrite = (0, _runtimeSnapshotCXpARQsx.p)(params.afterWrite ?? params.writeOptions?.afterWrite);
  let writeResult = await tryWriteSingleTopLevelIncludeMutation({
    snapshot,
    nextConfig: params.nextConfig,
    afterWrite,
    writeOptions: params.writeOptions ?? writeOptions,
    io: params.io
  });
  if (!writeResult) writeResult = resolveConfigWriteResult(await (params.io?.writeConfigFile ?? _ioCiCdMMvQ.b)(params.nextConfig, {
    baseSnapshot: snapshot,
    ...writeOptions,
    ...params.writeOptions,
    afterWrite
  }), params.nextConfig);
  return {
    path: snapshot.path,
    previousHash,
    snapshot,
    nextConfig: writeResult.persistedConfig,
    persistedHash: writeResult.persistedHash,
    afterWrite,
    followUp: (0, _runtimeSnapshotCXpARQsx.m)(afterWrite)
  };
}
async function commitPreparedConfigMutation(params) {
  const result = await replaceConfigFileUnlocked({
    nextConfig: params.nextConfig,
    snapshot: params.snapshot,
    baseHash: params.baseHash,
    writeOptions: {
      ...params.writeOptions,
      afterWrite: params.afterWrite
    },
    io: params.io
  });
  return {
    config: result.nextConfig,
    persistedHash: result.persistedHash,
    afterWrite: result.afterWrite
  };
}
async function transformConfigFileAttempt(params, attempt) {
  const { snapshot, writeOptions } = await readConfigSnapshotForMutation({
    io: params.io,
    writeOptions: params.writeOptions
  });
  (0, _nixModeWriteGuardDxCJ9lzV.n)({ configPath: snapshot.path });
  markActiveConfigMutationPath(snapshot.path);
  const previousHash = assertBaseHashMatches(snapshot, params.baseHash);
  const baseConfig = params.base === "runtime" ? snapshot.runtimeConfig : snapshot.sourceConfig;
  const afterWrite = (0, _runtimeSnapshotCXpARQsx.p)(params.afterWrite ?? params.writeOptions?.afterWrite);
  const mergedWriteOptions = {
    ...writeOptions,
    ...params.writeOptions
  };
  const transformed = await params.transform(baseConfig, {
    snapshot,
    previousHash,
    attempt
  });
  const committed = await (params.commit ?? commitPreparedConfigMutation)({
    nextConfig: transformed.nextConfig,
    snapshot,
    ...(previousHash !== null ? { baseHash: previousHash } : {}),
    writeOptions: mergedWriteOptions,
    afterWrite,
    io: params.io
  });
  const committedAfterWrite = committed.afterWrite ?? afterWrite;
  return {
    path: snapshot.path,
    previousHash,
    snapshot,
    nextConfig: committed.config,
    persistedHash: committed.persistedHash,
    result: transformed.result,
    attempts: attempt + 1,
    afterWrite: committedAfterWrite,
    followUp: (0, _runtimeSnapshotCXpARQsx.m)(committedAfterWrite)
  };
}
async function transformConfigFile(params) {
  return await withConfigMutationLock({ io: params.io }, async () => await transformConfigFileAttempt(params, 0));
}
async function transformConfigFileWithRetry(params) {
  const maxAttempts = params.maxAttempts ?? DEFAULT_CONFIG_MUTATION_RETRY_ATTEMPTS;
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) throw new Error("Config mutation maxAttempts must be a positive integer.");
  return await withConfigMutationLock({ io: params.io }, async () => {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) try {
      return await transformConfigFileAttempt(params, attempt);
    } catch (err) {
      if (err instanceof ConfigMutationConflictError && attempt < maxAttempts - 1) continue;
      throw err;
    }
    throw new Error("Config mutation retry loop exhausted unexpectedly.");
  });
}
async function mutateConfigFile(params) {
  return await transformConfigFile({
    base: params.base,
    baseHash: params.baseHash,
    afterWrite: params.afterWrite,
    writeOptions: params.writeOptions,
    io: params.io,
    transform: async (currentConfig, context) => {
      const draft = structuredClone(currentConfig);
      return {
        nextConfig: draft,
        result: await params.mutate(draft, context)
      };
    }
  });
}
async function mutateConfigFileWithRetry(params) {
  return await transformConfigFileWithRetry({
    base: params.base,
    baseHash: params.baseHash,
    maxAttempts: params.maxAttempts,
    afterWrite: params.afterWrite,
    writeOptions: params.writeOptions,
    io: params.io,
    transform: async (currentConfig, context) => {
      const draft = structuredClone(currentConfig);
      return {
        nextConfig: draft,
        result: await params.mutate(draft, context)
      };
    }
  });
}
//#endregion /* v9-487d7c353b1cc0c7 */
