"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = isGatewayConfigBypassCommandPath;exports.t = canSkipGatewayConfigLoad;var _credentialPlannerCmIPlWf = require("./credential-planner-Cm-IPlWf.js");
require("./credentials-B-149jP7.js");
//#region src/gateway/explicit-connection-policy.ts
function hasExplicitGatewayConnectionAuth(auth) {
  return Boolean((0, _credentialPlannerCmIPlWf.a)(auth?.token) || (0, _credentialPlannerCmIPlWf.a)(auth?.password));
}
function canSkipGatewayConfigLoad(params) {
  return !params.config && Boolean((0, _credentialPlannerCmIPlWf.a)(params.urlOverride)) && hasExplicitGatewayConnectionAuth(params.explicitAuth);
}
function isGatewayConfigBypassCommandPath(commandPath) {
  return commandPath[0] === "cron";
}
//#endregion /* v9-40a4001fe4be798c */
