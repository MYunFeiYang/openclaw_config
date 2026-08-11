"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.i = resolvePluginRuntimeLoadContext;exports.n = buildPluginRuntimeLoadOptionsFromValues;exports.r = createPluginRuntimeLoaderLogger;exports.t = buildPluginRuntimeLoadOptions;require("./agent-scope-Cf7T6Ju7.js");
var _agentScopeConfigDUwbsKjv = require("./agent-scope-config-DUwbsKjv.js");
var _pluginMetadataSnapshotBxWkpxUl = require("./plugin-metadata-snapshot-BxWkpxUl.js");
var _pluginRegistryIimloLsx = require("./plugin-registry-iimloLsx.js");
var _subsystemLmgZvqF = require("./subsystem-LmgZvqF7.js");
var _ioDnGGugrj = require("./io-DnGGugrj.js");
require("./config-CR6nsEzH.js");
var _pluginAutoEnableQ8Kl1Dsn = require("./plugin-auto-enable-q8Kl1Dsn.js");
var _loaderCxUWY2_ = require("./loader-CxUWY2_6.js");
require("./logging-B8QGVK5v.js");
//#region src/plugins/runtime/load-context.ts
const log = (0, _subsystemLmgZvqF.t)("plugins");
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
  const rawConfig = options?.config ?? (0, _ioDnGGugrj.i)();
  const rawWorkspaceDir = options?.workspaceDir ?? (0, _agentScopeConfigDUwbsKjv.o)(rawConfig, (0, _agentScopeConfigDUwbsKjv.c)(rawConfig));
  const metadataSnapshot = options?.manifestRegistry ? void 0 : (0, _pluginRegistryIimloLsx.v)({
    config: rawConfig,
    env,
    workspaceDir: rawWorkspaceDir
  }) ?? (0, _pluginMetadataSnapshotBxWkpxUl.i)({
    config: rawConfig,
    env,
    workspaceDir: rawWorkspaceDir
  });
  const manifestRegistry = options?.manifestRegistry ?? metadataSnapshot?.manifestRegistry;
  const activationSourceConfig = (0, _loaderCxUWY2_.E)({
    config: rawConfig,
    activationSourceConfig: options?.activationSourceConfig
  });
  const autoEnabled = (0, _pluginAutoEnableQ8Kl1Dsn.t)({
    config: rawConfig,
    env,
    manifestRegistry
  });
  const config = autoEnabled.config;
  const workspaceDir = options?.workspaceDir ?? (0, _agentScopeConfigDUwbsKjv.o)(config, (0, _agentScopeConfigDUwbsKjv.c)(config));
  if (metadataSnapshot) (0, _pluginRegistryIimloLsx.b)(metadataSnapshot, {
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
//#endregion /* v9-ee62f9ca95e1190e */
