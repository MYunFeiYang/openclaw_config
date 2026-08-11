"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.t = sameFileIdentity; //#region node_modules/@openclaw/fs-safe/dist/file-identity.js
function isZero(value) {
  return value === 0 || value === 0n;
}
function sameFileIdentity(left, right, platform = process.platform) {
  if (left.ino !== right.ino) return false;
  if (left.dev === right.dev) return true;
  return platform === "win32" && (isZero(left.dev) || isZero(right.dev));
}
//#endregion /* v9-243879abc756c6b9 */
