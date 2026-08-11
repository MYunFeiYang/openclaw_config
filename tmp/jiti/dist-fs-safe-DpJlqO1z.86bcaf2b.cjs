"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.A = findExistingAncestor;exports.C = safeFileURLToPath;exports.D = sanitizeUntrustedFileName;exports.E = pathExistsSync;exports.M = resolveAbsolutePathForWrite;exports.O = assertAbsolutePathInput;exports.S = isWindowsNetworkPath;exports.T = pathExists;exports._ = readLocalFileFromRoots;exports.a = walkDirectory;exports.b = basenameFromMediaSource;exports.c = writeSiblingTempFile;exports.d = pathScope;exports.f = resolveExistingPathsWithinRoot;exports.g = resolveWritablePathWithinRoot;exports.h = resolveStrictExistingPathsWithinRoot;exports.i = writeFileWithinRoot;exports.j = resolveAbsolutePathForRead;exports.k = canonicalPathFromExistingAncestor;exports.l = writeViaSiblingTempPath;exports.m = resolvePathsWithinRoot;exports.n = readFileWithinRoot;exports.o = walkDirectorySync;exports.p = resolvePathWithinRoot;exports.r = writeExternalFileWithinRoot;exports.s = readSecureFile;exports.t = ensureAbsoluteDirectory;exports.u = withTimeout;exports.v = resolveLocalPathFromRootsSync;exports.w = trySafeFileURLToPath;exports.x = hasEncodedFileUrlSeparator;exports.y = assertNoWindowsNetworkPath;require("./fs-safe-defaults-azXCfv92.js");
var _pathB5B_oAT = require("./path-B5B-_oAT.js");
var _fileIdentityPAmF0zvV = require("./file-identity-PAmF0zvV.js");
var _stringCoerceCx5273Cj = require("./string-coerce-Cx5273Cj.js");
var _writeQueueBKRKUV0w = require("./write-queue-BKRKUV0w.js");
var _secureTempDirGC3bO7Qi = require("./secure-temp-dir-GC3bO7Qi.js");
var _safePathSegmentBIlsa0xw = require("./safe-path-segment-BIlsa0xw.js");
var _permissionsBwHqNako = require("./permissions-BwHqNako.js");
var _nodeUrl = require("node:url");
var _nodeFs = _interopRequireWildcard(require("node:fs"));
var _nodePath = _interopRequireDefault(require("node:path"));
var _promises = _interopRequireDefault(require("node:fs/promises"));
var _nodeCrypto = _interopRequireWildcard(require("node:crypto"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}function _interopRequireWildcard(e, t) {if ("function" == typeof WeakMap) var r = new WeakMap(),n = new WeakMap();return (_interopRequireWildcard = function (e, t) {if (!t && e && e.__esModule) return e;var o,i,f = { __proto__: null, default: e };if (null === e || "object" != typeof e && "function" != typeof e) return f;if (o = t ? n : r) {if (o.has(e)) return o.get(e);o.set(e, f);}for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]);return f;})(e, t);}
//#region node_modules/@openclaw/fs-safe/dist/absolute-path.js
function assertAbsolutePathInput(filePath) {
  if (!filePath) throw new _pathB5B_oAT.p("invalid-path", "path is required");
  if (filePath.includes("\0")) throw new _pathB5B_oAT.p("invalid-path", "path must not contain NUL bytes");
  if (!_nodePath.default.isAbsolute(filePath)) throw new _pathB5B_oAT.p("invalid-path", "path must be absolute");
  return _nodePath.default.normalize(filePath);
}
async function pathExists$1(filePath) {
  try {
    await _promises.default.access(filePath);
    return true;
  } catch {
    return false;
  }
}
async function findExistingAncestor(filePath) {
  return (await findExistingAncestorWithStat(filePath))?.path ?? null;
}
async function findExistingAncestorWithStat(filePath) {
  let current = _nodePath.default.resolve(filePath);
  while (true) {
    try {
      return {
        path: current,
        stat: await _promises.default.lstat(current)
      };
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
    }
    const parent = _nodePath.default.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}
async function canonicalPathFromExistingAncestor(filePath) {
  const ancestor = await findExistingAncestor(filePath);
  if (!ancestor) return _nodePath.default.resolve(filePath);
  let canonicalAncestor = ancestor;
  try {
    canonicalAncestor = await _promises.default.realpath(ancestor);
  } catch {}
  const relative = _nodePath.default.relative(ancestor, filePath);
  return relative ? _nodePath.default.join(canonicalAncestor, relative) : canonicalAncestor;
}
async function resolveAbsolutePathForRead(filePath, options = {}) {
  const normalized = assertAbsolutePathInput(filePath);
  let canonicalPath;
  try {
    canonicalPath = await _promises.default.realpath(normalized);
  } catch (err) {
    if (err.code === "ENOENT") throw new _pathB5B_oAT.p("not-found", "path not found", { cause: err });
    throw err;
  }
  if ((options.symlinks ?? "reject") === "reject" && canonicalPath !== normalized) throw new _pathB5B_oAT.p("symlink", "path traverses a symlink", { cause: { canonicalPath } });
  return {
    path: normalized,
    canonicalPath
  };
}
async function resolveAbsolutePathForWrite(filePath, options = {}) {
  const normalized = assertAbsolutePathInput(filePath);
  const parentDir = _nodePath.default.dirname(normalized);
  const parentExists = await pathExists$1(parentDir);
  if ((options.symlinks ?? "reject") === "reject") {
    const ancestor = await findExistingAncestor(parentDir);
    if (ancestor) {
      const canonicalAncestor = await _promises.default.realpath(ancestor).catch(() => ancestor);
      if (canonicalAncestor !== ancestor) throw new _pathB5B_oAT.p("symlink", "path traverses a symlink", { cause: { canonicalPath: _nodePath.default.join(canonicalAncestor, _nodePath.default.relative(ancestor, normalized)) } });
    }
  }
  return {
    path: normalized,
    canonicalPath: await canonicalPathFromExistingAncestor(normalized),
    parentDir,
    parentExists
  };
}
//#endregion
//#region node_modules/@openclaw/fs-safe/dist/filename.js
function sanitizeUntrustedFileName(fileName, fallbackName) {
  const trimmed = typeof fileName === "string" ? fileName.trim() : "";
  if (!trimmed) return fallbackName;
  let base = _nodePath.default.posix.basename(trimmed);
  base = _nodePath.default.win32.basename(base);
  let cleaned = "";
  for (let i = 0; i < base.length; i++) {
    const code = base.charCodeAt(i);
    if (code < 32 || code === 127) continue;
    cleaned += base[i];
  }
  base = cleaned.trim();
  if (!base || base === "." || base === "..") return fallbackName;
  if (base.length > 200) base = base.slice(0, 200);
  return base;
}
//#endregion
//#region node_modules/@openclaw/fs-safe/dist/fs.js
/**
* Returns true when `fs.stat()` can stat the path.
*
* This follows stat semantics: broken symlinks return false, while symlinks to
* existing targets return true.
*/
async function pathExists(filePath) {
  try {
    await _promises.default.stat(filePath);
    return true;
  } catch {
    return false;
  }
}
/**
* Synchronous counterpart to `pathExists()`, with the same `fs.statSync()`
* semantics.
*/
function pathExistsSync(filePath) {
  try {
    _nodeFs.default.statSync(filePath);
    return true;
  } catch {
    return false;
  }
}
//#endregion
//#region node_modules/@openclaw/fs-safe/dist/local-file-access.js
const ENCODED_FILE_URL_SEPARATOR_RE = /%(?:2f|5c)/i;
function isLocalFileUrlHost(hostname) {
  const normalized = (0, _stringCoerceCx5273Cj.t)(hostname);
  return normalized === "" || normalized === "localhost";
}
function hasEncodedFileUrlSeparator(pathname) {
  return ENCODED_FILE_URL_SEPARATOR_RE.test(pathname);
}
function isWindowsNetworkPath(filePath, platform = process.platform) {
  if (platform !== "win32") return false;
  const normalized = filePath.replace(/\//g, "\\");
  return normalized.startsWith("\\\\?\\UNC\\") || normalized.startsWith("\\\\");
}
function isWindowsDriveLetterPath(filePath, platform = process.platform) {
  return platform === "win32" && /^[A-Za-z]:[\\/]/.test(filePath);
}
function assertNoWindowsNetworkPath(filePath, label = "Path") {
  if (isWindowsNetworkPath(filePath)) throw new Error(`${label} cannot use Windows network paths: ${filePath}`);
}
function safeFileURLToPath(fileUrl) {
  let parsed;
  try {
    parsed = new _nodeUrl.URL(fileUrl);
  } catch {
    throw new Error(`Invalid file:// URL: ${fileUrl}`);
  }
  if (parsed.protocol !== "file:") throw new Error(`Invalid file:// URL: ${fileUrl}`);
  if (!isLocalFileUrlHost(parsed.hostname)) throw new Error(`file:// URLs with remote hosts are not allowed: ${fileUrl}`);
  if (hasEncodedFileUrlSeparator(parsed.pathname)) throw new Error(`file:// URLs cannot encode path separators: ${fileUrl}`);
  const filePath = (0, _nodeUrl.fileURLToPath)(parsed);
  assertNoWindowsNetworkPath(filePath, "Local file URL");
  return filePath;
}
function trySafeFileURLToPath(fileUrl) {
  try {
    return safeFileURLToPath(fileUrl);
  } catch {
    return;
  }
}
function basenameFromMediaSource(source) {
  if (!source) return;
  if (source.startsWith("file://")) {
    const filePath = trySafeFileURLToPath(source);
    return filePath ? _nodePath.default.basename(filePath) || void 0 : void 0;
  }
  if (/^https?:\/\//i.test(source)) try {
    return _nodePath.default.basename(new _nodeUrl.URL(source).pathname) || void 0;
  } catch {
    return;
  }
  return _nodePath.default.basename(source) || void 0;
}
//#endregion
//#region node_modules/@openclaw/fs-safe/dist/local-roots.js
function resolveLocalPathInput(input, label) {
  if (input.startsWith("file://")) try {
    return safeFileURLToPath(input);
  } catch {
    const location = label === "file path" ? "" : ` in ${label}`;
    throw new Error(`Invalid file:// URL${location}: ${input}`);
  }
  if (input.includes("\0")) throw new _pathB5B_oAT.p("invalid-path", `${label} must not contain NUL bytes`);
  return (0, _secureTempDirGC3bO7Qi.f)(input);
}
function resolveLocalRootInput(input, label) {
  const trimmed = input.trim();
  if (!trimmed) throw new _pathB5B_oAT.p("invalid-path", `${label} entry is required`);
  const resolved = trimmed.startsWith("file://") ? resolveLocalPathInput(trimmed, label) : (0, _secureTempDirGC3bO7Qi.u)(trimmed);
  if (resolved.includes("\0")) throw new _pathB5B_oAT.p("invalid-path", `${label} entry must not contain NUL bytes`);
  if (!_nodePath.default.isAbsolute(resolved)) throw new _pathB5B_oAT.p("invalid-path", `${label} entries must be absolute paths: ${input}`);
  return _nodePath.default.resolve(resolved);
}
function isPathInsideRoot(candidate, rootDir) {
  return (0, _pathB5B_oAT.i)(rootDir, candidate);
}
function resolveRootRealSync(rootDir) {
  try {
    if (!_nodeFs.default.lstatSync(rootDir).isDirectory()) return null;
    return _nodeFs.default.realpathSync(rootDir);
  } catch {
    return null;
  }
}
function resolveCandidateCanonicalSync(filePath) {
  let sawExistingLeaf = false;
  try {
    const stat = _nodeFs.default.lstatSync(filePath);
    sawExistingLeaf = true;
    return {
      exists: true,
      canonicalPath: _nodeFs.default.realpathSync(filePath),
      isFile: stat.isFile()
    };
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }
  if (sawExistingLeaf) throw new _pathB5B_oAT.p("symlink", "local roots candidate is a dangling symlink");
  let cursor = filePath;
  const missingSegments = [];
  while (true) {
    const parent = _nodePath.default.dirname(cursor);
    if (parent === cursor) return {
      exists: false,
      canonicalPath: filePath
    };
    missingSegments.unshift(_nodePath.default.basename(cursor));
    cursor = parent;
    try {
      _nodeFs.default.lstatSync(cursor);
      const ancestorReal = _nodeFs.default.realpathSync(cursor);
      return {
        exists: false,
        canonicalPath: _nodePath.default.join(ancestorReal, ...missingSegments)
      };
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
    }
  }
}
function resolveLocalPathFromRootsSync(options) {
  const label = options.label ?? "local roots";
  const requestedPath = _nodePath.default.resolve(resolveLocalPathInput(options.filePath, "file path"));
  for (const rootEntry of options.roots) {
    const rootReal = resolveRootRealSync(resolveLocalRootInput(rootEntry, label));
    if (!rootReal) continue;
    let candidate;
    try {
      candidate = resolveCandidateCanonicalSync(requestedPath);
    } catch {
      continue;
    }
    if (!candidate.exists && options.allowMissing !== true) continue;
    if (candidate.exists && options.requireFile === true && !candidate.isFile) continue;
    if (isPathInsideRoot(candidate.canonicalPath, rootReal)) return {
      path: candidate.canonicalPath,
      root: rootReal
    };
  }
  return null;
}
async function readLocalFileFromRoots(options) {
  const label = options.label ?? "local roots";
  const requestedPath = _nodePath.default.resolve(resolveLocalPathInput(options.filePath, "file path"));
  for (const rootEntry of options.roots) {
    const rootDir = resolveLocalRootInput(rootEntry, label);
    let scopedRoot;
    try {
      scopedRoot = await (0, _secureTempDirGC3bO7Qi.o)(rootDir);
    } catch {
      continue;
    }
    const relativePath = _nodePath.default.relative(scopedRoot.rootDir, requestedPath);
    if (!relativePath || relativePath.startsWith("..") || _nodePath.default.isAbsolute(relativePath)) continue;
    try {
      const readOptions = {
        hardlinks: options.hardlinks,
        nonBlockingRead: options.nonBlockingRead,
        symlinks: options.symlinks
      };
      if (options.maxBytes !== void 0) readOptions.maxBytes = options.maxBytes;
      return {
        ...(await scopedRoot.read(relativePath, readOptions)),
        root: scopedRoot.rootReal
      };
    } catch {
      continue;
    }
  }
  return null;
}
//#endregion
//#region node_modules/@openclaw/fs-safe/dist/root-paths.js
function invalidPath(scopeLabel) {
  return {
    ok: false,
    error: `Invalid path: must stay within ${scopeLabel}`
  };
}
async function resolveRealPathIfExists(targetPath) {
  try {
    return await _promises.default.realpath(targetPath);
  } catch {
    return;
  }
}
async function resolveTrustedRootRealPath(rootDir) {
  try {
    const rootLstat = await _promises.default.lstat(rootDir);
    if (!rootLstat.isDirectory() || rootLstat.isSymbolicLink()) return;
    return await _promises.default.realpath(rootDir);
  } catch {
    return;
  }
}
async function validateCanonicalPathWithinRoot(params) {
  try {
    const candidateLstat = await _promises.default.lstat(params.candidatePath);
    if (candidateLstat.isSymbolicLink()) return "invalid";
    if (params.expect === "directory" && !candidateLstat.isDirectory()) return "invalid";
    if (params.expect === "file" && !candidateLstat.isFile()) return "invalid";
    if (params.expect === "file" && candidateLstat.nlink > 1) return "invalid";
    const candidateRealPath = await _promises.default.realpath(params.candidatePath);
    return (0, _pathB5B_oAT.i)(params.rootRealPath, candidateRealPath) ? "ok" : "invalid";
  } catch (err) {
    return (0, _pathB5B_oAT.r)(err) ? "not-found" : "invalid";
  }
}
function resolvePathWithinRoot(params) {
  const root = _nodePath.default.resolve(params.rootDir);
  const raw = params.requestedPath.trim();
  if (!raw) {
    if (!params.defaultFileName) return {
      ok: false,
      error: "path is required"
    };
    return {
      ok: true,
      path: _nodePath.default.join(root, params.defaultFileName)
    };
  }
  const resolved = _nodePath.default.resolve(root, raw);
  const rel = _nodePath.default.relative(root, resolved);
  if (!rel || rel.startsWith("..") || _nodePath.default.isAbsolute(rel)) return {
    ok: false,
    error: `Invalid path: must stay within ${params.scopeLabel}`
  };
  return {
    ok: true,
    path: resolved
  };
}
async function resolveWritablePathWithinRoot(params) {
  const lexical = resolvePathWithinRoot(params);
  if (!lexical.ok) return lexical;
  const rootRealPath = await resolveTrustedRootRealPath(_nodePath.default.resolve(params.rootDir));
  if (!rootRealPath) return invalidPath(params.scopeLabel);
  const requestedPath = lexical.path;
  if ((await validateCanonicalPathWithinRoot({
    rootRealPath,
    candidatePath: _nodePath.default.dirname(requestedPath),
    expect: "directory"
  })) !== "ok") return invalidPath(params.scopeLabel);
  if ((await validateCanonicalPathWithinRoot({
    rootRealPath,
    candidatePath: requestedPath,
    expect: "file"
  })) === "invalid") return invalidPath(params.scopeLabel);
  return lexical;
}
async function resolveNearestExistingPath(targetPath) {
  let current = _nodePath.default.resolve(targetPath);
  while (true) {
    try {
      await _promises.default.lstat(current);
      return current;
    } catch (err) {
      if (!(0, _pathB5B_oAT.r)(err)) throw err;
    }
    const parent = _nodePath.default.dirname(current);
    if (parent === current) throw new Error(`failed to resolve existing path for ${targetPath}`);
    current = parent;
  }
}
async function assertNoSymlinkSegments(params) {
  const relative = _nodePath.default.relative(params.rootDir, params.targetPath);
  if (relative.startsWith("..") || _nodePath.default.isAbsolute(relative)) throw new Error(`Invalid path: must stay within ${params.scopeLabel}`);
  let current = params.rootDir;
  for (const segment of relative.split(_nodePath.default.sep).filter(Boolean)) {
    current = _nodePath.default.join(current, segment);
    try {
      const stat = await _promises.default.lstat(current);
      if (stat.isSymbolicLink()) throw new Error(`Invalid path: must not traverse symlinks within ${params.scopeLabel}`);
      if (!stat.isDirectory()) throw new Error(`Invalid path: existing segment must be a directory within ${params.scopeLabel}`);
    } catch (err) {
      if ((0, _pathB5B_oAT.r)(err)) return;
      throw err;
    }
  }
}
async function ensureDirectoryWithinRoot(params) {
  const lexical = resolvePathWithinRoot({
    rootDir: params.rootDir,
    requestedPath: params.requestedPath,
    scopeLabel: params.scopeLabel,
    defaultFileName: params.defaultDirName
  });
  if (!lexical.ok) return lexical;
  const rootDir = _nodePath.default.resolve(params.rootDir);
  const targetPath = _nodePath.default.resolve(lexical.path);
  try {
    const rootStat = await _promises.default.lstat(rootDir);
    if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) return invalidPath(params.scopeLabel);
    await assertNoSymlinkSegments({
      rootDir,
      targetPath,
      scopeLabel: params.scopeLabel
    });
    const rootReal = await _promises.default.realpath(rootDir);
    const nearestExistingPath = await resolveNearestExistingPath(targetPath);
    if (!(0, _pathB5B_oAT.i)(rootReal, await _promises.default.realpath(nearestExistingPath))) return invalidPath(params.scopeLabel);
    const relative = _nodePath.default.relative(rootDir, targetPath);
    let current = rootDir;
    for (const segment of relative.split(_nodePath.default.sep).filter(Boolean)) {
      current = _nodePath.default.join(current, segment);
      while (true) try {
        const stat = await _promises.default.lstat(current);
        if (stat.isSymbolicLink() || !stat.isDirectory()) return invalidPath(params.scopeLabel);
        break;
      } catch (err) {
        if (!(0, _pathB5B_oAT.r)(err)) throw err;
        try {
          await _promises.default.mkdir(current, { mode: params.mode });
        } catch (mkdirErr) {
          if ((0, _pathB5B_oAT.r)(mkdirErr)) throw mkdirErr;
          if (mkdirErr.code === "EEXIST") continue;
          throw mkdirErr;
        }
      }
    }
    if (!(0, _pathB5B_oAT.i)(rootReal, await _promises.default.realpath(targetPath))) return invalidPath(params.scopeLabel);
    return {
      ok: true,
      path: targetPath
    };
  } catch {
    return invalidPath(params.scopeLabel);
  }
}
function resolvePathsWithinRoot(params) {
  const resolvedPaths = [];
  for (const raw of params.requestedPaths) {
    const pathResult = resolvePathWithinRoot({
      rootDir: params.rootDir,
      requestedPath: raw,
      scopeLabel: params.scopeLabel
    });
    if (!pathResult.ok) return {
      ok: false,
      error: pathResult.error
    };
    resolvedPaths.push(pathResult.path);
  }
  return {
    ok: true,
    paths: resolvedPaths
  };
}
async function resolveExistingPathsWithinRoot(params) {
  return await resolveCheckedPathsWithinRoot(params, true);
}
async function resolveStrictExistingPathsWithinRoot(params) {
  return await resolveCheckedPathsWithinRoot(params, false);
}
function pathScope(rootDir, options) {
  const base = {
    rootDir,
    scopeLabel: options.label
  };
  return {
    rootDir,
    label: options.label,
    resolve: (requestedPath, pathOptions) => resolvePathWithinRoot({
      ...base,
      requestedPath,
      defaultFileName: pathOptions?.defaultName
    }),
    resolveAll: (requestedPaths) => resolvePathsWithinRoot({
      ...base,
      requestedPaths
    }),
    existing: (requestedPaths) => resolveExistingPathsWithinRoot({
      ...base,
      requestedPaths
    }),
    files: (requestedPaths) => resolveStrictExistingPathsWithinRoot({
      ...base,
      requestedPaths
    }),
    writable: (requestedPath, pathOptions) => resolveWritablePathWithinRoot({
      ...base,
      requestedPath,
      defaultFileName: pathOptions?.defaultName
    }),
    ensureDir: (requestedPath, pathOptions) => ensureDirectoryWithinRoot({
      ...base,
      requestedPath,
      defaultDirName: pathOptions?.defaultName,
      mode: pathOptions?.mode
    })
  };
}
async function resolveCheckedPathsWithinRoot(params, allowMissingFallback) {
  const rootDir = _nodePath.default.resolve(params.rootDir);
  const rootRealPath = await resolveRealPathIfExists(rootDir);
  const root$1 = rootRealPath ? await (0, _secureTempDirGC3bO7Qi.o)(rootDir) : void 0;
  const isInRoot = (relativePath) => Boolean(relativePath) && !relativePath.startsWith("..") && !_nodePath.default.isAbsolute(relativePath);
  const resolveExistingRelativePath = async (requestedPath) => {
    const raw = requestedPath.trim();
    const lexicalPathResult = resolvePathWithinRoot({
      rootDir,
      requestedPath,
      scopeLabel: params.scopeLabel
    });
    if (lexicalPathResult.ok) return {
      ok: true,
      relativePath: _nodePath.default.relative(rootDir, lexicalPathResult.path),
      fallbackPath: lexicalPathResult.path
    };
    if (!rootRealPath || !raw || !_nodePath.default.isAbsolute(raw)) return lexicalPathResult;
    try {
      const resolvedExistingPath = await _promises.default.realpath(raw);
      const relativePath = _nodePath.default.relative(rootRealPath, resolvedExistingPath);
      if (!isInRoot(relativePath)) return lexicalPathResult;
      return {
        ok: true,
        relativePath,
        fallbackPath: resolvedExistingPath
      };
    } catch {
      return lexicalPathResult;
    }
  };
  const resolvedPaths = [];
  for (const raw of params.requestedPaths) {
    const pathResult = await resolveExistingRelativePath(raw);
    if (!pathResult.ok) return {
      ok: false,
      error: pathResult.error
    };
    let opened;
    try {
      if (!root$1) throw new _pathB5B_oAT.p("not-found", "root dir not found");
      opened = await root$1.open(pathResult.relativePath);
      resolvedPaths.push(opened.realPath);
    } catch (err) {
      if (allowMissingFallback && err instanceof _pathB5B_oAT.p && err.code === "not-found") {
        resolvedPaths.push(pathResult.fallbackPath);
        continue;
      }
      if (err instanceof _pathB5B_oAT.p && err.code === "outside-workspace") return {
        ok: false,
        error: `File is outside ${params.scopeLabel}`
      };
      return {
        ok: false,
        error: `Invalid path: must stay within ${params.scopeLabel} and be a regular non-symlink file`
      };
    } finally {
      await opened?.handle.close().catch(() => {});
    }
  }
  return {
    ok: true,
    paths: resolvedPaths
  };
}
//#endregion
//#region node_modules/@openclaw/fs-safe/dist/timing.js
async function withTimeout(promise, timeoutMs, labelOrOptions = { message: "timeout" }) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) return await promise;
  const options = typeof labelOrOptions === "string" ? { label: labelOrOptions } : labelOrOptions;
  const createError = options.createError ?? (() => new Error(options.message ?? `${options.label ?? "operation"} timed out after ${timeoutMs}ms`));
  let timeoutId;
  try {
    return await Promise.race([promise, new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(createError()), timeoutMs);
    })]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
