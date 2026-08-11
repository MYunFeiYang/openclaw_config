"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.t = sanitizeTerminalText;var _ansiBk0Jp_0O = require("./ansi-Bk0Jp_0O.js");
//#region src/terminal/safe-text.ts
/**
* Normalize untrusted text for single-line terminal/log rendering.
*/
function sanitizeTerminalText(input) {
  const normalized = (0, _ansiBk0Jp_0O.r)(input).replace(/\r/g, "\\r").replace(/\n/g, "\\n").replace(/\t/g, "\\t");
  let sanitized = "";
  for (const char of normalized) {
    const code = char.charCodeAt(0);
    if (!(code >= 0 && code <= 31 || code >= 127 && code <= 159)) sanitized += char;
  }
  return sanitized;
}
//#endregion /* v9-d7aafc8940ff3fc0 */
