"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = readClaudeCliCredentialsForSetup;exports.r = readClaudeCliCredentialsForSetupNonInteractive;exports.t = readClaudeCliCredentialsForRuntime;var _storeBYnnXRZ = require("./store-BYnn-xRZ.js");
require("./provider-auth-CGbjFPWT.js");
//#region extensions/anthropic/cli-auth-seam.ts
function readClaudeCliCredentialsForSetup() {
  return (0, _storeBYnnXRZ.I)();
}
function readClaudeCliCredentialsForSetupNonInteractive() {
  return (0, _storeBYnnXRZ.I)({ allowKeychainPrompt: false });
}
function readClaudeCliCredentialsForRuntime() {
  return (0, _storeBYnnXRZ.I)({ allowKeychainPrompt: false });
}
//#endregion /* v9-1fc4adfd4c0f6820 */