//#endregion
//#region node_modules/@openclaw/fs-safe/dist/sibling-temp.js
function buildTempPath(dir, tempPrefix) {
  const safePrefix = (0, _safePathSegmentBIlsa0xw.t)(tempPrefix ?? ".fs-safe-stream", { label: "sibling temp prefix" });
  return _nodePath.default.join(dir, `${safePrefix}.${process.pid}.${(0, _nodeCrypto.randomUUID)()}.tmp`);
}
async function syncFileBestEffort(filePath) {
  const handle = await _promises.default.open(filePath, "r+");
  try {
    await handle.sync();
  } catch (error) {
    if (error.code !== "EPERM") throw error;
  } finally {
    await handle.close();
  }
}
async function syncDirectoryBestEffort(dirPath) {
  let handle;
  try {
    handle = await _promises.default.open(dirPath, "r");
    await handle.sync();
  } catch {} finally {
    await handle?.close().catch(() => void 0);
  }
}
function assertFinalPathIsSibling(dir, filePath) {
  const resolvedDir = _nodePath.default.resolve(dir);
  const resolvedFile = _nodePath.default.resolve(filePath);
  if (_nodePath.default.dirname(resolvedFile) !== resolvedDir) throw new Error("Final path must be in the sibling temp directory.");
}
async function writeSiblingTempFile(options) {
  const dir = _nodePath.default.resolve(options.dir);
  await _promises.default.mkdir(dir, {
    recursive: true,
    mode: options.dirMode ?? 448
  });
  if (options.chmodDir !== false) await _promises.default.chmod(dir, options.dirMode ?? 448).catch(() => void 0);
  const dirGuard = await (0, _writeQueueBKRKUV0w.u)(dir);
  const tempPath = buildTempPath(dir, options.tempPrefix);
  const unregisterTempPath = (0, _writeQueueBKRKUV0w.n)(tempPath);
  let tempExists = false;
  try {
    tempExists = true;
    const result = await options.writeTemp(tempPath);
    if (options.mode !== void 0) await _promises.default.chmod(tempPath, options.mode).catch(() => void 0);
    if (options.syncTempFile) await syncFileBestEffort(tempPath);
    const filePath = _nodePath.default.resolve(options.resolveFinalPath(result));
    assertFinalPathIsSibling(dir, filePath);
    await (0, _writeQueueBKRKUV0w.t)(filePath, async () => {
      await (0, _writeQueueBKRKUV0w.s)([dirGuard], async () => {
        await _promises.default.rename(tempPath, filePath);
      });
      tempExists = false;
      unregisterTempPath();
      if (options.mode !== void 0) await _promises.default.chmod(filePath, options.mode).catch(() => void 0);
      if (options.syncParentDir) await syncDirectoryBestEffort(dir);
    });
    return {
      filePath,
      result
    };
  } finally {
    if (tempExists) await _promises.default.rm(tempPath, { force: true }).catch(() => void 0);
    unregisterTempPath();
  }
}
function buildSiblingTempPath(params) {
  const id = _nodeCrypto.default.randomUUID();
  const safePrefix = (0, _safePathSegmentBIlsa0xw.t)(params.tempPrefix, { label: "sibling temp prefix" });
  const safeTail = sanitizeUntrustedFileName(_nodePath.default.basename(params.targetPath), params.fallbackFileName);
  return _nodePath.default.join(_nodePath.default.dirname(params.targetPath), `${safePrefix}${id}-${safeTail}.part`);
}
async function writeViaSiblingTempPath(params) {
  const rootDir = await _promises.default.realpath(_nodePath.default.resolve(params.rootDir)).catch(() => _nodePath.default.resolve(params.rootDir));
  const requestedTargetPath = _nodePath.default.resolve(params.targetPath);
  const targetPath = await _promises.default.realpath(_nodePath.default.dirname(requestedTargetPath)).then((realDir) => _nodePath.default.join(realDir, _nodePath.default.basename(requestedTargetPath))).catch(() => requestedTargetPath);
  const relativeTargetPath = _nodePath.default.relative(rootDir, targetPath);
  if (!relativeTargetPath || relativeTargetPath === ".." || relativeTargetPath.startsWith(`..${_nodePath.default.sep}`) || _nodePath.default.isAbsolute(relativeTargetPath)) throw new Error("Target path is outside the allowed root");
  const rootGuard = await (0, _writeQueueBKRKUV0w.u)(rootDir);
  const tempDir = await _promises.default.mkdtemp(_nodePath.default.join((0, _secureTempDirGC3bO7Qi.t)({
    fallbackPrefix: "fs-safe-output",
    unsafeFallbackLabel: "sibling temp output dir",
    warn: () => void 0
  }), "fs-safe-output-"));
  const tempPath = buildSiblingTempPath({
    targetPath: _nodePath.default.join(tempDir, _nodePath.default.basename(targetPath)),
    fallbackFileName: params.fallbackFileName ?? "output.bin",
    tempPrefix: params.tempPrefix ?? ".fs-safe-output-"
  });
  const unregisterTempPath = (0, _writeQueueBKRKUV0w.n)(tempDir, { recursive: true });
  try {
    await (0, _secureTempDirGC3bO7Qi.s)()?.beforeSiblingTempWrite?.(tempPath);
    await params.writeTemp(tempPath);
    await (0, _writeQueueBKRKUV0w.c)(rootGuard);
    await (await (0, _secureTempDirGC3bO7Qi.o)(rootDir)).copyIn(relativeTargetPath, tempPath, { mkdir: false });
    await (0, _writeQueueBKRKUV0w.c)(rootGuard);
  } finally {
    await _promises.default.rm(tempDir, {
      recursive: true,
      force: true
    }).catch(() => {});
    unregisterTempPath();
  }
}
//#endregion
//#region node_modules/@openclaw/fs-safe/dist/secure-file.js
const SUPPORTS_NOFOLLOW = process.platform !== "win32" && "O_NOFOLLOW" in _nodeFs.constants;
const OPEN_READ_FLAGS = _nodeFs.constants.O_RDONLY | (SUPPORTS_NOFOLLOW ? _nodeFs.constants.O_NOFOLLOW : 0);
function isAbsolutePathname(value) {
  return _nodePath.default.isAbsolute(value) || isWindowsDriveLetterPath(value, "win32") || isWindowsNetworkPath(value, "win32");
}
function label(options) {
  return options.label ?? "Secure file";
}
async function openSecureHandle(options) {
  if (isWindowsNetworkPath(options.filePath, "win32") && !options.trust?.allowNetworkPath) throw new _pathB5B_oAT.p("invalid-path", `${label(options)} must be a local absolute path.`);
  if (!isAbsolutePathname(options.filePath)) throw new _pathB5B_oAT.p("invalid-path", `${label(options)} must be an absolute path.`);
  const preStat = await _promises.default.lstat(options.filePath).catch((err) => {
    throw new _pathB5B_oAT.p("not-found", `${label(options)} is not readable: ${options.filePath}`, { cause: err });
  });
  if (preStat.isDirectory()) throw new _pathB5B_oAT.p("not-file", `${label(options)} must be a file: ${options.filePath}`);
  if (preStat.isSymbolicLink() && !options.trust?.allowSymlink) throw new _pathB5B_oAT.p("symlink", `${label(options)} must not be a symlink: ${options.filePath}`);
  let handle;
  try {
    handle = await _promises.default.open(options.filePath, options.trust?.allowSymlink ? _nodeFs.constants.O_RDONLY : OPEN_READ_FLAGS);
  } catch (err) {
    if ((0, _pathB5B_oAT.o)(err)) throw new _pathB5B_oAT.p("symlink", `${label(options)} symlink open blocked`, { cause: err });
    throw err;
  }
  try {
    const openedStat = await handle.stat();
    if (!openedStat.isFile()) throw new _pathB5B_oAT.p("not-file", `${label(options)} must be a file: ${options.filePath}`);
    const pathStat = options.trust?.allowSymlink ? await _promises.default.stat(options.filePath) : await _promises.default.lstat(options.filePath);
    if (!options.trust?.allowSymlink && pathStat.isSymbolicLink()) throw new _pathB5B_oAT.p("symlink", `${label(options)} must not be a symlink: ${options.filePath}`);
    if (!(0, _fileIdentityPAmF0zvV.t)(pathStat, openedStat)) throw new _pathB5B_oAT.p("path-mismatch", `${label(options)} changed during open.`);
    const realPath = await _promises.default.realpath(options.filePath);
    if (!(0, _fileIdentityPAmF0zvV.t)(await _promises.default.stat(realPath), openedStat)) throw new _pathB5B_oAT.p("path-mismatch", `${label(options)} real path changed during open.`);
    if (options.io?.maxBytes !== void 0 && openedStat.size > options.io.maxBytes) throw new _pathB5B_oAT.p("too-large", `${label(options)} exceeded maxBytes (${options.io.maxBytes}).`);
    return {
      handle,
      pathStat: openedStat,
      realPath
    };
  } catch (err) {
    await handle.close().catch(() => void 0);
    throw err;
  }
}
async function assertTrustedDirs(options, realPath) {
  if (!options.trust?.trustedDirs || options.trust.trustedDirs.length === 0) return;
  if (!(await Promise.all(options.trust.trustedDirs.map(async (dir) => {
    const resolved = _nodePath.default.resolve(dir);
    return await _promises.default.realpath(resolved).catch(() => resolved);
  }))).some((dir) => (0, _pathB5B_oAT.i)(dir, realPath))) throw new _pathB5B_oAT.p("outside-workspace", `${label(options)} is outside trustedDirs: ${realPath}`);
}
function inspectOpenedPermissions(stat, platform) {
  const bits = (0, _permissionsBwHqNako.u)(typeof stat.mode === "number" ? stat.mode : null);
  return {
    ok: true,
    isSymlink: false,
    isDir: stat.isDirectory(),
    mode: typeof stat.mode === "number" ? stat.mode : null,
    bits,
    source: platform === "win32" ? "unknown" : "posix",
    worldWritable: (0, _permissionsBwHqNako.l)(bits),
    groupWritable: (0, _permissionsBwHqNako.s)(bits),
    worldReadable: (0, _permissionsBwHqNako.c)(bits),
    groupReadable: (0, _permissionsBwHqNako.o)(bits)
  };
}
async function assertSecurePermissions(options, stat, realPath) {
  if (options.permissions?.allowInsecure) return;
  const platform = options.inject?.platform ?? process.platform;
  const permissions = platform === "win32" ? await (0, _permissionsBwHqNako.a)(realPath, options.inject) : inspectOpenedPermissions(stat, platform);
  if (!permissions.ok) throw new _pathB5B_oAT.p("permission-unverified", `${label(options)} permissions could not be verified: ${realPath}`);
  if (platform === "win32" && permissions.source === "unknown") throw new _pathB5B_oAT.p("permission-unverified", `${label(options)} ACL verification unavailable on Windows for ${realPath}.`);
  const writableByOthers = permissions.worldWritable || permissions.groupWritable;
  const readableByOthers = permissions.worldReadable || permissions.groupReadable;
  if (writableByOthers || !options.permissions?.allowReadableByOthers && readableByOthers) throw new _pathB5B_oAT.p("insecure-permissions", `${label(options)} permissions are too open: ${realPath}`);
  if (platform !== "win32" && typeof process.getuid === "function" && stat.uid != null) {
    const uid = process.getuid();
    if (stat.uid !== uid) throw new _pathB5B_oAT.p("not-owned", `${label(options)} must be owned by the current user (uid=${uid}): ${realPath}`);
  }
  return permissions;
}
async function readHandleWithTimeout(handle, timeoutMs) {
  if (timeoutMs === void 0 || !Number.isFinite(timeoutMs) || timeoutMs <= 0) return await handle.readFile();
  let timeout;
  try {
    return await Promise.race([handle.readFile(), new Promise((_resolve, reject) => {
      timeout = setTimeout(() => {
        handle.close().catch(() => void 0);
        reject(new _pathB5B_oAT.p("timeout", `secure file read timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    })]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
async function readSecureFile(options) {
  const opened = await openSecureHandle(options);
  try {
    await assertTrustedDirs(options, opened.realPath);
    const permissions = await assertSecurePermissions(options, opened.pathStat, opened.realPath);
    const buffer = await readHandleWithTimeout(opened.handle, options.io?.timeoutMs);
    if (options.io?.maxBytes !== void 0 && buffer.byteLength > options.io.maxBytes) throw new _pathB5B_oAT.p("too-large", `${label(options)} exceeded maxBytes (${options.io.maxBytes}).`);
    return {
      buffer,
      realPath: opened.realPath,
      stat: opened.pathStat,
      permissions
    };
  } finally {
    await opened.handle.close().catch(() => void 0);
  }
}
//#endregion
//#region node_modules/@openclaw/fs-safe/dist/walk.js
function kindForDirent(dirent) {
  if (dirent.isDirectory()) return "directory";
  if (dirent.isFile()) return "file";
  if (dirent.isSymbolicLink()) return "symlink";
  return "other";
}
function shouldStop(result, options) {
  return options.maxEntries !== void 0 && result.scannedEntryCount >= Math.max(0, options.maxEntries);
}
function buildEntry(params) {
  const fullPath = _nodePath.default.join(params.dir, params.dirent.name);
  const relativePath = _nodePath.default.relative(params.rootDir, fullPath) || params.dirent.name;
  return {
    name: params.dirent.name,
    path: fullPath,
    relativePath,
    depth: params.depth,
    kind: params.kind ?? kindForDirent(params.dirent),
    dirent: params.dirent
  };
}
function resolveSyncKind(fullPath, dirent, symlinks) {
  const kind = kindForDirent(dirent);
  if (kind !== "symlink") return kind;
  if (symlinks === "skip") return null;
  if (symlinks === "include") return "symlink";
  try {
    const stat = _nodeFs.default.statSync(fullPath);
    if (stat.isDirectory()) return "directory";
    if (stat.isFile()) return "file";
  } catch {
    return null;
  }
  return "other";
}
async function resolveAsyncKind(fullPath, dirent, symlinks) {
  const kind = kindForDirent(dirent);
  if (kind !== "symlink") return kind;
  if (symlinks === "skip") return null;
  if (symlinks === "include") return "symlink";
  try {
    const stat = await _promises.default.stat(fullPath);
    if (stat.isDirectory()) return "directory";
    if (stat.isFile()) return "file";
  } catch {
    return null;
  }
  return "other";
}
function walkDirectorySync(rootDir, options = {}) {
  const root = _nodePath.default.resolve(rootDir);
  const symlinks = options.symlinks ?? "skip";
  const result = {
    entries: [],
    scannedEntryCount: 0,
    truncated: false
  };
  const visitedDirs = /* @__PURE__ */new Set();
  function visit(dir, depth) {
    if (options.maxDepth !== void 0 && depth > options.maxDepth) return;
    let realDir;
    try {
      realDir = _nodeFs.default.realpathSync(dir);
    } catch {
      return;
    }
    if (visitedDirs.has(realDir)) return;
    visitedDirs.add(realDir);
    let entries;
    try {
      entries = _nodeFs.default.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const dirent of entries) {
      if (shouldStop(result, options)) {
        result.truncated = true;
        return;
      }
      result.scannedEntryCount += 1;
      const fullPath = _nodePath.default.join(dir, dirent.name);
      const kind = resolveSyncKind(fullPath, dirent, symlinks);
      if (!kind) continue;
      const entry = buildEntry({
        rootDir: root,
        dir,
        dirent,
        depth,
        kind
      });
      if (options.include?.(entry) ?? true) result.entries.push(entry);
      if (kind === "directory" && (options.maxDepth === void 0 || depth < options.maxDepth) && (options.descend?.(entry) ?? true)) {
        visit(fullPath, depth + 1);
        if (result.truncated) return;
      }
    }
  }
  visit(root, 1);
  return result;
}
async function walkDirectory(rootDir, options = {}) {
  const root = _nodePath.default.resolve(rootDir);
  const symlinks = options.symlinks ?? "skip";
  const result = {
    entries: [],
    scannedEntryCount: 0,
    truncated: false
  };
  const visitedDirs = /* @__PURE__ */new Set();
  async function visit(dir, depth) {
    if (options.maxDepth !== void 0 && depth > options.maxDepth) return;
    let realDir;
    try {
      realDir = await _promises.default.realpath(dir);
    } catch {
      return;
    }
    if (visitedDirs.has(realDir)) return;
    visitedDirs.add(realDir);
    let entries;
    try {
      entries = await _promises.default.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const dirent of entries) {
      if (shouldStop(result, options)) {
        result.truncated = true;
        return;
      }
      result.scannedEntryCount += 1;
      const fullPath = _nodePath.default.join(dir, dirent.name);
      const kind = await resolveAsyncKind(fullPath, dirent, symlinks);
      if (!kind) continue;
      const entry = buildEntry({
        rootDir: root,
        dir,
        dirent,
        depth,
        kind
      });
      if (options.include?.(entry) ?? true) result.entries.push(entry);
      if (kind === "directory" && (options.maxDepth === void 0 || depth < options.maxDepth) && (options.descend?.(entry) ?? true)) {
        await visit(fullPath, depth + 1);
        if (result.truncated) return;
      }
    }
  }
  await visit(root, 1);
  return result;
}
//#endregion
//#region src/infra/fs-safe.ts
async function ensureAbsoluteDirectory(dirPath, options) {
  const absolutePath = _nodePath.default.resolve(dirPath);
  const scopeLabel = options?.scopeLabel ?? "directory";
  const existingAncestor = await findExistingAncestor(absolutePath);
  if (!existingAncestor) return {
    ok: false,
    error: /* @__PURE__ */new Error(`Invalid path: must stay within ${scopeLabel}`)
  };
  if (existingAncestor === absolutePath) {
    try {
      const stat = await _promises.default.lstat(absolutePath);
      if (!stat.isSymbolicLink() && stat.isDirectory()) return {
        ok: true,
        path: absolutePath
      };
    } catch {}
    return {
      ok: false,
      error: /* @__PURE__ */new Error(`Invalid path: must stay within ${scopeLabel}`)
    };
  }
  const result = await ensureDirectoryWithinRoot({
    rootDir: existingAncestor,
    requestedPath: _nodePath.default.relative(existingAncestor, absolutePath),
    scopeLabel,
    mode: options?.mode
  });
  if (result.ok) return result;
  return {
    ok: false,
    error: new Error(result.error)
  };
}
async function writeExternalFileWithinRoot(options) {
  const targetPath = _nodePath.default.resolve(options.rootDir, options.path);
  await writeViaSiblingTempPath({
    rootDir: options.rootDir,
    targetPath,
    writeTemp: options.write,
    fallbackFileName: options.fallbackFileName,
    tempPrefix: options.tempPrefix
  });
  return { path: targetPath };
}
/** @deprecated Use root(rootDir).read(relativePath, options). */
async function readFileWithinRoot(params) {
  return await (await (0, _secureTempDirGC3bO7Qi.o)(params.rootDir)).read(params.relativePath, {
    hardlinks: params.rejectHardlinks === false ? "allow" : "reject",
    maxBytes: params.maxBytes,
    nonBlockingRead: params.nonBlockingRead,
    symlinks: params.allowSymlinkTargetWithinRoot === true ? "follow-within-root" : "reject"
  });
}
/** @deprecated Use root(rootDir).write(relativePath, data, options). */
async function writeFileWithinRoot(params) {
  await (await (0, _secureTempDirGC3bO7Qi.o)(params.rootDir)).write(params.relativePath, params.data, {
    encoding: params.encoding,
    mkdir: params.mkdir
  });
}
//#endregion /* v9-6577a35a66be137d */
