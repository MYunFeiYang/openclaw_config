"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = listBuiltRuntimeEntryCandidates;exports.t = isTypeScriptPackageEntry;var _nodePath = _interopRequireDefault(require("node:path"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}
//#region src/plugins/package-entrypoints.ts
function isTypeScriptPackageEntry(entryPath) {
  return [
  ".ts",
  ".mts",
  ".cts"].
  includes(_nodePath.default.extname(entryPath).toLowerCase());
}
function listBuiltRuntimeEntryCandidates(entryPath) {
  if (!isTypeScriptPackageEntry(entryPath)) return [];
  const normalized = entryPath.replace(/\\/g, "/");
  const withoutExtension = normalized.replace(/\.[^.]+$/u, "");
  const normalizedRelative = normalized.replace(/^\.\//u, "");
  const distWithoutExtension = normalizedRelative.startsWith("src/") ? `./dist/${normalizedRelative.slice(4).replace(/\.[^.]+$/u, "")}` : `./dist/${withoutExtension.replace(/^\.\//u, "")}`;
  const withJavaScriptExtensions = (basePath) => [
  `${basePath}.js`,
  `${basePath}.mjs`,
  `${basePath}.cjs`];

  const candidates = [...withJavaScriptExtensions(distWithoutExtension), ...withJavaScriptExtensions(withoutExtension)];
  return [...new Set(candidates)].filter((candidate) => candidate !== normalized);
}
//#endregion /* v9-22c1ce244894f938 */
