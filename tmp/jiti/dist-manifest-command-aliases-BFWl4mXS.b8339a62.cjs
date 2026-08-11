"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = resolveManifestCommandAliasOwnerInRegistry;exports.r = resolveManifestToolOwnerInRegistry;exports.t = normalizeManifestCommandAliases;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
var _utilsCKsuXgDI = require("./utils-CKsuXgDI.js");
//#region src/plugins/manifest-command-aliases.ts
function normalizeManifestCommandAliases(value) {
  if (!Array.isArray(value)) return;
  const normalized = [];
  for (const entry of value) {
    if (typeof entry === "string") {
      const name = (0, _stringCoerceLndEvhRk.c)(entry) ?? "";
      if (name) normalized.push({ name });
      continue;
    }
    if (!(0, _utilsCKsuXgDI.c)(entry)) continue;
    const name = (0, _stringCoerceLndEvhRk.c)(entry.name) ?? "";
    if (!name) continue;
    const kind = entry.kind === "runtime-slash" ? entry.kind : void 0;
    const cliCommand = (0, _stringCoerceLndEvhRk.c)(entry.cliCommand) ?? "";
    normalized.push({
      name,
      ...(kind ? { kind } : {}),
      ...(cliCommand ? { cliCommand } : {})
    });
  }
  return normalized.length > 0 ? normalized : void 0;
}
function resolveManifestToolOwnerInRegistry(params) {
  const normalizedToolName = (0, _stringCoerceLndEvhRk.s)(params.toolName);
  if (!normalizedToolName) return;
  for (const plugin of params.registry.plugins) {
    const tools = plugin.contracts?.tools;
    if (!tools || tools.length === 0) continue;
    const match = tools.find((entry) => (0, _stringCoerceLndEvhRk.s)(entry) === normalizedToolName);
    if (match) return {
      toolName: match,
      pluginId: plugin.id
    };
  }
}
function resolveManifestCommandAliasOwnerInRegistry(params) {
  const normalizedCommand = (0, _stringCoerceLndEvhRk.s)(params.command);
  if (!normalizedCommand) return;
  const commandIsPluginId = params.registry.plugins.some((plugin) => (0, _stringCoerceLndEvhRk.s)(plugin.id) === normalizedCommand);
  for (const plugin of params.registry.plugins) {
    const alias = plugin.commandAliases?.find((entry) => (0, _stringCoerceLndEvhRk.s)(entry.name) === normalizedCommand);
    if (alias) {
      if (commandIsPluginId && (0, _stringCoerceLndEvhRk.s)(plugin.id) !== normalizedCommand) continue;
      return {
        ...alias,
        pluginId: plugin.id,
        ...(plugin.enabledByDefault === true ? { enabledByDefault: true } : {})
      };
    }
  }
}
//#endregion /* v9-734a1f2c58a9ac7c */
