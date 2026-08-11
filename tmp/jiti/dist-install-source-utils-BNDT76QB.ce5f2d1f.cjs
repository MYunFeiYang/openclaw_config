"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = resolveNpmPackArchiveMetadata;exports.i = resolveArchiveSourcePath;exports.n = createNpmMetadataEnv;exports.o = resolveNpmSpecMetadata;exports.r = packNpmSpecToArchive;exports.s = withTempDir;exports.t = buildNpmResolutionFields;var _fsSafeDpJlqO1z = require("./fs-safe-DpJlqO1z.js");
var _utilsCKsuXgDI = require("./utils-CKsuXgDI.js");
var _execCjEB16Q = require("./exec-Cj-EB16Q.js");
var _archiveBIRRxQjC = require("./archive-BIRRxQjC.js");
require("./archive-CBTii-y1.js");
var _npmInstallEnvDLHFd1ZY = require("./npm-install-env-DLHFd1ZY.js");
var _privateTempWorkspaceScYdgL = require("./private-temp-workspace-ScYdgL29.js");
var _nodePath = _interopRequireDefault(require("node:path"));
var _promises = _interopRequireDefault(require("node:fs/promises"));
var _nodeOs = _interopRequireDefault(require("node:os"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}
//#region src/infra/install-source-utils.ts
function buildNpmResolutionFields(resolution) {
  return {
    resolvedName: resolution?.name,
    resolvedVersion: resolution?.version,
    resolvedSpec: resolution?.resolvedSpec,
    integrity: resolution?.integrity,
    shasum: resolution?.shasum,
    resolvedAt: resolution?.resolvedAt
  };
}
function createNpmMetadataEnv(scope = {}) {
  const env = {
    COREPACK_ENABLE_DOWNLOAD_PROMPT: "0",
    NPM_CONFIG_IGNORE_SCRIPTS: "true"
  };
  (0, _npmInstallEnvDLHFd1ZY.t)(env, /* @__PURE__ */new Date(), scope);
  return env;
}
function normalizeNpmViewMetadata(value) {
  if (!value || typeof value !== "object") return null;
  const rec = value;
  const name = toOptionalString(rec.name);
  const version = toOptionalString(rec.version);
  const resolvedSpec = name && version ? `${name}@${version}` : void 0;
  const dist = rec.dist && typeof rec.dist === "object" ? rec.dist : {};
  return {
    name,
    version,
    resolvedSpec,
    integrity: toOptionalString(rec["dist.integrity"]) ?? toOptionalString(dist.integrity),
    shasum: toOptionalString(rec["dist.shasum"]) ?? toOptionalString(dist.shasum)
  };
}
async function resolveNpmSpecMetadata(params) {
  const res = await (0, _execCjEB16Q.r)([
  "npm",
  "view",
  params.spec,
  "name",
  "version",
  "dist.integrity",
  "dist.shasum",
  "--json"],
  {
    timeoutMs: Math.max(params.timeoutMs ?? 6e4, 6e4),
    env: createNpmMetadataEnv()
  });
  if (res.code !== 0) {
    const raw = res.stderr.trim() || res.stdout.trim();
    if (/E404|is not in this registry/i.test(raw)) return {
      ok: false,
      error: `Package not found on npm: ${params.spec}. See https://docs.openclaw.ai/tools/plugin for installable plugins.`
    };
    return {
      ok: false,
      error: `npm view failed: ${raw}`
    };
  }
  try {
    const metadata = normalizeNpmViewMetadata(JSON.parse(res.stdout.trim()));
    if (!metadata?.name || !metadata.version) return {
      ok: false,
      error: "npm view produced incomplete package metadata"
    };
    return {
      ok: true,
      metadata
    };
  } catch (err) {
    return {
      ok: false,
      error: `npm view produced invalid JSON: ${String(err)}`
    };
  }
}
async function withTempDir(prefix, fn) {
  return await (0, _privateTempWorkspaceScYdgL.r)({
    rootDir: _nodeOs.default.tmpdir(),
    prefix
  }, async (tmp) => fn(tmp.dir));
}
async function resolveArchiveSourcePath(archivePath) {
  const resolved = (0, _utilsCKsuXgDI.p)(archivePath);
  if (!(await (0, _fsSafeDpJlqO1z.T)(resolved))) return {
    ok: false,
    error: `archive not found: ${resolved}`
  };
  if (!(0, _archiveBIRRxQjC.s)(resolved)) return {
    ok: false,
    error: `unsupported archive: ${resolved}`
  };
  return {
    ok: true,
    path: resolved
  };
}
function toOptionalString(value) {
  if (typeof value !== "string") return;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : void 0;
}
function parseResolvedSpecFromId(id) {
  const at = id.lastIndexOf("@");
  if (at <= 0 || at >= id.length - 1) return;
  const name = id.slice(0, at).trim();
  const version = id.slice(at + 1).trim();
  if (!name || !version) return;
  return `${name}@${version}`;
}
function normalizeNpmPackEntry(entry) {
  if (!entry || typeof entry !== "object") return null;
  const rec = entry;
  const name = toOptionalString(rec.name);
  const version = toOptionalString(rec.version);
  const id = toOptionalString(rec.id);
  const resolvedSpec = (name && version ? `${name}@${version}` : void 0) ?? (id ? parseResolvedSpecFromId(id) : void 0);
  return {
    filename: toOptionalString(rec.filename),
    metadata: {
      name,
      version,
      resolvedSpec,
      integrity: toOptionalString(rec.integrity),
      shasum: toOptionalString(rec.shasum)
    }
  };
}
function parseNpmPackJsonOutput(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const candidates = [trimmed];
  const arrayStart = trimmed.indexOf("[");
  if (arrayStart > 0) candidates.push(trimmed.slice(arrayStart));
  for (const candidate of candidates) {
    let parsed;
    try {
      parsed = JSON.parse(candidate);
    } catch {
      continue;
    }
    const entries = Array.isArray(parsed) ? parsed : [parsed];
    let fallback = null;
    for (let i = entries.length - 1; i >= 0; i -= 1) {
      const normalized = normalizeNpmPackEntry(entries[i]);
      if (!normalized) continue;
      if (!fallback) fallback = normalized;
      if (normalized.filename) return normalized;
    }
    if (fallback) return fallback;
  }
  return null;
}
function parsePackedArchiveFromStdout(stdout) {
  const lines = stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const match = lines[index]?.match(/([^\s"']+\.tgz)/);
    if (match?.[1]) return match[1];
  }
}
async function findPackedArchiveInDir(cwd) {
  const archives = (await _promises.default.readdir(cwd, { withFileTypes: true }).catch(() => [])).filter((entry) => entry.isFile() && entry.name.endsWith(".tgz"));
  if (archives.length === 0) return;
  if (archives.length === 1) return archives[0]?.name;
  const sortedByMtime = await Promise.all(archives.map(async (entry) => ({
    name: entry.name,
    mtimeMs: (await _promises.default.stat(_nodePath.default.join(cwd, entry.name))).mtimeMs
  })));
  sortedByMtime.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return sortedByMtime[0]?.name;
}
async function packNpmSpecToArchive(params) {
  const res = await (0, _execCjEB16Q.r)([
  "npm",
  "pack",
  params.spec,
  "--ignore-scripts",
  "--json"],
  {
    timeoutMs: Math.max(params.timeoutMs, 3e5),
    cwd: params.cwd,
    env: createNpmMetadataEnv({ npmConfigCwd: params.cwd })
  });
  if (res.code !== 0) {
    const raw = res.stderr.trim() || res.stdout.trim();
    if (/E404|is not in this registry/i.test(raw)) return {
      ok: false,
      error: `Package not found on npm: ${params.spec}. See https://docs.openclaw.ai/tools/plugin for installable plugins.`
    };
    return {
      ok: false,
      error: `npm pack failed: ${raw}`
    };
  }
  const parsedJson = parseNpmPackJsonOutput(res.stdout || "");
  let packed = parsedJson?.filename ?? parsePackedArchiveFromStdout(res.stdout || "");
  if (!packed) packed = await findPackedArchiveInDir(params.cwd);
  if (!packed) return {
    ok: false,
    error: "npm pack produced no archive"
  };
  let archivePath = _nodePath.default.isAbsolute(packed) ? packed : _nodePath.default.join(params.cwd, packed);
  if (!(await (0, _fsSafeDpJlqO1z.T)(archivePath))) {
    const fallbackPacked = await findPackedArchiveInDir(params.cwd);
    if (!fallbackPacked) return {
      ok: false,
      error: "npm pack produced no archive"
    };
    archivePath = _nodePath.default.join(params.cwd, fallbackPacked);
  }
  return {
    ok: true,
    archivePath,
    metadata: parsedJson?.metadata ?? {}
  };
}
async function resolveNpmPackArchiveMetadata(params) {
  const archivePathResult = await resolveArchiveSourcePath(params.archivePath);
  if (!archivePathResult.ok) return archivePathResult;
  const archivePath = archivePathResult.path;
  const res = await (0, _execCjEB16Q.r)([
  "npm",
  "pack",
  archivePath,
  "--ignore-scripts",
  "--dry-run",
  "--json"],
  {
    timeoutMs: Math.max(params.timeoutMs ?? 6e4, 6e4),
    env: createNpmMetadataEnv()
  });
  if (res.code !== 0) return {
    ok: false,
    error: `npm pack metadata read failed: ${res.stderr.trim() || res.stdout.trim()}`
  };
  const parsedJson = parseNpmPackJsonOutput(res.stdout || "");
  if (!parsedJson?.metadata.name || !parsedJson.metadata.version) return {
    ok: false,
    error: "npm pack metadata read produced incomplete package metadata"
  };
  return {
    ok: true,
    archivePath,
    tarballName: parsedJson.filename ?? _nodePath.default.basename(archivePath),
    metadata: parsedJson.metadata
  };
}
//#endregion /* v9-6c1ccca586034d80 */
