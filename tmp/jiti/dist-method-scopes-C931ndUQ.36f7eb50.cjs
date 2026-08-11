"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = resolveLeastPrivilegeOperatorScopesForMethod;exports.i = isNodeRoleMethod;exports.n = authorizeOperatorScopesForMethod;exports.r = isAdminOnlyMethod;exports.t = void 0;var _runtimeStateDfdlNmk = require("./runtime-state-DfdlNmk0.js");
var _gatewayMethodPolicy6EppaSoq = require("./gateway-method-policy-6EppaSoq.js");
var _operatorScopesB0wNyvBW = require("./operator-scopes-B0wNyvBW.js");
//#region src/gateway/method-scopes.ts
const CLI_DEFAULT_OPERATOR_SCOPES = exports.t = [
_operatorScopesB0wNyvBW.t,
_operatorScopesB0wNyvBW.i,
_operatorScopesB0wNyvBW.o,
_operatorScopesB0wNyvBW.n,
_operatorScopesB0wNyvBW.r,
_operatorScopesB0wNyvBW.a];

const NODE_ROLE_METHODS = new Set([
"node.invoke.result",
"node.event",
"node.pending.drain",
"node.canvas.capability.refresh",
"node.pending.pull",
"node.pending.ack",
"skills.bins"]
);
const METHOD_SCOPE_BY_NAME = new Map(Object.entries({
  [_operatorScopesB0wNyvBW.n]: [
  "exec.approval.get",
  "exec.approval.list",
  "exec.approval.request",
  "exec.approval.waitDecision",
  "exec.approval.resolve",
  "plugin.approval.list",
  "plugin.approval.request",
  "plugin.approval.waitDecision",
  "plugin.approval.resolve"],

  [_operatorScopesB0wNyvBW.r]: [
  "node.pair.request",
  "node.pair.list",
  "node.pair.reject",
  "node.pair.remove",
  "node.pair.verify",
  "node.pair.approve",
  "device.pair.list",
  "device.pair.approve",
  "device.pair.reject",
  "device.pair.remove",
  "device.token.rotate",
  "device.token.revoke",
  "node.rename"],

  [_operatorScopesB0wNyvBW.i]: [
  "assistant.media.get",
  "health",
  "diagnostics.stability",
  "doctor.memory.status",
  "doctor.memory.dreamDiary",
  "logs.tail",
  "channels.status",
  "status",
  "usage.status",
  "usage.cost",
  "tts.status",
  "tts.providers",
  "tts.personas",
  "commands.list",
  "models.list",
  "models.authStatus",
  "tools.catalog",
  "tools.effective",
  "plugins.uiDescriptors",
  "agents.list",
  "agent.identity.get",
  "skills.status",
  "skills.search",
  "skills.detail",
  "voicewake.get",
  "voicewake.routing.get",
  "sessions.list",
  "sessions.get",
  "sessions.preview",
  "sessions.resolve",
  "sessions.compaction.list",
  "sessions.compaction.get",
  "sessions.subscribe",
  "sessions.unsubscribe",
  "sessions.messages.subscribe",
  "sessions.messages.unsubscribe",
  "sessions.usage",
  "sessions.usage.timeseries",
  "sessions.usage.logs",
  "cron.list",
  "cron.status",
  "cron.runs",
  "gateway.identity.get",
  "system-presence",
  "last-heartbeat",
  "node.list",
  "node.describe",
  "chat.history",
  "config.get",
  "config.schema.lookup",
  "talk.config",
  "agents.files.list",
  "agents.files.get"],

  [_operatorScopesB0wNyvBW.o]: [
  "message.action",
  "send",
  "poll",
  "agent",
  "agent.wait",
  "wake",
  "talk.mode",
  "talk.realtime.session",
  "talk.realtime.relayAudio",
  "talk.realtime.relayMark",
  "talk.realtime.relayStop",
  "talk.realtime.relayToolResult",
  "talk.speak",
  "tts.enable",
  "tts.disable",
  "tts.convert",
  "tts.setProvider",
  "tts.setPersona",
  "voicewake.set",
  "voicewake.routing.set",
  "node.invoke",
  "chat.send",
  "chat.abort",
  "sessions.create",
  "sessions.send",
  "sessions.steer",
  "sessions.abort",
  "sessions.compaction.branch",
  "doctor.memory.backfillDreamDiary",
  "doctor.memory.resetDreamDiary",
  "doctor.memory.resetGroundedShortTerm",
  "doctor.memory.repairDreamingArtifacts",
  "doctor.memory.dedupeDreamDiary",
  "push.test",
  "push.web.vapidPublicKey",
  "push.web.subscribe",
  "push.web.unsubscribe",
  "push.web.test",
  "node.pending.enqueue"],

  [_operatorScopesB0wNyvBW.t]: [
  "channels.start",
  "channels.logout",
  "agents.create",
  "agents.update",
  "agents.delete",
  "skills.install",
  "skills.update",
  "secrets.reload",
  "secrets.resolve",
  "cron.add",
  "cron.update",
  "cron.remove",
  "cron.run",
  "sessions.patch",
  "sessions.pluginPatch",
  "sessions.reset",
  "sessions.delete",
  "sessions.compact",
  "sessions.compaction.restore",
  "connect",
  "chat.inject",
  "nativeHook.invoke",
  "web.login.start",
  "web.login.wait",
  "set-heartbeats",
  "system-event",
  "agents.files.set",
  "update.status"],

  [_operatorScopesB0wNyvBW.a]: []
}).flatMap(([scope, methods]) => methods.map((method) => [method, scope])));
function resolveScopedMethod(method) {
  const explicitScope = METHOD_SCOPE_BY_NAME.get(method);
  if (explicitScope) return explicitScope;
  const reservedScope = (0, _gatewayMethodPolicy6EppaSoq.n)(method);
  if (reservedScope) return reservedScope;
  const pluginScope = (0, _runtimeStateDfdlNmk.r)()?.activeRegistry?.gatewayMethodScopes?.[method];
  if (pluginScope) return pluginScope;
}
function isNodeRoleMethod(method) {
  return NODE_ROLE_METHODS.has(method);
}
function isAdminOnlyMethod(method) {
  return resolveScopedMethod(method) === _operatorScopesB0wNyvBW.t;
}
function resolveRequiredOperatorScopeForMethod(method) {
  return resolveScopedMethod(method);
}
function resolveLeastPrivilegeOperatorScopesForMethod(method) {
  const requiredScope = resolveRequiredOperatorScopeForMethod(method);
  if (requiredScope) return [requiredScope];
  return [];
}
function authorizeOperatorScopesForMethod(method, scopes) {
  if (scopes.includes("operator.admin")) return { allowed: true };
  const requiredScope = resolveRequiredOperatorScopeForMethod(method) ?? "operator.admin";
  if (requiredScope === "operator.read") {
    if (scopes.includes("operator.read") || scopes.includes("operator.write")) return { allowed: true };
    return {
      allowed: false,
      missingScope: _operatorScopesB0wNyvBW.i
    };
  }
  if (scopes.includes(requiredScope)) return { allowed: true };
  return {
    allowed: false,
    missingScope: requiredScope
  };
}
//#endregion /* v9-9a9b28d95fd4add4 */
