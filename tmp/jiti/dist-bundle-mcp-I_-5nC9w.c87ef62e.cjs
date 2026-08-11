"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = loadEnabledBundleConfig;exports.i = inspectBundleServerRuntimeSupport;exports.n = inspectBundleMcpRuntimeSupport;exports.o = readBundleJsonObject;exports.r = loadEnabledBundleMcpConfig;exports.t = extractMcpServerMap;var _rootFileCqMcFM3J = require("./root-file-CqMcFM3J.js");
var _utilsCKsuXgDI = require("./utils-CKsuXgDI.js");
require("./boundary-file-read-wgc2vgUM.js");
var _bundleManifestDpCbfxOo = require("./bundle-manifest-DpCbfxOo.js");
var _jsonFiles1SmAauRO = require("./json-files-1SmAauRO.js");
var _configStateCOhlckC = require("./config-state-COhlckC5.js");
var _pluginRegistryBZohWtpt = require("./plugin-registry-BZohWtpt.js");
var _mergePatchB1KO8sev = require("./merge-patch-B1KO8sev.js");
var _nodeFs = _interopRequireDefault(require("node:fs"));
var _nodePath = _interopRequireDefault(require("node:path"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}
//#region src/plugins/bundle-config-shared.ts
function readBundleJsonObject(params) {
  const result = (0, _jsonFiles1SmAauRO.o)({
    rootDir: params.rootDir,
    relativePath: params.relativePath,
    boundaryLabel: "plugin root",
    rejectHardlinks: true
  });
  if (result.ok) return {
    ok: true,
    raw: result.value
  };
  if (result.reason === "open") return params.onOpenFailure?.(result.failure) ?? {
    ok: true,
    raw: {}
  };
  return {
    ok: false,
    error: result.error
  };
}
function resolveBundleJsonOpenFailure(params) {
  return (0, _rootFileCqMcFM3J.n)(params.failure, {
    path: () => {
      if (params.allowMissing) return {
        ok: true,
        raw: {}
      };
      return {
        ok: false,
        error: `unable to read ${params.relativePath}: path`
      };
    },
    fallback: (failure) => ({
      ok: false,
      error: `unable to read ${params.relativePath}: ${failure.reason}`
    })
  });
}
function inspectBundleServerRuntimeSupport(params) {
  const supportedServerNames = [];
  const unsupportedServerNames = [];
  let hasSupportedServer = false;
  for (const [serverName, server] of Object.entries(params.resolveServers(params.loaded.config))) {
    if (typeof server.command === "string" && server.command.trim().length > 0) {
      hasSupportedServer = true;
      supportedServerNames.push(serverName);
      continue;
    }
    unsupportedServerNames.push(serverName);
  }
  return {
    hasSupportedServer,
    supportedServerNames,
    unsupportedServerNames,
    diagnostics: params.loaded.diagnostics
  };
}
function loadEnabledBundleConfig(params) {
  const normalizedPlugins = (0, _configStateCOhlckC.s)(params.cfg?.plugins);
  if (!normalizedPlugins.enabled) return {
    config: params.createEmptyConfig(),
    diagnostics: []
  };
  const registry = (0, _pluginRegistryBZohWtpt.n)({
    workspaceDir: params.workspaceDir,
    config: params.cfg,
    includeDisabled: true
  });
  const diagnostics = [];
  let merged = params.createEmptyConfig();
  for (const record of registry.plugins) {
    if (record.format !== "bundle" || !record.bundleFormat) continue;
    if (!(0, _configStateCOhlckC.l)({
      id: record.id,
      origin: record.origin,
      config: normalizedPlugins,
      rootConfig: params.cfg
    }).activated) continue;
    const loaded = params.loadBundleConfig({
      pluginId: record.id,
      rootDir: record.rootDir,
      bundleFormat: record.bundleFormat
    });
    merged = (0, _mergePatchB1KO8sev.t)(merged, loaded.config);
    for (const message of loaded.diagnostics) diagnostics.push(params.createDiagnostic(record.id, message));
  }
  return {
    config: merged,
    diagnostics
  };
}
//#endregion
//#region src/plugins/bundle-mcp.ts
const MANIFEST_PATH_BY_FORMAT = {
  claude: _bundleManifestDpCbfxOo.t,
  codex: _bundleManifestDpCbfxOo.n,
  cursor: _bundleManifestDpCbfxOo.r
};
const CLAUDE_PLUGIN_ROOT_PLACEHOLDER = "${CLAUDE_PLUGIN_ROOT}";
function resolveBundleMcpConfigPaths(params) {
  const declared = (0, _bundleManifestDpCbfxOo.s)(params.raw.mcpServers);
  const defaults = _nodeFs.default.existsSync(_nodePath.default.join(params.rootDir, ".mcp.json")) ? [".mcp.json"] : [];
  if (params.bundleFormat === "claude") return (0, _bundleManifestDpCbfxOo.o)(defaults, declared);
  return (0, _bundleManifestDpCbfxOo.o)(defaults, declared);
}
function extractMcpServerMap(raw) {
  if (!(0, _utilsCKsuXgDI.c)(raw)) return {};
  const nested = (0, _utilsCKsuXgDI.c)(raw.mcpServers) ? raw.mcpServers : (0, _utilsCKsuXgDI.c)(raw.servers) ? raw.servers : raw;
  if (!(0, _utilsCKsuXgDI.c)(nested)) return {};
  const result = {};
  for (const [serverName, serverRaw] of Object.entries(nested)) {
    if (!(0, _utilsCKsuXgDI.c)(serverRaw)) continue;
    result[serverName] = { ...serverRaw };
  }
  return result;
}
function isExplicitRelativePath(value) {
  return value === "." || value === ".." || value.startsWith("./") || value.startsWith("../");
}
function expandBundleRootPlaceholders(value, rootDir) {
  if (!value.includes(CLAUDE_PLUGIN_ROOT_PLACEHOLDER)) return value;
  return value.split(CLAUDE_PLUGIN_ROOT_PLACEHOLDER).join(rootDir);
}
function normalizeBundlePath(targetPath) {
  return _nodePath.default.normalize(_nodePath.default.resolve(targetPath));
}
function normalizeExpandedAbsolutePath(value) {
  return _nodePath.default.isAbsolute(value) ? _nodePath.default.normalize(value) : value;
}
function absolutizeBundleMcpServer(params) {
  const next = { ...params.server };
  if (typeof next.cwd !== "string" && typeof next.workingDirectory !== "string") next.cwd = params.baseDir;
  const command = next.command;
  if (typeof command === "string") {
    const expanded = expandBundleRootPlaceholders(command, params.rootDir);
    next.command = isExplicitRelativePath(expanded) ? _nodePath.default.resolve(params.baseDir, expanded) : normalizeExpandedAbsolutePath(expanded);
  }
  const cwd = next.cwd;
  if (typeof cwd === "string") {
    const expanded = expandBundleRootPlaceholders(cwd, params.rootDir);
    next.cwd = _nodePath.default.isAbsolute(expanded) ? expanded : _nodePath.default.resolve(params.baseDir, expanded);
  }
  const workingDirectory = next.workingDirectory;
  if (typeof workingDirectory === "string") {
    const expanded = expandBundleRootPlaceholders(workingDirectory, params.rootDir);
    next.workingDirectory = _nodePath.default.isAbsolute(expanded) ? _nodePath.default.normalize(expanded) : _nodePath.default.resolve(params.baseDir, expanded);
  }
  if (Array.isArray(next.args)) next.args = next.args.map((entry) => {
    if (typeof entry !== "string") return entry;
    const expanded = expandBundleRootPlaceholders(entry, params.rootDir);
    if (!isExplicitRelativePath(expanded)) return normalizeExpandedAbsolutePath(expanded);
    return _nodePath.default.resolve(params.baseDir, expanded);
  });
  if ((0, _utilsCKsuXgDI.c)(next.env)) next.env = Object.fromEntries(Object.entries(next.env).map(([key, value]) => [key, typeof value === "string" ? normalizeExpandedAbsolutePath(expandBundleRootPlaceholders(value, params.rootDir)) : value]));
  return next;
}
function loadBundleFileBackedMcpConfig(params) {
  const rootDir = normalizeBundlePath(params.rootDir);
  const absolutePath = _nodePath.default.resolve(rootDir, params.relativePath);
  const result = (0, _jsonFiles1SmAauRO.o)({
    rootDir,
    relativePath: params.relativePath,
    boundaryLabel: "plugin root",
    rejectHardlinks: true
  });
  if (!result.ok) {
    if (result.reason === "open") return {
      config: { mcpServers: {} },
      diagnostics: result.failure.reason === "path" ? [] : [`unable to read ${params.relativePath}: ${result.failure.reason}`]
    };
    return {
      config: { mcpServers: {} },
      diagnostics: [`unable to read ${params.relativePath}: ${result.error}`]
    };
  }
  const servers = extractMcpServerMap(result.value);
  const baseDir = normalizeBundlePath(_nodePath.default.dirname(absolutePath));
  return {
    config: { mcpServers: Object.fromEntries(Object.entries(servers).map(([serverName, server]) => [serverName, absolutizeBundleMcpServer({
        rootDir,
        baseDir,
        server
      })])) },
    diagnostics: []
  };
}
function loadBundleInlineMcpConfig(params) {
  if (!(0, _utilsCKsuXgDI.c)(params.raw.mcpServers)) return { mcpServers: {} };
  const baseDir = normalizeBundlePath(params.baseDir);
  const servers = extractMcpServerMap(params.raw.mcpServers);
  return { mcpServers: Object.fromEntries(Object.entries(servers).map(([serverName, server]) => [serverName, absolutizeBundleMcpServer({
      rootDir: baseDir,
      baseDir,
      server
    })])) };
}
function loadBundleMcpConfig(params) {
  const manifestRelativePath = MANIFEST_PATH_BY_FORMAT[params.bundleFormat];
  const manifestLoaded = readBundleJsonObject({
    rootDir: params.rootDir,
    relativePath: manifestRelativePath,
    onOpenFailure: (failure) => resolveBundleJsonOpenFailure({
      failure,
      relativePath: manifestRelativePath,
      allowMissing: params.bundleFormat === "claude"
    })
  });
  if (!manifestLoaded.ok) return {
    config: { mcpServers: {} },
    diagnostics: [manifestLoaded.error]
  };
  let merged = { mcpServers: {} };
  const filePaths = resolveBundleMcpConfigPaths({
    raw: manifestLoaded.raw,
    rootDir: params.rootDir,
    bundleFormat: params.bundleFormat
  });
  const diagnostics = [];
  for (const relativePath of filePaths) {
    const loaded = loadBundleFileBackedMcpConfig({
      rootDir: params.rootDir,
      relativePath
    });
    diagnostics.push(...loaded.diagnostics);
    merged = (0, _mergePatchB1KO8sev.t)(merged, loaded.config);
  }
  merged = (0, _mergePatchB1KO8sev.t)(merged, loadBundleInlineMcpConfig({
    raw: manifestLoaded.raw,
    baseDir: params.rootDir
  }));
  return {
    config: merged,
    diagnostics
  };
}
function inspectBundleMcpRuntimeSupport(params) {
  const support = inspectBundleServerRuntimeSupport({
    loaded: loadBundleMcpConfig(params),
    resolveServers: (config) => config.mcpServers
  });
  return {
    hasSupportedStdioServer: support.hasSupportedServer,
    supportedServerNames: support.supportedServerNames,
    unsupportedServerNames: support.unsupportedServerNames,
    diagnostics: support.diagnostics
  };
}
function loadEnabledBundleMcpConfig(params) {
  return loadEnabledBundleConfig({
    workspaceDir: params.workspaceDir,
    cfg: params.cfg,
    createEmptyConfig: () => ({ mcpServers: {} }),
    loadBundleConfig: loadBundleMcpConfig,
    createDiagnostic: (pluginId, message) => ({
      pluginId,
      message
    })
  });
}
//#endregion /* v9-cd639b962952e20e */
