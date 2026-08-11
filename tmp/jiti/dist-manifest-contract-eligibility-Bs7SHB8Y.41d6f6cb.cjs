"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = loadManifestContractSnapshot;exports.i = listAvailableManifestContractValues;exports.n = isManifestPluginAvailableForControlPlane;exports.o = loadManifestMetadataRegistry;exports.r = listAvailableManifestContractPlugins;exports.s = loadManifestMetadataSnapshot;exports.t = hasManifestContractValue;var _pluginMetadataSnapshotBxWkpxUl = require("./plugin-metadata-snapshot-BxWkpxUl.js");
var _installedPluginIndexStoreIOgCdyHd = require("./installed-plugin-index-store-IOgCdyHd.js");
var _pluginRegistryIimloLsx = require("./plugin-registry-iimloLsx.js");
//#region src/plugins/manifest-contract-eligibility.ts
function isManifestPluginAvailableForControlPlane(params) {
  if (params.plugin.origin === "bundled") return true;
  return (0, _installedPluginIndexStoreIOgCdyHd.d)(params.snapshot.index, params.plugin.id, params.config);
}
function hasManifestContractValue(params) {
  const values = params.plugin.contracts?.[params.contract] ?? [];
  return values.length > 0 && (!params.value || values.includes(params.value));
}
function listAvailableManifestContractPlugins(params) {
  return params.snapshot.plugins.filter((plugin) => hasManifestContractValue({
    plugin,
    contract: params.contract,
    value: params.value
  }) && isManifestPluginAvailableForControlPlane({
    snapshot: params.snapshot,
    plugin,
    config: params.config
  }));
}
function listAvailableManifestContractValues(params) {
  const values = /* @__PURE__ */new Set();
  for (const plugin of listAvailableManifestContractPlugins(params)) for (const value of plugin.contracts?.[params.contract] ?? []) values.add(value);
  return [...values].toSorted((left, right) => left.localeCompare(right));
}
function loadManifestContractSnapshot(params) {
  const snapshot = loadManifestMetadataSnapshot(params);
  return {
    index: snapshot.index,
    plugins: snapshot.plugins
  };
}
function loadManifestMetadataRegistry(params) {
  const snapshot = loadManifestMetadataSnapshot(params);
  return {
    index: snapshot.index,
    manifestRegistry: snapshot.manifestRegistry
  };
}
function loadManifestMetadataSnapshot(params) {
  const config = params.config ?? {};
  const env = params.env ?? process.env;
  const current = (0, _pluginRegistryIimloLsx.v)({
    config,
    env,
    ...(params.workspaceDir ? { workspaceDir: params.workspaceDir } : {}),
    ...(params.workspaceDir === void 0 ? { allowWorkspaceScopedSnapshot: true } : {})
  });
  if (current) return current;
  return (0, _pluginMetadataSnapshotBxWkpxUl.i)({
    config,
    env,
    ...(params.workspaceDir ? { workspaceDir: params.workspaceDir } : {})
  });
}
//#endregion /* v9-2401cee1905877b3 */
