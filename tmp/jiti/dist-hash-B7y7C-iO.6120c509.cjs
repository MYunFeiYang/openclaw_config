"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.t = hashText;var _nodeCrypto = _interopRequireDefault(require("node:crypto"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}
//#region packages/memory-host-sdk/src/host/hash.ts
function hashText(value) {
  return _nodeCrypto.default.createHash("sha256").update(value).digest("hex");
}
//#endregion /* v9-b183832470ecfb4d */
