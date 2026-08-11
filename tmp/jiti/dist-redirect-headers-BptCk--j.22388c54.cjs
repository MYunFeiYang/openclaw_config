"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.t = retainSafeHeadersForCrossOriginRedirect;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
var _fetchHeadersBBx0ZA3V = require("./fetch-headers-BBx0ZA3V.js");
//#region src/infra/net/redirect-headers.ts
const CROSS_ORIGIN_REDIRECT_SAFE_HEADERS = new Set([
"accept",
"accept-encoding",
"accept-language",
"cache-control",
"content-language",
"content-type",
"if-match",
"if-modified-since",
"if-none-match",
"if-unmodified-since",
"pragma",
"range",
"user-agent"]
);
function retainSafeHeadersForCrossOriginRedirect(headers) {
  if (!headers) return headers;
  const incoming = new Headers((0, _fetchHeadersBBx0ZA3V.t)(headers));
  const safeHeaders = {};
  for (const [key, value] of incoming.entries()) if (CROSS_ORIGIN_REDIRECT_SAFE_HEADERS.has((0, _stringCoerceLndEvhRk.a)(key))) safeHeaders[key] = value;
  return safeHeaders;
}
//#endregion /* v9-012c6e26b4ef6476 */
