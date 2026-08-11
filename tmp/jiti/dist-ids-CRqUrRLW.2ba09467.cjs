"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.i = listBundledChannelCatalogEntries;exports.n = void 0;exports.r = normalizeChatChannelId;exports.t = void 0;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
var _openclawRootDDaGBMF_ = require("./openclaw-root-DDaGBMF_.js");
var _jsonFiles1SmAauRO = require("./json-files-1SmAauRO.js");
var _bundledDirBocaljIz = require("./bundled-dir-BocaljIz.js");
var _nodeFs = _interopRequireDefault(require("node:fs"));
var _nodePath = _interopRequireDefault(require("node:path"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}
//#region src/channels/bundled-channel-catalog-read.ts
const OFFICIAL_CHANNEL_CATALOG_RELATIVE_PATH = _nodePath.default.join("dist", "channel-catalog.json");
const officialCatalogFileCache = /* @__PURE__ */new Map();
const bundledPackageCatalogCache = /* @__PURE__ */new Map();
function listPackageRoots() {
  return [(0, _openclawRootDDaGBMF_.n)({ cwd: process.cwd() }), (0, _openclawRootDDaGBMF_.n)({ moduleUrl: "file:///Users/thinkway/.nvm/versions/node/v24.14.0/lib/node_modules/openclaw/dist/ids-CRqUrRLW.js" })].filter((entry, index, all) => Boolean(entry) && all.indexOf(entry) === index);
}
function readBundledExtensionCatalogEntriesSync() {
  const pluginsDir = (0, _bundledDirBocaljIz.n)();
  if (!pluginsDir) return [];
  const cached = bundledPackageCatalogCache.get(pluginsDir);
  if (cached !== void 0) return cached ?? [];
  try {
    const entries = _nodeFs.default.readdirSync(pluginsDir, { withFileTypes: true }).filter((entry) => entry.isDirectory()).flatMap((entry) => {
      const parsed = (0, _jsonFiles1SmAauRO.u)(_nodePath.default.join(pluginsDir, entry.name, "package.json"));
      return parsed ? [parsed] : [];
    });
    bundledPackageCatalogCache.set(pluginsDir, entries);
    return entries;
  } catch {
    bundledPackageCatalogCache.set(pluginsDir, null);
    return [];
  }
}
function readOfficialCatalogFileSync() {
  for (const packageRoot of listPackageRoots()) {
    const candidate = _nodePath.default.join(packageRoot, OFFICIAL_CHANNEL_CATALOG_RELATIVE_PATH);
    const cached = officialCatalogFileCache.get(candidate);
    if (cached !== void 0) {
      if (cached) return cached;
      continue;
    }
    if (!_nodeFs.default.existsSync(candidate)) {
      officialCatalogFileCache.set(candidate, null);
      continue;
    }
    const payload = (0, _jsonFiles1SmAauRO.u)(candidate);
    if (payload) {
      const entries = Array.isArray(payload.entries) ? payload.entries : [];
      officialCatalogFileCache.set(candidate, entries);
      return entries;
    }
    officialCatalogFileCache.set(candidate, null);
  }
  return [];
}
function isChannelCatalogEntryLike(entry) {
  return "openclaw" in entry;
}
function toBundledChannelEntry(entry) {
  const channel = isChannelCatalogEntryLike(entry) ? entry.openclaw?.channel : entry;
  const id = (0, _stringCoerceLndEvhRk.s)(channel?.id);
  if (!id || !channel) return null;
  return {
    id,
    channel,
    aliases: Array.isArray(channel.aliases) ? channel.aliases.map((alias) => (0, _stringCoerceLndEvhRk.s)(alias)).filter((alias) => Boolean(alias)) : [],
    order: typeof channel.order === "number" && Number.isFinite(channel.order) ? channel.order : Number.MAX_SAFE_INTEGER
  };
}
function listBundledChannelCatalogEntries() {
  const entries = /* @__PURE__ */new Map();
  for (const entry of readOfficialCatalogFileSync().map((entry) => toBundledChannelEntry(entry)).filter((entry) => Boolean(entry))) entries.set(entry.id, entry);
  for (const entry of readBundledExtensionCatalogEntriesSync().map((entry) => toBundledChannelEntry(entry)).filter((entry) => Boolean(entry))) entries.set(entry.id, entry);
  return Array.from(entries.values()).toSorted((left, right) => left.order - right.order || left.id.localeCompare(right.id));
}
//#endregion
//#region src/channels/ids.ts
function listBundledChatChannelEntries() {
  return listBundledChannelCatalogEntries().map((entry) => ({
    id: (0, _stringCoerceLndEvhRk.s)(entry.id) ?? entry.id,
    aliases: entry.aliases,
    order: entry.order
  })).toSorted((left, right) => left.order - right.order || left.id.localeCompare(right.id, "en", { sensitivity: "base" }));
}
const BUNDLED_CHAT_CHANNEL_ENTRIES = Object.freeze(listBundledChatChannelEntries());
const CHAT_CHANNEL_ID_SET = new Set(BUNDLED_CHAT_CHANNEL_ENTRIES.map((entry) => entry.id));
const CHAT_CHANNEL_ORDER = exports.n = Object.freeze(BUNDLED_CHAT_CHANNEL_ENTRIES.map((entry) => entry.id));
const CHANNEL_IDS = exports.t = CHAT_CHANNEL_ORDER;
const CHAT_CHANNEL_ALIASES = Object.freeze(Object.fromEntries(BUNDLED_CHAT_CHANNEL_ENTRIES.flatMap((entry) => entry.aliases.map((alias) => [alias, entry.id]))));
function normalizeChatChannelId(raw) {
  const normalized = (0, _stringCoerceLndEvhRk.s)(raw);
  if (!normalized) return null;
  const resolved = CHAT_CHANNEL_ALIASES[normalized] ?? normalized;
  return CHAT_CHANNEL_ID_SET.has(resolved) ? resolved : null;
}
//#endregion /* v9-54f96e1a04a5b475 */
