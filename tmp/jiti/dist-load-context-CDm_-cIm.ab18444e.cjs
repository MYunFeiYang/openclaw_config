"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.i = resolvePluginRuntimeLoadContext;exports.n = buildPluginRuntimeLoadOptionsFromValues;exports.r = createPluginRuntimeLoaderLogger;exports.t = buildPluginRuntimeLoadOptions;require("./agent-scope-DMMelGwC.js");
var _agentScopeConfigDCRwWQZy = require("./agent-scope-config-DCRwWQZy.js");
var _pluginMetadataSnapshotYo9W2SZ = require("./plugin-metadata-snapshot-yo9-w2SZ.js");
var _pluginRegistryBZohWtpt = require("./plugin-registry-BZohWtpt.js");
var _subsystemCH8Q21Y = require("./subsystem-C-H8Q21Y.js");
var _ioCiCdMMvQ = require("./io-CiCdMMvQ.js");
require("./config-ClOrPUuZ.js");
var _pluginAutoEnableCa3CdPro = require("./plugin-auto-enable-Ca3CdPro.js");
var _loaderCZB9kQVT = require("./loader-CZB9kQVT.js");
require("./logging-BFdm3vtw.js");
//#region src/plugins/runtime/load-context.ts
const log = (0, _subsystemCH8Q21Y.t)("plugins");
function createPluginRuntimeLoaderLogger() {
  return {
    info: (message) => log.info(message),
    warn: (message) => log.warn(message),
    error: (message) => log.error(message),
    debug: (message) => log.debug(message)
  };
}
function resolvePluginRuntimeLoadContext(options) {
  const env = options?.env ?? process.env;
  const rawConfig = options?.config ?? (0, _ioCiCdMMvQ.i)();
  const rawWorkspaceDir = options?.workspaceDir ?? (0, _agentScopeConfigDCRwWQZy.o)(rawConfig, (0, _agentScopeConfigDCRwWQZy.c)(rawConfig));
  const metadataSnapshot = options?.manifestRegistry ? void 0 : (0, _pluginRegistryBZohWtpt.v)({
    config: rawConfig,
    env,
    workspaceDir: rawWorkspaceDir
  }) ?? (0, _pluginMetadataSnapshotYo9W2SZ.i)({
    config: rawConfig,
    env,
    workspaceDir: rawWorkspaceDir
  });
  const manifestRegistry = options?.manifestRegistry ?? metadataSnapshot?.manifestRegistry;
  const activationSourceConfig = (0, _loaderCZB9kQVT.E)({
    config: rawConfig,
    activationSourceConfig: options?.activationSourceConfig
  });
  const autoEnabled = (0, _pluginAutoEnableCa3CdPro.t)({
    config: rawConfig,
    env,
    manifestRegistry
  });
  const config = autoEnabled.config;
  const workspaceDir = options?.workspaceDir ?? (0, _agentScopeConfigDCRwWQZy.o)(config, (0, _agentScopeConfigDCRwWQZy.c)(config));
  if (metadataSnapshot) (0, _pluginRegistryBZohWtpt.b)(metadataSnapshot, {
    config: rawConfig,
    compatibleConfigs: [config, activationSourceConfig],
    env,
    workspaceDir
  });
  return {
    rawConfig,
    config,
    activationSourceConfig,
    autoEnabledReasons: autoEnabled.autoEnabledReasons,
    workspaceDir,
    env,
    logger: options?.logger ?? createPluginRuntimeLoaderLogger(),
    ...(manifestRegistry ? { manifestRegistry } : {})
  };
}
function buildPluginRuntimeLoadOptions(context, overrides) {
  return buildPluginRuntimeLoadOptionsFromValues(context, overrides);
}
function buildPluginRuntimeLoadOptionsFromValues(values, overrides) {
  return {
    config: values.config,
    activationSourceConfig: values.activationSourceConfig,
    autoEnabledReasons: values.autoEnabledReasons,
    workspaceDir: values.workspaceDir,
    env: values.env,
    logger: values.logger,
    ...(values.manifestRegistry ? { manifestRegistry: values.manifestRegistry } : {}),
    ...overrides
  };
}
//#endregion /* v9-85a093e23b5a2b97 */
