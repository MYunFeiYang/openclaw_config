"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = tryReadSecretFileSync;exports.i = readSecretFileSync;exports.n = void 0;exports.o = writeSecretFileAtomic;exports.t = exports.r = void 0;var _pathB5B_oAT = require("./path-B5B-_oAT.js");
var _writeQueueBKRKUV0w = require("./write-queue-BKRKUV0w.js");
var _secureTempDirGC3bO7Qi = require("./secure-temp-dir-GC3bO7Qi.js");
var _pinnedOpenDx64loDQ = require("./pinned-open-Dx64loDQ.js");
var _nodeFs = _interopRequireDefault(require("node:fs"));
var _nodePath = _interopRequireDefault(require("node:path"));
var _promises = _interopRequireDefault(require("node:fs/promises"));
var _nodeCrypto = require("node:crypto");function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}
//#region node_modules/@openclaw/fs-safe/dist/secret-file.js
const DEFAULT_SECRET_FILE_MAX_BYTES = exports.t = 16 * 1024;
const PRIVATE_SECRET_DIR_MODE = exports.n = 448;
const PRIVATE_SECRET_FILE_MODE = exports.r = 384;
function normalizeSecretReadError(error) {
  return error instanceof Error ? error : new Error(String(error));
}
function resolveUserPath(input) {
  return (0, _secureTempDirGC3bO7Qi.d)(input);
}
function readSecretFileOutcomeSync(filePath, label, options = {}) {
  const resolvedPath = resolveUserPath(filePath.trim());
  if (!resolvedPath) return {
    ok: false,
    code: "invalid-path",
    message: `${label} file path is empty.`
  };
  const maxBytes = options.maxBytes ?? 16384;
  let previewStat;
  try {
    previewStat = _nodeFs.default.lstatSync(resolvedPath);
  } catch (error) {
    const normalized = normalizeSecretReadError(error);
    return {
      ok: false,
      code: error.code === "ENOENT" ? "not-found" : "invalid-path",
      error: normalized,
      message: `Failed to inspect ${label} file at ${resolvedPath}: ${String(normalized)}`
    };
  }
  if (previewStat.isSymbolicLink()) if (!options.rejectSymlink) try {
    previewStat = _nodeFs.default.statSync(resolvedPath);
  } catch (error) {
    const normalized = normalizeSecretReadError(error);
    return {
      ok: false,
      code: error.code === "ENOENT" ? "not-found" : "invalid-path",
      error: normalized,
      message: `Failed to inspect ${label} file at ${resolvedPath}: ${String(normalized)}`
    };
  } else
  return {
    ok: false,
    code: "symlink",
    message: `${label} file at ${resolvedPath} must not be a symlink.`
  };
  if (!previewStat.isFile()) return {
    ok: false,
    code: "not-file",
    message: `${label} file at ${resolvedPath} must be a regular file.`
  };
  if (previewStat.size > maxBytes) return {
    ok: false,
    code: "too-large",
    message: `${label} file at ${resolvedPath} exceeds ${maxBytes} bytes.`
  };
  const opened = (0, _pinnedOpenDx64loDQ.t)({
    filePath: resolvedPath,
    rejectPathSymlink: options.rejectSymlink,
    maxBytes
  });
  if (!opened.ok) {
    const error = normalizeSecretReadError(opened.reason === "validation" ? /* @__PURE__ */new Error("security validation failed") : opened.error);
    return {
      ok: false,
      code: opened.reason === "path" ? "not-found" : "path-mismatch",
      error,
      message: `Failed to read ${label} file at ${resolvedPath}: ${String(error)}`
    };
  }
  try {
    const secret = _nodeFs.default.readFileSync(opened.fd, "utf8").trim();
    if (!secret) return {
      ok: false,
      code: "invalid-path",
      message: `${label} file at ${resolvedPath} is empty.`
    };
    return {
      ok: true,
      secret
    };
  } catch (error) {
    const normalized = normalizeSecretReadError(error);
    return {
      ok: false,
      code: "invalid-path",
      error: normalized,
      message: `Failed to read ${label} file at ${resolvedPath}: ${String(normalized)}`
    };
  } finally {
    _nodeFs.default.closeSync(opened.fd);
  }
}
function readSecretFileSync(filePath, label, options = {}) {
  const result = readSecretFileOutcomeSync(filePath, label, options);
  if (result.ok) return result.secret;
  throw new _pathB5B_oAT.p(result.code, result.message, { cause: result.error });
}
function tryReadSecretFileSync(filePath, label, options = {}) {
  if (!filePath?.trim()) return;
  const result = readSecretFileOutcomeSync(filePath, label, options);
  return result.ok ? result.secret : void 0;
}
function assertPathWithinRoot(rootDir, targetPath) {
  const relative = _nodePath.default.relative(rootDir, targetPath);
  if (!relative || relative.startsWith("..") || _nodePath.default.isAbsolute(relative)) throw new Error(`Private secret path must stay under ${rootDir}.`);
}
function assertRealPathWithinRoot(rootDir, targetPath) {
  const relative = _nodePath.default.relative(rootDir, targetPath);
  if (relative.startsWith("..") || _nodePath.default.isAbsolute(relative)) throw new Error(`Private secret path must stay under ${rootDir}.`);
}
async function enforcePrivatePathMode(resolvedPath, expectedMode, kind) {
  if (process.platform === "win32") return;
  await _promises.default.chmod(resolvedPath, expectedMode);
  const actualMode = (await _promises.default.stat(resolvedPath)).mode & 511;
  if (actualMode !== expectedMode) throw new Error(`Private secret ${kind} ${resolvedPath} has insecure permissions ${actualMode.toString(8)}.`);
}
async function ensurePrivateDirectory(rootDir, targetDir, mode) {
  const resolvedRoot = _nodePath.default.resolve(rootDir);
  const resolvedTarget = _nodePath.default.resolve(targetDir);
  if (resolvedTarget === resolvedRoot) {
    await _promises.default.mkdir(resolvedRoot, {
      recursive: true,
      mode
    });
    const rootStat = await _promises.default.lstat(resolvedRoot);
    if (rootStat.isSymbolicLink()) throw new Error(`Private secret root ${resolvedRoot} must not be a symlink.`);
    if (!rootStat.isDirectory()) throw new Error(`Private secret root ${resolvedRoot} must be a directory.`);
    await enforcePrivatePathMode(resolvedRoot, mode, "directory");
    return;
  }
  assertPathWithinRoot(resolvedRoot, resolvedTarget);
  await ensurePrivateDirectory(resolvedRoot, resolvedRoot, mode);
  const resolvedRootReal = await _promises.default.realpath(resolvedRoot);
  let current = resolvedRoot;
  for (const segment of _nodePath.default.relative(resolvedRoot, resolvedTarget).split(_nodePath.default.sep).filter(Boolean)) {
    current = _nodePath.default.join(current, segment);
    try {
      const stat = await _promises.default.lstat(current);
      if (stat.isSymbolicLink()) throw new Error(`Private secret directory component ${current} must not be a symlink.`);
      if (!stat.isDirectory()) throw new Error(`Private secret directory component ${current} must be a directory.`);
    } catch (error) {
      if (!error || typeof error !== "object" || !("code" in error) || error.code !== "ENOENT") throw error;
      await _promises.default.mkdir(current, { mode });
    }
    const currentReal = await _promises.default.realpath(current);
    assertRealPathWithinRoot(resolvedRootReal, currentReal);
    await enforcePrivatePathMode(currentReal, mode, "directory");
  }
}
async function writeSecretFileAtomic(params) {
  const mode = params.mode ?? 384;
  const dirMode = params.dirMode ?? 448;
  const resolvedRoot = _nodePath.default.resolve(params.rootDir);
  const resolvedFile = _nodePath.default.resolve(params.filePath);
  assertPathWithinRoot(resolvedRoot, resolvedFile);
  const intendedParentDir = _nodePath.default.dirname(resolvedFile);
  await ensurePrivateDirectory(resolvedRoot, intendedParentDir, dirMode);
  const resolvedRootReal = await _promises.default.realpath(resolvedRoot);
  const parentDir = await _promises.default.realpath(intendedParentDir);
  assertRealPathWithinRoot(resolvedRootReal, parentDir);
  const parentGuard = await (0, _writeQueueBKRKUV0w.u)(parentDir);
  const fileName = _nodePath.default.basename(resolvedFile);
  const finalFilePath = _nodePath.default.join(parentDir, fileName);
  try {
    const stat = await _promises.default.lstat(finalFilePath);
    if (stat.isSymbolicLink()) throw new Error(`Private secret file ${finalFilePath} must not be a symlink.`);
    if (!stat.isFile()) throw new Error(`Private secret file ${finalFilePath} must be a regular file.`);
  } catch (error) {
    if (!error || typeof error !== "object" || !("code" in error) || error.code !== "ENOENT") throw error;
  }
  const tempPath = _nodePath.default.join(parentDir, `.tmp-${process.pid}-${Date.now()}-${(0, _nodeCrypto.randomBytes)(6).toString("hex")}`);
  let createdTemp = false;
  try {
    const handle = await _promises.default.open(tempPath, "wx", mode);
    createdTemp = true;
    try {
      await handle.writeFile(params.content);
    } finally {
      await handle.close();
    }
    await enforcePrivatePathMode(tempPath, mode, "file");
    if ((await _promises.default.realpath(intendedParentDir)) !== parentDir) throw new Error(`Private secret parent directory changed during write for ${finalFilePath}.`);
    await (0, _writeQueueBKRKUV0w.s)([parentGuard], async () => {
      await _promises.default.rename(tempPath, finalFilePath);
    });
    createdTemp = false;
    await enforcePrivatePathMode(finalFilePath, mode, "file");
  } finally {
    if (createdTemp) await _promises.default.unlink(tempPath).catch(() => void 0);
  }
}
//#endregion /* v9-78c849c75912ef9c */
