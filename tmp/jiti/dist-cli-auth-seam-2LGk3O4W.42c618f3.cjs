"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = readClaudeCliCredentialsForSetup;exports.r = readClaudeCliCredentialsForSetupNonInteractive;exports.t = readClaudeCliCredentialsForRuntime;var _storeCMBbDiib = require("./store-CMBbDiib.js");
require("./provider-auth-C9zf8LVY.js");
//#region extensions/anthropic/cli-auth-seam.ts
function readClaudeCliCredentialsForSetup() {
  return (0, _storeCMBbDiib.I)();
}
function readClaudeCliCredentialsForSetupNonInteractive() {
  return (0, _storeCMBbDiib.I)({ allowKeychainPrompt: false });
}
function readClaudeCliCredentialsForRuntime() {
  return (0, _storeCMBbDiib.I)({ allowKeychainPrompt: false });
}
//#endregion /* v9-96700ec11a9c86fc */
