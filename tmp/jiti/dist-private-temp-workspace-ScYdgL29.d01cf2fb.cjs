"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.i = withTempWorkspaceSync;exports.n = tempWorkspaceSync;exports.r = withTempWorkspace;exports.t = tempWorkspace;require("./fs-safe-defaults-azXCfv92.js");
var _writeQueueBKRKUV0w = require("./write-queue-BKRKUV0w.js");
var _rootFileCqMcFM3J = require("./root-file-CqMcFM3J.js");
var _fileStoreIjIAbY2X = require("./file-store-ijIAbY2X.js");
var _nodeFs = _interopRequireDefault(require("node:fs"));
var _nodePath = _interopRequireDefault(require("node:path"));
var _promises = _interopRequireDefault(require("node:fs/promises"));
var _nodeCrypto = require("node:crypto");function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}
//#region node_modules/@openclaw/fs-safe/dist/private-temp-workspace.js
function sanitizeTempPrefix(prefix) {
  const sanitized = prefix.trim().replace(/[^a-zA-Z0-9._-]/g, "-");
  if (!sanitized || sanitized === "." || sanitized === "..") return "fs-safe-";
  return sanitized.endsWith("-") ? sanitized : `${sanitized}-`;
}
function resolveWorkspaceLeaf(dir, fileName) {
  return _nodePath.default.join(dir, assertWorkspaceFileName(fileName));
}
function assertWorkspaceFileName(fileName) {
  const value = fileName.trim();
  if (!value || value === "." || value === ".." || value.includes("\0") || value.includes("/") || value.includes("\\") || _nodePath.default.basename(value) !== value) throw new Error(`Invalid temp workspace file name: ${JSON.stringify(fileName)}`);
  return value;
}
async function ensurePrivateDirectory(dir, mode) {
  await _promises.default.mkdir(dir, {
    recursive: true,
    mode
  });
  if (!(await _promises.default.stat(dir)).isDirectory()) throw new Error(`Temp root must be a directory: ${dir}`);
  await _promises.default.chmod(dir, mode).catch(() => void 0);
}
function ensurePrivateDirectorySync(dir, mode) {
  _nodeFs.default.mkdirSync(dir, {
    recursive: true,
    mode
  });
  if (!_nodeFs.default.statSync(dir).isDirectory()) throw new Error(`Temp root must be a directory: ${dir}`);
  try {
    _nodeFs.default.chmodSync(dir, mode);
  } catch {}
}
async function createTempWorkspace(options) {
  const dirMode = options.dirMode ?? 448;
  const mode = options.mode ?? 384;
  const requestedRoot = _nodePath.default.resolve(options.rootDir);
  const root = await _promises.default.realpath(requestedRoot).catch(() => requestedRoot);
  await ensurePrivateDirectory(root, dirMode);
  const dir = await _promises.default.mkdtemp(_nodePath.default.join(root, sanitizeTempPrefix(options.prefix)));
  const unregisterTempDir = (0, _writeQueueBKRKUV0w.n)(dir, { recursive: true });
  await _promises.default.chmod(dir, dirMode).catch(() => void 0);
  const stat = await _promises.default.lstat(dir);
  if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error(`Temp workspace must be a directory: ${dir}`);
  const store = (0, _fileStoreIjIAbY2X.t)({
    rootDir: dir,
    private: true,
    dirMode,
    mode
  });
  return {
    dir,
    store,
    path: (fileName) => resolveWorkspaceLeaf(dir, fileName),
    write: async (fileName, data) => await store.write(assertWorkspaceFileName(fileName), data, { mode }),
    writeText: async (fileName, data) => await store.writeText(assertWorkspaceFileName(fileName), data, { mode }),
    writeJson: async (fileName, data, writeOptions) => await store.writeJson(assertWorkspaceFileName(fileName), data, {
      mode,
      trailingNewline: writeOptions?.trailingNewline
    }),
    copyIn: async (fileName, sourcePath) => await store.copyIn(assertWorkspaceFileName(fileName), sourcePath, { mode }),
    read: async (fileName) => await store.readBytes(assertWorkspaceFileName(fileName)),
    cleanup: async () => {
      try {
        await _promises.default.rm(dir, {
          recursive: true,
          force: true
        }).catch(() => void 0);
      } finally {
        unregisterTempDir();
      }
    },
    [Symbol.asyncDispose]: async () => {
      try {
        await _promises.default.rm(dir, {
          recursive: true,
          force: true
        }).catch(() => void 0);
      } finally {
        unregisterTempDir();
      }
    }
  };
}
async function tempWorkspace(options) {
  return await createTempWorkspace(options);
}
async function withTempWorkspace(options, run) {
  const workspace = await createTempWorkspace({
    ...options,
    prefix: `${sanitizeTempPrefix(options.prefix)}${(0, _nodeCrypto.randomUUID)()}-`
  });
  try {
    return await run(workspace);
  } finally {
    await workspace.cleanup();
  }
}
function tempWorkspaceSync(options) {
  const dirMode = options.dirMode ?? 448;
  const mode = options.mode ?? 384;
  const requestedRoot = _nodePath.default.resolve(options.rootDir);
  let root = requestedRoot;
  try {
    root = _nodeFs.default.realpathSync.native(requestedRoot);
  } catch {
    root = requestedRoot;
  }
  ensurePrivateDirectorySync(root, dirMode);
  const dir = _nodeFs.default.mkdtempSync(_nodePath.default.join(root, sanitizeTempPrefix(options.prefix)));
  const unregisterTempDir = (0, _writeQueueBKRKUV0w.n)(dir, { recursive: true });
  try {
    _nodeFs.default.chmodSync(dir, dirMode);
  } catch {}
  const stat = _nodeFs.default.lstatSync(dir);
  if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error(`Temp workspace must be a directory: ${dir}`);
  const store = (0, _fileStoreIjIAbY2X.n)({
    rootDir: dir,
    private: true,
    dirMode,
    mode
  });
  return {
    dir,
    store,
    path: (fileName) => resolveWorkspaceLeaf(dir, fileName),
    write: (fileName, data) => store.write(assertWorkspaceFileName(fileName), data, { mode }),
    writeText: (fileName, data) => store.writeText(assertWorkspaceFileName(fileName), data, { mode }),
    writeJson: (fileName, data, writeOptions) => store.writeJson(assertWorkspaceFileName(fileName), data, {
      mode,
      trailingNewline: writeOptions?.trailingNewline
    }),
    read: (fileName) => {
      const opened = (0, _rootFileCqMcFM3J.i)({
        absolutePath: store.path(assertWorkspaceFileName(fileName)),
        rootPath: dir,
        boundaryLabel: "temp workspace",
        rejectHardlinks: true
      });
      if (!opened.ok) throw Object.assign(/* @__PURE__ */new Error(`File not found: ${fileName}`), { code: "ENOENT" });
      try {
        return _nodeFs.default.readFileSync(opened.fd);
      } finally {
        _nodeFs.default.closeSync(opened.fd);
      }
    },
    cleanup: () => {
      try {
        _nodeFs.default.rmSync(dir, {
          recursive: true,
          force: true
        });
      } catch {} finally {
        unregisterTempDir();
      }
    },
    [Symbol.dispose]: () => {
      try {
        _nodeFs.default.rmSync(dir, {
          recursive: true,
          force: true
        });
      } catch {} finally {
        unregisterTempDir();
      }
    }
  };
}
function withTempWorkspaceSync(options, run) {
  const workspace = tempWorkspaceSync({
    ...options,
    prefix: `${sanitizeTempPrefix(options.prefix)}${(0, _nodeCrypto.randomUUID)()}-`
  });
  try {
    return run(workspace);
  } finally {
    workspace.cleanup();
  }
}
//#endregion /* v9-6fa919a132b3e475 */
