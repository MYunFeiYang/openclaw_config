"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = resolveAgentDir;exports.c = resolveDefaultAgentId;exports.i = resolveAgentContextLimits;exports.n = listAgentIds;exports.o = resolveAgentWorkspaceDir;exports.r = resolveAgentConfig;exports.s = resolveDefaultAgentDir;exports.t = listAgentEntries;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
var _pathsCnwfh6dH = require("./paths-Cnwfh6dH.js");
var _utilsCKsuXgDI = require("./utils-CKsuXgDI.js");
var _sessionKeyCQewiu8n = require("./session-key-CQewiu8n.js");
var _workspaceDefaultDaaBuyRT = require("./workspace-default-DaaBuyRT.js");
var _nodePath = _interopRequireDefault(require("node:path"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}function _interopRequireWildcard(e, t) {if ("function" == typeof WeakMap) var r = new WeakMap(),n = new WeakMap();return (_interopRequireWildcard = function (e, t) {if (!t && e && e.__esModule) return e;var o,i,f = { __proto__: null, default: e };if (null === e || "object" != typeof e && "function" != typeof e) return f;if (o = t ? n : r) {if (o.has(e)) return o.get(e);o.set(e, f);}for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]);return f;})(e, t);}
//#region src/agents/agent-scope-config.ts
let defaultAgentWarned = false;
function warnMultipleDefaultAgents() {
  Promise.resolve().then(() => jitiImport("./subsystem-BYQb6GAz.js").then((m) => _interopRequireWildcard(m))).then(({ createSubsystemLogger }) => {
    createSubsystemLogger("agent-scope").warn("Multiple agents marked default=true; using the first entry as default.");
  }).catch(() => void 0);
}
/** Strip null bytes from paths to prevent ENOTDIR errors. */
function stripNullBytes(s) {
  return s.replaceAll("\0", "");
}
function listAgentEntries(cfg) {
  const list = cfg.agents?.list;
  if (!Array.isArray(list)) return [];
  return list.filter((entry) => entry !== null && typeof entry === "object");
}
function listAgentIds(cfg) {
  const agents = listAgentEntries(cfg);
  if (agents.length === 0) return [_sessionKeyCQewiu8n.t];
  const seen = /* @__PURE__ */new Set();
  const ids = [];
  for (const entry of agents) {
    const id = (0, _sessionKeyCQewiu8n.c)(entry?.id);
    if (seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids.length > 0 ? ids : [_sessionKeyCQewiu8n.t];
}
function resolveDefaultAgentId(cfg) {
  const agents = listAgentEntries(cfg);
  if (agents.length === 0) return _sessionKeyCQewiu8n.t;
  const defaults = agents.filter((agent) => agent?.default);
  if (defaults.length > 1 && !defaultAgentWarned) {
    defaultAgentWarned = true;
    warnMultipleDefaultAgents();
  }
  const chosen = (defaults[0] ?? agents[0])?.id?.trim();
  return (0, _sessionKeyCQewiu8n.c)(chosen || "main");
}
function resolveAgentEntry(cfg, agentId) {
  const id = (0, _sessionKeyCQewiu8n.c)(agentId);
  return listAgentEntries(cfg).find((entry) => (0, _sessionKeyCQewiu8n.c)(entry.id) === id);
}
function resolveAgentConfig(cfg, agentId) {
  const entry = resolveAgentEntry(cfg, (0, _sessionKeyCQewiu8n.c)(agentId));
  if (!entry) return;
  const agentDefaults = cfg.agents?.defaults;
  return {
    name: (0, _stringCoerceLndEvhRk.f)(entry.name),
    workspace: (0, _stringCoerceLndEvhRk.f)(entry.workspace),
    agentDir: (0, _stringCoerceLndEvhRk.f)(entry.agentDir),
    systemPromptOverride: (0, _stringCoerceLndEvhRk.f)(entry.systemPromptOverride),
    model: typeof entry.model === "string" || entry.model && typeof entry.model === "object" ? entry.model : void 0,
    thinkingDefault: entry.thinkingDefault,
    verboseDefault: entry.verboseDefault ?? agentDefaults?.verboseDefault,
    reasoningDefault: entry.reasoningDefault,
    fastModeDefault: entry.fastModeDefault,
    contextInjection: entry.contextInjection,
    bootstrapMaxChars: entry.bootstrapMaxChars,
    bootstrapTotalMaxChars: entry.bootstrapTotalMaxChars,
    experimental: typeof entry.experimental === "object" && entry.experimental ? {
      ...agentDefaults?.experimental,
      ...entry.experimental
    } : agentDefaults?.experimental,
    skills: Array.isArray(entry.skills) ? entry.skills : void 0,
    memorySearch: entry.memorySearch,
    humanDelay: entry.humanDelay,
    tts: entry.tts,
    contextLimits: typeof entry.contextLimits === "object" && entry.contextLimits ? {
      ...agentDefaults?.contextLimits,
      ...entry.contextLimits
    } : agentDefaults?.contextLimits,
    heartbeat: entry.heartbeat,
    identity: entry.identity,
    groupChat: entry.groupChat,
    subagents: typeof entry.subagents === "object" && entry.subagents ? entry.subagents : void 0,
    runRetries: typeof entry.runRetries === "object" && entry.runRetries ? {
      ...agentDefaults?.runRetries,
      ...entry.runRetries
    } : agentDefaults?.runRetries,
    embeddedPi: typeof entry.embeddedPi === "object" && entry.embeddedPi ? entry.embeddedPi : void 0,
    sandbox: entry.sandbox,
    tools: entry.tools
  };
}
function resolveAgentContextLimits(cfg, agentId) {
  const defaults = cfg?.agents?.defaults?.contextLimits;
  if (!cfg || !agentId) return defaults;
  return resolveAgentConfig(cfg, agentId)?.contextLimits ?? defaults;
}
function resolveAgentWorkspaceDir(cfg, agentId, env = process.env) {
  const id = (0, _sessionKeyCQewiu8n.c)(agentId);
  const configured = resolveAgentConfig(cfg, id)?.workspace?.trim();
  if (configured) return stripNullBytes((0, _utilsCKsuXgDI.p)(configured, env));
  const defaultAgentId = resolveDefaultAgentId(cfg);
  const fallback = cfg.agents?.defaults?.workspace?.trim();
  if (id === defaultAgentId) {
    if (fallback) return stripNullBytes((0, _utilsCKsuXgDI.p)(fallback, env));
    return stripNullBytes((0, _workspaceDefaultDaaBuyRT.n)(env));
  }
  if (fallback) return stripNullBytes(_nodePath.default.join((0, _utilsCKsuXgDI.p)(fallback, env), id));
  const stateDir = (0, _pathsCnwfh6dH.v)(env);
  return stripNullBytes(_nodePath.default.join(stateDir, `workspace-${id}`));
}
function resolveAgentDir(cfg, agentId, env = process.env) {
  const id = (0, _sessionKeyCQewiu8n.c)(agentId);
  const configured = resolveAgentConfig(cfg, id)?.agentDir?.trim();
  if (configured) return (0, _utilsCKsuXgDI.p)(configured, env);
  const root = (0, _pathsCnwfh6dH.v)(env);
  return _nodePath.default.join(root, "agents", id, "agent");
}
function resolveDefaultAgentDir(cfg, env = process.env) {
  return resolveAgentDir(cfg, resolveDefaultAgentId(cfg), env);
}
//#endregion /* v9-61cce3cb00a5ee20 */
