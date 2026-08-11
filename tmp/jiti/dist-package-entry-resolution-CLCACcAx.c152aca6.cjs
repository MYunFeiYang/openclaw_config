"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = resolvePackageSetupSource;exports.r = validatePackageExtensionEntriesForInstall;exports.t = resolvePackageRuntimeExtensionSources;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
var _rootPathDTHDXh_ = require("./root-path-DTHDXh_7.js");
var _rootFileCqMcFM3J = require("./root-file-CqMcFM3J.js");
require("./boundary-file-read-wgc2vgUM.js");
var _manifestCkPySoxh = require("./manifest-CkPySoxh.js");
require("./boundary-path-DoEhnof5.js");
var _packageEntrypointsD_bjPUwf = require("./package-entrypoints-D_bjPUwf.js");
var _nodeFs = _interopRequireDefault(require("node:fs"));
var _nodePath = _interopRequireDefault(require("node:path"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}
//#region src/plugins/package-entry-resolution.ts
function runtimeExtensionsLengthMismatchMessage(params) {
  return `package.json openclaw.runtimeExtensions length (${params.runtimeExtensionsLength}) must match openclaw.extensions length (${params.extensionsLength})`;
}
function readPackageManifestStringList(params) {
  if (!Array.isArray(params.value)) return {
    ok: true,
    entries: []
  };
  const entries = [];
  for (const [index, entry] of params.value.entries()) {
    const normalized = (0, _stringCoerceLndEvhRk.c)(entry);
    if (!normalized) return {
      ok: false,
      error: `package.json ${params.fieldName}[${index}] must be a non-empty string`
    };
    entries.push(normalized);
  }
  return {
    ok: true,
    entries
  };
}
function resolvePackageRuntimeExtensionEntries(params) {
  const runtimeExtensionsResult = readPackageManifestStringList({
    fieldName: "openclaw.runtimeExtensions",
    value: (0, _manifestCkPySoxh.r)(params.manifest ?? void 0)?.runtimeExtensions
  });
  if (!runtimeExtensionsResult.ok) return runtimeExtensionsResult;
  const runtimeExtensions = runtimeExtensionsResult.entries;
  if (runtimeExtensions.length === 0) return {
    ok: true,
    runtimeExtensions: []
  };
  if (runtimeExtensions.length !== params.extensions.length) return {
    ok: false,
    error: runtimeExtensionsLengthMismatchMessage({
      runtimeExtensionsLength: runtimeExtensions.length,
      extensionsLength: params.extensions.length
    })
  };
  return {
    ok: true,
    runtimeExtensions
  };
}
function missingCompiledRuntimeEntryMessage(params) {
  return `${params.label} requires compiled runtime output for TypeScript entry ${params.entry}: expected ${params.candidates.join(", ")}. This is a plugin packaging issue, not a local config problem; update or reinstall the plugin after the publisher ships compiled JavaScript, or disable/uninstall the plugin until then. TypeScript source fallback is only supported for source checkouts and local development paths.`;
}
async function validatePackageExtensionEntry(params) {
  const absolutePath = _nodePath.default.resolve(params.packageDir, params.entry);
  try {
    if (!(await (0, _rootPathDTHDXh_.r)({
      absolutePath,
      rootPath: params.packageDir,
      boundaryLabel: "plugin package directory"
    })).exists) return params.requireExisting ? {
      ok: false,
      error: `${params.label} not found: ${params.entry}`
    } : {
      ok: true,
      exists: false
    };
  } catch {
    return {
      ok: false,
      error: `${params.label} escapes plugin directory: ${params.entry}`
    };
  }
  const opened = await (0, _rootFileCqMcFM3J.r)({
    absolutePath,
    rootPath: params.packageDir,
    boundaryLabel: "plugin package directory"
  });
  if (!opened.ok) return (0, _rootFileCqMcFM3J.n)(opened, {
    path: () => ({
      ok: false,
      error: `${params.label} not found: ${params.entry}`
    }),
    io: () => ({
      ok: false,
      error: `${params.label} unreadable: ${params.entry}`
    }),
    validation: () => ({
      ok: false,
      error: `${params.label} failed plugin directory boundary checks: ${params.entry}`
    }),
    fallback: () => ({
      ok: false,
      error: `${params.label} failed plugin directory boundary checks: ${params.entry}`
    })
  });
  _nodeFs.default.closeSync(opened.fd);
  return {
    ok: true,
    exists: true
  };
}
async function validatePackageExtensionEntriesForInstall(params) {
  const runtimeResolution = resolvePackageRuntimeExtensionEntries({
    manifest: params.manifest,
    extensions: params.extensions
  });
  if (!runtimeResolution.ok) return runtimeResolution;
  for (const [index, entry] of params.extensions.entries()) {
    const sourceEntry = await validatePackageExtensionEntry({
      packageDir: params.packageDir,
      entry,
      label: "extension entry",
      requireExisting: false
    });
    if (!sourceEntry.ok) return sourceEntry;
    const runtimeEntry = runtimeResolution.runtimeExtensions[index];
    if (runtimeEntry) {
      const runtimeResult = await validatePackageExtensionEntry({
        packageDir: params.packageDir,
        entry: runtimeEntry,
        label: "runtime extension entry",
        requireExisting: true
      });
      if (!runtimeResult.ok) return runtimeResult;
      continue;
    }
    let foundBuiltEntry = false;
    const builtEntryCandidates = (0, _packageEntrypointsD_bjPUwf.n)(entry);
    for (const builtEntry of builtEntryCandidates) {
      const builtResult = await validatePackageExtensionEntry({
        packageDir: params.packageDir,
        entry: builtEntry,
        label: "inferred runtime extension entry",
        requireExisting: false
      });
      if (!builtResult.ok) return builtResult;
      if (builtResult.exists) {
        foundBuiltEntry = true;
        break;
      }
    }
    if (foundBuiltEntry) continue;
    if (sourceEntry.exists && (0, _packageEntrypointsD_bjPUwf.t)(entry)) return {
      ok: false,
      error: missingCompiledRuntimeEntryMessage({
        label: "package install",
        entry,
        candidates: builtEntryCandidates
      })
    };
    if (sourceEntry.exists) continue;
    if (builtEntryCandidates.length > 0) return {
      ok: false,
      error: missingCompiledRuntimeEntryMessage({
        label: "package install",
        entry,
        candidates: builtEntryCandidates
      })
    };
    return {
      ok: false,
      error: `extension entry not found: ${entry}`
    };
  }
  const packageManifest = (0, _manifestCkPySoxh.r)(params.manifest);
  const setupEntry = (0, _stringCoerceLndEvhRk.c)(packageManifest?.setupEntry);
  const runtimeSetupEntry = (0, _stringCoerceLndEvhRk.c)(packageManifest?.runtimeSetupEntry);
  if (runtimeSetupEntry && !setupEntry) return {
    ok: false,
    error: "package.json openclaw.runtimeSetupEntry requires openclaw.setupEntry"
  };
  if (setupEntry) {
    const sourceEntry = await validatePackageExtensionEntry({
      packageDir: params.packageDir,
      entry: setupEntry,
      label: "setup entry",
      requireExisting: false
    });
    if (!sourceEntry.ok) return sourceEntry;
    if (runtimeSetupEntry) {
      const runtimeResult = await validatePackageExtensionEntry({
        packageDir: params.packageDir,
        entry: runtimeSetupEntry,
        label: "runtime setup entry",
        requireExisting: true
      });
      if (!runtimeResult.ok) return runtimeResult;
      return { ok: true };
    }
    let foundBuiltSetupEntry = false;
    const builtSetupCandidates = (0, _packageEntrypointsD_bjPUwf.n)(setupEntry);
    for (const builtEntry of builtSetupCandidates) {
      const builtResult = await validatePackageExtensionEntry({
        packageDir: params.packageDir,
        entry: builtEntry,
        label: "inferred runtime setup entry",
        requireExisting: false
      });
      if (!builtResult.ok) return builtResult;
      if (builtResult.exists) {
        foundBuiltSetupEntry = true;
        break;
      }
    }
    if (foundBuiltSetupEntry) return { ok: true };
    if (sourceEntry.exists && (0, _packageEntrypointsD_bjPUwf.t)(setupEntry)) return {
      ok: false,
      error: missingCompiledRuntimeEntryMessage({
        label: "package install",
        entry: setupEntry,
        candidates: builtSetupCandidates
      })
    };
    if (sourceEntry.exists) return { ok: true };
    if (builtSetupCandidates.length > 0) return {
      ok: false,
      error: missingCompiledRuntimeEntryMessage({
        label: "package install",
        entry: setupEntry,
        candidates: builtSetupCandidates
      })
    };
    return {
      ok: false,
      error: `setup entry not found: ${setupEntry}`
    };
  }
  return { ok: true };
}
function resolvePackageEntrySource(params) {
  const source = _nodePath.default.resolve(params.packageDir, params.entryPath);
  const rejectHardlinks = params.rejectHardlinks ?? true;
  const candidates = [source];
  const openCandidate = (absolutePath) => {
    const opened = (0, _rootFileCqMcFM3J.i)({
      absolutePath,
      rootPath: params.packageDir,
      ...(params.packageRootRealPath !== void 0 ? { rootRealPath: params.packageRootRealPath } : {}),
      boundaryLabel: "plugin package directory",
      rejectHardlinks
    });
    if (!opened.ok) return (0, _rootFileCqMcFM3J.n)(opened, {
      path: () => null,
      io: () => {
        params.diagnostics.push({
          level: "warn",
          ...(params.pluginIdHint ? { pluginId: params.pluginIdHint } : {}),
          message: `extension entry unreadable (I/O error): ${params.entryPath}`,
          source: params.sourceLabel
        });
        return null;
      },
      fallback: () => {
        params.diagnostics.push({
          level: "error",
          ...(params.pluginIdHint ? { pluginId: params.pluginIdHint } : {}),
          message: `extension entry escapes package directory: ${params.entryPath}`,
          source: params.sourceLabel
        });
        return null;
      }
    });
    const safeSource = opened.path;
    _nodeFs.default.closeSync(opened.fd);
    return safeSource;
  };
  if (!rejectHardlinks) {
    const builtCandidate = source.replace(/\.[^.]+$/u, ".js");
    if (builtCandidate !== source) candidates.push(builtCandidate);
  }
  for (const candidate of new Set(candidates)) {
    if (!_nodeFs.default.existsSync(candidate)) continue;
    return openCandidate(candidate);
  }
  return openCandidate(source);
}
function shouldInferBuiltRuntimeEntry(origin) {
  return origin === "config" || origin === "global";
}
function shouldRequireBuiltRuntimeEntry(origin) {
  return origin === "global";
}
function resolveSafePackageEntry(params) {
  const absolutePath = _nodePath.default.resolve(params.packageDir, params.entryPath);
  if (_nodeFs.default.existsSync(absolutePath)) {
    const existingSource = resolvePackageEntrySource({
      packageDir: params.packageDir,
      ...(params.packageRootRealPath !== void 0 ? { packageRootRealPath: params.packageRootRealPath } : {}),
      entryPath: params.entryPath,
      pluginIdHint: params.pluginIdHint,
      sourceLabel: params.sourceLabel,
      diagnostics: params.diagnostics,
      rejectHardlinks: params.rejectHardlinks
    });
    if (!existingSource) return null;
    return {
      relativePath: _nodePath.default.relative(params.packageDir, absolutePath).replace(/\\/g, "/"),
      existingSource
    };
  }
  try {
    (0, _rootPathDTHDXh_.i)({
      absolutePath,
      rootPath: params.packageDir,
      ...(params.packageRootRealPath !== void 0 ? { rootCanonicalPath: params.packageRootRealPath } : {}),
      boundaryLabel: "plugin package directory"
    });
  } catch {
    params.diagnostics.push({
      level: "error",
      ...(params.pluginIdHint ? { pluginId: params.pluginIdHint } : {}),
      message: `extension entry escapes package directory: ${params.entryPath}`,
      source: params.sourceLabel
    });
    return null;
  }
  return { relativePath: _nodePath.default.relative(params.packageDir, absolutePath).replace(/\\/g, "/") };
}
function resolveOptionalExistingPackageEntrySource(params) {
  const source = _nodePath.default.resolve(params.packageDir, params.entryPath);
  if (!_nodeFs.default.existsSync(source)) return { status: "missing" };
  const resolved = resolvePackageEntrySource(params);
  return resolved ? {
    status: "resolved",
    source: resolved
  } : { status: "invalid" };
}
function resolvePackageRuntimeEntrySource(params) {
  const safeEntry = resolveSafePackageEntry({
    packageDir: params.packageDir,
    ...(params.packageRootRealPath !== void 0 ? { packageRootRealPath: params.packageRootRealPath } : {}),
    entryPath: params.entryPath,
    pluginIdHint: params.pluginIdHint,
    sourceLabel: params.sourceLabel,
    diagnostics: params.diagnostics,
    rejectHardlinks: params.rejectHardlinks
  });
  if (!safeEntry) return null;
  if (params.runtimeEntryPath) {
    const runtimeSource = resolvePackageEntrySource({
      packageDir: params.packageDir,
      ...(params.packageRootRealPath !== void 0 ? { packageRootRealPath: params.packageRootRealPath } : {}),
      entryPath: params.runtimeEntryPath,
      pluginIdHint: params.pluginIdHint,
      sourceLabel: params.sourceLabel,
      diagnostics: params.diagnostics,
      rejectHardlinks: params.rejectHardlinks
    });
    if (runtimeSource) return runtimeSource;
    params.diagnostics.push({
      level: "error",
      ...(params.pluginIdHint ? { pluginId: params.pluginIdHint } : {}),
      message: `${params.runtimeEntryLabel ?? "runtime entry"} not found: ${params.runtimeEntryPath}`,
      source: params.sourceLabel
    });
    return null;
  }
  if (shouldInferBuiltRuntimeEntry(params.origin)) {
    const builtEntryCandidates = (0, _packageEntrypointsD_bjPUwf.n)(safeEntry.relativePath);
    for (const candidate of builtEntryCandidates) {
      const runtimeSource = resolveOptionalExistingPackageEntrySource({
        packageDir: params.packageDir,
        ...(params.packageRootRealPath !== void 0 ? { packageRootRealPath: params.packageRootRealPath } : {}),
        entryPath: candidate,
        pluginIdHint: params.pluginIdHint,
        sourceLabel: params.sourceLabel,
        diagnostics: params.diagnostics,
        rejectHardlinks: params.rejectHardlinks
      });
      if (runtimeSource.status === "resolved") return runtimeSource.source;
      if (runtimeSource.status === "invalid") return null;
    }
    if ((params.requireBuiltRuntimeEntry ?? shouldRequireBuiltRuntimeEntry(params.origin)) && (0, _packageEntrypointsD_bjPUwf.t)(safeEntry.relativePath)) {
      params.diagnostics.push({
        level: "warn",
        ...(params.pluginIdHint ? { pluginId: params.pluginIdHint } : {}),
        message: missingCompiledRuntimeEntryMessage({
          label: "installed plugin package",
          entry: safeEntry.relativePath,
          candidates: builtEntryCandidates
        }),
        source: params.sourceLabel
      });
      return null;
    }
  }
  if (safeEntry.existingSource) return safeEntry.existingSource;
  if (params.rejectHardlinks === false) {
    const trustedFallbackSource = resolvePackageEntrySource({
      packageDir: params.packageDir,
      ...(params.packageRootRealPath !== void 0 ? { packageRootRealPath: params.packageRootRealPath } : {}),
      entryPath: params.entryPath,
      pluginIdHint: params.pluginIdHint,
      sourceLabel: params.sourceLabel,
      diagnostics: params.diagnostics,
      rejectHardlinks: params.rejectHardlinks
    });
    if (trustedFallbackSource) return trustedFallbackSource;
  }
  params.diagnostics.push({
    level: "error",
    ...(params.pluginIdHint ? { pluginId: params.pluginIdHint } : {}),
    message: `${params.sourceEntryLabel ?? "extension entry"} not found: ${safeEntry.relativePath}`,
    source: params.sourceLabel
  });
  return null;
}
function resolvePackageSetupSource(params) {
  const packageManifest = (0, _manifestCkPySoxh.r)(params.manifest ?? void 0);
  const setupEntryPath = (0, _stringCoerceLndEvhRk.c)(packageManifest?.setupEntry);
  if (!setupEntryPath) return null;
  return resolvePackageRuntimeEntrySource({
    packageDir: params.packageDir,
    ...(params.packageRootRealPath !== void 0 ? { packageRootRealPath: params.packageRootRealPath } : {}),
    entryPath: setupEntryPath,
    sourceEntryLabel: "setup entry",
    runtimeEntryPath: (0, _stringCoerceLndEvhRk.c)(packageManifest?.runtimeSetupEntry),
    runtimeEntryLabel: "runtime setup entry",
    pluginIdHint: packageManifest?.plugin?.id ?? packageManifest?.channel?.id,
    origin: params.origin,
    ...(params.requireBuiltRuntimeEntry !== void 0 ? { requireBuiltRuntimeEntry: params.requireBuiltRuntimeEntry } : {}),
    sourceLabel: params.sourceLabel,
    diagnostics: params.diagnostics,
    rejectHardlinks: params.rejectHardlinks
  });
}
function resolvePackageRuntimeExtensionSources(params) {
  const runtimeResolution = resolvePackageRuntimeExtensionEntries({
    manifest: params.manifest,
    extensions: params.extensions
  });
  if (!runtimeResolution.ok) {
    params.diagnostics.push({
      level: "error",
      ...(params.pluginIdHint ? { pluginId: params.pluginIdHint } : {}),
      message: runtimeResolution.error,
      source: params.sourceLabel
    });
    return [];
  }
  return params.extensions.flatMap((entryPath, index) => {
    const source = resolvePackageRuntimeEntrySource({
      packageDir: params.packageDir,
      ...(params.packageRootRealPath !== void 0 ? { packageRootRealPath: params.packageRootRealPath } : {}),
      entryPath,
      sourceEntryLabel: "extension entry",
      runtimeEntryPath: runtimeResolution.runtimeExtensions[index],
      runtimeEntryLabel: "runtime extension entry",
      pluginIdHint: params.pluginIdHint,
      origin: params.origin,
      ...(params.requireBuiltRuntimeEntry !== void 0 ? { requireBuiltRuntimeEntry: params.requireBuiltRuntimeEntry } : {}),
      sourceLabel: params.sourceLabel,
      diagnostics: params.diagnostics,
      rejectHardlinks: params.rejectHardlinks
    });
    return source ? [source] : [];
  });
}
//#endregion /* v9-7fa7208ecbd23329 */
