"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = toRelativeWorkspacePath;exports.i = toRelativeSandboxPath;exports.n = resolveWorkspaceRoot;exports.r = resolvePathFromInput;exports.t = normalizeWorkspaceDir;var _pathB5B_oAT = require("./path-B5B-_oAT.js");
var _utilsCKsuXgDI = require("./utils-CKsuXgDI.js");
require("./path-guards-BptIujoz.js");
var _sandboxPathsDgH4e5SP = require("./sandbox-paths-DgH4e5SP.js");
var _nodePath = _interopRequireDefault(require("node:path"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}
//#region src/agents/path-policy.ts
function throwPathEscapesBoundary(params) {
  const boundary = params.options?.boundaryLabel ?? "workspace root";
  const suffix = params.options?.includeRootInError ? ` (${params.rootResolved})` : "";
  throw new Error(`Path escapes ${boundary}${suffix}: ${params.candidate}`);
}
function validateRelativePathWithinBoundary(params) {
  if (params.relativePath === "" || params.relativePath === ".") {
    if (params.options?.allowRoot) return "";
    throwPathEscapesBoundary({
      options: params.options,
      rootResolved: params.rootResolved,
      candidate: params.candidate
    });
  }
  if (params.relativePath === ".." || params.relativePath.startsWith("../") || params.relativePath.startsWith("..\\") || params.isAbsolutePath(params.relativePath)) throwPathEscapesBoundary({
    options: params.options,
    rootResolved: params.rootResolved,
    candidate: params.candidate
  });
  return params.relativePath;
}
function toRelativePathUnderRoot(params) {
  const resolvedInput = (0, _sandboxPathsDgH4e5SP.i)(params.candidate, params.options?.cwd ?? params.root);
  if (process.platform === "win32") {
    const rootResolved = _nodePath.default.win32.resolve(params.root);
    const resolvedCandidate = _nodePath.default.win32.resolve(resolvedInput);
    const rootForCompare = (0, _pathB5B_oAT.c)(rootResolved);
    const targetForCompare = (0, _pathB5B_oAT.c)(resolvedCandidate);
    return validateRelativePathWithinBoundary({
      relativePath: _nodePath.default.win32.relative(rootForCompare, targetForCompare),
      isAbsolutePath: _nodePath.default.win32.isAbsolute,
      options: params.options,
      rootResolved,
      candidate: params.candidate
    });
  }
  const rootResolved = _nodePath.default.resolve(params.root);
  const resolvedCandidate = _nodePath.default.resolve(resolvedInput);
  return validateRelativePathWithinBoundary({
    relativePath: _nodePath.default.relative(rootResolved, resolvedCandidate),
    isAbsolutePath: _nodePath.default.isAbsolute,
    options: params.options,
    rootResolved,
    candidate: params.candidate
  });
}
function toRelativeBoundaryPath(params) {
  return toRelativePathUnderRoot({
    root: params.root,
    candidate: params.candidate,
    options: {
      allowRoot: params.options?.allowRoot,
      cwd: params.options?.cwd,
      boundaryLabel: params.boundaryLabel,
      includeRootInError: params.includeRootInError
    }
  });
}
function toRelativeWorkspacePath(root, candidate, options) {
  return toRelativeBoundaryPath({
    root,
    candidate,
    options,
    boundaryLabel: "workspace root"
  });
}
function toRelativeSandboxPath(root, candidate, options) {
  return toRelativeBoundaryPath({
    root,
    candidate,
    options,
    boundaryLabel: "sandbox root",
    includeRootInError: true
  });
}
function resolvePathFromInput(filePath, cwd) {
  return _nodePath.default.normalize((0, _sandboxPathsDgH4e5SP.i)(filePath, cwd));
}
//#endregion
//#region src/agents/workspace-dir.ts
function normalizeWorkspaceDir(workspaceDir) {
  const trimmed = workspaceDir?.trim();
  if (!trimmed) return null;
  const expanded = trimmed.startsWith("~") ? (0, _utilsCKsuXgDI.p)(trimmed) : trimmed;
  const resolved = _nodePath.default.resolve(expanded);
  if (resolved === _nodePath.default.parse(resolved).root) return null;
  return resolved;
}
function resolveWorkspaceRoot(workspaceDir) {
  return normalizeWorkspaceDir(workspaceDir) ?? process.cwd();
}
//#endregion /* v9-4627342613dbbe05 */
