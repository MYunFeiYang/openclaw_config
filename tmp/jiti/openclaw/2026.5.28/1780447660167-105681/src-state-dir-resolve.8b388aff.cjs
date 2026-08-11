"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.resolveStateDir = resolveStateDir;var path = _interopRequireWildcard(require("node:path"));
var os = _interopRequireWildcard(require("node:os"));function _interopRequireWildcard(e, t) {if ("function" == typeof WeakMap) var r = new WeakMap(),n = new WeakMap();return (_interopRequireWildcard = function (e, t) {if (!t && e && e.__esModule) return e;var o,i,f = { __proto__: null, default: e };if (null === e || "object" != typeof e && "function" != typeof e) return f;if (o = t ? n : r) {if (o.has(e)) return o.get(e);o.set(e, f);}for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]);return f;})(e, t);}
/** 解析 openclaw 状态目录 */
function resolveStateDir() {
  const stateOverride = process.env.OPENCLAW_STATE_DIR?.trim() || process.env.CLAWDBOT_STATE_DIR?.trim();
  if (stateOverride)
  return stateOverride;
  return path.join(os.homedir(), ".openclaw");
} /* v9-a55f0dc9817e28e3 */
