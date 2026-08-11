"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.i = resetFileLockManagerForTest;exports.n = createFileLockManager;exports.r = drainFileLockManagerForTest;exports.t = acquireFileLock;var _sidecarLockH5BKJRxL = require("./sidecar-lock-h5BKJRxL.js");
//#region node_modules/@openclaw/fs-safe/dist/file-lock.js
function resolveFileLockManagerKey(targetPath, managerKey) {
  return managerKey ?? `fs-safe.file-lock:${targetPath}`;
}
function withLockDefaults(options) {
  const defaults = (0, _sidecarLockH5BKJRxL.n)();
  return {
    ...options,
    retry: options.retry ?? defaults.retry,
    staleMs: options.staleMs ?? defaults.staleMs ?? 3e4,
    staleRecovery: options.staleRecovery ?? defaults.staleRecovery,
    timeoutMs: options.timeoutMs ?? defaults.timeoutMs
  };
}
async function acquireFileLock(targetPath, options) {
  return await createFileLockManager(resolveFileLockManagerKey(targetPath, options.managerKey)).acquire(targetPath, options);
}
function createFileLockManager(key) {
  const manager = (0, _sidecarLockH5BKJRxL.t)(key);
  return {
    acquire: async (targetPath, options) => {
      const { managerKey: _managerKey, ...acquireOptions } = options;
      return await manager.acquire({
        ...withLockDefaults(acquireOptions),
        targetPath
      });
    },
    withLock: async (targetPath, options, fn) => {
      const { managerKey: _managerKey, ...acquireOptions } = options;
      return await manager.withLock({
        ...withLockDefaults(acquireOptions),
        targetPath
      }, fn);
    },
    drain: manager.drain,
    reset: manager.reset,
    heldEntries: manager.heldEntries
  };
}
async function drainFileLockManagerForTest(targetPath, managerKey) {
  await createFileLockManager(resolveFileLockManagerKey(targetPath, managerKey)).drain();
}
function resetFileLockManagerForTest(targetPath, managerKey) {
  createFileLockManager(resolveFileLockManagerKey(targetPath, managerKey)).reset();
}
//#endregion /* v9-55310afb6036ef0c */
