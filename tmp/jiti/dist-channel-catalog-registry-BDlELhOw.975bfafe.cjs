"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.t = listChannelCatalogEntries;var _discoveryBNk7kgJV = require("./discovery-BNk7kgJV.js");
var _installedPluginIndexRecordReaderDR3h__QQ = require("./installed-plugin-index-record-reader-DR3h__QQ.js");
var _manifestCkPySoxh = require("./manifest-CkPySoxh.js");
//#region src/plugins/channel-catalog-registry.ts
function listChannelCatalogEntries(params = {}) {
  const installRecords = resolveInstallRecords(params);
  return (params.discovery ?? (0, _discoveryBNk7kgJV.t)({
    workspaceDir: params.workspaceDir,
    env: params.env,
    ...(installRecords && Object.keys(installRecords).length > 0 ? { installRecords } : {})
  })).candidates.flatMap((candidate) => {
    if (params.origin && candidate.origin !== params.origin) return [];
    const channel = candidate.packageManifest?.channel;
    if (!channel?.id) return [];
    const manifest = (0, _manifestCkPySoxh.i)(candidate.rootDir, (0, _discoveryBNk7kgJV.f)({
      origin: candidate.origin,
      rootDir: candidate.rootDir,
      env: params.env
    }));
    if (!manifest.ok) return [];
    return [{
      pluginId: manifest.manifest.id,
      origin: candidate.origin,
      packageName: candidate.packageName,
      workspaceDir: candidate.workspaceDir,
      rootDir: candidate.rootDir,
      channel,
      ...(candidate.packageManifest?.install ? { install: candidate.packageManifest.install } : {})
    }];
  });
}
function resolveInstallRecords(params) {
  if (params.installRecords) return params.installRecords;
  if (params.origin === "bundled") return;
  try {
    return (0, _installedPluginIndexRecordReaderDR3h__QQ.n)(params.env ? { env: params.env } : {});
  } catch {
    return;
  }
}
//#endregion /* v9-2c1cffd13f29ee2a */
