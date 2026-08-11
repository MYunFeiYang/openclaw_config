"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.t = describePluginInstallSource;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
var _clawhubSpecC0z3kReV = require("./clawhub-spec-C0z3kReV.js");
var _npmRegistrySpecBT2PTNSZ = require("./npm-registry-spec-BT2PTNSZ.js");
//#region src/plugins/install-source-info.ts
function resolveNpmPinState(params) {
  if (params.exactVersion) return params.hasIntegrity ? "exact-with-integrity" : "exact-without-integrity";
  return params.hasIntegrity ? "floating-with-integrity" : "floating-without-integrity";
}
function resolveDefaultChoice(value) {
  return value === "clawhub" || value === "npm" || value === "local" ? value : void 0;
}
function normalizeExpectedPackageName(value) {
  const expected = (0, _stringCoerceLndEvhRk.c)(value);
  if (!expected) return;
  return (0, _npmRegistrySpecBT2PTNSZ.s)(expected)?.name ?? expected;
}
function describePluginInstallSource(install, options) {
  const clawhubSpec = (0, _stringCoerceLndEvhRk.c)(install.clawhubSpec);
  const npmSpec = (0, _stringCoerceLndEvhRk.c)(install.npmSpec);
  const localPath = (0, _stringCoerceLndEvhRk.c)(install.localPath);
  const defaultChoice = resolveDefaultChoice(install.defaultChoice);
  const expectedIntegrity = (0, _stringCoerceLndEvhRk.c)(install.expectedIntegrity);
  const expectedPackageName = normalizeExpectedPackageName(options?.expectedPackageName);
  const warnings = [];
  let clawhub;
  let npm;
  if (install.defaultChoice !== void 0 && !defaultChoice) warnings.push("invalid-default-choice");
  if (clawhubSpec) {
    const parsed = (0, _clawhubSpecC0z3kReV.t)(clawhubSpec);
    if (parsed) {
      if (!parsed.version) warnings.push("clawhub-spec-floating");
      clawhub = {
        spec: clawhubSpec,
        packageName: parsed.name,
        ...(parsed.version ? { version: parsed.version } : {}),
        exactVersion: Boolean(parsed.version)
      };
    } else warnings.push("invalid-clawhub-spec");
  }
  if (npmSpec) {
    const parsed = (0, _npmRegistrySpecBT2PTNSZ.s)(npmSpec);
    if (parsed) {
      const exactVersion = parsed.selectorKind === "exact-version";
      const hasIntegrity = Boolean(expectedIntegrity);
      if (!exactVersion) warnings.push("npm-spec-floating");
      if (!hasIntegrity) warnings.push("npm-spec-missing-integrity");
      if (expectedPackageName && parsed.name !== expectedPackageName) warnings.push("npm-spec-package-name-mismatch");
      npm = {
        spec: parsed.raw,
        packageName: parsed.name,
        ...(expectedPackageName && parsed.name !== expectedPackageName ? { expectedPackageName } : {}),
        selectorKind: parsed.selectorKind,
        exactVersion,
        pinState: resolveNpmPinState({
          exactVersion,
          hasIntegrity
        }),
        ...(parsed.selector ? { selector: parsed.selector } : {}),
        ...(expectedIntegrity ? { expectedIntegrity } : {})
      };
    } else warnings.push("invalid-npm-spec");
  }
  if (defaultChoice === "clawhub" && !clawhub) warnings.push("default-choice-missing-source");
  if (defaultChoice === "npm" && !npm) warnings.push("default-choice-missing-source");
  if (defaultChoice === "local" && !localPath) warnings.push("default-choice-missing-source");
  if (expectedIntegrity && !npm) warnings.push("npm-integrity-without-source");
  return {
    ...(defaultChoice ? { defaultChoice } : {}),
    ...(clawhub ? { clawhub } : {}),
    ...(npm ? { npm } : {}),
    ...(localPath ? { local: { path: localPath } } : {}),
    warnings
  };
}
//#endregion /* v9-dafb2782175c0b56 */
