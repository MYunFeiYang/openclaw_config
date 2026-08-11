"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.ProxylineError = void 0;exports.formatUrl = formatUrl;exports.redactProxyUrl = redactProxyUrl;exports.resolveProxyTlsCa = resolveProxyTlsCa;var _nodeFs = _interopRequireDefault(require("node:fs"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}
class ProxylineError extends Error {
  code;
  constructor(code, message) {
    super(message);
    this.name = "ProxylineError";
    this.code = code;
  }
}exports.ProxylineError = ProxylineError;
function resolveProxyTlsCa(options) {
  if (!options) {
    return undefined;
  }
  if (options.ca !== undefined) {
    return options.ca;
  }
  if (options.caFile !== undefined) {
    return _nodeFs.default.readFileSync(options.caFile, "utf8");
  }
  return undefined;
}
function formatUrl(value) {
  return value instanceof URL ? value.href : new URL(value).href;
}
function redactProxyUrl(value) {
  const url = value instanceof URL ? new URL(value.href) : new URL(value);
  url.username = "";
  url.password = "";
  url.search = "";
  url.hash = "";
  return url.href;
} /* v9-2157afb0efa58865 */
