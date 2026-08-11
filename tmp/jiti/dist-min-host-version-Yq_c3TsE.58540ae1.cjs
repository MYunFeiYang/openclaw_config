"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = parseMinHostVersionRequirement;exports.t = checkMinHostVersion;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
var _runtimeGuardDkWiFxll = require("./runtime-guard-DkWiFxll.js");
//#region src/plugins/min-host-version.ts
const MIN_HOST_VERSION_FORMAT = "openclaw.install.minHostVersion must use a semver floor in the form \">=x.y.z[-prerelease][+build]\"";
const SEMVER_LABEL_RE = String.raw`\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?`;
const MIN_HOST_VERSION_RE = new RegExp(`^>=(${SEMVER_LABEL_RE})$`);
const LEGACY_MIN_HOST_VERSION_RE = /^(\d+)\.(\d+)\.(\d+)$/;
function parseMinHostVersionRequirement(raw, options = {}) {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const match = trimmed.match(MIN_HOST_VERSION_RE) ?? (options.allowLegacyBareSemver ? trimmed.match(LEGACY_MIN_HOST_VERSION_RE) : null);
  if (!match) return null;
  const minimumLabel = match.length >= 4 ? `${match[1]}.${match[2]}.${match[3]}` : match[1] ?? "";
  if (!(0, _runtimeGuardDkWiFxll.a)(minimumLabel)) return null;
  return {
    raw: trimmed,
    minimumLabel
  };
}
function checkMinHostVersion(params) {
  if (params.minHostVersion === void 0) return {
    ok: true,
    requirement: null
  };
  const requirement = parseMinHostVersionRequirement(params.minHostVersion, { allowLegacyBareSemver: params.allowLegacyBareSemver });
  if (!requirement) return {
    ok: false,
    kind: "invalid",
    error: MIN_HOST_VERSION_FORMAT
  };
  const currentVersion = (0, _stringCoerceLndEvhRk.c)(params.currentVersion) || "unknown";
  const currentSemver = (0, _runtimeGuardDkWiFxll.a)(currentVersion);
  if (!currentSemver) return {
    ok: false,
    kind: "unknown_host_version",
    requirement
  };
  if (!(0, _runtimeGuardDkWiFxll.n)(currentSemver, (0, _runtimeGuardDkWiFxll.a)(requirement.minimumLabel))) return {
    ok: false,
    kind: "incompatible",
    requirement,
    currentVersion
  };
  return {
    ok: true,
    requirement
  };
}
//#endregion /* v9-03bdb8bbd5ce0bef */
