"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.t = resolveEnvApiKey;var _providerIdCz7K6wgK = require("./provider-id-Cz7K6wgK.js");
var _ioCiCdMMvQ = require("./io-CiCdMMvQ.js");
var _providerAuthAliasesDEhinO0g = require("./provider-auth-aliases-DEhinO0g.js");
var _setupRegistryBGTB8int = require("./setup-registry-BGTB8int.js");
var _modelAuthMarkersBoUkLnQ = require("./model-auth-markers-Bo-UkLnQ.js");
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
  const normalized = options.aliasMap ? options.aliasMap[normalizedProvider] ?? normalizedProvider : (0, _providerAuthAliasesDEhinO0g.r)(provider, lookupParams);
  const candidateMap = options.candidateMap ?? (0, _modelAuthMarkersBoUkLnQ.y)(lookupParams);
  const authEvidenceMap = options.authEvidenceMap ?? (0, _modelAuthMarkersBoUkLnQ.b)(lookupParams);
  const applied = new Set((0, _ioCiCdMMvQ.J)());
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
  const setupProvider = (0, _setupRegistryBGTB8int.i)({
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
//#endregion /* v9-049a3478317d3e2d */
