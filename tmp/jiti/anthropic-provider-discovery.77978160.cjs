"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _cliAuthSeam2LGk3O4W = require("../../cli-auth-seam-2LGk3O4W.js");
//#region extensions/anthropic/provider-discovery.ts
const CLAUDE_CLI_BACKEND_ID = "claude-cli";
function resolveClaudeCliSyntheticAuth() {
  const credential = (0, _cliAuthSeam2LGk3O4W.t)();
  if (!credential) return;
  return credential.type === "oauth" ? {
    apiKey: credential.access,
    source: "Claude CLI native auth",
    mode: "oauth",
    expiresAt: credential.expires
  } : {
    apiKey: credential.token,
    source: "Claude CLI native auth",
    mode: "token",
    expiresAt: credential.expires
  };
}
const anthropicProviderDiscovery = exports.default = {
  id: CLAUDE_CLI_BACKEND_ID,
  label: "Claude CLI",
  docsPath: "/providers/models",
  auth: [],
  resolveSyntheticAuth: ({ provider }) => provider === CLAUDE_CLI_BACKEND_ID ? resolveClaudeCliSyntheticAuth() : void 0
};
//#endregion /* v9-9d64ffa5be657c07 */
