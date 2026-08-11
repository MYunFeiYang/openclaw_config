"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = extnameFromAnyPath;exports.r = nameFromAnyPath;exports.t = basenameFromAnyPath;var _nodePath = _interopRequireDefault(require("node:path"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}
//#region src/media/file-name.ts
function basenameFromAnyPath(value) {
  return _nodePath.default.win32.basename(_nodePath.default.posix.basename(value));
}
function extnameFromAnyPath(value) {
  return _nodePath.default.extname(basenameFromAnyPath(value));
}
function nameFromAnyPath(value) {
  const base = basenameFromAnyPath(value);
  const ext = _nodePath.default.extname(base);
  return _nodePath.default.basename(base, ext);
}
//#endregion /* v9-7b0f3e0cc7273aea */
