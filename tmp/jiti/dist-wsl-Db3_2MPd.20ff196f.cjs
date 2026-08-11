"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = resetWSLStateForTests;exports.i = isWSLSync;exports.n = isWSL2Sync;exports.r = isWSLEnv;exports.t = isWSL;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
var _nodeFs = require("node:fs");
var _promises = _interopRequireDefault(require("node:fs/promises"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}
//#region src/infra/wsl.ts
let wslCached = null;
function resetWSLStateForTests() {
  wslCached = null;
}
function isWSLEnv() {
  if (process.env.WSL_INTEROP || process.env.WSL_DISTRO_NAME || process.env.WSLENV) return true;
  return false;
}
/**
* Synchronously check if running in WSL.
* Checks env vars first, then /proc/version.
*/
function isWSLSync() {
  if (process.platform !== "linux") return false;
  if (isWSLEnv()) return true;
  try {
    const release = (0, _stringCoerceLndEvhRk.a)((0, _nodeFs.readFileSync)("/proc/version", "utf8"));
    return release.includes("microsoft") || release.includes("wsl");
  } catch {
    return false;
  }
}
/**
* Synchronously check if running in WSL2.
*/
function isWSL2Sync() {
  if (!isWSLSync()) return false;
  try {
    const version = (0, _stringCoerceLndEvhRk.a)((0, _nodeFs.readFileSync)("/proc/version", "utf8"));
    return version.includes("wsl2") || version.includes("microsoft-standard");
  } catch {
    return false;
  }
}
async function isWSL() {
  if (wslCached !== null) return wslCached;
  if (process.platform !== "linux") {
    wslCached = false;
    return wslCached;
  }
  if (isWSLEnv()) {
    wslCached = true;
    return wslCached;
  }
  try {
    const release = (0, _stringCoerceLndEvhRk.a)(await _promises.default.readFile("/proc/sys/kernel/osrelease", "utf8"));
    wslCached = release.includes("microsoft") || release.includes("wsl");
  } catch {
    wslCached = false;
  }
  return wslCached;
}
//#endregion /* v9-96d243cb63ac891f */
