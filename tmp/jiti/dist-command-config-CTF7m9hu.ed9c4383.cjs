"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = collectCommandSecretAssignmentsFromSnapshot;exports.t = analyzeCommandSecretAssignmentsFromSnapshot;var _typesSecretsBHp0Y_k = require("./types.secrets-BHp0Y_k0.js");
var _targetRegistryDOBQeKjE = require("./target-registry-DOBQeKjE.js");
var _pathUtilsBF77VRFq = require("./path-utils-BF77VRFq.js");
var _secretValueCavHlQ1h = require("./secret-value-CavHlQ1h.js");
//#region src/secrets/command-config.ts
function analyzeCommandSecretAssignmentsFromSnapshot(params) {
  const defaults = params.sourceConfig.secrets?.defaults;
  const assignments = [];
  const diagnostics = [];
  const unresolved = [];
  const inactive = [];
  for (const target of (0, _targetRegistryDOBQeKjE.r)(params.sourceConfig, params.targetIds)) {
    if (params.allowedPaths && !params.allowedPaths.has(target.path)) continue;
    const { explicitRef, ref } = (0, _typesSecretsBHp0Y_k.p)({
      value: target.value,
      refValue: target.refValue,
      defaults
    });
    const inlineCandidateRef = explicitRef ? (0, _typesSecretsBHp0Y_k.a)(target.value, defaults) : null;
    if (!ref) continue;
    const resolved = (0, _pathUtilsBF77VRFq.n)(params.resolvedConfig, target.pathSegments);
    if (!(0, _secretValueCavHlQ1h.r)(resolved, target.entry.expectedResolvedValue)) {
      if (params.inactiveRefPaths?.has(target.path)) {
        diagnostics.push(`${target.path}: secret ref is configured on an inactive surface; skipping command-time assignment.`);
        inactive.push({
          path: target.path,
          pathSegments: [...target.pathSegments]
        });
        continue;
      }
      unresolved.push({
        path: target.path,
        pathSegments: [...target.pathSegments]
      });
      continue;
    }
    assignments.push({
      path: target.path,
      pathSegments: [...target.pathSegments],
      value: resolved
    });
    if (target.entry.secretShape === "sibling_ref" && explicitRef && inlineCandidateRef) diagnostics.push(`${target.path}: both inline and sibling ref were present; sibling ref took precedence.`);
  }
  return {
    assignments,
    diagnostics,
    unresolved,
    inactive
  };
}
function collectCommandSecretAssignmentsFromSnapshot(params) {
  const analyzed = analyzeCommandSecretAssignmentsFromSnapshot({
    sourceConfig: params.sourceConfig,
    resolvedConfig: params.resolvedConfig,
    targetIds: params.targetIds,
    inactiveRefPaths: params.inactiveRefPaths,
    allowedPaths: params.allowedPaths
  });
  if (analyzed.unresolved.length > 0) throw new Error(`${params.commandName}: ${analyzed.unresolved[0]?.path ?? "target"} is unresolved in the active runtime snapshot.`);
  return {
    assignments: analyzed.assignments,
    diagnostics: analyzed.diagnostics
  };
}
//#endregion /* v9-86a525d609c24960 */
