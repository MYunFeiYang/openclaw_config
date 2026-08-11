"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = withPluginInstallRecords;exports.c = writePersistedInstalledPluginIndexInstallRecordsSync;exports.i = resolveInstalledPluginIndexRecordsStorePath;exports.n = recordPluginInstallInRecords;exports.o = withoutPluginInstallRecords;exports.r = removePluginInstallRecordFromRecords;exports.s = writePersistedInstalledPluginIndexInstallRecords;exports.t = void 0;var _installedPluginIndexStoreDEo2ZAhx = require("./installed-plugin-index-store-DEo2ZAhx.js");
var _installedPluginIndexRecordReaderDR3h__QQ = require("./installed-plugin-index-record-reader-DR3h__QQ.js");
var _installsSCk5WJJQ = require("./installs-SCk5WJJQ.js");
//#region src/plugins/installed-plugin-index-records.ts
const PLUGIN_INSTALLS_CONFIG_PATH = exports.t = ["plugins", "installs"];
function resolveInstalledPluginIndexRecordsStorePath(options = {}) {
  return (0, _installedPluginIndexRecordReaderDR3h__QQ.a)(options);
}
async function writePersistedInstalledPluginIndexInstallRecords(records, options = {}) {
  await (0, _installedPluginIndexStoreDEo2ZAhx.i)({
    ...options,
    reason: "source-changed",
    installRecords: records
  });
  return resolveInstalledPluginIndexRecordsStorePath(options);
}
function writePersistedInstalledPluginIndexInstallRecordsSync(records, options = {}) {
  (0, _installedPluginIndexStoreDEo2ZAhx.a)({
    ...options,
    reason: "source-changed",
    installRecords: records
  });
  return resolveInstalledPluginIndexRecordsStorePath(options);
}
function withPluginInstallRecords(config, records) {
  return {
    ...config,
    plugins: {
      ...config.plugins,
      installs: records
    }
  };
}
function withoutPluginInstallRecords(config) {
  if (!config.plugins?.installs) return config;
  const { installs: _installs, ...plugins } = config.plugins;
  if (Object.keys(plugins).length === 0) {
    const { plugins: _plugins, ...rest } = config;
    return rest;
  }
  return {
    ...config,
    plugins
  };
}
function recordPluginInstallInRecords(records, update) {
  return (0, _installsSCk5WJJQ.n)({ plugins: { installs: records } }, update).plugins?.installs ?? {};
}
function removePluginInstallRecordFromRecords(records, pluginId) {
  const { [pluginId]: _removed, ...rest } = records;
  return rest;
}
//#endregion /* v9-bef2be85c6bc4b1c */
