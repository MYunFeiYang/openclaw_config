"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.t = formatHelpExamples;var _themeB128avno = require("./theme-B128avno.js");
//#region src/cli/help-format.ts
function formatHelpExample(command, description) {
  return `  ${_themeB128avno.r.command(command)}\n    ${_themeB128avno.r.muted(description)}`;
}
function formatHelpExampleLine(command, description) {
  if (!description) return `  ${_themeB128avno.r.command(command)}`;
  return `  ${_themeB128avno.r.command(command)} ${_themeB128avno.r.muted(`# ${description}`)}`;
}
function formatHelpExamples(examples, inline = false) {
  const formatter = inline ? formatHelpExampleLine : formatHelpExample;
  return examples.map(([command, description]) => formatter(command, description)).join("\n");
}
//#endregion /* v9-5447612b26582844 */
