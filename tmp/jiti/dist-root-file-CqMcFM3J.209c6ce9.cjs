"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.i = openRootFileSync;exports.n = matchRootFileOpenFailure;exports.r = openRootFile;exports.t = canUseRootFileOpen;var _rootPathDTHDXh_ = require("./root-path-DTHDXh_7.js");
var _pinnedOpenDx64loDQ = require("./pinned-open-Dx64loDQ.js");
var _nodeFs = _interopRequireDefault(require("node:fs"));
var _nodePath = _interopRequireDefault(require("node:path"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}
//#region node_modules/@openclaw/fs-safe/dist/root-file.js
function canUseRootFileOpen(ioFs) {
  return typeof ioFs.openSync === "function" && typeof ioFs.closeSync === "function" && typeof ioFs.fstatSync === "function" && typeof ioFs.lstatSync === "function" && typeof ioFs.realpathSync === "function" && typeof ioFs.readFileSync === "function" && typeof ioFs.constants === "object" && ioFs.constants !== null;
}
function openRootFileSync(params) {
  const ioFs = params.ioFs ?? _nodeFs.default;
  const resolved = resolveRootFilePathGeneric({
    absolutePath: params.absolutePath,
    resolve: (absolutePath) => (0, _rootPathDTHDXh_.i)({
      absolutePath,
      rootPath: params.rootPath,
      rootCanonicalPath: params.rootRealPath,
      boundaryLabel: params.boundaryLabel,
      skipLexicalRootCheck: params.skipLexicalRootCheck
    })
  });
  if (resolved instanceof Promise) return toBoundaryValidationError(/* @__PURE__ */new Error("Unexpected async boundary resolution"));
  return finalizeRootFileOpen({
    resolved,
    maxBytes: params.maxBytes,
    rejectHardlinks: params.rejectHardlinks,
    allowedType: params.allowedType,
    ioFs
  });
}
function matchRootFileOpenFailure(failure, handlers) {
  switch (failure.reason) {
    case "path":return handlers.path ? handlers.path(failure) : handlers.fallback(failure);
    case "validation":return handlers.validation ? handlers.validation(failure) : handlers.fallback(failure);
    case "io":return handlers.io ? handlers.io(failure) : handlers.fallback(failure);
  }
  return handlers.fallback(failure);
}
function openRootFileResolved(params) {
  const opened = (0, _pinnedOpenDx64loDQ.t)({
    filePath: params.absolutePath,
    resolvedPath: params.resolvedPath,
    rejectHardlinks: params.rejectHardlinks ?? true,
    maxBytes: params.maxBytes,
    allowedType: params.allowedType,
    ioFs: params.ioFs
  });
  if (!opened.ok) return opened;
  return {
    ok: true,
    path: opened.path,
    fd: opened.fd,
    stat: opened.stat,
    rootRealPath: params.rootRealPath
  };
}
function finalizeRootFileOpen(params) {
  if ("ok" in params.resolved) return params.resolved;
  return openRootFileResolved({
    absolutePath: params.resolved.absolutePath,
    resolvedPath: params.resolved.resolvedPath,
    rootRealPath: params.resolved.rootRealPath,
    maxBytes: params.maxBytes,
    rejectHardlinks: params.rejectHardlinks,
    allowedType: params.allowedType,
    ioFs: params.ioFs
  });
}
async function openRootFile(params) {
  const ioFs = params.ioFs ?? _nodeFs.default;
  const maybeResolved = resolveRootFilePathGeneric({
    absolutePath: params.absolutePath,
    resolve: (absolutePath) => (0, _rootPathDTHDXh_.r)({
      absolutePath,
      rootPath: params.rootPath,
      rootCanonicalPath: params.rootRealPath,
      boundaryLabel: params.boundaryLabel,
      policy: params.aliasPolicy,
      skipLexicalRootCheck: params.skipLexicalRootCheck
    })
  });
  return finalizeRootFileOpen({
    resolved: maybeResolved instanceof Promise ? await maybeResolved : maybeResolved,
    maxBytes: params.maxBytes,
    rejectHardlinks: params.rejectHardlinks,
    allowedType: params.allowedType,
    ioFs
  });
}
function toBoundaryValidationError(error) {
  return {
    ok: false,
    reason: "validation",
    error
  };
}
function mapResolvedRootPath(absolutePath, resolved) {
  return {
    absolutePath,
    resolvedPath: resolved.canonicalPath,
    rootRealPath: resolved.rootCanonicalPath
  };
}
function resolveRootFilePathGeneric(params) {
  const absolutePath = _nodePath.default.resolve(params.absolutePath);
  try {
    const resolved = params.resolve(absolutePath);
    if (resolved instanceof Promise) return resolved.then((value) => mapResolvedRootPath(absolutePath, value)).catch((error) => toBoundaryValidationError(error));
    return mapResolvedRootPath(absolutePath, resolved);
  } catch (error) {
    return toBoundaryValidationError(error);
  }
}
//#endregion /* v9-01e086e5f6b3ae72 */
