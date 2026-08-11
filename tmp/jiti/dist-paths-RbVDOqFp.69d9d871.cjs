"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = resolveSessionFilePathOptions;exports.c = resolveSessionTranscriptsDir;exports.d = validateSessionId;exports.i = resolveSessionFilePath;exports.l = resolveSessionTranscriptsDirForAgent;exports.n = resolveAgentsDirFromSessionStorePath;exports.o = resolveSessionTranscriptPath;exports.r = resolveDefaultSessionStorePath;exports.s = resolveSessionTranscriptPathInDir;exports.t = void 0;exports.u = resolveStorePath;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
var _homeDirIZwpu = require("./home-dir-iZwpu-40.js");
var _pathsCnwfh6dH = require("./paths-Cnwfh6dH.js");
var _sessionKeyCQewiu8n = require("./session-key-CQewiu8n.js");
var _artifactsB1BDOSBz = require("./artifacts-B1BDOSBz.js");
var _nodeFs = _interopRequireDefault(require("node:fs"));
var _nodePath = _interopRequireDefault(require("node:path"));
var _nodeOs = _interopRequireDefault(require("node:os"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}
//#region src/config/sessions/paths.ts
function resolveAgentSessionsDir(agentId, env = process.env, homedir = () => (0, _homeDirIZwpu.o)(env, _nodeOs.default.homedir)) {
  const root = (0, _pathsCnwfh6dH.v)(env, homedir);
  const id = (0, _sessionKeyCQewiu8n.c)(agentId ?? "main");
  return _nodePath.default.join(root, "agents", id, "sessions");
}
function resolveSessionTranscriptsDir(env = process.env, homedir = () => (0, _homeDirIZwpu.o)(env, _nodeOs.default.homedir)) {
  return resolveAgentSessionsDir(_sessionKeyCQewiu8n.t, env, homedir);
}
function resolveSessionTranscriptsDirForAgent(agentId, env = process.env, homedir = () => (0, _homeDirIZwpu.o)(env, _nodeOs.default.homedir)) {
  return resolveAgentSessionsDir(agentId, env, homedir);
}
function resolveDefaultSessionStorePath(agentId) {
  return _nodePath.default.join(resolveAgentSessionsDir(agentId), "sessions.json");
}
const MULTI_STORE_PATH_SENTINEL = "(multiple)";
function resolveSessionFilePathOptions(params) {
  const agentId = params.agentId?.trim();
  const storePath = params.storePath?.trim();
  if (storePath && storePath !== MULTI_STORE_PATH_SENTINEL) {
    const sessionsDir = _nodePath.default.dirname(_nodePath.default.resolve(storePath));
    return agentId ? {
      sessionsDir,
      agentId
    } : { sessionsDir };
  }
  if (agentId) return { agentId };
}
const SAFE_SESSION_ID_RE = exports.t = /^[a-z0-9][a-z0-9._-]{0,127}$/i;
function validateSessionId(sessionId) {
  const trimmed = sessionId.trim();
  if (!SAFE_SESSION_ID_RE.test(trimmed) || (0, _artifactsB1BDOSBz.n)(`${trimmed}.jsonl`)) throw new Error(`Invalid session ID: ${sessionId}`);
  return trimmed;
}
function resolveSessionsDir(opts) {
  const sessionsDir = opts?.sessionsDir?.trim();
  if (sessionsDir) return _nodePath.default.resolve(sessionsDir);
  return resolveAgentSessionsDir(opts?.agentId);
}
function resolvePathFromAgentSessionsDir(agentSessionsDir, candidateAbsPath) {
  const agentBase = safeRealpathSync(_nodePath.default.resolve(agentSessionsDir)) ?? _nodePath.default.resolve(agentSessionsDir);
  const realCandidate = safeRealpathSync(candidateAbsPath) ?? candidateAbsPath;
  const relative = _nodePath.default.relative(agentBase, realCandidate);
  if (!relative || relative.startsWith("..") || _nodePath.default.isAbsolute(relative)) return;
  return _nodePath.default.resolve(agentBase, relative);
}
function resolveSiblingAgentSessionsDir(baseSessionsDir, agentId) {
  const resolvedBase = _nodePath.default.resolve(baseSessionsDir);
  if (_nodePath.default.basename(resolvedBase) !== "sessions") return;
  const baseAgentDir = _nodePath.default.dirname(resolvedBase);
  const baseAgentsDir = _nodePath.default.dirname(baseAgentDir);
  if (_nodePath.default.basename(baseAgentsDir) !== "agents") return;
  const rootDir = _nodePath.default.dirname(baseAgentsDir);
  return _nodePath.default.join(rootDir, "agents", (0, _sessionKeyCQewiu8n.c)(agentId), "sessions");
}
function resolveAgentSessionsPathParts(candidateAbsPath) {
  const parts = _nodePath.default.normalize(_nodePath.default.resolve(candidateAbsPath)).split(_nodePath.default.sep).filter(Boolean);
  const sessionsIndex = parts.lastIndexOf("sessions");
  if (sessionsIndex < 2 || parts[sessionsIndex - 2] !== "agents") return null;
  return {
    parts,
    sessionsIndex
  };
}
function extractAgentIdFromAbsoluteSessionPath(candidateAbsPath) {
  const parsed = resolveAgentSessionsPathParts(candidateAbsPath);
  if (!parsed) return;
  const { parts, sessionsIndex } = parsed;
  return parts[sessionsIndex - 1] || void 0;
}
function resolveStructuralSessionFallbackPath(candidateAbsPath, expectedAgentId) {
  const parsed = resolveAgentSessionsPathParts(candidateAbsPath);
  if (!parsed) return;
  const { parts, sessionsIndex } = parsed;
  const agentIdPart = parts[sessionsIndex - 1];
  if (!agentIdPart) return;
  const normalizedAgentId = (0, _sessionKeyCQewiu8n.c)(agentIdPart);
  if (normalizedAgentId !== (0, _stringCoerceLndEvhRk.a)(agentIdPart)) return;
  if (normalizedAgentId !== (0, _sessionKeyCQewiu8n.c)(expectedAgentId)) return;
  const relativeSegments = parts.slice(sessionsIndex + 1);
  if (relativeSegments.length !== 1) return;
  const fileName = relativeSegments[0];
  if (!fileName || fileName === "." || fileName === "..") return;
  return _nodePath.default.normalize(_nodePath.default.resolve(candidateAbsPath));
}
function safeRealpathSync(filePath) {
  try {
    return _nodeFs.default.realpathSync(filePath);
  } catch {
    return;
  }
}
function resolvePathWithinSessionsDir(sessionsDir, candidate, opts) {
  const trimmed = candidate.trim();
  if (!trimmed) throw new Error("Session file path must not be empty");
  const resolvedBase = _nodePath.default.resolve(sessionsDir);
  const realBase = safeRealpathSync(resolvedBase) ?? resolvedBase;
  const realTrimmed = _nodePath.default.isAbsolute(trimmed) ? safeRealpathSync(trimmed) ?? trimmed : trimmed;
  const normalized = _nodePath.default.isAbsolute(realTrimmed) ? _nodePath.default.relative(realBase, realTrimmed) : realTrimmed;
  if (normalized.startsWith("..") && _nodePath.default.isAbsolute(realTrimmed)) {
    const tryAgentFallback = (agentId) => {
      const normalizedAgentId = (0, _sessionKeyCQewiu8n.c)(agentId);
      const siblingSessionsDir = resolveSiblingAgentSessionsDir(realBase, normalizedAgentId);
      if (siblingSessionsDir) {
        const siblingResolved = resolvePathFromAgentSessionsDir(siblingSessionsDir, realTrimmed);
        if (siblingResolved) return siblingResolved;
      }
      return resolvePathFromAgentSessionsDir(resolveAgentSessionsDir(normalizedAgentId), realTrimmed);
    };
    const explicitAgentId = opts?.agentId?.trim();
    if (explicitAgentId) {
      const resolvedFromAgent = tryAgentFallback(explicitAgentId);
      if (resolvedFromAgent) return resolvedFromAgent;
    }
    const extractedAgentId = extractAgentIdFromAbsoluteSessionPath(realTrimmed);
    if (extractedAgentId) {
      const resolvedFromPath = tryAgentFallback(extractedAgentId);
      if (resolvedFromPath) return resolvedFromPath;
      const structuralFallback = resolveStructuralSessionFallbackPath(realTrimmed, extractedAgentId);
      if (structuralFallback) return structuralFallback;
    }
  }
  if (!normalized || normalized.startsWith("..") || _nodePath.default.isAbsolute(normalized)) throw new Error("Session file path must be within sessions directory");
  return _nodePath.default.resolve(realBase, normalized);
}
function resolveSessionTranscriptPathInDir(sessionId, sessionsDir, topicId) {
  const safeSessionId = validateSessionId(sessionId);
  const safeTopicId = typeof topicId === "string" ? encodeURIComponent(topicId) : typeof topicId === "number" ? String(topicId) : void 0;
  return resolvePathWithinSessionsDir(sessionsDir, safeTopicId !== void 0 ? `${safeSessionId}-topic-${safeTopicId}.jsonl` : `${safeSessionId}.jsonl`);
}
function resolveSessionTranscriptPath(sessionId, agentId, topicId) {
  return resolveSessionTranscriptPathInDir(sessionId, resolveAgentSessionsDir(agentId), topicId);
}
function resolveSessionFilePath(sessionId, entry, opts) {
  const sessionsDir = resolveSessionsDir(opts);
  const candidate = entry?.sessionFile?.trim();
  if (candidate) try {
    return resolvePathWithinSessionsDir(sessionsDir, candidate, { agentId: opts?.agentId });
  } catch {}
  return resolveSessionTranscriptPathInDir(sessionId, sessionsDir);
}
function resolveStorePath(store, opts) {
  const agentId = (0, _sessionKeyCQewiu8n.c)(opts?.agentId ?? "main");
  const env = opts?.env ?? process.env;
  const homedir = () => (0, _homeDirIZwpu.o)(env, _nodeOs.default.homedir);
  if (!store) return _nodePath.default.join(resolveAgentSessionsDir(agentId, env, homedir), "sessions.json");
  if (store.includes("{agentId}")) {
    const expanded = store.replaceAll("{agentId}", agentId);
    if (expanded.startsWith("~")) return _nodePath.default.resolve((0, _homeDirIZwpu.t)(expanded, {
      home: (0, _homeDirIZwpu.o)(env, homedir),
      env,
      homedir
    }));
    return _nodePath.default.resolve(expanded);
  }
  if (store.startsWith("~")) return _nodePath.default.resolve((0, _homeDirIZwpu.t)(store, {
    home: (0, _homeDirIZwpu.o)(env, homedir),
    env,
    homedir
  }));
  return _nodePath.default.resolve(store);
}
function resolveAgentsDirFromSessionStorePath(storePath) {
  const candidateAbsPath = _nodePath.default.resolve(storePath);
  if (_nodePath.default.basename(candidateAbsPath) !== "sessions.json") return;
  const sessionsDir = _nodePath.default.dirname(candidateAbsPath);
  if (_nodePath.default.basename(sessionsDir) !== "sessions") return;
  const agentDir = _nodePath.default.dirname(sessionsDir);
  const agentsDir = _nodePath.default.dirname(agentDir);
  if (_nodePath.default.basename(agentsDir) !== "agents") return;
  return agentsDir;
}
//#endregion /* v9-ab80592eadfb90df */
