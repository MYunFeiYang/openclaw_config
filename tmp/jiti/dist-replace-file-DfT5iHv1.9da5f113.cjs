"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.i = replaceFileAtomicSync;exports.n = void 0;exports.r = replaceFileAtomic$1;exports.t = movePathWithCopyFallback;require("./fs-safe-defaults-azXCfv92.js");
var _writeQueueBKRKUV0w = require("./write-queue-BKRKUV0w.js");
var _safePathSegmentBIlsa0xw = require("./safe-path-segment-BIlsa0xw.js");
var _nodeFs = _interopRequireWildcard(require("node:fs"));
var _nodePath = _interopRequireDefault(require("node:path"));
var _promises = _interopRequireDefault(require("node:fs/promises"));
var _nodeCrypto = require("node:crypto");function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}function _interopRequireWildcard(e, t) {if ("function" == typeof WeakMap) var r = new WeakMap(),n = new WeakMap();return (_interopRequireWildcard = function (e, t) {if (!t && e && e.__esModule) return e;var o,i,f = { __proto__: null, default: e };if (null === e || "object" != typeof e && "function" != typeof e) return f;if (o = t ? n : r) {if (o.has(e)) return o.get(e);o.set(e, f);}for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]);return f;})(e, t);}
//#region node_modules/@openclaw/fs-safe/dist/replace-file.js
function isRetryableRenameError(error) {
  return error.code === "EBUSY";
}
function isPermissionRenameError(error) {
  const code = error.code;
  return code === "EPERM" || code === "EEXIST";
}
const SUPPORTS_NOFOLLOW = process.platform !== "win32" && "O_NOFOLLOW" in _nodeFs.default.constants;
const OPEN_READ_FLAGS = _nodeFs.default.constants.O_RDONLY | (SUPPORTS_NOFOLLOW ? _nodeFs.default.constants.O_NOFOLLOW : 0);
const OPEN_WRITE_EXCLUSIVE_FLAGS = _nodeFs.default.constants.O_WRONLY | _nodeFs.default.constants.O_CREAT | _nodeFs.default.constants.O_EXCL | (SUPPORTS_NOFOLLOW ? _nodeFs.default.constants.O_NOFOLLOW : 0);
async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
async function renameWithRetry(params) {
  for (let attempt = 0; attempt <= params.maxRetries; attempt++) try {
    await params.fsModule.rename(params.src, params.dest);
    return { method: "rename" };
  } catch (error) {
    if (isRetryableRenameError(error) && attempt < params.maxRetries) {
      await sleep(params.baseDelayMs * 2 ** attempt);
      continue;
    }
    if (params.copyFallbackOnPermissionError && isPermissionRenameError(error)) {
      await copyFallbackReplace(params.fsModule, params.src, params.dest);
      return { method: "copy-fallback" };
    }
    throw error;
  }
  throw new Error("Atomic rename retry loop exhausted.");
}
function sleepSync(ms) {
  if (ms <= 0) return;
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}
function renameWithRetrySync(params) {
  for (let attempt = 0; attempt <= params.maxRetries; attempt++) try {
    params.fsModule.renameSync(params.src, params.dest);
    return { method: "rename" };
  } catch (error) {
    if (isRetryableRenameError(error) && attempt < params.maxRetries) {
      sleepSync(params.baseDelayMs * 2 ** attempt);
      continue;
    }
    if (params.copyFallbackOnPermissionError && isPermissionRenameError(error)) {
      copyFallbackReplaceSync(params.fsModule, params.src, params.dest);
      return { method: "copy-fallback" };
    }
    throw error;
  }
  throw new Error("Atomic rename retry loop exhausted.");
}
async function copyFallbackReplace(fsModule, src, dest) {
  const sourceStat = await fsModule.lstat(src);
  if (sourceStat.isSymbolicLink() || !sourceStat.isFile()) throw new Error(`Refusing copy fallback from non-file source: ${src}`);
  const destStat = await fsModule.lstat(dest).catch((lstatError) => {
    if (lstatError.code === "ENOENT") return null;
    throw lstatError;
  });
  if (destStat?.isSymbolicLink()) throw new Error(`Refusing copy fallback through symlink destination: ${dest}`);
  if (destStat) await fsModule.rm(dest, { force: true });
  let sourceHandle = null;
  let destHandle = null;
  try {
    sourceHandle = await fsModule.open(src, OPEN_READ_FLAGS);
    destHandle = await fsModule.open(dest, OPEN_WRITE_EXCLUSIVE_FLAGS, sourceStat.mode & 511);
    await destHandle.writeFile(await sourceHandle.readFile());
  } finally {
    await destHandle?.close().catch(() => void 0);
    await sourceHandle?.close().catch(() => void 0);
  }
  await fsModule.unlink(src).catch(() => void 0);
}
function copyFallbackReplaceSync(fsModule, src, dest) {
  const sourceStat = fsModule.lstatSync(src);
  if (sourceStat.isSymbolicLink() || !sourceStat.isFile()) throw new Error(`Refusing copy fallback from non-file source: ${src}`);
  let destStat = null;
  try {
    destStat = fsModule.lstatSync(dest);
  } catch (lstatError) {
    if (lstatError.code !== "ENOENT") throw lstatError;
  }
  if (destStat?.isSymbolicLink()) throw new Error(`Refusing copy fallback through symlink destination: ${dest}`);
  if (destStat) fsModule.rmSync(dest, { force: true });
  let sourceFd;
  let destFd;
  try {
    sourceFd = fsModule.openSync(src, OPEN_READ_FLAGS);
    destFd = fsModule.openSync(dest, OPEN_WRITE_EXCLUSIVE_FLAGS, sourceStat.mode & 511);
    fsModule.writeFileSync(destFd, fsModule.readFileSync(sourceFd));
  } finally {
    if (destFd !== void 0) try {
      fsModule.closeSync(destFd);
    } catch {}
    if (sourceFd !== void 0) try {
      fsModule.closeSync(sourceFd);
    } catch {}
  }
  try {
    fsModule.unlinkSync(src);
  } catch {}
}
function validateReplaceFilePath(filePath) {
  if (!filePath || filePath.includes("\0")) throw new Error("Atomic replace file path must be non-empty.");
}
function buildReplaceTempPath(filePath, tempPrefix) {
  const dir = _nodePath.default.dirname(filePath);
  const safePrefix = (0, _safePathSegmentBIlsa0xw.t)(tempPrefix ?? ".fs-safe-replace", { label: "atomic replace temp prefix" });
  return _nodePath.default.join(dir, `${safePrefix}.${process.pid}.${(0, _nodeCrypto.randomUUID)()}.tmp`);
}
async function resolveMode(options) {
  const defaultMode = options.mode ?? 384;
  if (!options.preserveExistingMode) return defaultMode;
  const stat = await (options.fileSystem?.promises ?? _promises.default).stat(options.filePath).catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  return stat ? stat.mode : defaultMode;
}
function resolveModeSync(options) {
  const defaultMode = options.mode ?? 384;
  if (!options.preserveExistingMode) return defaultMode;
  const fsModule = options.fileSystem ?? _nodeFs.default;
  let stat;
  try {
    stat = fsModule.statSync(options.filePath);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  return stat ? stat.mode : defaultMode;
}
async function syncTempFile(fsModule, tempPath) {
  const handle = await fsModule.open(tempPath, "r+");
  try {
    await handle.sync();
  } catch (error) {
    if (error.code !== "EPERM") throw error;
  } finally {
    await handle.close();
  }
}
function syncTempFileSync(fsModule, tempPath) {
  const fd = fsModule.openSync(tempPath, "r+");
  try {
    fsModule.fsyncSync(fd);
  } catch (error) {
    if (error.code !== "EPERM") throw error;
  } finally {
    fsModule.closeSync(fd);
  }
}
async function syncDirectoryBestEffort(fsModule, dirPath) {
  let handle;
  try {
    handle = await fsModule.open(dirPath, "r");
    await handle.sync();
  } catch {} finally {
    await handle?.close().catch(() => void 0);
  }
}
function syncDirectoryBestEffortSync(fsModule, dirPath) {
  let fd;
  try {
    fd = fsModule.openSync(dirPath, "r");
    fsModule.fsyncSync(fd);
  } catch {} finally {
    if (fd !== void 0) try {
      fsModule.closeSync(fd);
    } catch {}
  }
}
async function cleanupTempFile(params) {
  const cleanupError = await params.fsModule.rm(params.tempPath, { force: true }).catch((error) => error);
  if (cleanupError && params.throwOnCleanupError && params.originalError !== void 0) throw new Error(`Atomic file replace failed (${String(params.originalError)}); cleanup also failed (${String(cleanupError)})`, { cause: params.originalError });
}
async function replaceFileAtomic$1(options) {
  const filePath = options.filePath;
  validateReplaceFilePath(filePath);
  return await (0, _writeQueueBKRKUV0w.t)(_nodePath.default.resolve(filePath), async () => {
    return await replaceFileAtomicUnserialized(options);
  });
}
async function replaceFileAtomicUnserialized(options) {
  const filePath = options.filePath;
  const fsModule = options.fileSystem?.promises ?? _promises.default;
  const dir = _nodePath.default.dirname(filePath);
  const dirMode = options.dirMode ?? 448;
  const mode = await resolveMode(options);
  const tempPath = buildReplaceTempPath(filePath, options.tempPrefix);
  const unregisterTempPath = (0, _writeQueueBKRKUV0w.n)(tempPath);
  let tempExists = false;
  let originalError;
  await fsModule.mkdir(dir, {
    recursive: true,
    mode: dirMode
  });
  await fsModule.chmod(dir, dirMode).catch(() => void 0);
  try {
    tempExists = true;
    await fsModule.writeFile(tempPath, options.content, {
      mode,
      flag: "wx"
    });
    if (options.syncTempFile) await syncTempFile(fsModule, tempPath);
    if (options.beforeRename) await options.beforeRename({
      filePath,
      tempPath
    });
    const result = await renameWithRetry({
      fsModule,
      src: tempPath,
      dest: filePath,
      maxRetries: options.renameMaxRetries ?? 0,
      baseDelayMs: options.renameRetryBaseDelayMs ?? 50,
      copyFallbackOnPermissionError: options.copyFallbackOnPermissionError === true
    });
    tempExists = false;
    unregisterTempPath();
    await fsModule.chmod(filePath, mode).catch(() => void 0);
    if (options.syncParentDir) await syncDirectoryBestEffort(fsModule, dir);
    return result;
  } catch (error) {
    originalError = error;
    throw error;
  } finally {
    if (tempExists) await cleanupTempFile({
      fsModule,
      tempPath,
      originalError,
      throwOnCleanupError: options.throwOnCleanupError === true
    });
    unregisterTempPath();
  }
}
function replaceFileAtomicSync(options) {
  const filePath = options.filePath;
  validateReplaceFilePath(filePath);
  const fsModule = options.fileSystem ?? _nodeFs.default;
  const dir = _nodePath.default.dirname(filePath);
  const dirMode = options.dirMode ?? 448;
  const mode = resolveModeSync(options);
  const tempPath = buildReplaceTempPath(filePath, options.tempPrefix);
  const unregisterTempPath = (0, _writeQueueBKRKUV0w.n)(tempPath);
  let tempExists = false;
  let originalError;
  fsModule.mkdirSync(dir, {
    recursive: true,
    mode: dirMode
  });
  try {
    fsModule.chmodSync(dir, dirMode);
  } catch {}
  try {
    tempExists = true;
    fsModule.writeFileSync(tempPath, options.content, {
      mode,
      flag: "wx"
    });
    if (options.syncTempFile) syncTempFileSync(fsModule, tempPath);
    if (options.beforeRename) options.beforeRename({
      filePath,
      tempPath
    });
    const result = renameWithRetrySync({
      fsModule,
      src: tempPath,
      dest: filePath,
      maxRetries: options.renameMaxRetries ?? 0,
      baseDelayMs: options.renameRetryBaseDelayMs ?? 50,
      copyFallbackOnPermissionError: options.copyFallbackOnPermissionError === true
    });
    tempExists = false;
    unregisterTempPath();
    try {
      fsModule.chmodSync(filePath, mode);
    } catch {}
    if (options.syncParentDir) syncDirectoryBestEffortSync(fsModule, dir);
    return result;
  } catch (error) {
    originalError = error;
    throw error;
  } finally {
    if (tempExists) try {
      fsModule.rmSync(tempPath, { force: true });
    } catch (cleanupError) {
      if (options.throwOnCleanupError && originalError !== void 0) throw new Error(`Atomic file replace failed (${String(originalError)}); cleanup also failed (${String(cleanupError)})`, { cause: originalError });
    }
    unregisterTempPath();
  }
}
//#endregion
//#region node_modules/@openclaw/fs-safe/dist/move-path.js
function entryIdentity(stat) {
  return {
    ctimeMs: stat.ctimeMs,
    dev: stat.dev,
    ino: stat.ino,
    mode: stat.mode,
    mtimeMs: stat.mtimeMs,
    size: stat.size
  };
}
function sameIdentity(a, b) {
  return a.dev === b.dev && a.ino === b.ino && a.mode === b.mode && a.size === b.size && a.mtimeMs === b.mtimeMs && a.ctimeMs === b.ctimeMs;
}
function sameDirectoryNode(a, b) {
  return a.dev === b.dev && a.ino === b.ino;
}
function modeBits(mode) {
  return mode & 511;
}
function sourceChangedError(sourcePath) {
  return Object.assign(/* @__PURE__ */new Error(`Source changed during move fallback: ${sourcePath}`), { code: "ESTALE" });
}
async function assertSourceStillMatches(sourcePath, identity) {
  if (!sameIdentity(identity, entryIdentity(await _promises.default.lstat(sourcePath)))) throw sourceChangedError(sourcePath);
}
function regularReadFlags() {
  return _nodeFs.constants.O_RDONLY | (typeof _nodeFs.constants.O_NOFOLLOW === "number" && process.platform !== "win32" ? _nodeFs.constants.O_NOFOLLOW : 0);
}
async function writeAll(handle, buffer, bytesRead) {
  let offset = 0;
  while (offset < bytesRead) {
    const { bytesWritten } = await handle.write(buffer, offset, bytesRead - offset);
    offset += bytesWritten;
  }
}
async function copyRegularFilePinned(params) {
  let destinationCreated = false;
  let sourceHandle;
  try {
    sourceHandle = await _promises.default.open(params.from, regularReadFlags());
  } catch (error) {
    const code = error?.code;
    if (code === "ELOOP" || code === "ENOENT" || code === "ENOTDIR") throw sourceChangedError(params.from);
    throw error;
  }
  try {
    const openedStat = await sourceHandle.stat();
    if (!openedStat.isFile() || !sameIdentity(params.identity, entryIdentity(openedStat))) throw sourceChangedError(params.from);
    const destinationHandle = await _promises.default.open(params.to, _nodeFs.constants.O_WRONLY | _nodeFs.constants.O_CREAT | _nodeFs.constants.O_EXCL, modeBits(params.mode) || 438);
    destinationCreated = true;
    try {
      const scratch = Buffer.allocUnsafe(64 * 1024);
      while (true) {
        const { bytesRead } = await sourceHandle.read(scratch, 0, scratch.length, null);
        if (bytesRead === 0) break;
        await writeAll(destinationHandle, scratch, bytesRead);
      }
    } finally {
      await destinationHandle.close();
    }
    if (!sameIdentity(params.identity, entryIdentity(await sourceHandle.stat()))) throw sourceChangedError(params.from);
    await _promises.default.chmod(params.to, modeBits(params.mode)).catch(() => void 0);
  } catch (error) {
    if (destinationCreated) await _promises.default.rm(params.to, { force: true }).catch(() => void 0);
    throw error;
  } finally {
    await sourceHandle.close();
  }
}
async function copyEntryWithManifest(from, to, options) {
  const sourceStat = await _promises.default.lstat(from);
  const identity = entryIdentity(sourceStat);
  if (sourceStat.isSymbolicLink()) {
    await _promises.default.symlink(await _promises.default.readlink(from), to);
    await assertSourceStillMatches(from, identity);
    return {
      ...identity,
      kind: "leaf"
    };
  }
  if (sourceStat.isDirectory()) {
    await _promises.default.mkdir(to, { mode: modeBits(sourceStat.mode) || 493 });
    const children = [];
    for (const child of await _promises.default.readdir(from)) children.push({
      name: child,
      manifest: await copyEntryWithManifest(_nodePath.default.join(from, child), _nodePath.default.join(to, child), options)
    });
    await assertSourceStillMatches(from, identity);
    await _promises.default.chmod(to, modeBits(sourceStat.mode));
    return {
      ...identity,
      children,
      kind: "directory"
    };
  }
  if (!sourceStat.isFile()) throw new Error(`Refusing to move non-file path with copy fallback: ${from}`);
  if (options.sourceHardlinks === "reject" && sourceStat.nlink > 1) throw new Error(`Refusing to move hardlinked file with copy fallback: ${from}`);
  await copyRegularFilePinned({
    from,
    identity,
    mode: sourceStat.mode,
    to
  });
  return {
    ...identity,
    kind: "leaf"
  };
}
function mergeCleanupResults(a, b) {
  return a === "stale" || b === "stale" ? "stale" : "removed";
}
async function cleanupCopiedEntry(sourcePath, manifest) {
  let currentStat;
  try {
    currentStat = await _promises.default.lstat(sourcePath);
  } catch (error) {
    if (error?.code === "ENOENT") return "removed";
    throw error;
  }
  if (manifest.kind === "directory") {
    if (!currentStat.isDirectory() || !sameDirectoryNode(manifest, entryIdentity(currentStat))) return "stale";
    let result = "removed";
    for (const child of manifest.children) result = mergeCleanupResults(result, await cleanupCopiedEntry(_nodePath.default.join(sourcePath, child.name), child.manifest));
    try {
      await _promises.default.rmdir(sourcePath);
    } catch (error) {
      const code = error?.code;
      if (code === "ENOTEMPTY" || code === "EEXIST") return "stale";
      throw error;
    }
    return result;
  }
  if (!sameIdentity(manifest, entryIdentity(currentStat))) return "stale";
  await _promises.default.unlink(sourcePath);
  return "removed";
}
async function movePathWithCopyFallback$1(options) {
  try {
    await (0, _writeQueueBKRKUV0w.r)({
      from: options.from,
      to: options.to
    });
    return;
  } catch (error) {
    if (error?.code !== "EXDEV") throw error;
  }
  const targetDir = _nodePath.default.dirname(_nodePath.default.resolve(options.to));
  const staged = _nodePath.default.join(targetDir, `.fs-safe-move-${process.pid}-${(0, _nodeCrypto.randomUUID)()}.tmp`);
  try {
    const manifest = await copyEntryWithManifest(options.from, staged, { sourceHardlinks: options.sourceHardlinks ?? "allow" });
    await (0, _writeQueueBKRKUV0w.r)({
      from: staged,
      to: options.to
    });
    if ((await cleanupCopiedEntry(options.from, manifest)) === "stale") throw sourceChangedError(options.from);
  } finally {
    await _promises.default.rm(staged, {
      recursive: true,
      force: true
    }).catch(() => void 0);
  }
}
//#endregion
//#region src/infra/replace-file.ts
const replaceFileAtomic = exports.n = replaceFileAtomic$1;
async function movePathWithCopyFallback(options) {
  if (options.sourceHardlinks === "reject") await assertNoHardlinkedSourceFiles(options.from);
  await movePathWithCopyFallback$1({
    from: options.from,
    to: options.to
  });
}
async function assertNoHardlinkedSourceFiles(sourcePath) {
  const sourceStat = await _promises.default.lstat(sourcePath);
  if (sourceStat.isFile() && sourceStat.nlink > 1) throw new Error(`Hardlinked source file is not allowed: ${sourcePath}`);
  if (!sourceStat.isDirectory()) return;
  const entries = await _promises.default.readdir(sourcePath, { withFileTypes: true });
  await Promise.all(entries.map(async (entry) => {
    const entryPath = _nodePath.default.join(sourcePath, entry.name);
    if (entry.isDirectory()) {
      await assertNoHardlinkedSourceFiles(entryPath);
      return;
    }
    if (!entry.isFile()) return;
    if ((await _promises.default.lstat(entryPath)).nlink > 1) throw new Error(`Hardlinked source file is not allowed: ${entryPath}`);
  }));
}
//#endregion /* v9-b33208ae5f54ccad */
