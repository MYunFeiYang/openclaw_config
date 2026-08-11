"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.t = resolveEnvApiKey;var _providerIdCz7K6wgK = require("./provider-id-Cz7K6wgK.js");
var _ioDnGGugrj = require("./io-DnGGugrj.js");
var _providerAuthAliasesCljpontN = require("./provider-auth-aliases-CljpontN.js");
var _setupRegistryCHoxAZCG = require("./setup-registry-CHoxAZCG.js");
var _modelAuthMarkersCiLEGnXI = require("./model-auth-markers-CiLEGnXI.js");
var _normalizeSecretInputCH0hjbpb = require("./normalize-secret-input-CH0hjbpb.js");
var _nodeFs = _interopRequireDefault(require("node:fs"));
var _nodeOs = _interopRequireDefault(require("node:os"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}
//#region src/agents/model-auth-env.ts
function expandAuthEvidencePath(rawPath, env) {
  const trimmed = rawPath.trim();
  if (!trimmed) return;
  const homeDir = normalizeOptionalPathInput(env.HOME) ?? _nodeOs.default.homedir();
  const appDataDir = normalizeOptionalPathInput(env.APPDATA);
  if (trimmed.includes("${APPDATA}") && !appDataDir) return;
  return trimmed.replaceAll("${HOME}", homeDir).replaceAll("${APPDATA}", appDataDir ?? "");
}
function normalizeOptionalPathInput(value) {
  if (typeof value !== "string") return;
  const trimmed = value.trim();
  return trimmed ? trimmed : void 0;
}
function hasRequiredAuthEvidenceEnv(evidence, env) {
  const hasEnv = (key) => Boolean((0, _normalizeSecretInputCH0hjbpb.t)(env[key]));
  if (evidence.requiresAnyEnv?.length && !evidence.requiresAnyEnv.some(hasEnv)) return false;
  if (evidence.requiresAllEnv?.length && !evidence.requiresAllEnv.every(hasEnv)) return false;
  return true;
}
function hasLocalFileAuthEvidence(evidence, env) {
  if (evidence.fileEnvVar) {
    const explicitPath = normalizeOptionalPathInput(env[evidence.fileEnvVar]);
    if (explicitPath) return _nodeFs.default.existsSync(explicitPath);
  }
  for (const rawPath of evidence.fallbackPaths ?? []) {
    const expandedPath = expandAuthEvidencePath(rawPath, env);
    if (expandedPath && _nodeFs.default.existsSync(expandedPath)) return true;
  }
  return false;
}
function resolveAuthEvidence(evidence, env) {
  for (const entry of evidence ?? []) {
    if (entry.type !== "local-file-with-env") continue;
    if (!hasRequiredAuthEvidenceEnv(entry, env) || !hasLocalFileAuthEvidence(entry, env)) continue;
    return {
      apiKey: entry.credentialMarker,
      source: entry.source ?? "local auth evidence"
    };
  }
  return null;
}
function resolveEnvApiKey(provider, env = process.env, options = {}) {
  const normalizedProvider = (0, _providerIdCz7K6wgK.i)(provider);
  const lookupParams = {
    config: options.config,
    workspaceDir: options.workspaceDir,
    env
  };
  const normalized = options.aliasMap ? options.aliasMap[normalizedProvider] ?? normalizedProvider : (0, _providerAuthAliasesCljpontN.r)(provider, lookupParams);
  const candidateMap = options.candidateMap ?? (0, _modelAuthMarkersCiLEGnXI.y)(lookupParams);
  const authEvidenceMap = options.authEvidenceMap ?? (0, _modelAuthMarkersCiLEGnXI.b)(lookupParams);
  const applied = new Set((0, _ioDnGGugrj.J)());
  const pick = (envVar) => {
    const value = (0, _normalizeSecretInputCH0hjbpb.t)(env[envVar]);
    if (!value) return null;
    return {
      apiKey: value,
      source: applied.has(envVar) ? `shell env: ${envVar}` : `env: ${envVar}`
    };
  };
  const candidates = Object.hasOwn(candidateMap, normalized) ? candidateMap[normalized] : void 0;
  if (Array.isArray(candidates)) for (const envVar of candidates) {
    const resolved = pick(envVar);
    if (resolved) return resolved;
  }
  const authEvidence = resolveAuthEvidence(Object.hasOwn(authEvidenceMap, normalized) ? authEvidenceMap[normalized] : void 0, env);
  if (authEvidence) return authEvidence;
  if (Array.isArray(candidates)) return null;
  if (options.skipSetupProviderFallback === true) return null;
  const setupProvider = (0, _setupRegistryCHoxAZCG.i)({
    provider: normalized,
    env
  });
  if (setupProvider?.resolveConfigApiKey) {
    const resolved = setupProvider.resolveConfigApiKey({
      provider: normalized,
      env
    });
    if (resolved?.trim()) return {
      apiKey: resolved,
      source: resolved === "gcp-vertex-credentials" ? "gcloud adc" : "env"
    };
  }
  return null;
}
//#endregion /* v9-bf8b8b8ce82ff526 */
