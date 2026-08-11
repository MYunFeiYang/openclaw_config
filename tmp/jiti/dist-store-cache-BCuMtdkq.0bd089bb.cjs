"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.l = exports.i = exports.f = exports.d = exports.c = exports.a = void 0;exports.n = readCachedAuthProfileStore;exports.o = void 0;exports.r = writeCachedAuthProfileStore;exports.s = void 0;exports.t = clearLoadedAuthStoreCache;exports.u = void 0;var _subsystemCH8Q21Y = require("./subsystem-C-H8Q21Y.js");
var _runtimeSnapshotsBSv4EtU = require("./runtime-snapshots-B-sv4EtU.js");
//#region src/agents/auth-profiles/constants.ts
/** @deprecated Anthropic provider-owned CLI profile id; do not use from third-party plugins. */
const CLAUDE_CLI_PROFILE_ID = exports.a = "anthropic:claude-cli";
/** @deprecated OpenAI Codex provider-owned CLI profile id; do not use from third-party plugins. */
const CODEX_CLI_PROFILE_ID = exports.o = "openai-codex:codex-cli";
const OPENAI_CODEX_DEFAULT_PROFILE_ID = exports.d = "openai-codex:default";
/** @deprecated MiniMax provider-owned CLI profile id; do not use from third-party plugins. */
const MINIMAX_CLI_PROFILE_ID = exports.c = "minimax-portal:minimax-cli";
const AUTH_STORE_LOCK_OPTIONS = exports.i = {
  retries: {
    retries: 10,
    factor: 2,
    minTimeout: 100,
    maxTimeout: 1e4,
    randomize: true
  },
  stale: 3e4
};
const OAUTH_REFRESH_LOCK_OPTIONS = exports.u = {
  retries: {
    retries: 20,
    factor: 2,
    minTimeout: 100,
    maxTimeout: 1e4,
    randomize: true
  },
  stale: 18e4
};
const OAUTH_REFRESH_CALL_TIMEOUT_MS = exports.l = 12e4;
const EXTERNAL_CLI_SYNC_TTL_MS = exports.s = 900 * 1e3;
const log = exports.f = (0, _subsystemCH8Q21Y.t)("agents/auth-profiles");
//#endregion
//#region src/agents/auth-profiles/store-cache.ts
const loadedAuthStoreCache = /* @__PURE__ */new Map();
function readCachedAuthProfileStore(params) {
  const cached = loadedAuthStoreCache.get(params.authPath);
  if (!cached || cached.authMtimeMs !== params.authMtimeMs || cached.stateMtimeMs !== params.stateMtimeMs) return null;
  if (Date.now() - cached.syncedAtMs >= 9e5) return null;
  return (0, _runtimeSnapshotsBSv4EtU.g)(cached.store);
}
function writeCachedAuthProfileStore(params) {
  loadedAuthStoreCache.set(params.authPath, {
    authMtimeMs: params.authMtimeMs,
    stateMtimeMs: params.stateMtimeMs,
    syncedAtMs: Date.now(),
    store: (0, _runtimeSnapshotsBSv4EtU.g)(params.store)
  });
}
function clearLoadedAuthStoreCache() {
  loadedAuthStoreCache.clear();
}
//#endregion /* v9-b0b96fe600b8c078 */
