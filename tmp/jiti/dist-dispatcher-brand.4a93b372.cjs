"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.PROXYLINE_DISPATCHER_BRAND = void 0;exports.isProxylineDispatcher = isProxylineDispatcher;const PROXYLINE_DISPATCHER_BRAND = exports.PROXYLINE_DISPATCHER_BRAND = Symbol.for("@openclaw/proxyline.dispatcher");
function isProxylineDispatcher(dispatcher) {
  return typeof dispatcher === "object" &&
  dispatcher !== null &&
  dispatcher[PROXYLINE_DISPATCHER_BRAND] === true;
} /* v9-2c88a63f01e7cb11 */
