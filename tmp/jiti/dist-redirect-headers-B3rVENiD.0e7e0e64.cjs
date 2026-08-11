"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.t = retainSafeHeadersForCrossOriginRedirect;var _stringCoerceBje8XVt = require("./string-coerce-Bje8XVt9.js");
var _fetchHeadersCGp03wKO = require("./fetch-headers-CGp03wKO.js");
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
  const incoming = new Headers((0, _fetchHeadersCGp03wKO.t)(headers));
  const safeHeaders = {};
  for (const [key, value] of incoming.entries()) if (CROSS_ORIGIN_REDIRECT_SAFE_HEADERS.has((0, _stringCoerceBje8XVt.a)(key))) safeHeaders[key] = value;
  return safeHeaders;
}
//#endregion /* v9-80fe70907ff14f11 */
