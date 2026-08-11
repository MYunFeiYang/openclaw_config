"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = guardedRm;exports.c = assertAsyncDirectoryGuard;exports.d = createNearestExistingDirectoryGuard;exports.f = createSyncDirectoryGuard;exports.i = guardedRenameSync;exports.l = assertSyncDirectoryGuard;exports.n = registerTempPathForExit;exports.o = guardedRmSync;exports.r = guardedRename;exports.s = withAsyncDirectoryGuards;exports.t = serializePathWrite;exports.u = createAsyncDirectoryGuard;var _pathB5B_oAT = require("./path-B5B-_oAT.js");
var _fileIdentityPAmF0zvV = require("./file-identity-PAmF0zvV.js");
var _nodeFs = _interopRequireDefault(require("node:fs"));
var _nodePath = _interopRequireDefault(require("node:path"));
var _promises = _interopRequireDefault(require("node:fs/promises"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}
//#region node_modules/@openclaw/fs-safe/dist/directory-guard.js
async function createAsyncDirectoryGuard(dir) {
  const stat = await _promises.default.lstat(dir);
  if (stat.isSymbolicLink() || !stat.isDirectory()) throw new _pathB5B_oAT.p("not-file", "directory component must be a directory");
  return {
    dir,
    realPath: await _promises.default.realpath(dir),
    stat
  };
}
async function assertAsyncDirectoryGuard(guard) {
  const stat = await _promises.default.lstat(guard.dir);
  if (stat.isSymbolicLink() || !stat.isDirectory()) throw new _pathB5B_oAT.p("not-file", "directory component must be a directory");
  if (!(0, _fileIdentityPAmF0zvV.t)(stat, guard.stat) || (await _promises.default.realpath(guard.dir)) !== guard.realPath) throw new _pathB5B_oAT.p("path-mismatch", "directory changed during operation");
}
function createSyncDirectoryGuard(dir) {
  const stat = _nodeFs.default.lstatSync(dir);
  if (stat.isSymbolicLink() || !stat.isDirectory()) throw new _pathB5B_oAT.p("not-file", "directory component must be a directory");
  return {
    dir,
    realPath: _nodeFs.default.realpathSync(dir),
    stat
  };
}
function assertSyncDirectoryGuard(guard) {
  const stat = _nodeFs.default.lstatSync(guard.dir);
  if (stat.isSymbolicLink() || !stat.isDirectory()) throw new _pathB5B_oAT.p("not-file", "directory component must be a directory");
  if (!(0, _fileIdentityPAmF0zvV.t)(stat, guard.stat) || _nodeFs.default.realpathSync(guard.dir) !== guard.realPath) throw new _pathB5B_oAT.p("path-mismatch", "directory changed during operation");
}
async function createNearestExistingDirectoryGuard(rootReal, targetPath) {
  let current = _nodePath.default.resolve(targetPath);
  const root = _nodePath.default.resolve(rootReal);
  while (current !== root) try {
    return await createAsyncDirectoryGuard(current);
  } catch (error) {
    if (!(0, _pathB5B_oAT.r)(error)) throw error;
    current = _nodePath.default.dirname(current);
  }
  return await createAsyncDirectoryGuard(root);
}
function createNearestExistingSyncDirectoryGuard(rootReal, targetPath) {
  let current = _nodePath.default.resolve(targetPath);
  const root = _nodePath.default.resolve(rootReal);
  while (current !== root) try {
    return createSyncDirectoryGuard(current);
  } catch (error) {
    if (!(0, _pathB5B_oAT.r)(error)) throw error;
    current = _nodePath.default.dirname(current);
  }
  return createSyncDirectoryGuard(root);
}
//#endregion
//#region node_modules/@openclaw/fs-safe/dist/guarded-mutation.js
async function withAsyncDirectoryGuards(guards, mutate, options = {}) {
  for (const guard of guards) await assertAsyncDirectoryGuard(guard);
  const result = await mutate();
  if (options.verifyAfter !== false) try {
    for (const guard of guards) await assertAsyncDirectoryGuard(guard);
  } catch (error) {
    if (options.onPostGuardFailure) try {
      await options.onPostGuardFailure(result, error);
    } catch {}
    throw error;
  }
  return result;
}
function withSyncDirectoryGuards(guards, mutate, options = {}) {
  for (const guard of guards) assertSyncDirectoryGuard(guard);
  const result = mutate();
  if (options.verifyAfter !== false) for (const guard of guards) assertSyncDirectoryGuard(guard);
  return result;
}
async function guardedRename(params) {
  await withAsyncDirectoryGuards([await createAsyncDirectoryGuard(_nodePath.default.dirname(params.from)), params.targetRoot ? await createNearestExistingDirectoryGuard(params.targetRoot, _nodePath.default.dirname(params.to)) : await createAsyncDirectoryGuard(_nodePath.default.dirname(params.to))], async () => {
    await _promises.default.rename(params.from, params.to);
  }, { verifyAfter: params.verifyAfter });
}
function guardedRenameSync(params) {
  withSyncDirectoryGuards([createSyncDirectoryGuard(_nodePath.default.dirname(params.from)), params.targetRoot ? createNearestExistingSyncDirectoryGuard(params.targetRoot, _nodePath.default.dirname(params.to)) : createSyncDirectoryGuard(_nodePath.default.dirname(params.to))], () => _nodeFs.default.renameSync(params.from, params.to), { verifyAfter: params.verifyAfter });
}
async function guardedRm(params) {
  await withAsyncDirectoryGuards([await createAsyncDirectoryGuard(_nodePath.default.dirname(params.target))], async () => {
    await _promises.default.rm(params.target, {
      ...(params.recursive !== void 0 ? { recursive: params.recursive } : {}),
      ...(params.force !== void 0 ? { force: params.force } : {})
    });
  }, { verifyAfter: params.verifyAfter });
}
function guardedRmSync(params) {
  withSyncDirectoryGuards([createSyncDirectoryGuard(_nodePath.default.dirname(params.target))], () => _nodeFs.default.rmSync(params.target, {
    ...(params.recursive !== void 0 ? { recursive: params.recursive } : {}),
    ...(params.force !== void 0 ? { force: params.force } : {})
  }), { verifyAfter: params.verifyAfter });
}
//#endregion
//#region node_modules/@openclaw/fs-safe/dist/temp-cleanup.js
const tempCleanupEntries = /* @__PURE__ */new Map();
let cleanupRegistered = false;
function cleanupRegisteredTempPathsSync() {
  for (const entry of tempCleanupEntries.values()) try {
    _nodeFs.default.rmSync(entry.path, {
      force: true,
      recursive: entry.recursive
    });
  } catch {}
  tempCleanupEntries.clear();
}
function registerTempPathForExit(tempPath, options) {
  if (!cleanupRegistered) {
    cleanupRegistered = true;
    process.once("exit", cleanupRegisteredTempPathsSync);
  }
  tempCleanupEntries.set(tempPath, {
    path: tempPath,
    recursive: options?.recursive === true
  });
  return () => {
    tempCleanupEntries.delete(tempPath);
  };
}
//#endregion
//#region node_modules/@openclaw/fs-safe/dist/write-queue.js
const writeQueues = /* @__PURE__ */new Map();
async function serializePathWrite(key, run) {
  const previous = writeQueues.get(key) ?? Promise.resolve();
  const task = (async () => {
    await previous.catch(() => void 0);
    return await run();
  })();
  const done = task.then(() => void 0, () => void 0);
  writeQueues.set(key, done);
  try {
    return await task;
  } finally {
    if (writeQueues.get(key) === done) writeQueues.delete(key);
  }
}
//#endregion /* v9-d384ec72e6262f72 */
