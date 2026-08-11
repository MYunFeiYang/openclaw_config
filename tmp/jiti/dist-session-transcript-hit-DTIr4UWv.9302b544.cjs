"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = resolveTranscriptStemToSessionKeys;exports.t = extractTranscriptStemFromSessionsMemoryHit;var _stringCoerceBje8XVt = require("./string-coerce-Bje8XVt9.js");
require("./combined-store-gateway-D6wKl8dT.js");
var _artifactsC4Ry7YwM = require("./artifacts-C4Ry7YwM.js");
var _nodePath = _interopRequireDefault(require("node:path"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}
//#region src/plugin-sdk/session-transcript-hit.ts
/**
* Derive transcript stem `S` from a memory search hit path for `source === "sessions"`.
* Builtin index uses `sessions/<basename>.jsonl`; QMD exports use `<stem>.md`.
*/
function extractTranscriptStemFromSessionsMemoryHit(hitPath) {
  const normalized = hitPath.replace(/\\/g, "/");
  const trimmed = normalized.startsWith("sessions/") ? normalized.slice(9) : normalized;
  const base = _nodePath.default.basename(trimmed);
  if (base.endsWith(".jsonl")) return base.slice(0, -6) || null;
  if (base.endsWith(".md")) return base.slice(0, -3) || null;
  return null;
}
/**
* Map transcript stem to canonical session store keys (all agents in the combined store).
* Session tools visibility and agent-to-agent policy are enforced by the caller (e.g.
* `createSessionVisibilityGuard`), including cross-agent cases.
*/
function resolveTranscriptStemToSessionKeys(params) {
  const { store } = params;
  const matches = [];
  const parsedStemId = (0, _artifactsC4Ry7YwM.d)(params.stem.endsWith(".jsonl") ? params.stem : `${params.stem}.jsonl`);
  for (const [sessionKey, entry] of Object.entries(store)) {
    const sessionFile = (0, _stringCoerceBje8XVt.c)(entry.sessionFile);
    if (sessionFile) {
      const base = _nodePath.default.basename(sessionFile);
      if ((base.endsWith(".jsonl") ? base.slice(0, -6) : base) === params.stem) {
        matches.push(sessionKey);
        continue;
      }
    }
    if (entry.sessionId === params.stem || parsedStemId && entry.sessionId === parsedStemId) matches.push(sessionKey);
  }
  return [...new Set(matches)];
}
//#endregion /* v9-9d99ac09b83df075 */
