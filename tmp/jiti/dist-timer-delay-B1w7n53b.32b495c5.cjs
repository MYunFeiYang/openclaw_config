"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = resolveSafeTimeoutDelayMs;exports.r = setSafeTimeout;exports.t = void 0; //#region src/utils/timer-delay.ts
const MAX_SAFE_TIMEOUT_DELAY_MS = exports.t = 2147483647;
function resolveSafeTimeoutDelayMs(delayMs, opts) {
  const rawMinMs = opts?.minMs ?? 1;
  const minMs = Math.min(MAX_SAFE_TIMEOUT_DELAY_MS, Math.max(0, Number.isFinite(rawMinMs) ? Math.floor(rawMinMs) : 1));
  return Math.min(MAX_SAFE_TIMEOUT_DELAY_MS, Math.max(minMs, Number.isFinite(delayMs) ? Math.floor(delayMs) : minMs));
}
function setSafeTimeout(callback, delayMs, opts) {
  return setTimeout(callback, resolveSafeTimeoutDelayMs(delayMs, opts));
}
//#endregion /* v9-07a051658099125f */
