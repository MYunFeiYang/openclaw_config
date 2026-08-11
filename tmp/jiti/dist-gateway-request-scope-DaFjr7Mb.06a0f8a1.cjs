"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.i = withPluginRuntimePluginScope;exports.n = withPluginRuntimeGatewayRequestScope;exports.r = withPluginRuntimePluginIdScope;exports.t = getPluginRuntimeGatewayRequestScope;var _globalSingletonB2nbp4Tq = require("./global-singleton-B2nbp4Tq.js");
var _nodeAsync_hooks = require("node:async_hooks");
//#region src/plugins/runtime/gateway-request-scope.ts
const pluginRuntimeGatewayRequestScope = (0, _globalSingletonB2nbp4Tq.n)(Symbol.for("openclaw.pluginRuntimeGatewayRequestScope"), () => new _nodeAsync_hooks.AsyncLocalStorage());
/**
* Runs plugin gateway handlers with request-scoped context that runtime helpers can read.
*/
function withPluginRuntimeGatewayRequestScope(scope, run) {
  return pluginRuntimeGatewayRequestScope.run(scope, run);
}
/**
* Runs work under the current gateway request scope while attaching plugin identity.
*/
function withPluginRuntimePluginScope(scope, run) {
  const current = pluginRuntimeGatewayRequestScope.getStore();
  const scoped = current ? {
    ...current,
    pluginId: scope.pluginId
  } : {
    pluginId: scope.pluginId,
    isWebchatConnect: () => false
  };
  if (scope.pluginSource !== void 0) scoped.pluginSource = scope.pluginSource;else
  delete scoped.pluginSource;
  return pluginRuntimeGatewayRequestScope.run(scoped, run);
}
/**
* Runs work under the current gateway request scope while attaching plugin identity.
*/
function withPluginRuntimePluginIdScope(pluginId, run) {
  return withPluginRuntimePluginScope({ pluginId }, run);
}
/**
* Returns the current plugin gateway request scope when called from a plugin request handler.
*/
function getPluginRuntimeGatewayRequestScope() {
  return pluginRuntimeGatewayRequestScope.getStore();
}
//#endregion /* v9-32de8c30f0ad8f43 */
