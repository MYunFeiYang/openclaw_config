"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = getFsSafeLockConfig;exports.t = createSidecarLockManager;var _fileIdentityPAmF0zvV = require("./file-identity-PAmF0zvV.js");
var _nodeFs = _interopRequireDefault(require("node:fs"));
var _nodePath = _interopRequireDefault(require("node:path"));
var _promises = _interopRequireDefault(require("node:fs/promises"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}
//#region node_modules/@openclaw/fs-safe/dist/lock-config.js
let lockConfig = { staleRecovery: "fail-closed" };
function getFsSafeLockConfig() {
  return {
    ...lockConfig,
    retry: lockConfig.retry ? { ...lockConfig.retry } : void 0
  };
}
//#endregion
//#region node_modules/@openclaw/fs-safe/dist/sidecar-lock.js
const GLOBAL_STATE_KEY = Symbol.for("fsSafe.sidecarLockManagers");
function getGlobalManagers() {
  const globalWithState = globalThis;
  if (!globalWithState[GLOBAL_STATE_KEY]) globalWithState[GLOBAL_STATE_KEY] = /* @__PURE__ */new Map();
  return globalWithState[GLOBAL_STATE_KEY];
}
function resolveManagerState(key) {
  const managers = getGlobalManagers();
  let state = managers.get(key);
  if (!state) {
    state = {
      cleanupRegistered: false,
      held: /* @__PURE__ */new Map()
    };
    managers.set(key, state);
  }
  return state;
}
async function readLockSnapshot(lockPath) {
  try {
    const stat = await _promises.default.lstat(lockPath);
    const raw = await _promises.default.readFile(lockPath, "utf8");
    try {
      const parsed = JSON.parse(raw);
      return {
        raw,
        payload: parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null,
        stat
      };
    } catch {
      return {
        raw,
        payload: null,
        stat
      };
    }
  } catch {
    return null;
  }
}
function snapshotMatches(current, observed) {
  if (observed.stat && current.stat && !(0, _fileIdentityPAmF0zvV.t)(observed.stat, current.stat)) return false;
  if (observed.raw !== void 0) return current.raw === observed.raw;
  return observed.stat !== void 0 && current.stat !== void 0;
}
async function removeLockIfUnchanged(lockPath, observed) {
  const current = await readLockSnapshot(lockPath);
  if (!current || !observed) return false;
  if (!snapshotMatches(current, observed)) return false;
  await _promises.default.rm(lockPath, { force: true }).catch(() => void 0);
  return true;
}
async function lockSnapshotStillPresent(lockPath, observed) {
  const current = await readLockSnapshot(lockPath);
  return !!current && !!observed && snapshotMatches(current, observed);
}
async function removeStaleLockIfAllowed(params) {
  if (!params.shouldRemoveStaleLock) return "not-approved";
  if (params.snapshot.raw === void 0) return "not-approved";
  if (!(await params.shouldRemoveStaleLock({
    lockPath: params.lockPath,
    normalizedTargetPath: params.normalizedTargetPath,
    raw: params.snapshot.raw,
    payload: params.snapshot.payload
  }))) return "not-approved";
  const current = await readLockSnapshot(params.lockPath);
  if (!current || !snapshotMatches(current, params.snapshot)) return "changed";
  try {
    await _promises.default.rm(params.lockPath, { force: true });
  } catch {
    return "not-approved";
  }
  return "removed";
}
function snapshotMatchesSync(lockPath, observed) {
  try {
    const stat = _nodeFs.default.lstatSync(lockPath);
    if (observed.stat && !(0, _fileIdentityPAmF0zvV.t)(observed.stat, stat)) return false;
    return observed.raw === void 0 || _nodeFs.default.readFileSync(lockPath, "utf8") === observed.raw;
  } catch {
    return false;
  }
}
async function resolveNormalizedTargetPath(targetPath) {
  const resolved = _nodePath.default.resolve(targetPath);
  const dir = _nodePath.default.dirname(resolved);
  await _promises.default.mkdir(dir, { recursive: true });
  try {
    return _nodePath.default.join(await _promises.default.realpath(dir), _nodePath.default.basename(resolved));
  } catch {
    return resolved;
  }
}
function computeDelayMs(retry, attempt) {
  const minTimeout = retry.minTimeout ?? 50;
  const maxTimeout = retry.maxTimeout ?? 1e3;
  const factor = retry.factor ?? 1;
  const base = Math.min(maxTimeout, Math.max(minTimeout, minTimeout * factor ** attempt));
  const jitter = retry.randomize ? 1 + Math.random() : 1;
  return Math.min(maxTimeout, Math.round(base * jitter));
}
async function defaultShouldReclaim(params) {
  const createdAt = typeof params.payload?.createdAt === "string" ? params.payload.createdAt : "";
  const createdAtMs = Date.parse(createdAt);
  if (Number.isFinite(createdAtMs) && params.nowMs - createdAtMs > params.staleMs) return true;
  try {
    const stat = await _promises.default.stat(params.lockPath);
    return params.nowMs - stat.mtimeMs > params.staleMs;
  } catch {
    return true;
  }
}
function releaseAllLocksSync(state) {
  for (const [normalizedTargetPath, held] of state.held) {
    held.handle.close().catch(() => void 0);
    try {
      if (snapshotMatchesSync(held.lockPath, held.snapshot)) _nodeFs.default.rmSync(held.lockPath, { force: true });
    } catch {}
    state.held.delete(normalizedTargetPath);
  }
}
async function releaseHeldLock(state, normalizedTargetPath, held, opts = {}) {
  if (state.held.get(normalizedTargetPath) !== held) return false;
  if (opts.force) held.count = 0;else
  {
    held.count -= 1;
    if (held.count > 0) return false;
  }
  if (held.releasePromise) {
    await held.releasePromise.catch(() => void 0);
    return true;
  }
  state.held.delete(normalizedTargetPath);
  held.releasePromise = (async () => {
    await held.handle.close().catch(() => void 0);
    await removeLockIfUnchanged(held.lockPath, held.snapshot);
  })();
  try {
    await held.releasePromise;
    return true;
  } finally {
    held.releasePromise = void 0;
  }
}
function createSidecarLockManager(key) {
  const state = resolveManagerState(key);
  function ensureExitCleanupRegistered() {
    if (state.cleanupRegistered) return;
    state.cleanupRegistered = true;
    process.on("exit", () => releaseAllLocksSync(state));
  }
  async function acquire(options) {
    ensureExitCleanupRegistered();
    const normalizedTargetPath = await resolveNormalizedTargetPath(options.targetPath);
    const lockPath = options.lockPath ?? `${normalizedTargetPath}.lock`;
    const held = state.held.get(normalizedTargetPath);
    if (held && options.allowReentrant) {
      held.count += 1;
      const release = () => releaseHeldLock(state, normalizedTargetPath, held).then(() => void 0);
      return {
        lockPath,
        normalizedTargetPath,
        release,
        [Symbol.asyncDispose]: release
      };
    }
    const startedAt = Date.now();
    const retry = options.retry ?? {};
    const maxRetries = options.timeoutMs === Number.POSITIVE_INFINITY ? void 0 : retry.retries;
    let attempt = 0;
    while (true) {
      let handle = null;
      try {
        handle = await _promises.default.open(lockPath, "wx");
        const payload = await options.payload();
        const raw = `${JSON.stringify(payload, null, 2)}\n`;
        await handle.writeFile(raw, "utf8");
        const snapshot = {
          raw,
          payload,
          stat: await handle.stat()
        };
        const createdHeld = {
          count: 1,
          handle,
          lockPath,
          snapshot,
          acquiredAt: Date.now(),
          metadata: options.metadata ?? {}
        };
        state.held.set(normalizedTargetPath, createdHeld);
        const release = () => releaseHeldLock(state, normalizedTargetPath, createdHeld).then(() => void 0);
        return {
          lockPath,
          normalizedTargetPath,
          release,
          [Symbol.asyncDispose]: release
        };
      } catch (err) {
        if (handle) {
          const failedSnapshot = { payload: null };
          try {
            failedSnapshot.stat = await handle.stat();
          } catch {}
          if (state.held.get(normalizedTargetPath)?.handle === handle) state.held.delete(normalizedTargetPath);
          await _promises.default.rm(lockPath, { force: true }).catch(() => void 0);
          await handle.close().catch(() => void 0);
          await removeLockIfUnchanged(lockPath, failedSnapshot);
        }
        if (err.code !== "EEXIST") throw err;
        const nowMs = Date.now();
        const snapshot = await readLockSnapshot(lockPath);
        if (!snapshot) continue;
        if (await (options.shouldReclaim ?? defaultShouldReclaim)({
          lockPath,
          normalizedTargetPath,
          payload: snapshot?.payload ?? null,
          staleMs: options.staleMs,
          nowMs,
          heldByThisProcess: state.held.has(normalizedTargetPath)
        })) {
          if (!(await lockSnapshotStillPresent(lockPath, snapshot))) continue;
          if ((options.staleRecovery ?? "fail-closed") === "remove-if-unchanged") {
            const removal = await removeStaleLockIfAllowed({
              lockPath,
              normalizedTargetPath,
              snapshot,
              shouldRemoveStaleLock: options.shouldRemoveStaleLock
            });
            if (removal === "removed" || removal === "changed") continue;
          }
          throw Object.assign(/* @__PURE__ */new Error(`file lock stale for ${normalizedTargetPath}`), {
            code: "file_lock_stale",
            lockPath,
            normalizedTargetPath
          });
        }
        const elapsed = Date.now() - startedAt;
        if (options.timeoutMs !== void 0 && options.timeoutMs !== Number.POSITIVE_INFINITY && elapsed >= options.timeoutMs || maxRetries !== void 0 && attempt >= maxRetries) throw Object.assign(/* @__PURE__ */new Error(`file lock timeout for ${normalizedTargetPath}`), {
          code: "file_lock_timeout",
          lockPath,
          normalizedTargetPath
        });
        const remaining = options.timeoutMs === void 0 || options.timeoutMs === Number.POSITIVE_INFINITY ? Number.POSITIVE_INFINITY : Math.max(0, options.timeoutMs - elapsed);
        const delay = Math.min(computeDelayMs(retry, attempt), remaining);
        attempt += 1;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  async function withLock(options, fn) {
    const lock = await acquire(options);
    try {
      return await fn();
    } finally {
      await lock.release();
    }
  }
  async function drain() {
    for (const [normalizedTargetPath, held] of Array.from(state.held.entries())) await releaseHeldLock(state, normalizedTargetPath, held, { force: true }).catch(() => void 0);
  }
  function reset() {
    releaseAllLocksSync(state);
  }
  function heldEntries() {
    return Array.from(state.held.entries()).map(([normalizedTargetPath, held]) => ({
      normalizedTargetPath,
      lockPath: held.lockPath,
      acquiredAt: held.acquiredAt,
      metadata: held.metadata,
      forceRelease: () => releaseHeldLock(state, normalizedTargetPath, held, { force: true })
    }));
  }
  return {
    acquire,
    withLock,
    drain,
    reset,
    heldEntries
  };
}
//#endregion /* v9-db3f8fd84d30eaad */
