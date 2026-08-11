"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = createConfigRuntimeEnv;exports.i = applyConfigEnvVars;exports.n = collectDurableServiceEnvVars;exports.r = readStateDirDotEnvVarsFromStateDir;exports.t = collectDurableServiceEnvVarSources;var _pathsCnwfh6dH = require("./paths-Cnwfh6dH.js");
var _hostEnvSecurityDRikErcl = require("./host-env-security-DRikErcl.js");
var _envSubstitution9nsc3cTc = require("./env-substitution-9nsc3cTc.js");
var _nodeFs = _interopRequireDefault(require("node:fs"));
var _nodePath = _interopRequireDefault(require("node:path"));
var _dotenv = _interopRequireDefault(require("dotenv"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}
//#region src/config/config-env-vars.ts
function isBlockedConfigEnvVar(key) {
  return (0, _hostEnvSecurityDRikErcl.r)(key) || (0, _hostEnvSecurityDRikErcl.n)(key);
}
function collectConfigEnvVarsByTarget(cfg) {
  const envConfig = cfg?.env;
  if (!envConfig) return {};
  const entries = {};
  if (envConfig.vars) for (const [rawKey, value] of Object.entries(envConfig.vars)) {
    if (typeof value !== "string" || !value.trim()) continue;
    const key = (0, _hostEnvSecurityDRikErcl.i)(rawKey, { portable: true });
    if (!key) continue;
    if (isBlockedConfigEnvVar(key)) continue;
    entries[key] = value;
  }
  for (const [rawKey, value] of Object.entries(envConfig)) {
    if (rawKey === "shellEnv" || rawKey === "vars") continue;
    if (typeof value !== "string" || !value.trim()) continue;
    const key = (0, _hostEnvSecurityDRikErcl.i)(rawKey, { portable: true });
    if (!key) continue;
    if (isBlockedConfigEnvVar(key)) continue;
    entries[key] = value;
  }
  return entries;
}
function collectConfigRuntimeEnvVars(cfg) {
  return collectConfigEnvVarsByTarget(cfg);
}
function collectConfigServiceEnvVars(cfg) {
  return collectConfigEnvVarsByTarget(cfg);
}
function createConfigRuntimeEnv(cfg, baseEnv = process.env) {
  const env = { ...baseEnv };
  applyConfigEnvVars(cfg, env);
  return env;
}
function applyConfigEnvVars(cfg, env = process.env) {
  const entries = collectConfigRuntimeEnvVars(cfg);
  for (const [key, value] of Object.entries(entries)) {
    if (env[key]?.trim()) continue;
    if ((0, _envSubstitution9nsc3cTc.n)(value)) continue;
    env[key] = value;
  }
}
//#endregion
//#region src/config/state-dir-dotenv.ts
function isBlockedServiceEnvVar(key) {
  return (0, _hostEnvSecurityDRikErcl.r)(key) || (0, _hostEnvSecurityDRikErcl.n)(key);
}
function parseStateDirDotEnvContent(content) {
  const parsed = _dotenv.default.parse(content);
  const entries = {};
  for (const [rawKey, value] of Object.entries(parsed)) {
    if (!value?.trim()) continue;
    const key = (0, _hostEnvSecurityDRikErcl.i)(rawKey, { portable: true });
    if (!key) continue;
    if (isBlockedServiceEnvVar(key)) continue;
    entries[key] = value;
  }
  return entries;
}
function readStateDirDotEnvVarsFromStateDir(stateDir) {
  const dotEnvPath = _nodePath.default.join(stateDir, ".env");
  try {
    return parseStateDirDotEnvContent(_nodeFs.default.readFileSync(dotEnvPath, "utf8"));
  } catch {
    return {};
  }
}
/**
* Read and parse `~/.openclaw/.env` (or `$OPENCLAW_STATE_DIR/.env`), returning
* a filtered record of key-value pairs suitable for a managed service
* environment source.
*/
function readStateDirDotEnvVars(env) {
  return readStateDirDotEnvVarsFromStateDir((0, _pathsCnwfh6dH.v)(env));
}
function collectDurableServiceEnvVarSources(params) {
  const stateDirDotEnvEnvironment = readStateDirDotEnvVars(params.env);
  const configEnvironment = collectConfigServiceEnvVars(params.config);
  return {
    stateDirDotEnvEnvironment,
    configEnvironment,
    durableEnvironment: {
      ...stateDirDotEnvEnvironment,
      ...configEnvironment
    }
  };
}
/**
* Durable service env sources survive beyond the invoking shell and are safe to
* persist into owner-only gateway service environment sources.
*
* Precedence:
* 1. state-dir `.env` file vars
* 2. config service env vars
*/
function collectDurableServiceEnvVars(params) {
  return collectDurableServiceEnvVarSources(params).durableEnvironment;
}
//#endregion /* v9-98b9a1748e778a30 */
