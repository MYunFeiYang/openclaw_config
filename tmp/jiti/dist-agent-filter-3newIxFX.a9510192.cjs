"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = resolveEffectiveAgentSkillsLimits;exports.t = resolveEffectiveAgentSkillFilter;var _sessionKeyCQewiu8n = require("./session-key-CQewiu8n.js");
var _filterC6LM1yyQ = require("./filter-C6LM1yyQ.js");
//#region src/agents/skills/agent-filter.ts
function resolveAgentEntry(cfg, agentId) {
  if (!cfg) return;
  const normalizedAgentId = (0, _sessionKeyCQewiu8n.c)(agentId);
  return cfg.agents?.list?.find((entry) => (0, _sessionKeyCQewiu8n.c)(entry.id) === normalizedAgentId);
}
/**
* Explicit per-agent skills win when present; otherwise fall back to shared defaults.
* Unknown agent ids also fall back to defaults so legacy/unresolved callers do not widen access.
*/
function resolveEffectiveAgentSkillFilter(cfg, agentId) {
  if (!cfg) return;
  const agentEntry = resolveAgentEntry(cfg, agentId);
  if (agentEntry && Object.hasOwn(agentEntry, "skills")) return (0, _filterC6LM1yyQ.n)(agentEntry.skills);
  return (0, _filterC6LM1yyQ.n)(cfg.agents?.defaults?.skills);
}
function resolveEffectiveAgentSkillsLimits(cfg, agentId) {
  if (!agentId) return;
  const agentEntry = resolveAgentEntry(cfg, agentId);
  if (!agentEntry || !Object.hasOwn(agentEntry, "skillsLimits")) return;
  const { maxSkillsPromptChars } = agentEntry.skillsLimits ?? {};
  return typeof maxSkillsPromptChars === "number" ? { maxSkillsPromptChars } : void 0;
}
//#endregion /* v9-1c4b968c78561e54 */
