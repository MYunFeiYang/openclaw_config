"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = resolveInstalledPluginIndexStorePath;exports.i = readPersistedInstalledPluginIndexInstallRecordsSync;exports.n = loadInstalledPluginIndexInstallRecordsSync;exports.r = readPersistedInstalledPluginIndexInstallRecords;exports.t = loadInstalledPluginIndexInstallRecords;var _pathsCnwfh6dH = require("./paths-Cnwfh6dH.js");
var _installPathsBm0q0NPS = require("./install-paths-Bm0q0NPS.js");
var _jsonFiles1SmAauRO = require("./json-files-1SmAauRO.js");
var _nodeFs = _interopRequireDefault(require("node:fs"));
var _nodePath = _interopRequireDefault(require("node:path"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}
//#region src/plugins/installed-plugin-index-store-path.ts
const INSTALLED_PLUGIN_INDEX_STORE_PATH = _nodePath.default.join("plugins", "installs.json");
function resolveInstalledPluginIndexStorePath(options = {}) {
  if (options.filePath) return options.filePath;
  const env = options.env ?? process.env;
  const stateDir = options.stateDir ?? (0, _pathsCnwfh6dH.v)(env);
  return _nodePath.default.join(stateDir, INSTALLED_PLUGIN_INDEX_STORE_PATH);
}
//#endregion
//#region src/plugins/installed-plugin-index-record-reader.ts
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function cloneInstallRecords(records) {
  return readRecordMap(records) ?? {};
}
const BLOCKED_RECORD_KEYS = new Set([
"__proto__",
"constructor",
"prototype"]
);
function isSafeRecordKey(key) {
  return !BLOCKED_RECORD_KEYS.has(key);
}
function readRecordMap(value) {
  if (!isRecord(value)) return null;
  const records = {};
  for (const [pluginId, record] of Object.entries(value).toSorted(([left], [right]) => left.localeCompare(right))) {
    if (!isSafeRecordKey(pluginId)) continue;
    if (isRecord(record) && typeof record.source === "string") records[pluginId] = structuredClone(record);
  }
  return records;
}
function readJsonObjectFileSync(filePath) {
  const parsed = (0, _jsonFiles1SmAauRO.u)(filePath);
  return isRecord(parsed) ? parsed : null;
}
function readStringRecord(value) {
  if (!isRecord(value)) return {};
  const record = {};
  for (const [key, raw] of Object.entries(value).toSorted(([left], [right]) => left.localeCompare(right))) {
    if (!isSafeRecordKey(key)) continue;
    if (typeof raw === "string" && raw.trim()) record[key] = raw.trim();
  }
  return record;
}
function hasPackagePluginMetadata(manifest) {
  const openclaw = manifest.openclaw;
  if (!isRecord(openclaw)) return false;
  const extensions = openclaw.extensions;
  return Array.isArray(extensions) && extensions.some((entry) => typeof entry === "string");
}
function readManifestPluginId(packageDir) {
  const manifest = readJsonObjectFileSync(_nodePath.default.join(packageDir, "openclaw.plugin.json"));
  return (typeof manifest?.id === "string" ? manifest.id.trim() : "") || void 0;
}
function resolveRecoveredManagedNpmPluginId(params) {
  const packageManifest = readJsonObjectFileSync(_nodePath.default.join(params.packageDir, "package.json"));
  if (!packageManifest || !hasPackagePluginMetadata(packageManifest)) return;
  const packageName = typeof packageManifest.name === "string" && packageManifest.name.trim() ? packageManifest.name.trim() : params.packageName;
  const pluginId = readManifestPluginId(params.packageDir) ?? packageName;
  return (0, _installPathsBm0q0NPS.c)(pluginId) ? void 0 : pluginId;
}
function buildRecoveredManagedNpmInstallRecords(options = {}) {
  const npmRoot = options.stateDir ? _nodePath.default.join(options.stateDir, "npm") : (0, _installPathsBm0q0NPS.a)(options.env);
  const dependencies = readStringRecord(readJsonObjectFileSync(_nodePath.default.join(npmRoot, "package.json"))?.dependencies);
  const records = {};
  for (const [packageName, dependencySpec] of Object.entries(dependencies)) {
    const packageDir = _nodePath.default.join(npmRoot, "node_modules", packageName);
    let stat;
    try {
      stat = _nodeFs.default.statSync(packageDir);
    } catch {
      continue;
    }
    if (!stat.isDirectory()) continue;
    const pluginId = resolveRecoveredManagedNpmPluginId({
      packageName,
      packageDir
    });
    if (!pluginId) continue;
    const packageManifest = readJsonObjectFileSync(_nodePath.default.join(packageDir, "package.json"));
    const version = typeof packageManifest?.version === "string" && packageManifest.version.trim() ? packageManifest.version.trim() : void 0;
    records[pluginId] = {
      source: "npm",
      spec: `${packageName}@${dependencySpec}`,
      installPath: packageDir,
      ...(version ? {
        version,
        resolvedName: packageName,
        resolvedVersion: version
      } : {}),
      ...(version ? { resolvedSpec: `${packageName}@${version}` } : {})
    };
  }
  return records;
}
function mergeRecoveredManagedNpmInstallRecords(persisted, options) {
  return {
    ...buildRecoveredManagedNpmInstallRecords(options),
    ...persisted
  };
}
function extractPluginInstallRecordsFromPersistedInstalledPluginIndex(index) {
  if (!isRecord(index)) return null;
  if (Object.prototype.hasOwnProperty.call(index, "installRecords")) return readRecordMap(index.installRecords) ?? {};
  if (!Array.isArray(index.plugins)) return null;
  const records = {};
  for (const entry of index.plugins) {
    if (!isRecord(entry) || typeof entry.pluginId !== "string" || !isRecord(entry.installRecord)) continue;
    if (!isSafeRecordKey(entry.pluginId)) continue;
    records[entry.pluginId] = structuredClone(entry.installRecord);
  }
  return records;
}
async function readPersistedInstalledPluginIndexInstallRecords(options = {}) {
  return extractPluginInstallRecordsFromPersistedInstalledPluginIndex(await (0, _jsonFiles1SmAauRO.l)(resolveInstalledPluginIndexStorePath(options)));
}
function readPersistedInstalledPluginIndexInstallRecordsSync(options = {}) {
  return extractPluginInstallRecordsFromPersistedInstalledPluginIndex((0, _jsonFiles1SmAauRO.u)(resolveInstalledPluginIndexStorePath(options)));
}
async function loadInstalledPluginIndexInstallRecords(params = {}) {
  return cloneInstallRecords(mergeRecoveredManagedNpmInstallRecords(await readPersistedInstalledPluginIndexInstallRecords(params), params));
}
function loadInstalledPluginIndexInstallRecordsSync(params = {}) {
  return cloneInstallRecords(mergeRecoveredManagedNpmInstallRecords(readPersistedInstalledPluginIndexInstallRecordsSync(params), params));
}
//#endregion /* v9-5e097a3b199d761b */
