"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.t = resolveOpenClawAgentDir;var _utilsCKsuXgDI = require("./utils-CKsuXgDI.js");
var _agentScopeConfigDCRwWQZy = require("./agent-scope-config-DCRwWQZy.js");
//#region src/plugin-sdk/agent-dir-compat.ts
/**
* @deprecated Prefer resolveAgentDir(cfg, agentId) or resolveDefaultAgentDir(cfg).
* Kept for third-party plugin SDK compatibility.
*/
function resolveOpenClawAgentDir(env = process.env) {
  const override = env.OPENCLAW_AGENT_DIR?.trim() || env.PI_CODING_AGENT_DIR?.trim();
  return override ? (0, _utilsCKsuXgDI.p)(override, env) : (0, _agentScopeConfigDCRwWQZy.s)({}, env);
}
//#endregion /* v9-0ac928128b7b852a */
