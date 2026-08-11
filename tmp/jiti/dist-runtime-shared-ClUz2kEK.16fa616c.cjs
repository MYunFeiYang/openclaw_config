"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = isChannelAccountEffectivelyEnabled;exports.c = pushInactiveSurfaceWarning;exports.i = hasOwnProperty;exports.l = pushWarning;exports.n = collectSecretInputAssignment;exports.o = isEnabledFlag;exports.r = createResolverContext;exports.s = pushAssignment;exports.t = applyResolvedAssignments;var _utilsDvkbxKCZ = require("./utils-DvkbxKCZ.js");
var _typesSecretsBHp0Y_k = require("./types.secrets-BHp0Y_k0.js");
var _refContractDtvCiPbj = require("./ref-contract-DtvCiPbj.js");
require("./shared-C9ga15VD.js");
var _secretValueCavHlQ1h = require("./secret-value-CavHlQ1h.js");
//#region src/secrets/runtime-shared.ts
function createResolverContext(params) {
  return {
    sourceConfig: params.sourceConfig,
    env: params.env,
    cache: {},
    warnings: [],
    warningKeys: /* @__PURE__ */new Set(),
    assignments: []
  };
}
function pushAssignment(context, assignment) {
  context.assignments.push(assignment);
}
function pushWarning(context, warning) {
  const warningKey = `${warning.code}:${warning.path}:${warning.message}`;
  if (context.warningKeys.has(warningKey)) return;
  context.warningKeys.add(warningKey);
  context.warnings.push(warning);
}
function pushInactiveSurfaceWarning(params) {
  pushWarning(params.context, {
    code: "SECRETS_REF_IGNORED_INACTIVE_SURFACE",
    path: params.path,
    message: params.details && params.details.trim().length > 0 ? `${params.path}: ${params.details}` : `${params.path}: secret ref is configured on an inactive surface; skipping resolution until it becomes active.`
  });
}
function collectSecretInputAssignment(params) {
  const ref = (0, _typesSecretsBHp0Y_k.a)(params.value, params.defaults);
  if (!ref) return;
  if (params.active === false) {
    pushInactiveSurfaceWarning({
      context: params.context,
      path: params.path,
      details: params.inactiveReason
    });
    return;
  }
  pushAssignment(params.context, {
    ref,
    path: params.path,
    expected: params.expected,
    apply: params.apply
  });
}
function applyResolvedAssignments(params) {
  for (const assignment of params.assignments) {
    const key = (0, _refContractDtvCiPbj.u)(assignment.ref);
    if (!params.resolved.has(key)) throw new Error(`Secret reference "${key}" resolved to no value.`);
    const value = params.resolved.get(key);
    (0, _secretValueCavHlQ1h.t)({
      value,
      expected: assignment.expected,
      errorMessage: assignment.expected === "string" ? `${assignment.path} resolved to a non-string or empty value.` : `${assignment.path} resolved to an unsupported value type.`
    });
    assignment.apply(value);
  }
}
function hasOwnProperty(record, key) {
  return Object.prototype.hasOwnProperty.call(record, key);
}
function isEnabledFlag(value) {
  if (!(0, _utilsDvkbxKCZ.c)(value)) return true;
  return value.enabled !== false;
}
function isChannelAccountEffectivelyEnabled(channel, account) {
  return isEnabledFlag(channel) && isEnabledFlag(account);
}
//#endregion /* v9-906b4696c440444e */
