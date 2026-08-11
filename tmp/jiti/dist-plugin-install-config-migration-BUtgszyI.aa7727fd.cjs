"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = stripShippedPluginInstallConfigRecords;exports.t = extractShippedPluginInstallConfigRecords;var _schemasBmna8ihM = require("./schemas-Bmna8ihM.js");
var _zodSchemaInstallsDyO5Hbk = require("./zod-schema.installs-DyO5Hbk4.js");
//#region src/config/plugin-install-config-migration.ts
const PluginInstallRecordsSchema = (0, _schemasBmna8ihM.Nn)((0, _schemasBmna8ihM.Rn)(), (0, _schemasBmna8ihM.Tn)(_zodSchemaInstallsDyO5Hbk.n).passthrough());
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function pruneEmptyPluginsObject(plugins) {
  const { installs: _installs, ...rest } = plugins;
  return Object.keys(rest).length === 0 ? void 0 : rest;
}
function extractShippedPluginInstallConfigRecords(config) {
  if (!isRecord(config) || !isRecord(config.plugins)) return {};
  const parsed = PluginInstallRecordsSchema.safeParse(config.plugins.installs);
  return parsed.success ? structuredClone(parsed.data) : {};
}
function stripShippedPluginInstallConfigRecords(config) {
  if (!isRecord(config) || !isRecord(config.plugins) || !("installs" in config.plugins)) return config;
  const plugins = pruneEmptyPluginsObject(config.plugins);
  const { plugins: _plugins, ...rest } = config;
  return plugins === void 0 ? rest : {
    ...rest,
    plugins
  };
}
//#endregion /* v9-976490131fd87b17 */
