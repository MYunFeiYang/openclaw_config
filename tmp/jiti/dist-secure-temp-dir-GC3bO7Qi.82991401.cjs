"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = resolveOpenedFileRealPathForHandle;exports.c = void 0;exports.d = resolveHomeRelativePath;exports.f = resolveUserPath;exports.i = readLocalFileSafely;exports.l = assertNoPathAliasEscape;exports.n = void 0;exports.o = root;exports.r = openLocalFileSafely;exports.s = getFsSafeTestHooks;exports.t = resolveSecureTempRoot;exports.u = expandHomePrefix;var _fsSafeDefaultsAzXCfv = require("./fs-safe-defaults-azXCfv92.js");
var _pathB5B_oAT = require("./path-B5B-_oAT.js");
var _fileIdentityPAmF0zvV = require("./file-identity-PAmF0zvV.js");
var _stringCoerceCx5273Cj = require("./string-coerce-Cx5273Cj.js");
var _writeQueueBKRKUV0w = require("./write-queue-BKRKUV0w.js");
var _rootPathDTHDXh_ = require("./root-path-DTHDXh_7.js");
var _nodeFs = _interopRequireWildcard(require("node:fs"));
var _nodePath = _interopRequireDefault(require("node:path"));
var _promises = _interopRequireDefault(require("node:fs/promises"));
var _nodeOs = _interopRequireWildcard(require("node:os"));
var _nodeChild_process = require("node:child_process");
var _nodeCrypto = require("node:crypto");
var _promises2 = require("node:stream/promises");
var _nodeStream = require("node:stream");function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}function _interopRequireWildcard(e, t) {if ("function" == typeof WeakMap) var r = new WeakMap(),n = new WeakMap();return (_interopRequireWildcard = function (e, t) {if (!t && e && e.__esModule) return e;var o,i,f = { __proto__: null, default: e };if (null === e || "object" != typeof e && "function" != typeof e) return f;if (o = t ? n : r) {if (o.has(e)) return o.get(e);o.set(e, f);}for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]);return f;})(e, t);}
//#region node_modules/@openclaw/fs-safe/dist/home-dir.js
function normalize(value) {
  const trimmed = (0, _stringCoerceCx5273Cj.n)(value);
  if (!trimmed) return;
  if (trimmed === "undefined" || trimmed === "null") return;
  return trimmed;
}
function resolveEffectiveHomeDir(env = process.env, homedir = _nodeOs.default.homedir) {
  const raw = resolveRawHomeDir(env, homedir);
  return raw ? _nodePath.default.resolve(raw) : void 0;
}
function resolveRawHomeDir(env, homedir) {
  const explicitHome = normalize(env.OPENCLAW_HOME);
  if (!explicitHome) return resolveRawOsHomeDir(env, homedir);
  if (_nodePath.default.normalize(explicitHome).split(_nodePath.default.sep)[0] !== "~") return explicitHome;
  const fallbackHome = resolveRawOsHomeDir(env, homedir);
  if (!fallbackHome) return;
  return expandHomePrefix(explicitHome, { home: fallbackHome });
}
function resolveRawOsHomeDir(env, homedir) {
  const envHome = normalize(env.HOME);
  if (envHome) return envHome;
  const userProfile = normalize(env.USERPROFILE);
  if (userProfile) return userProfile;
  return normalizeSafe(homedir);
}
function normalizeSafe(homedir) {
  try {
    return normalize(homedir());
  } catch {
    return;
  }
}
function resolveRequiredHomeDir(env = process.env, homedir = _nodeOs.default.homedir) {
  return resolveEffectiveHomeDir(env, homedir) ?? _nodePath.default.resolve(process.cwd());
}
function expandHomePrefix(input, opts) {
  const segments = _nodePath.default.normalize(input).split(_nodePath.default.sep);
  if (segments[0] !== "~") return input;
  const home = normalize(opts?.home) ?? resolveEffectiveHomeDir(opts?.env ?? process.env, opts?.homedir ?? _nodeOs.default.homedir);
  if (!home) return input;
  return _nodePath.default.join(home, ...segments.slice(1));
}
function resolveHomeRelativePath(input, opts) {
  if (!input) return input;
  if (_nodePath.default.normalize(input).split(_nodePath.default.sep)[0] !== "~") return _nodePath.default.resolve(input);
  const expanded = expandHomePrefix(input, {
    home: resolveRequiredHomeDir(opts?.env ?? process.env, opts?.homedir ?? _nodeOs.default.homedir),
    env: opts?.env,
    homedir: opts?.homedir
  });
  return _nodePath.default.resolve(expanded);
}
function resolveUserPath(input, optsOrEnv, homedir) {
  return resolveHomeRelativePath(input, optsOrEnv && ("env" in optsOrEnv || "homedir" in optsOrEnv) ? optsOrEnv : {
    env: optsOrEnv,
    homedir
  });
}
//#endregion
//#region node_modules/@openclaw/fs-safe/dist/bounded-read-stream.js
function createMaxBytesTransform$1(maxBytes) {
  let bytes = 0;
  return new _nodeStream.Transform({ transform(chunk, _encoding, callback) {
      const buffer = chunk instanceof Buffer ? chunk : Buffer.from(chunk);
      bytes += buffer.byteLength;
      if (bytes > maxBytes) {
        callback(new _pathB5B_oAT.p("too-large", `file exceeds limit of ${maxBytes} bytes (got at least ${bytes})`));
        return;
      }
      callback(null, buffer);
    } });
}
function createBoundedReadStream(opened, maxBytes) {
  const stream = opened.handle.createReadStream();
  return maxBytes === void 0 ? stream : stream.pipe(createMaxBytesTransform$1(maxBytes));
}
//#endregion
//#region node_modules/@openclaw/fs-safe/dist/guarded-mkdir.js
function isSameOrChildPath(candidate, parent) {
  return candidate === parent || candidate.startsWith(`${parent}${_nodePath.default.sep}`);
}
function isPathEscape(relativePath) {
  return relativePath === ".." || relativePath.startsWith(`..${_nodePath.default.sep}`) || _nodePath.default.isAbsolute(relativePath);
}
async function mkdirPathComponentsWithGuards(params) {
  const root = _nodePath.default.resolve(params.rootReal);
  const target = _nodePath.default.resolve(params.targetPath);
  const relative = _nodePath.default.relative(root, target);
  if (isPathEscape(relative)) throw new _pathB5B_oAT.p("outside-workspace", "directory is outside workspace root");
  let current = root;
  for (const part of relative.split(_nodePath.default.sep).filter(Boolean)) {
    const next = _nodePath.default.join(current, part);
    const parentGuard = await (0, _writeQueueBKRKUV0w.u)(current);
    await params.beforeComponent?.(next);
    await (0, _writeQueueBKRKUV0w.c)(parentGuard);
    try {
      await _promises.default.mkdir(next);
    } catch (error) {
      if (!error || typeof error !== "object" || !("code" in error) || error.code !== "EEXIST") throw error;
    }
    const stat = await _promises.default.lstat(next);
    if (stat.isSymbolicLink() || !stat.isDirectory()) throw new _pathB5B_oAT.p("not-file", "directory component must be a directory");
    if (!isSameOrChildPath(_nodePath.default.resolve(await _promises.default.realpath(next)), root)) throw new _pathB5B_oAT.p("outside-workspace", "directory escaped workspace root");
    await (0, _writeQueueBKRKUV0w.u)(next);
    await (0, _writeQueueBKRKUV0w.c)(parentGuard);
    current = next;
  }
}
//#endregion
//#region node_modules/@openclaw/fs-safe/dist/pinned-python.js
const PINNED_PYTHON_WORKER_SOURCE = String.raw`
import base64
import errno
import json
import os
import secrets
import stat
import sys

DIR_FLAGS = os.O_RDONLY
if hasattr(os, "O_DIRECTORY"):
    DIR_FLAGS |= os.O_DIRECTORY
if hasattr(os, "O_NOFOLLOW"):
    DIR_FLAGS |= os.O_NOFOLLOW
READ_FLAGS = os.O_RDONLY
if hasattr(os, "O_NOFOLLOW"):
    READ_FLAGS |= os.O_NOFOLLOW
WRITE_FLAGS = os.O_WRONLY | os.O_CREAT | os.O_EXCL
if hasattr(os, "O_NOFOLLOW"):
    WRITE_FLAGS |= os.O_NOFOLLOW

def split_relative(value):
    if value in ("", "."):
        return []
    if "\x00" in value or value.startswith("/") or value.startswith("//"):
        raise OSError(errno.EPERM, "invalid relative path")
    if value.startswith("..\\"):
        raise OSError(errno.EPERM, "path traversal is not allowed")
    parts = [part for part in value.split("/") if part and part != "."]
    for part in parts:
        if part == "..":
            raise OSError(errno.EPERM, "path traversal is not allowed")
    return parts

def open_dir(path_value, dir_fd=None):
    return os.open(path_value, DIR_FLAGS, dir_fd=dir_fd)

def walk_dir(root_fd, segments, mkdir_enabled=False):
    current_fd = os.dup(root_fd)
    try:
        for segment in segments:
            try:
                next_fd = open_dir(segment, dir_fd=current_fd)
            except FileNotFoundError:
                if not mkdir_enabled:
                    raise
                os.mkdir(segment, 0o777, dir_fd=current_fd)
                next_fd = open_dir(segment, dir_fd=current_fd)
            os.close(current_fd)
            current_fd = next_fd
        return current_fd
    except Exception:
        os.close(current_fd)
        raise

def parent_and_basename(root_fd, relative):
    segments = split_relative(relative)
    if not segments:
        raise OSError(errno.EPERM, "operation requires a non-root path")
    parent_fd = walk_dir(root_fd, segments[:-1])
    return parent_fd, segments[-1]

def encode_stat(st):
    mode = st.st_mode
    return {
        "dev": st.st_dev,
        "gid": st.st_gid,
        "ino": st.st_ino,
        "isDirectory": stat.S_ISDIR(mode),
        "isFile": stat.S_ISREG(mode),
        "isSymbolicLink": stat.S_ISLNK(mode),
        "mode": mode,
        "mtimeMs": st.st_mtime * 1000,
        "nlink": st.st_nlink,
        "size": st.st_size,
        "uid": st.st_uid,
    }

def reject_unsafe_endpoint(st):
    mode = st.st_mode
    if stat.S_ISLNK(mode):
        raise OSError(errno.ELOOP, "symlink endpoint is not allowed")
    if stat.S_ISREG(mode) and st.st_nlink > 1:
        raise OSError(errno.EPERM, "hardlinked file endpoint is not allowed")

def stat_path(root_fd, payload):
    relative = payload.get("relativePath", "")
    segments = split_relative(relative)
    if not segments:
        return encode_stat(os.fstat(root_fd))
    parent_fd, basename = parent_and_basename(root_fd, relative)
    try:
        st = os.lstat(basename, dir_fd=parent_fd)
        if payload.get("rejectSymlink", True) and stat.S_ISLNK(st.st_mode):
            raise OSError(errno.ELOOP, "symlink endpoint is not allowed")
        return encode_stat(st)
    finally:
        os.close(parent_fd)

def readdir_path(root_fd, payload):
    dir_fd = walk_dir(root_fd, split_relative(payload.get("relativePath", "")))
    try:
        names = sorted(os.listdir(dir_fd))
        if not payload.get("withFileTypes", False):
            return names
        entries = []
        for name in names:
            st = os.lstat(name, dir_fd=dir_fd)
            entry = encode_stat(st)
            entry["name"] = name
            entries.append(entry)
        return entries
    finally:
        os.close(dir_fd)

def mkdirp_path(root_fd, payload):
    dir_fd = walk_dir(root_fd, split_relative(payload.get("relativePath", "")), mkdir_enabled=True)
    os.close(dir_fd)
    return None

def remove_tree(parent_fd, basename):
    st = os.lstat(basename, dir_fd=parent_fd)
    if stat.S_ISDIR(st.st_mode) and not stat.S_ISLNK(st.st_mode):
        dir_fd = open_dir(basename, dir_fd=parent_fd)
        try:
            for child in os.listdir(dir_fd):
                remove_tree(dir_fd, child)
        finally:
            os.close(dir_fd)
        os.rmdir(basename, dir_fd=parent_fd)
    else:
        os.unlink(basename, dir_fd=parent_fd)

def remove_path(root_fd, payload):
    parent_fd, basename = parent_and_basename(root_fd, payload.get("relativePath", ""))
    try:
        try:
            st = os.lstat(basename, dir_fd=parent_fd)
        except FileNotFoundError:
            if payload.get("force", True):
                return None
            raise
        if stat.S_ISDIR(st.st_mode) and not stat.S_ISLNK(st.st_mode):
            if payload.get("recursive", False):
                remove_tree(parent_fd, basename)
            else:
                os.rmdir(basename, dir_fd=parent_fd)
        else:
            os.unlink(basename, dir_fd=parent_fd)
        return None
    finally:
        os.close(parent_fd)

def rename_path(root_fd, payload):
    from_parent_fd, from_base = parent_and_basename(root_fd, payload["from"])
    to_parent_fd, to_base = parent_and_basename(root_fd, payload["to"])
    try:
        from_stat = os.lstat(from_base, dir_fd=from_parent_fd)
        reject_unsafe_endpoint(from_stat)
        if not payload.get("overwrite", True):
            try:
                os.lstat(to_base, dir_fd=to_parent_fd)
                raise FileExistsError(errno.EEXIST, "destination exists", to_base)
            except FileNotFoundError:
                pass
        os.rename(from_base, to_base, src_dir_fd=from_parent_fd, dst_dir_fd=to_parent_fd)
        os.fsync(from_parent_fd)
        if from_parent_fd != to_parent_fd:
            os.fsync(to_parent_fd)
        return None
    finally:
        os.close(from_parent_fd)
        os.close(to_parent_fd)

def create_temp_file(parent_fd, basename, mode):
    prefix = "." + basename + "."
    for _ in range(128):
        candidate = prefix + secrets.token_hex(6) + ".tmp"
        try:
            fd = os.open(candidate, WRITE_FLAGS, mode, dir_fd=parent_fd)
            return candidate, fd
        except FileExistsError:
            continue
    raise RuntimeError("failed to allocate pinned temp file")

def write_path(root_fd, payload):
    parent_fd = walk_dir(root_fd, split_relative(payload.get("relativeParentPath", "")), bool(payload.get("mkdir", True)))
    temp_fd = None
    temp_name = None
    basename = payload["basename"]
    mode = int(payload.get("mode", 0o600))
    overwrite = bool(payload.get("overwrite", True))
    max_bytes = int(payload.get("maxBytes", -1))
    data = base64.b64decode(payload.get("base64", ""))
    try:
        if max_bytes >= 0 and len(data) > max_bytes:
            raise RuntimeError("fs-safe-too-large:%d:%d" % (max_bytes, len(data)))
        if not overwrite:
            try:
                os.lstat(basename, dir_fd=parent_fd)
                raise FileExistsError(errno.EEXIST, "destination exists", basename)
            except FileNotFoundError:
                pass
        temp_name, temp_fd = create_temp_file(parent_fd, basename, mode)
        view = memoryview(data)
        while view:
            written = os.write(temp_fd, view)
            if written <= 0:
                raise OSError(errno.EIO, "short write")
            view = view[written:]
        os.fsync(temp_fd)
        os.close(temp_fd)
        temp_fd = None
        os.replace(temp_name, basename, src_dir_fd=parent_fd, dst_dir_fd=parent_fd)
        temp_name = None
        os.fsync(parent_fd)
        result_stat = os.stat(basename, dir_fd=parent_fd, follow_symlinks=False)
        return {"dev": result_stat.st_dev, "ino": result_stat.st_ino}
    finally:
        if temp_fd is not None:
            os.close(temp_fd)
        if temp_name is not None:
            try:
                os.unlink(temp_name, dir_fd=parent_fd)
            except FileNotFoundError:
                pass
        os.close(parent_fd)

def copy_path(root_fd, payload):
    source_fd = os.open(payload["sourcePath"], READ_FLAGS)
    parent_fd = None
    temp_fd = None
    temp_name = None
    try:
        source_stat = os.fstat(source_fd)
        if not stat.S_ISREG(source_stat.st_mode):
            raise RuntimeError("fs-safe-not-file")
        if source_stat.st_dev != int(payload["sourceDev"]) or source_stat.st_ino != int(payload["sourceIno"]):
            raise RuntimeError("fs-safe-source-mismatch")
        basename = payload["basename"]
        mode = int(payload.get("mode", 0o600))
        overwrite = bool(payload.get("overwrite", True))
        max_bytes = int(payload.get("maxBytes", -1))
        if max_bytes >= 0 and source_stat.st_size > max_bytes:
            raise RuntimeError("fs-safe-too-large:%d:%d" % (max_bytes, source_stat.st_size))
        parent_fd = walk_dir(root_fd, split_relative(payload.get("relativeParentPath", "")), bool(payload.get("mkdir", True)))
        if not overwrite:
            try:
                os.lstat(basename, dir_fd=parent_fd)
                raise FileExistsError(errno.EEXIST, "destination exists", basename)
            except FileNotFoundError:
                pass
        temp_name, temp_fd = create_temp_file(parent_fd, basename, mode)
        written_bytes = 0
        while True:
            chunk = os.read(source_fd, 65536)
            if not chunk:
                break
            written_bytes += len(chunk)
            if max_bytes >= 0 and written_bytes > max_bytes:
                raise RuntimeError("fs-safe-too-large:%d:%d" % (max_bytes, written_bytes))
            view = memoryview(chunk)
            while view:
                written = os.write(temp_fd, view)
                if written <= 0:
                    raise OSError(errno.EIO, "short write")
                view = view[written:]
        os.fsync(temp_fd)
        os.close(temp_fd)
        temp_fd = None
        os.replace(temp_name, basename, src_dir_fd=parent_fd, dst_dir_fd=parent_fd)
        temp_name = None
        os.fsync(parent_fd)
        result_stat = os.stat(basename, dir_fd=parent_fd, follow_symlinks=False)
        return {"dev": result_stat.st_dev, "ino": result_stat.st_ino}
    finally:
        os.close(source_fd)
        if temp_fd is not None:
            os.close(temp_fd)
        if temp_name is not None and parent_fd is not None:
            try:
                os.unlink(temp_name, dir_fd=parent_fd)
            except FileNotFoundError:
                pass
        if parent_fd is not None:
            os.close(parent_fd)

def run_operation(operation, root_path, payload):
    root_fd = open_dir(root_path)
    try:
        if operation == "stat":
            return stat_path(root_fd, payload)
        if operation == "readdir":
            return readdir_path(root_fd, payload)
        if operation == "mkdirp":
            return mkdirp_path(root_fd, payload)
        if operation == "remove":
            return remove_path(root_fd, payload)
        if operation == "rename":
            return rename_path(root_fd, payload)
        if operation == "write":
            return write_path(root_fd, payload)
        if operation == "copy":
            return copy_path(root_fd, payload)
        raise RuntimeError("unknown operation: " + operation)
    finally:
        os.close(root_fd)

for line in sys.stdin:
    try:
        request = json.loads(line)
        result = run_operation(request["operation"], request["rootPath"], request.get("payload") or {})
        response = {"id": request["id"], "ok": True, "result": result}
    except Exception as exc:
        response = {
            "id": request.get("id") if isinstance(locals().get("request"), dict) else None,
            "ok": False,
            "code": exc.__class__.__name__,
            "errno": getattr(exc, "errno", None),
            "message": str(exc),
        }
    print(json.dumps(response, separators=(",", ":")), flush=True)
`;
let nextRequestId = 1;
let worker = null;
const PYTHON_CANDIDATE_DEFAULTS = [
"/usr/bin/python3",
"/opt/homebrew/bin/python3",
"/usr/local/bin/python3"];

function canExecute(binPath) {
  try {
    _nodeFs.default.accessSync(binPath, _nodeFs.default.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}
function resolvePython() {
  const configured = (0, _fsSafeDefaultsAzXCfv.r)().pythonPath;
  if (configured) return configured;
  for (const candidate of PYTHON_CANDIDATE_DEFAULTS) if (canExecute(candidate)) return candidate;
  return "python3";
}
function assertPinnedHelperSupported() {
  if (process.platform === "win32") throw new _pathB5B_oAT.p("unsupported-platform", "fd-relative pinned filesystem operations are not available on Windows");
  if ((0, _fsSafeDefaultsAzXCfv.r)().mode === "off") throw new _pathB5B_oAT.p("helper-unavailable", "Python helper is disabled");
}
function isSpawnUnavailable(error) {
  if (!(error instanceof Error)) return false;
  const maybeErrno = error;
  return typeof maybeErrno.syscall === "string" && maybeErrno.syscall.startsWith("spawn") && [
  "EACCES",
  "ENOENT",
  "ENOEXEC"].
  includes(maybeErrno.code ?? "");
}
function mapWorkerError(response) {
  const code = typeof response.code === "string" ? response.code : "";
  const errno = typeof response.errno === "number" ? response.errno : void 0;
  const message = typeof response.message === "string" && response.message ? response.message : "pinned helper failed";
  const tooLarge = message.match(/fs-safe-too-large:(\d+):(\d+)/);
  if (tooLarge) {
    const [, limit, got] = tooLarge;
    return new _pathB5B_oAT.p("too-large", `file exceeds limit of ${limit} bytes (got at least ${got})`);
  }
  if (message.includes("fs-safe-not-file")) return new _pathB5B_oAT.p("not-file", "not a file");
  if (message.includes("fs-safe-source-mismatch")) return new _pathB5B_oAT.p("path-mismatch", "source path changed during copy");
  if (code === "FileNotFoundError" || errno === 2) return new _pathB5B_oAT.p("not-found", "file not found");
  if (code === "FileExistsError" || errno === 17) return new _pathB5B_oAT.p("already-exists", message);
  if (errno === 39) return new _pathB5B_oAT.p("not-empty", "directory is not empty");
  if (errno === 1 || errno === 13 || errno === 21) return new _pathB5B_oAT.p("not-removable", "path is not removable under root");
  if (code === "NotADirectoryError" || code === "OSError" || errno === 20 || errno === 40) return new _pathB5B_oAT.p("path-alias", message);
  return new _pathB5B_oAT.p("helper-failed", message);
}
function rejectPending(error) {
  if (!worker) return;
  setWorkerRef(worker, false);
  for (const pending of worker.pending.values()) pending.reject(error);
  worker.pending.clear();
  worker = null;
}
function handleWorkerLine(line) {
  if (!worker || !line.trim()) return;
  let decoded;
  try {
    decoded = JSON.parse(line);
  } catch {
    rejectPending(new _pathB5B_oAT.p("helper-failed", `pinned helper returned invalid JSON: ${line}`));
    return;
  }
  if (typeof decoded !== "object" || decoded === null || !("id" in decoded)) {
    rejectPending(new _pathB5B_oAT.p("helper-failed", "pinned helper returned invalid response"));
    return;
  }
  const response = decoded;
  const id = typeof response.id === "number" ? response.id : void 0;
  if (id === void 0) return;
  const pending = worker.pending.get(id);
  if (!pending) return;
  worker.pending.delete(id);
  if (worker.pending.size === 0) setWorkerRef(worker, false);
  if (response.ok === true) {
    pending.resolve(response.result);
    return;
  }
  pending.reject(mapWorkerError(decoded));
}
function getWorker() {
  assertPinnedHelperSupported();
  if (worker) return worker;
  const child = (0, _nodeChild_process.spawn)(resolvePython(), [
  "-u",
  "-c",
  PINNED_PYTHON_WORKER_SOURCE],
  { stdio: [
    "pipe",
    "pipe",
    "pipe"]
  });
  worker = {
    child,
    pending: /* @__PURE__ */new Map(),
    stderr: "",
    stdoutBuffer: ""
  };
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    const current = worker;
    if (!current) return;
    current.stdoutBuffer += chunk;
    for (;;) {
      const newline = current.stdoutBuffer.indexOf("\n");
      if (newline < 0) break;
      const line = current.stdoutBuffer.slice(0, newline);
      current.stdoutBuffer = current.stdoutBuffer.slice(newline + 1);
      handleWorkerLine(line);
    }
  });
  child.stderr.on("data", (chunk) => {
    if (worker) worker.stderr = `${worker.stderr}${chunk}`.slice(-4096);
  });
  child.once("error", (error) => {
    rejectPending(isSpawnUnavailable(error) ? new _pathB5B_oAT.p("helper-unavailable", "Python helper is unavailable", { cause: error }) : error instanceof Error ? error : new Error(String(error)));
  });
  child.once("close", (code, signal) => {
    const stderr = worker?.stderr.trim();
    rejectPending(new _pathB5B_oAT.p("helper-failed", stderr || `pinned helper exited with code ${code ?? "null"} (${signal ?? "?"})`));
  });
  process.once("exit", () => {
    child.kill("SIGTERM");
  });
  setWorkerRef(worker, false);
  return worker;
}
function setRefable(value, ref) {
  if (!value) return;
  value[ref ? "ref" : "unref"]?.();
}
function setWorkerRef(currentWorker, ref) {
  setRefable(currentWorker.child, ref);
  setRefable(currentWorker.child.stdin, ref);
  setRefable(currentWorker.child.stdout, ref);
  setRefable(currentWorker.child.stderr, ref);
}
async function runPinnedPythonOperation(params) {
  const requestId = nextRequestId++;
  const currentWorker = getWorker();
  if (typeof currentWorker.child.stdin?.write !== "function") throw new _pathB5B_oAT.p("helper-unavailable", "Python helper stdin is unavailable");
  setWorkerRef(currentWorker, true);
  return await new Promise((resolve, reject) => {
    currentWorker.pending.set(requestId, {
      reject,
      resolve: (value) => resolve(value)
    });
    const request = JSON.stringify({
      id: requestId,
      operation: params.operation,
      rootPath: params.rootPath,
      payload: params.payload
    });
    currentWorker.child.stdin.write(`${request}\n`, (error) => {
      if (error) {
        currentWorker.pending.delete(requestId);
        if (currentWorker.pending.size === 0) setWorkerRef(currentWorker, false);
        reject(error);
      }
    });
  });
}
function assertPinnedPythonOperationAvailable() {
  if (typeof getWorker().child.stdin?.write !== "function") throw new _pathB5B_oAT.p("helper-unavailable", "Python helper stdin is unavailable");
}
function validatePinnedOperationPayload(payload) {
  if (typeof payload.relativePath === "string") validatePinnedRelativePath(payload.relativePath);
  if (typeof payload.relativeParentPath === "string") validatePinnedRelativePath(payload.relativeParentPath);
  if (typeof payload.from === "string") validatePinnedRelativePath(payload.from);
  if (typeof payload.to === "string") validatePinnedRelativePath(payload.to);
}
function validatePinnedRelativePath(relativePath) {
  if (relativePath.length === 0 || relativePath === ".") return;
  if (relativePath.includes("\0")) throw new _pathB5B_oAT.p("invalid-path", "relative path contains a NUL byte");
  if (relativePath.startsWith("/") || relativePath.startsWith("//") || relativePath === ".." || relativePath.startsWith("../") || relativePath.startsWith("..\\")) throw new _pathB5B_oAT.p("invalid-path", "relative path must not escape root");
  for (const segment of relativePath.split("/")) if (segment === "..") throw new _pathB5B_oAT.p("invalid-path", "relative path must not contain '..'");
}
//#endregion
//#region node_modules/@openclaw/fs-safe/dist/pinned-helper.js
async function runPinnedHelper(operation, rootDir, payload) {
  validatePinnedOperationPayload(payload);
  return await runPinnedPythonOperation({
    operation,
    rootPath: rootDir,
    payload
  });
}
async function helperStat(rootDir, relativePath) {
  return await runPinnedHelper("stat", rootDir, { relativePath });
}
async function helperReaddir(rootDir, relativePath, withFileTypes) {
  return await runPinnedHelper("readdir", rootDir, {
    relativePath,
    withFileTypes
  });
}
//#endregion
//#region node_modules/@openclaw/fs-safe/dist/pinned-path.js
function isPinnedPathHelperSpawnError(error) {
  return (0, _fsSafeDefaultsAzXCfv.t)(error);
}
async function runPinnedPathHelper(params) {
  try {
    await runPinnedHelper(params.operation, params.rootPath, { relativePath: params.relativePath });
  } catch (error) {
    if (error instanceof _pathB5B_oAT.p) throw error;
    throw new _pathB5B_oAT.p("helper-failed", "pinned path helper failed", { cause: error instanceof Error ? error : void 0 });
  }
}
//#endregion
//#region node_modules/@openclaw/fs-safe/dist/pinned-write.js
function byteLength(input, encoding) {
  return typeof input === "string" ? Buffer.byteLength(input, encoding ?? "utf8") : input.byteLength;
}
function assertSafeBasename(basename) {
  if (!basename || basename === "." || basename === ".." || basename.includes("/") || basename.includes("\0")) throw new _pathB5B_oAT.p("invalid-path", "invalid target path");
}
function assertWithinMaxBytes(bytes, maxBytes) {
  if (maxBytes !== void 0 && bytes > maxBytes) throw new _pathB5B_oAT.p("too-large", `file exceeds limit of ${maxBytes} bytes (got at least ${bytes})`);
}
function createMaxBytesTransform(maxBytes) {
  if (maxBytes === void 0) return;
  let bytes = 0;
  return new _nodeStream.Transform({ transform(chunk, _encoding, callback) {
      bytes += chunk.byteLength;
      if (bytes > maxBytes) {
        callback(new _pathB5B_oAT.p("too-large", `file exceeds limit of ${maxBytes} bytes (got at least ${bytes})`));
        return;
      }
      callback(null, chunk);
    } });
}
async function pipelineWithMaxBytes(stream, destination, maxBytes) {
  const limiter = createMaxBytesTransform(maxBytes);
  if (limiter) {
    await (0, _promises2.pipeline)(stream, limiter, destination);
    return;
  }
  await (0, _promises2.pipeline)(stream, destination);
}
async function inputToBase64(input, maxBytes) {
  if (input.kind === "buffer") {
    assertWithinMaxBytes(byteLength(input.data, input.encoding), maxBytes);
    return (typeof input.data === "string" ? Buffer.from(input.data, input.encoding ?? "utf8") : input.data).toString("base64");
  }
  const chunks = [];
  let bytes = 0;
  for await (const chunk of input.stream) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytes += buffer.byteLength;
    assertWithinMaxBytes(bytes, maxBytes);
    chunks.push(buffer);
  }
  return Buffer.concat(chunks, bytes).toString("base64");
}
async function runPinnedWriteHelper(params) {
  assertSafeBasename(params.basename);
  validatePinnedOperationPayload({ relativeParentPath: params.relativeParentPath });
  if ((0, _fsSafeDefaultsAzXCfv.r)().mode === "off") return await runPinnedWriteFallback(params);
  if (params.input.kind === "stream") try {
    assertPinnedPythonOperationAvailable();
  } catch (error) {
    if ((0, _fsSafeDefaultsAzXCfv.t)(error)) return await runPinnedWriteFallback(params);
    throw error;
  }
  const payload = {
    base64: await inputToBase64(params.input, params.maxBytes),
    basename: params.basename,
    maxBytes: params.maxBytes ?? -1,
    mkdir: params.mkdir,
    mode: params.mode || 384,
    overwrite: params.overwrite !== false,
    relativeParentPath: params.relativeParentPath
  };
  try {
    return await runPinnedPythonOperation({
      operation: "write",
      rootPath: params.rootPath,
      payload
    });
  } catch (error) {
    if ((0, _fsSafeDefaultsAzXCfv.t)(error)) return await runPinnedWriteFallback(params);
    throw error;
  }
}
async function runPinnedCopyHelper(params) {
  assertSafeBasename(params.basename);
  validatePinnedOperationPayload({ relativeParentPath: params.relativeParentPath });
  return await runPinnedPythonOperation({
    operation: "copy",
    rootPath: params.rootPath,
    payload: {
      basename: params.basename,
      maxBytes: params.maxBytes ?? -1,
      mkdir: params.mkdir,
      mode: params.mode || 384,
      overwrite: params.overwrite !== false,
      relativeParentPath: params.relativeParentPath,
      sourceDev: params.sourceIdentity.dev,
      sourceIno: params.sourceIdentity.ino,
      sourcePath: params.sourcePath
    }
  });
}
async function runPinnedWriteFallback(params) {
  const parentPath = params.relativeParentPath ? _nodePath.default.join(params.rootPath, ...params.relativeParentPath.split("/")) : params.rootPath;
  const parentGuard = await (0, _writeQueueBKRKUV0w.d)(params.rootPath, parentPath);
  if (params.mkdir) await (0, _writeQueueBKRKUV0w.s)([parentGuard], async () => {
    await _promises.default.mkdir(parentPath, { recursive: true });
  });
  const targetPath = _nodePath.default.join(parentPath, params.basename);
  if (params.overwrite === false) {
    let handle = await (0, _writeQueueBKRKUV0w.s)([parentGuard], async () => await _promises.default.open(targetPath, _nodeFs.default.constants.O_WRONLY | _nodeFs.default.constants.O_CREAT | _nodeFs.default.constants.O_EXCL, params.mode), { onPostGuardFailure: async (openedHandle) => {
        await openedHandle.close().catch(() => void 0);
      } });
    let created = true;
    try {
      if (params.input.kind === "buffer") {
        assertWithinMaxBytes(byteLength(params.input.data, params.input.encoding), params.maxBytes);
        if (typeof params.input.data === "string") await handle.writeFile(params.input.data, params.input.encoding ?? "utf8");else
        await handle.writeFile(params.input.data);
      } else await pipelineWithMaxBytes(params.input.stream, handle.createWriteStream(), params.maxBytes);
      const stat = await handle.stat();
      created = false;
      return {
        dev: stat.dev,
        ino: stat.ino
      };
    } finally {
      await handle.close().catch(() => void 0);
      if (created) await _promises.default.rm(targetPath, { force: true }).catch(() => void 0);
    }
  }
  const tempPath = _nodePath.default.join(parentPath, `.${params.basename}.${(0, _nodeCrypto.randomUUID)()}.fallback.tmp`);
  const tempFlags = _nodeFs.default.constants.O_WRONLY | _nodeFs.default.constants.O_CREAT | _nodeFs.default.constants.O_EXCL | (process.platform !== "win32" && "O_NOFOLLOW" in _nodeFs.default.constants ? _nodeFs.default.constants.O_NOFOLLOW : 0);
  let handle;
  let handleClosedByStream = false;
  try {
    handle = await _promises.default.open(tempPath, tempFlags, params.mode);
    if (params.input.kind === "buffer") {
      assertWithinMaxBytes(byteLength(params.input.data, params.input.encoding), params.maxBytes);
      if (typeof params.input.data === "string") await handle.writeFile(params.input.data, params.input.encoding ?? "utf8");else
      await handle.writeFile(params.input.data);
    } else {
      const writable = handle.createWriteStream();
      writable.once("close", () => {
        handleClosedByStream = true;
      });
      await pipelineWithMaxBytes(params.input.stream, writable, params.maxBytes);
    }
    if (!handleClosedByStream) {
      await handle.close().catch(() => void 0);
      handle = void 0;
    }
    await (0, _writeQueueBKRKUV0w.s)([parentGuard], async () => {
      await _promises.default.rename(tempPath, targetPath);
    });
  } catch (error) {
    if (handle && !handleClosedByStream) await handle.close().catch(() => void 0);
    await _promises.default.rm(tempPath, { force: true }).catch(() => void 0);
    throw error;
  }
  const stat = await _promises.default.stat(targetPath);
  return {
    dev: stat.dev,
    ino: stat.ino
  };
}
//#endregion
//#region node_modules/@openclaw/fs-safe/dist/path-policy.js
const PATH_ALIAS_POLICIES = exports.c = _rootPathDTHDXh_.t;
async function assertNoPathAliasEscape(params) {
  const resolved = await (0, _rootPathDTHDXh_.r)({
    absolutePath: params.absolutePath,
    rootPath: params.rootPath,
    boundaryLabel: params.boundaryLabel,
    policy: params.policy
  });
  if (params.policy?.allowFinalSymlinkForUnlink === true && resolved.kind === "symlink") return;
  await assertNoHardlinkedFinalPath({
    filePath: resolved.absolutePath,
    root: resolved.rootPath,
    boundaryLabel: params.boundaryLabel,
    allowFinalHardlinkForUnlink: params.policy?.allowFinalHardlinkForUnlink
  });
}
async function assertNoHardlinkedFinalPath(params) {
  if (params.allowFinalHardlinkForUnlink) return;
  let stat;
  try {
    stat = await _promises.default.stat(params.filePath);
  } catch (err) {
    if ((0, _pathB5B_oAT.r)(err)) return;
    throw err;
  }
  if (!stat.isFile()) return;
  if (stat.nlink > 1) throw new Error(`Hardlinked path is not allowed under ${params.boundaryLabel} (${shortPath(params.root)}): ${shortPath(params.filePath)}`);
}
function shortPath(value) {
  if (value.startsWith(_nodeOs.default.homedir())) return `~${value.slice(_nodeOs.default.homedir().length)}`;
  return value;
}
//#endregion
//#region node_modules/@openclaw/fs-safe/dist/path-stat.js
function pathStatFromStats(stat) {
  return {
    dev: Number(stat.dev),
    gid: Number(stat.gid),
    ino: Number(stat.ino),
    isDirectory: stat.isDirectory(),
    isFile: stat.isFile(),
    isSymbolicLink: stat.isSymbolicLink(),
    mode: stat.mode,
    mtimeMs: stat.mtimeMs,
    nlink: stat.nlink,
    size: stat.size,
    uid: stat.uid
  };
}
//#endregion
//#region node_modules/@openclaw/fs-safe/dist/root-context.js
const ensureTrailingSep = (value) => value.endsWith(_nodePath.default.sep) ? value : value + _nodePath.default.sep;
function assertValidRootRelativePath(relativePath) {
  (0, _pathB5B_oAT.t)(relativePath, "relative path contains a NUL byte");
}
let cachedHomePath;
async function expandRelativePathWithHome(relativePath) {
  const rawHome = process.env.HOME || process.env.USERPROFILE || _nodeOs.default.homedir();
  if (cachedHomePath?.raw !== rawHome) {
    let realHome = rawHome;
    try {
      realHome = await _promises.default.realpath(rawHome);
    } catch {}
    cachedHomePath = {
      raw: rawHome,
      real: realHome
    };
  }
  return expandHomePrefix(relativePath, { home: cachedHomePath.real });
}
async function resolveRootContext(rootDir) {
  (0, _pathB5B_oAT.t)(rootDir, "root dir contains a NUL byte");
  let rootReal;
  try {
    rootReal = await _promises.default.realpath(rootDir);
    if (!(await _promises.default.stat(rootReal)).isDirectory()) throw new _pathB5B_oAT.p("invalid-path", "root dir is not a directory");
  } catch (err) {
    if (err instanceof _pathB5B_oAT.p) throw err;
    if ((0, _pathB5B_oAT.r)(err)) throw new _pathB5B_oAT.p("not-found", "root dir not found");
    throw err;
  }
  return {
    rootDir: _nodePath.default.resolve(rootDir),
    rootReal,
    rootWithSep: ensureTrailingSep(rootReal)
  };
}
async function resolvePathInRoot(root, relativePath) {
  assertValidRootRelativePath(relativePath);
  const expanded = await expandRelativePathWithHome(relativePath);
  const resolved = _nodePath.default.resolve(root.rootWithSep, expanded);
  if (!(0, _pathB5B_oAT.i)(root.rootWithSep, resolved)) throw new _pathB5B_oAT.p("outside-workspace", "file is outside workspace root");
  return {
    rootReal: root.rootReal,
    rootWithSep: root.rootWithSep,
    resolved
  };
}
//#endregion
//#region node_modules/@openclaw/fs-safe/dist/root-errors.js
function isAlreadyExistsError(error) {
  return (0, _pathB5B_oAT.n)(error, "EEXIST") || /File exists|EEXIST/i.test(String(error));
}
function normalizePinnedWriteError(error) {
  if (error instanceof _pathB5B_oAT.p) return error;
  return new _pathB5B_oAT.p("invalid-path", "path is not a regular file under root", { cause: error instanceof Error ? error : void 0 });
}
function normalizePinnedPathError(error) {
  if (error instanceof _pathB5B_oAT.p) return error;
  return new _pathB5B_oAT.p("path-alias", "path is not under root", { cause: error instanceof Error ? error : void 0 });
}
//#endregion
//#region node_modules/@openclaw/fs-safe/dist/test-hooks.js
let fsSafeTestHooks;
function getFsSafeTestHooks() {
  return fsSafeTestHooks;
}
//#endregion
//#region node_modules/@openclaw/fs-safe/dist/root-impl.js
function logWarn(message) {
  if (process.env.FS_SAFE_DEBUG_WARNINGS === "1") console.warn(message);
}
const SUPPORTS_NOFOLLOW = process.platform !== "win32" && "O_NOFOLLOW" in _nodeFs.constants;
const NONBLOCK_OPEN_FLAG = "O_NONBLOCK" in _nodeFs.constants ? _nodeFs.constants.O_NONBLOCK : 0;
const OPEN_READ_FLAGS = _nodeFs.constants.O_RDONLY | (SUPPORTS_NOFOLLOW ? _nodeFs.constants.O_NOFOLLOW : 0);
const OPEN_READ_NONBLOCK_FLAGS = OPEN_READ_FLAGS | NONBLOCK_OPEN_FLAG;
const OPEN_READ_FOLLOW_FLAGS = _nodeFs.constants.O_RDONLY;
const OPEN_READ_FOLLOW_NONBLOCK_FLAGS = OPEN_READ_FOLLOW_FLAGS | NONBLOCK_OPEN_FLAG;
const OPEN_WRITE_EXISTING_FLAGS = _nodeFs.constants.O_WRONLY | (SUPPORTS_NOFOLLOW ? _nodeFs.constants.O_NOFOLLOW : 0);
const OPEN_WRITE_CREATE_FLAGS = _nodeFs.constants.O_WRONLY | _nodeFs.constants.O_CREAT | _nodeFs.constants.O_EXCL | (SUPPORTS_NOFOLLOW ? _nodeFs.constants.O_NOFOLLOW : 0);
const OPEN_APPEND_EXISTING_FLAGS = _nodeFs.constants.O_RDWR | _nodeFs.constants.O_APPEND | (SUPPORTS_NOFOLLOW ? _nodeFs.constants.O_NOFOLLOW : 0);
const OPEN_APPEND_CREATE_FLAGS = _nodeFs.constants.O_RDWR | _nodeFs.constants.O_APPEND | _nodeFs.constants.O_CREAT | _nodeFs.constants.O_EXCL | (SUPPORTS_NOFOLLOW ? _nodeFs.constants.O_NOFOLLOW : 0);
const DEFAULT_ROOT_MAX_BYTES = exports.n = 16 * 1024 * 1024;
function closeHandleForDispose(handle) {
  return handle.close().catch(() => void 0);
}
function openResult(params) {
  return {
    handle: params.handle,
    realPath: params.realPath,
    stat: params.stat,
    [Symbol.asyncDispose]: async () => {
      await closeHandleForDispose(params.handle);
    }
  };
}
async function openVerifiedLocalFile(filePath, options) {
  const fsSafeTestHooks = getFsSafeTestHooks();
  try {
    if ((await _promises.default.lstat(filePath)).isDirectory()) throw new _pathB5B_oAT.p("not-file", "not a file");
    await fsSafeTestHooks?.afterPreOpenLstat?.(filePath);
  } catch (err) {
    if (err instanceof _pathB5B_oAT.p) throw err;
  }
  let handle;
  try {
    const openFlags = options?.symlinks === "follow-within-root" ? options?.nonBlockingRead ? OPEN_READ_FOLLOW_NONBLOCK_FLAGS : OPEN_READ_FOLLOW_FLAGS : options?.nonBlockingRead ? OPEN_READ_NONBLOCK_FLAGS : OPEN_READ_FLAGS;
    await fsSafeTestHooks?.beforeOpen?.(filePath, openFlags);
    handle = await _promises.default.open(filePath, openFlags);
    try {
      await fsSafeTestHooks?.afterOpen?.(filePath, handle);
    } catch (err) {
      await handle.close().catch(() => {});
      throw err;
    }
  } catch (err) {
    if ((0, _pathB5B_oAT.r)(err)) throw new _pathB5B_oAT.p("not-found", "file not found");
    if ((0, _pathB5B_oAT.o)(err)) throw new _pathB5B_oAT.p("symlink", "symlink open blocked", { cause: err });
    if ((0, _pathB5B_oAT.n)(err, "EISDIR")) throw new _pathB5B_oAT.p("not-file", "not a file");
    throw err;
  }
  try {
    const stat = await handle.stat();
    if (!stat.isFile()) throw new _pathB5B_oAT.p("not-file", "not a file");
    if (options?.hardlinks === "reject" && stat.nlink > 1) throw new _pathB5B_oAT.p("hardlink", "hardlinked path not allowed");
    if (options?.symlinks === "follow-within-root") {
      if (!(0, _fileIdentityPAmF0zvV.t)(stat, await _promises.default.stat(filePath))) throw new _pathB5B_oAT.p("path-mismatch", "path changed during read");
    } else {
      const pathStat = await _promises.default.lstat(filePath);
      if (pathStat.isSymbolicLink()) throw new _pathB5B_oAT.p("symlink", "symlink not allowed");
      if (!(0, _fileIdentityPAmF0zvV.t)(stat, pathStat)) throw new _pathB5B_oAT.p("path-mismatch", "path changed during read");
    }
    const realPath = await resolveOpenedFileRealPathForHandle(handle, filePath);
    const realStat = await _promises.default.stat(realPath);
    if (options?.hardlinks === "reject" && realStat.nlink > 1) throw new _pathB5B_oAT.p("hardlink", "hardlinked path not allowed");
    if (!(0, _fileIdentityPAmF0zvV.t)(stat, realStat)) throw new _pathB5B_oAT.p("path-mismatch", "path mismatch");
    return openResult({
      handle,
      realPath,
      stat
    });
  } catch (err) {
    await handle.close().catch(() => {});
    if (err instanceof _pathB5B_oAT.p) throw err;
    if ((0, _pathB5B_oAT.r)(err)) throw new _pathB5B_oAT.p("not-found", "file not found");
    throw err;
  }
}
var RootHandle = class {
  rootDir;
  rootReal;
  rootWithSep;
  defaults;
  constructor(context, defaults = {}) {
    this.rootDir = context.rootDir;
    this.rootReal = context.rootReal;
    this.rootWithSep = context.rootWithSep;
    this.defaults = defaults;
  }
  get context() {
    return {
      rootDir: this.rootDir,
      rootReal: this.rootReal,
      rootWithSep: this.rootWithSep
    };
  }
  async resolve(relativePath) {
    return (await resolvePathInRoot(this.context, relativePath)).resolved;
  }
  async open(relativePath, options = {}) {
    return await openFileInRoot(this.context, {
      relativePath,
      ...readDefaults(this.defaults),
      ...options
    });
  }
  async read(relativePath, options = {}) {
    return await readFileInRoot(this.context, {
      relativePath,
      ...readDefaults(this.defaults),
      ...options
    });
  }
  async readBytes(relativePath, options = {}) {
    return (await this.read(relativePath, options)).buffer;
  }
  async readText(relativePath, options = {}) {
    const { encoding = "utf8", ...readOptions } = options;
    return (await this.read(relativePath, readOptions)).buffer.toString(encoding);
  }
  async readJson(relativePath, options = {}) {
    return JSON.parse(await this.readText(relativePath, options));
  }
  async readAbsolute(filePath, options = {}) {
    return await readPathInRoot(this.context, {
      filePath,
      ...readDefaults(this.defaults),
      ...options
    });
  }
  reader(options = {}) {
    return async (filePath) => {
      return (await this.readAbsolute(filePath, options)).buffer;
    };
  }
  async openWritable(relativePath, options = {}) {
    const writeMode = options.writeMode ?? "replace";
    return await openWritableFileInRoot(this.context, {
      relativePath,
      mkdir: this.defaults.mkdir,
      mode: this.defaults.mode,
      ...options,
      append: writeMode === "append",
      truncateExisting: writeMode === "replace"
    });
  }
  async append(relativePath, data, options = {}) {
    await appendFileInRoot(this.context, {
      relativePath,
      data,
      mkdir: this.defaults.mkdir,
      mode: this.defaults.mode,
      ...options
    });
  }
  async remove(relativePath) {
    assertValidRootRelativePath(relativePath);
    await removePathInRoot(this.context, relativePath);
  }
  async mkdir(relativePath) {
    assertValidRootRelativePath(relativePath);
    await mkdirPathInRoot(this.context, { relativePath });
  }
  async ensureRoot() {
    await mkdirPathInRoot(this.context, {
      relativePath: "",
      allowRoot: true
    });
  }
  async write(relativePath, data, options = {}) {
    await writeFileInRoot(this.context, {
      relativePath,
      data,
      mkdir: this.defaults.mkdir,
      mode: this.defaults.mode,
      ...options
    });
  }
  async create(relativePath, data, options = {}) {
    await writeFileInRoot(this.context, {
      relativePath,
      data,
      mkdir: this.defaults.mkdir,
      mode: this.defaults.mode,
      ...options,
      overwrite: false
    });
  }
  async writeJson(relativePath, data, options = {}) {
    const { replacer, space, trailingNewline = true, ...writeOptions } = options;
    const json = JSON.stringify(data, replacer, space);
    await this.write(relativePath, trailingNewline ? `${json}\n` : json, writeOptions);
  }
  async createJson(relativePath, data, options = {}) {
    const { replacer, space, trailingNewline = true, ...writeOptions } = options;
    const json = JSON.stringify(data, replacer, space);
    await this.create(relativePath, trailingNewline ? `${json}\n` : json, writeOptions);
  }
  async copyIn(relativePath, sourcePath, options = {}) {
    assertValidRootRelativePath(relativePath);
    await copyFileInRoot(this.context, {
      sourcePath,
      relativePath,
      maxBytes: this.defaults.maxBytes,
      mkdir: this.defaults.mkdir,
      mode: this.defaults.mode,
      ...options
    });
  }
  async exists(relativePath) {
    try {
      await this.stat(relativePath);
      return true;
    } catch (err) {
      if (err instanceof _pathB5B_oAT.p && err.code === "not-found") return false;
      throw err;
    }
  }
  async stat(relativePath) {
    assertValidRootRelativePath(relativePath);
    try {
      return await helperStat(this.rootReal, relativePath);
    } catch (error) {
      if ((0, _fsSafeDefaultsAzXCfv.t)(error)) return await statPathFallback(this.context, relativePath);
      throw error;
    }
  }
  async list(relativePath, options = {}) {
    assertValidRootRelativePath(relativePath);
    try {
      return options.withFileTypes === true ? await helperReaddir(this.rootReal, relativePath, true) : await helperReaddir(this.rootReal, relativePath, false);
    } catch (error) {
      if ((0, _fsSafeDefaultsAzXCfv.t)(error)) return await listPathFallback(this.context, relativePath, options.withFileTypes === true);
      throw error;
    }
  }
  async move(fromRelative, toRelative, options = {}) {
    assertValidRootRelativePath(fromRelative);
    assertValidRootRelativePath(toRelative);
    try {
      await runPinnedHelper("rename", this.rootReal, {
        from: fromRelative,
        overwrite: options.overwrite ?? false,
        to: toRelative
      });
    } catch (error) {
      if ((0, _fsSafeDefaultsAzXCfv.t)(error)) {
        await movePathFallback(this.context, {
          fromRelative,
          overwrite: options.overwrite ?? false,
          toRelative
        });
        return;
      }
      throw error;
    }
  }
};
function readDefaults(defaults) {
  return {
    hardlinks: defaults.hardlinks,
    maxBytes: defaults.maxBytes ?? 16777216,
    nonBlockingRead: defaults.nonBlockingRead,
    symlinks: defaults.symlinks
  };
}
async function root(rootDir, defaults = {}) {
  return new RootHandle(await resolveRootContext(rootDir), defaults);
}
async function openFileInRoot(root, params) {
  const { rootWithSep, resolved } = await resolvePathInRoot(root, params.relativePath);
  let opened;
  try {
    opened = await openVerifiedLocalFile(resolved, {
      nonBlockingRead: params.nonBlockingRead,
      symlinks: params.symlinks
    });
  } catch (err) {
    if (err instanceof _pathB5B_oAT.p) throw err;
    throw err;
  }
  if (params.hardlinks !== "allow" && opened.stat.nlink > 1) {
    await opened.handle.close().catch(() => {});
    throw new _pathB5B_oAT.p("hardlink", "hardlinked path not allowed");
  }
  if (!(0, _pathB5B_oAT.i)(rootWithSep, opened.realPath)) {
    await opened.handle.close().catch(() => {});
    throw new _pathB5B_oAT.p("outside-workspace", "file is outside workspace root");
  }
  return opened;
}
async function readFileInRoot(root, params) {
  const opened = await openFileInRoot(root, params);
  try {
    return await readOpenedFileSafely({
      opened,
      maxBytes: params.maxBytes
    });
  } finally {
    await opened.handle.close().catch(() => {});
  }
}
async function readPathInRoot(root, params) {
  const rootDir = root.rootDir;
  const candidatePath = _nodePath.default.isAbsolute(params.filePath) ? _nodePath.default.resolve(params.filePath) : _nodePath.default.resolve(rootDir, params.filePath);
  return await readFileInRoot(root, {
    relativePath: _nodePath.default.relative(rootDir, candidatePath),
    hardlinks: params.hardlinks,
    maxBytes: params.maxBytes,
    nonBlockingRead: params.nonBlockingRead,
    symlinks: params.symlinks
  });
}
async function readLocalFileSafely(params) {
  const opened = await openLocalFileSafely({ filePath: params.filePath });
  try {
    return await readOpenedFileSafely({
      opened,
      maxBytes: params.maxBytes
    });
  } finally {
    await opened.handle.close().catch(() => {});
  }
}
async function openLocalFileSafely(params) {
  (0, _pathB5B_oAT.t)(params.filePath, "file path contains a NUL byte");
  return await openVerifiedLocalFile(params.filePath);
}
async function readOpenedFileSafely(params) {
  if (params.maxBytes !== void 0 && params.opened.stat.size > params.maxBytes) throw new _pathB5B_oAT.p("too-large", `file exceeds limit of ${params.maxBytes} bytes (got ${params.opened.stat.size})`);
  const buffer = await params.opened.handle.readFile();
  if (params.maxBytes !== void 0 && buffer.byteLength > params.maxBytes) throw new _pathB5B_oAT.p("too-large", `file exceeds limit of ${params.maxBytes} bytes (got ${buffer.byteLength})`);
  return {
    buffer,
    realPath: params.opened.realPath,
    stat: params.opened.stat
  };
}
function emitWriteBoundaryWarning(reason) {
  logWarn(`security: fs-safe write boundary warning (${reason})`);
}
function buildAtomicWriteTempPath(targetPath) {
  const dir = _nodePath.default.dirname(targetPath);
  const base = _nodePath.default.basename(targetPath);
  return _nodePath.default.join(dir, `.${base}.${process.pid}.${(0, _nodeCrypto.randomUUID)()}.tmp`);
}
function rootWriteQueueKey(root, relativePath) {
  return `${root.rootReal}\0${relativePath}`;
}
async function writeTempFileForAtomicReplace(params) {
  const tempHandle = await _promises.default.open(params.tempPath, OPEN_WRITE_CREATE_FLAGS, params.mode);
  try {
    if (typeof params.data === "string") await tempHandle.writeFile(params.data, params.encoding ?? "utf8");else
    await tempHandle.writeFile(params.data);
    return await tempHandle.stat();
  } finally {
    await tempHandle.close().catch(() => {});
  }
}
async function verifyAtomicWriteResult(params) {
  const opened = await openVerifiedLocalFile(params.targetPath, { hardlinks: "reject" });
  try {
    if (!(0, _fileIdentityPAmF0zvV.t)(opened.stat, params.expectedIdentity)) throw new _pathB5B_oAT.p("path-mismatch", "path changed during write");
    if (!(0, _pathB5B_oAT.i)(params.root.rootWithSep, opened.realPath)) throw new _pathB5B_oAT.p("outside-workspace", "file is outside workspace root");
  } finally {
    await opened.handle.close().catch(() => {});
  }
}
async function resolveOpenedFileRealPathForHandle(handle, ioPath) {
  const handleStat = await handle.stat();
  const fdCandidates = process.platform === "linux" ? [`/proc/self/fd/${handle.fd}`, `/dev/fd/${handle.fd}`] : process.platform === "win32" ? [] : [`/dev/fd/${handle.fd}`];
  for (const fdPath of fdCandidates) try {
    const fdRealPath = await _promises.default.realpath(fdPath);
    if ((0, _fileIdentityPAmF0zvV.t)(handleStat, await _promises.default.stat(fdRealPath))) return fdRealPath;
  } catch {}
  try {
    const ioRealPath = await _promises.default.realpath(ioPath);
    if ((0, _fileIdentityPAmF0zvV.t)(handleStat, await _promises.default.stat(ioRealPath))) return ioRealPath;
  } catch (err) {
    if (!(0, _pathB5B_oAT.r)(err)) throw err;
  }
  const parentResolved = await resolveOpenedFileRealPathFromParent(handleStat, ioPath);
  if (parentResolved) return parentResolved;
  throw new _pathB5B_oAT.p("path-mismatch", "unable to resolve opened file path");
}
async function resolveOpenedFileRealPathFromParent(handleStat, ioPath) {
  let parentReal;
  try {
    parentReal = await _promises.default.realpath(_nodePath.default.dirname(ioPath));
  } catch (err) {
    if ((0, _pathB5B_oAT.r)(err)) return null;
    throw err;
  }
  let entries;
  try {
    entries = await _promises.default.readdir(parentReal);
  } catch (err) {
    if ((0, _pathB5B_oAT.r)(err)) return null;
    throw err;
  }
  for (const entry of entries.toSorted()) {
    const candidatePath = _nodePath.default.join(parentReal, entry);
    try {
      const candidateStat = await _promises.default.lstat(candidatePath);
      if (candidateStat.isFile() && (0, _fileIdentityPAmF0zvV.t)(handleStat, candidateStat)) return await _promises.default.realpath(candidatePath);
    } catch (err) {
      if (!(0, _pathB5B_oAT.r)(err)) throw err;
    }
  }
  return null;
}
async function openWritableFileInRoot(root, params) {
  const { rootReal, rootWithSep, resolved } = await resolvePathInRoot(root, params.relativePath);
  try {
    await assertNoPathAliasEscape({
      absolutePath: resolved,
      rootPath: rootReal,
      boundaryLabel: "root"
    });
  } catch (err) {
    throw new _pathB5B_oAT.p("path-alias", "path alias escape blocked", { cause: err });
  }
  if (params.mkdir !== false) await (0, _writeQueueBKRKUV0w.s)([await (0, _writeQueueBKRKUV0w.d)(rootReal, _nodePath.default.dirname(resolved))], async () => {
    await _promises.default.mkdir(_nodePath.default.dirname(resolved), { recursive: true });
  });
  let ioPath = resolved;
  try {
    const resolvedRealPath = await _promises.default.realpath(resolved);
    if (!(0, _pathB5B_oAT.i)(rootWithSep, resolvedRealPath)) throw new _pathB5B_oAT.p("outside-workspace", "file is outside workspace root");
    ioPath = resolvedRealPath;
  } catch (err) {
    if (err instanceof _pathB5B_oAT.p) throw err;
    if (!(0, _pathB5B_oAT.r)(err)) throw err;
  }
  const mode = params.mode ?? 384;
  let handle;
  let createdForWrite = false;
  const existingFlags = params.append ? OPEN_APPEND_EXISTING_FLAGS : OPEN_WRITE_EXISTING_FLAGS;
  const createFlags = params.append ? OPEN_APPEND_CREATE_FLAGS : OPEN_WRITE_CREATE_FLAGS;
  try {
    try {
      handle = await _promises.default.open(ioPath, existingFlags, mode);
    } catch (err) {
      if (!(0, _pathB5B_oAT.r)(err)) throw err;
      handle = await _promises.default.open(ioPath, createFlags, mode);
      createdForWrite = true;
    }
  } catch (err) {
    if ((0, _pathB5B_oAT.r)(err)) throw new _pathB5B_oAT.p("not-found", "file not found");
    if ((0, _pathB5B_oAT.o)(err)) throw new _pathB5B_oAT.p("symlink", "symlink open blocked", { cause: err });
    if ((0, _pathB5B_oAT.n)(err, "EISDIR")) throw new _pathB5B_oAT.p("not-file", "not a file", { cause: err });
    throw err;
  }
  let realPathForCleanup = null;
  try {
    const stat = await handle.stat();
    if (!stat.isFile()) throw new _pathB5B_oAT.p("invalid-path", "path is not a regular file under root");
    if (stat.nlink > 1) throw new _pathB5B_oAT.p("hardlink", "hardlinked path not allowed");
    try {
      const lstat = await _promises.default.lstat(ioPath);
      if (lstat.isSymbolicLink() || !lstat.isFile()) throw new _pathB5B_oAT.p(lstat.isSymbolicLink() ? "symlink" : "not-file", "path is not a regular file under root");
      if (!(0, _fileIdentityPAmF0zvV.t)(stat, lstat)) throw new _pathB5B_oAT.p("path-mismatch", "path changed during write");
    } catch (err) {
      if (!(0, _pathB5B_oAT.r)(err)) throw err;
    }
    const realPath = await resolveOpenedFileRealPathForHandle(handle, ioPath);
    realPathForCleanup = realPath;
    const realStat = await _promises.default.stat(realPath);
    if (!(0, _fileIdentityPAmF0zvV.t)(stat, realStat)) throw new _pathB5B_oAT.p("path-mismatch", "path mismatch");
    if (realStat.nlink > 1) throw new _pathB5B_oAT.p("hardlink", "hardlinked path not allowed");
    if (!(0, _pathB5B_oAT.i)(rootWithSep, realPath)) throw new _pathB5B_oAT.p("outside-workspace", "file is outside workspace root");
    if (params.append !== true && params.truncateExisting !== false && !createdForWrite) await handle.truncate(0);
    return {
      handle,
      createdForWrite,
      realPath,
      stat,
      [Symbol.asyncDispose]: async () => {
        await closeHandleForDispose(handle);
      }
    };
  } catch (err) {
    const cleanupCreatedPath = createdForWrite && err instanceof _pathB5B_oAT.p;
    const cleanupPath = realPathForCleanup ?? ioPath;
    await handle.close().catch(() => {});
    if (cleanupCreatedPath) await _promises.default.rm(cleanupPath, { force: true }).catch(() => {});
    throw err;
  }
}
async function appendFileInRoot(root, params) {
  const target = await openWritableFileInRoot(root, {
    relativePath: params.relativePath,
    mkdir: params.mkdir,
    mode: params.mode,
    truncateExisting: false,
    append: true
  });
  try {
    let prefix = "";
    if (params.prependNewlineIfNeeded === true && !target.createdForWrite && target.stat.size > 0 && (typeof params.data === "string" && !params.data.startsWith("\n") || Buffer.isBuffer(params.data) && params.data.length > 0 && params.data[0] !== 10)) {
      const lastByte = Buffer.alloc(1);
      const { bytesRead } = await target.handle.read(lastByte, 0, 1, target.stat.size - 1);
      if (bytesRead === 1 && lastByte[0] !== 10) prefix = "\n";
    }
    if (typeof params.data === "string") {
      await target.handle.appendFile(`${prefix}${params.data}`, params.encoding ?? "utf8");
      return;
    }
    const payload = prefix.length > 0 ? Buffer.concat([Buffer.from(prefix, "utf8"), params.data]) : params.data;
    await target.handle.appendFile(payload);
  } finally {
    await target.handle.close().catch(() => {});
  }
}
async function removePathInRoot(root, relativePath) {
  const resolved = await resolvePinnedRemovePathInRoot(root, relativePath);
  if (process.platform === "win32") {
    await removePathFallback(resolved);
    return;
  }
  try {
    await runPinnedPathHelper({
      operation: "remove",
      rootPath: resolved.rootReal,
      relativePath: resolved.relativePosix
    });
  } catch (error) {
    if (isPinnedPathHelperSpawnError(error)) {
      await removePathFallback(resolved);
      return;
    }
    throw normalizePinnedPathError(error);
  }
}
async function mkdirPathInRoot(root, params) {
  const resolved = await resolvePinnedPathInRoot(root, params);
  if (process.platform === "win32") {
    await mkdirPathFallback(resolved);
    return;
  }
  try {
    await runPinnedPathHelper({
      operation: "mkdirp",
      rootPath: resolved.rootReal,
      relativePath: resolved.relativePosix
    });
  } catch (error) {
    if (isPinnedPathHelperSpawnError(error)) {
      await mkdirPathFallback(resolved);
      return;
    }
    throw normalizePinnedPathError(error);
  }
}
async function writeFileInRoot(root, params) {
  if (process.platform === "win32") {
    await (0, _writeQueueBKRKUV0w.t)(rootWriteQueueKey(root, params.relativePath), async () => {
      await writeFileFallback(root, params);
    });
    return;
  }
  const pinned = await resolvePinnedWriteTargetInRoot(root, params.relativePath, params.mode);
  await (0, _writeQueueBKRKUV0w.t)(pinned.targetPath, async () => {
    let identity;
    try {
      identity = await runPinnedWriteHelper({
        rootPath: pinned.rootReal,
        relativeParentPath: pinned.relativeParentPath,
        basename: pinned.basename,
        mkdir: params.mkdir !== false,
        mode: params.mode ?? pinned.mode,
        overwrite: params.overwrite,
        input: {
          kind: "buffer",
          data: params.data,
          encoding: params.encoding
        }
      });
    } catch (error) {
      if (params.overwrite === false && isAlreadyExistsError(error)) throw new _pathB5B_oAT.p("already-exists", "file already exists", { cause: error instanceof Error ? error : void 0 });
      throw normalizePinnedWriteError(error);
    }
    try {
      await verifyAtomicWriteResult({
        root,
        targetPath: pinned.targetPath,
        expectedIdentity: identity
      });
    } catch (err) {
      emitWriteBoundaryWarning(`post-write verification failed: ${String(err)}`);
      throw err;
    }
  });
}
async function copyFileInRoot(root, params) {
  assertValidRootRelativePath(params.relativePath);
  (0, _pathB5B_oAT.t)(params.sourcePath, "source path contains a NUL byte");
  const source = await openVerifiedLocalFile(params.sourcePath, { hardlinks: params.sourceHardlinks });
  if (params.maxBytes !== void 0 && source.stat.size > params.maxBytes) {
    await source.handle.close().catch(() => {});
    throw new _pathB5B_oAT.p("too-large", `file exceeds limit of ${params.maxBytes} bytes (got ${source.stat.size})`);
  }
  try {
    if (process.platform === "win32") {
      await (0, _writeQueueBKRKUV0w.t)(rootWriteQueueKey(root, params.relativePath), async () => {
        await copyFileFallback(root, params, source);
      });
      return;
    }
    const pinned = await resolvePinnedWriteTargetInRoot(root, params.relativePath, params.mode);
    await (0, _writeQueueBKRKUV0w.t)(pinned.targetPath, async () => {
      let identity;
      try {
        if ((0, _fsSafeDefaultsAzXCfv.r)().mode === "off") {
          await copyFileFallback(root, params, source);
          return;
        }
        identity = await runPinnedCopyHelper({
          rootPath: pinned.rootReal,
          relativeParentPath: pinned.relativeParentPath,
          basename: pinned.basename,
          mkdir: params.mkdir !== false,
          mode: pinned.mode,
          overwrite: true,
          maxBytes: params.maxBytes,
          sourcePath: source.realPath,
          sourceIdentity: {
            dev: source.stat.dev,
            ino: source.stat.ino
          }
        });
      } catch (error) {
        if ((0, _fsSafeDefaultsAzXCfv.t)(error)) {
          await copyFileFallback(root, params, source);
          return;
        }
        throw normalizePinnedWriteError(error);
      }
      try {
        await verifyAtomicWriteResult({
          root,
          targetPath: pinned.targetPath,
          expectedIdentity: identity
        });
      } catch (err) {
        emitWriteBoundaryWarning(`post-copy verification failed: ${String(err)}`);
        throw err;
      }
    });
  } finally {
    await source.handle.close().catch(() => {});
  }
}
async function resolvePinnedWriteTargetInRoot(root, relativePath, requestedMode) {
  const { rootReal, rootWithSep, resolved } = await resolvePathInRoot(root, relativePath);
  try {
    await assertNoPathAliasEscape({
      absolutePath: resolved,
      rootPath: rootReal,
      boundaryLabel: "root"
    });
  } catch (err) {
    throw new _pathB5B_oAT.p("path-alias", "path alias escape blocked", { cause: err });
  }
  const relativeResolved = _nodePath.default.relative(rootReal, resolved);
  if (_nodePath.default.isAbsolute(relativeResolved)) throw new _pathB5B_oAT.p("outside-workspace", "file is outside workspace root");
  const relativePosix = relativeResolved ? relativeResolved.split(_nodePath.default.sep).join(_nodePath.default.posix.sep) : "";
  const basename = _nodePath.default.posix.basename(relativePosix);
  if (!basename || basename === "." || basename === "/") throw new _pathB5B_oAT.p("invalid-path", "invalid target path");
  let mode = requestedMode ?? 384;
  try {
    const opened = await openFileInRoot(root, {
      relativePath,
      hardlinks: "reject",
      nonBlockingRead: true
    });
    try {
      mode = requestedMode ?? opened.stat.mode & 511;
      if (!(0, _pathB5B_oAT.i)(rootWithSep, opened.realPath)) throw new _pathB5B_oAT.p("outside-workspace", "file is outside workspace root");
    } finally {
      await opened.handle.close().catch(() => {});
    }
  } catch (err) {
    if (!(err instanceof _pathB5B_oAT.p) || err.code !== "not-found") throw err;
  }
  return {
    rootReal,
    targetPath: resolved,
    relativeParentPath: _nodePath.default.posix.dirname(relativePosix) === "." ? "" : _nodePath.default.posix.dirname(relativePosix),
    basename,
    mode: mode || 384
  };
}
async function resolvePinnedPathInRoot(root, params) {
  return await resolvePinnedOperationPathInRoot(root, {
    allowRoot: params.allowRoot,
    relativePath: params.relativePath,
    policy: PATH_ALIAS_POLICIES.strict
  });
}
async function resolvePinnedRemovePathInRoot(root, relativePath) {
  return await resolvePinnedOperationPathInRoot(root, {
    relativePath,
    policy: PATH_ALIAS_POLICIES.unlinkTarget
  });
}
async function resolvePinnedOperationPathInRoot(root, params) {
  const resolved = await resolvePinnedRootPathInRoot(root, {
    relativePath: params.relativePath,
    policy: params.policy
  });
  const relativeResolved = _nodePath.default.relative(resolved.rootReal, resolved.canonicalPath);
  if ((relativeResolved === "" || relativeResolved === ".") && params.allowRoot === true) return {
    rootReal: resolved.rootReal,
    resolved: resolved.canonicalPath,
    relativePosix: ""
  };
  const firstSegment = relativeResolved.split(_nodePath.default.sep)[0];
  if (relativeResolved === "" || relativeResolved === "." || firstSegment === ".." || _nodePath.default.isAbsolute(relativeResolved)) throw new _pathB5B_oAT.p("outside-workspace", "file is outside workspace root");
  const relativePosix = relativeResolved.split(_nodePath.default.sep).join(_nodePath.default.posix.sep);
  if (!(0, _pathB5B_oAT.i)(resolved.rootWithSep, resolved.canonicalPath)) throw new _pathB5B_oAT.p("outside-workspace", "file is outside workspace root");
  return {
    rootReal: resolved.rootReal,
    resolved: resolved.canonicalPath,
    relativePosix
  };
}
async function resolvePinnedRootPathInRoot(root, params) {
  const rootReal = root.rootReal;
  let resolved;
  try {
    resolved = await (0, _rootPathDTHDXh_.r)({
      absolutePath: _nodePath.default.resolve(rootReal, await expandRelativePathWithHome(params.relativePath)),
      rootPath: rootReal,
      rootCanonicalPath: rootReal,
      boundaryLabel: "root",
      policy: params.policy
    });
  } catch (err) {
    throw new _pathB5B_oAT.p("path-alias", "path alias escape blocked", { cause: err });
  }
  const rootWithSep = ensureTrailingSep(resolved.rootCanonicalPath);
  return {
    rootReal: resolved.rootCanonicalPath,
    rootWithSep,
    canonicalPath: resolved.canonicalPath
  };
}
async function removePathFallback(resolved) {
  const guard = await (0, _writeQueueBKRKUV0w.u)(_nodePath.default.dirname(resolved.resolved));
  await getFsSafeTestHooks()?.beforeRootFallbackMutation?.("remove", resolved.resolved);
  await (0, _writeQueueBKRKUV0w.c)(guard);
  await ((await _promises.default.lstat(resolved.resolved)).isDirectory() ? _promises.default.rmdir(resolved.resolved) : _promises.default.rm(resolved.resolved));
  await (0, _writeQueueBKRKUV0w.c)(guard).catch(() => void 0);
}
async function mkdirPathFallback(resolved) {
  await mkdirPathComponentsWithGuards({
    rootReal: resolved.rootReal,
    targetPath: resolved.resolved,
    beforeComponent: async (componentPath) => await getFsSafeTestHooks()?.beforeRootFallbackMutation?.("mkdir", componentPath)
  });
}
async function statPathFallback(root, relativePath) {
  const resolved = await resolvePinnedPathInRoot(root, {
    relativePath,
    allowRoot: true
  });
  try {
    return pathStatFromStats(await _promises.default.lstat(resolved.resolved));
  } catch (error) {
    if ((0, _pathB5B_oAT.r)(error)) throw new _pathB5B_oAT.p("not-found", "file not found", { cause: error instanceof Error ? error : void 0 });
    throw error;
  }
}
async function listPathFallback(root, relativePath, withFileTypes) {
  const resolved = await resolvePinnedPathInRoot(root, {
    relativePath,
    allowRoot: true
  });
  try {
    const sortedNames = (await _promises.default.readdir(resolved.resolved)).toSorted();
    if (!withFileTypes) return sortedNames;
    const entries = [];
    for (const name of sortedNames) entries.push({
      name,
      ...pathStatFromStats(await _promises.default.lstat(_nodePath.default.join(resolved.resolved, name)))
    });
    return entries;
  } catch (error) {
    if ((0, _pathB5B_oAT.r)(error)) throw new _pathB5B_oAT.p("not-found", "directory not found", { cause: error instanceof Error ? error : void 0 });
    throw error;
  }
}
async function movePathFallback(root, params) {
  const source = await resolvePathInRoot(root, params.fromRelative);
  await resolvePinnedRootPathInRoot(root, {
    relativePath: params.fromRelative,
    policy: PATH_ALIAS_POLICIES.strict
  });
  const target = await resolvePathInRoot(root, params.toRelative);
  await resolvePinnedRootPathInRoot(root, {
    relativePath: params.toRelative,
    policy: PATH_ALIAS_POLICIES.unlinkTarget
  });
  try {
    await assertNoPathAliasEscape({
      absolutePath: target.resolved,
      rootPath: target.rootReal,
      boundaryLabel: "root"
    });
  } catch (error) {
    throw new _pathB5B_oAT.p("path-alias", "path alias escape blocked", { cause: error instanceof Error ? error : void 0 });
  }
  let sourceStat;
  try {
    sourceStat = await _promises.default.lstat(source.resolved);
  } catch (error) {
    if ((0, _pathB5B_oAT.r)(error)) throw new _pathB5B_oAT.p("not-found", "file not found", { cause: error instanceof Error ? error : void 0 });
    throw error;
  }
  if (sourceStat.isSymbolicLink()) throw new _pathB5B_oAT.p("symlink", "symlink not allowed");
  if (sourceStat.isFile() && sourceStat.nlink > 1) throw new _pathB5B_oAT.p("hardlink", "hardlinked path not allowed");
  if (!params.overwrite) try {
    await _promises.default.lstat(target.resolved);
    throw new _pathB5B_oAT.p("already-exists", "destination exists");
  } catch (error) {
    if (error instanceof _pathB5B_oAT.p) throw error;
    if (!(0, _pathB5B_oAT.r)(error)) throw error;
  }
  const sourceParentGuard = await (0, _writeQueueBKRKUV0w.u)(_nodePath.default.dirname(source.resolved));
  const targetParentGuard = await (0, _writeQueueBKRKUV0w.d)(target.rootReal, _nodePath.default.dirname(target.resolved));
  await getFsSafeTestHooks()?.beforeRootFallbackMutation?.("move", target.resolved);
  await (0, _writeQueueBKRKUV0w.c)(sourceParentGuard);
  await (0, _writeQueueBKRKUV0w.c)(targetParentGuard);
  try {
    await _promises.default.rename(source.resolved, target.resolved);
  } catch (error) {
    if ((0, _pathB5B_oAT.r)(error)) throw new _pathB5B_oAT.p("not-found", "file not found", { cause: error instanceof Error ? error : void 0 });
    if ((0, _pathB5B_oAT.n)(error, "EEXIST")) throw new _pathB5B_oAT.p("already-exists", "destination exists", { cause: error instanceof Error ? error : void 0 });
    throw error;
  }
  await (0, _writeQueueBKRKUV0w.c)(targetParentGuard).catch(() => void 0);
}
async function writeFileFallback(root, params) {
  if (params.overwrite === false) {
    await writeMissingFileFallback(root, params);
    return;
  }
  const target = await openWritableFileInRoot(root, {
    relativePath: params.relativePath,
    mkdir: params.mkdir,
    mode: params.mode,
    truncateExisting: false
  });
  const destinationPath = target.realPath;
  const mode = params.mode ?? target.stat.mode & 511;
  await target.handle.close().catch(() => {});
  const destinationGuard = await (0, _writeQueueBKRKUV0w.u)(_nodePath.default.dirname(destinationPath));
  let tempPath = null;
  let unregisterTempPath = null;
  try {
    tempPath = buildAtomicWriteTempPath(destinationPath);
    unregisterTempPath = (0, _writeQueueBKRKUV0w.n)(tempPath);
    const writtenStat = await writeTempFileForAtomicReplace({
      tempPath,
      data: params.data,
      encoding: params.encoding,
      mode: mode || 384
    });
    const commitTempPath = tempPath;
    await (0, _writeQueueBKRKUV0w.s)([destinationGuard], async () => {
      await _promises.default.rename(commitTempPath, destinationPath);
    });
    tempPath = null;
    unregisterTempPath();
    unregisterTempPath = null;
    try {
      await verifyAtomicWriteResult({
        root,
        targetPath: destinationPath,
        expectedIdentity: writtenStat
      });
    } catch (err) {
      emitWriteBoundaryWarning(`post-write verification failed: ${String(err)}`);
      throw err;
    }
  } finally {
    if (tempPath) await _promises.default.rm(tempPath, { force: true }).catch(() => {});
    unregisterTempPath?.();
  }
}
async function writeMissingFileFallback(root, params) {
  const { rootReal, resolved } = await resolvePathInRoot(root, params.relativePath);
  try {
    await assertNoPathAliasEscape({
      absolutePath: resolved,
      rootPath: rootReal,
      boundaryLabel: "root"
    });
  } catch (err) {
    throw new _pathB5B_oAT.p("path-alias", "path alias escape blocked", { cause: err });
  }
  if (params.mkdir !== false) await _promises.default.mkdir(_nodePath.default.dirname(resolved), { recursive: true });
  const parentGuard = await (0, _writeQueueBKRKUV0w.u)(_nodePath.default.dirname(resolved));
  let created = false;
  try {
    const { handle, writtenStat } = await (0, _writeQueueBKRKUV0w.s)([parentGuard], async () => {
      const handle = await _promises.default.open(resolved, OPEN_WRITE_CREATE_FLAGS, params.mode ?? 384);
      created = true;
      try {
        if (typeof params.data === "string") await handle.writeFile(params.data, params.encoding ?? "utf8");else
        await handle.writeFile(params.data);
        return {
          handle,
          writtenStat: await handle.stat()
        };
      } catch (error) {
        await handle.close().catch(() => void 0);
        throw error;
      }
    }, { onPostGuardFailure: async ({ handle }) => {
        created = false;
        await handle.close().catch(() => void 0);
      } });
    await handle.close();
    await verifyAtomicWriteResult({
      root,
      targetPath: resolved,
      expectedIdentity: writtenStat
    });
    created = false;
  } catch (err) {
    if ((0, _pathB5B_oAT.n)(err, "EEXIST")) throw new _pathB5B_oAT.p("already-exists", "file already exists", { cause: err instanceof Error ? err : void 0 });
    throw err;
  } finally {
    if (created) await _promises.default.rm(resolved, { force: true }).catch(() => void 0);
  }
}
async function copyFileFallback(root, params, source) {
  let target = null;
  let sourceClosedByStream = false;
  let targetClosedByUs = false;
  let tempHandle = null;
  let tempPath = null;
  let unregisterTempPath = null;
  let tempClosedByStream = false;
  try {
    target = await openWritableFileInRoot(root, {
      relativePath: params.relativePath,
      mkdir: params.mkdir,
      mode: params.mode,
      truncateExisting: false
    });
    const destinationPath = target.realPath;
    const mode = params.mode ?? target.stat.mode & 511;
    await target.handle.close().catch(() => {});
    targetClosedByUs = true;
    const destinationGuard = await (0, _writeQueueBKRKUV0w.u)(_nodePath.default.dirname(destinationPath));
    tempPath = buildAtomicWriteTempPath(destinationPath);
    unregisterTempPath = (0, _writeQueueBKRKUV0w.n)(tempPath);
    tempHandle = await _promises.default.open(tempPath, OPEN_WRITE_CREATE_FLAGS, mode || 384);
    const sourceStream = createBoundedReadStream(source, params.maxBytes);
    const targetStream = tempHandle.createWriteStream();
    sourceStream.once("close", () => {
      sourceClosedByStream = true;
    });
    targetStream.once("close", () => {
      tempClosedByStream = true;
    });
    await (0, _promises2.pipeline)(sourceStream, targetStream);
    const writtenStat = await _promises.default.stat(tempPath);
    if (!tempClosedByStream) {
      await tempHandle.close().catch(() => {});
      tempClosedByStream = true;
    }
    tempHandle = null;
    const commitTempPath = tempPath;
    await (0, _writeQueueBKRKUV0w.s)([destinationGuard], async () => {
      await _promises.default.rename(commitTempPath, destinationPath);
    });
    tempPath = null;
    unregisterTempPath();
    unregisterTempPath = null;
    try {
      await verifyAtomicWriteResult({
        root,
        targetPath: destinationPath,
        expectedIdentity: writtenStat
      });
    } catch (err) {
      emitWriteBoundaryWarning(`post-copy verification failed: ${String(err)}`);
      throw err;
    }
  } catch (err) {
    if (target?.createdForWrite) await _promises.default.rm(target.realPath, { force: true }).catch(() => {});
    throw err;
  } finally {
    if (!sourceClosedByStream) await source.handle.close().catch(() => {});
    if (tempHandle && !tempClosedByStream) await tempHandle.close().catch(() => {});
    if (tempPath) await _promises.default.rm(tempPath, { force: true }).catch(() => {});
    unregisterTempPath?.();
    if (target && !targetClosedByUs) await target.handle.close().catch(() => {});
  }
}
//#endregion
//#region node_modules/@openclaw/fs-safe/dist/secure-temp-dir.js
function isNodeErrorWithCode(err, code) {
  return typeof err === "object" && err !== null && "code" in err && err.code === code;
}
function resolveSecureTempRoot(options) {
  const TMP_DIR_ACCESS_MODE = _nodeFs.default.constants.W_OK | _nodeFs.default.constants.X_OK;
  const accessSync = options.accessSync ?? _nodeFs.default.accessSync;
  const chmodSync = options.chmodSync ?? _nodeFs.default.chmodSync;
  const lstatSync = options.lstatSync ?? _nodeFs.default.lstatSync;
  const mkdirSync = options.mkdirSync ?? _nodeFs.default.mkdirSync;
  const warn = options.warn ?? ((message) => console.warn(message));
  const warningPrefix = options.warningPrefix ?? "[fs-safe]";
  const unsafeFallbackLabel = options.unsafeFallbackLabel ?? "secure temp dir";
  const getuid = options.getuid ?? (() => {
    try {
      return typeof process.getuid === "function" ? process.getuid() : void 0;
    } catch {
      return;
    }
  });
  const tmpdir$1 = typeof options.tmpdir === "function" ? options.tmpdir : _nodeOs.tmpdir;
  const platform = options.platform ?? process.platform;
  const uid = getuid();
  const isSecureDirForUser = (st) => {
    if (uid === void 0) return true;
    if (typeof st.uid === "number" && st.uid !== uid) return false;
    if (typeof st.mode === "number" && (st.mode & 18) !== 0) return false;
    return true;
  };
  const fallback = () => {
    const base = tmpdir$1();
    const suffix = uid === void 0 ? options.fallbackPrefix : `${options.fallbackPrefix}-${uid}`;
    return (platform === "win32" ? _nodePath.default.win32.join : _nodePath.default.join)(base, suffix);
  };
  const isTrustedTmpDir = (st) => {
    return st.isDirectory() && !st.isSymbolicLink() && isSecureDirForUser(st);
  };
  const resolveDirState = (candidatePath) => {
    try {
      if (!isTrustedTmpDir(lstatSync(candidatePath))) return "invalid";
      accessSync(candidatePath, TMP_DIR_ACCESS_MODE);
      return "available";
    } catch (err) {
      if (isNodeErrorWithCode(err, "ENOENT")) return "missing";
      return "invalid";
    }
  };
  const tryRepairWritableBits = (candidatePath) => {
    try {
      const st = lstatSync(candidatePath);
      if (!st.isDirectory() || st.isSymbolicLink()) return false;
      if (uid !== void 0 && typeof st.uid === "number" && st.uid !== uid) return false;
      if (typeof st.mode !== "number") return false;
      if ((st.mode & 18) === 0) return resolveDirState(candidatePath) === "available";
      try {
        chmodSync(candidatePath, 448);
      } catch (chmodErr) {
        if (isNodeErrorWithCode(chmodErr, "EPERM") || isNodeErrorWithCode(chmodErr, "EACCES") || isNodeErrorWithCode(chmodErr, "ENOENT")) return resolveDirState(candidatePath) === "available";
        throw chmodErr;
      }
      warn(`${warningPrefix} tightened permissions on temp dir: ${candidatePath}`);
      return resolveDirState(candidatePath) === "available";
    } catch {
      return false;
    }
  };
  const ensureTrustedFallbackDir = () => {
    const fallbackPath = fallback();
    const state = resolveDirState(fallbackPath);
    if (state === "available") return fallbackPath;
    if (state === "invalid") {
      if (tryRepairWritableBits(fallbackPath)) return fallbackPath;
      throw new Error(`Unsafe fallback ${unsafeFallbackLabel}: ${fallbackPath}`);
    }
    try {
      mkdirSync(fallbackPath, {
        recursive: true,
        mode: 448
      });
      chmodSync(fallbackPath, 448);
    } catch {
      throw new Error(`Unable to create fallback ${unsafeFallbackLabel}: ${fallbackPath}`);
    }
    if (resolveDirState(fallbackPath) !== "available" && !tryRepairWritableBits(fallbackPath)) throw new Error(`Unsafe fallback ${unsafeFallbackLabel}: ${fallbackPath}`);
    return fallbackPath;
  };
  if (options.skipPreferredOnWindows === true && platform === "win32") return ensureTrustedFallbackDir();
  if (!options.preferredDir) return ensureTrustedFallbackDir();
  const existingPreferredState = resolveDirState(options.preferredDir);
  if (existingPreferredState === "available") return options.preferredDir;
  if (existingPreferredState === "invalid") {
    if (tryRepairWritableBits(options.preferredDir)) return options.preferredDir;
    return ensureTrustedFallbackDir();
  }
  try {
    accessSync(_nodePath.default.dirname(options.preferredDir), TMP_DIR_ACCESS_MODE);
    mkdirSync(options.preferredDir, {
      recursive: true,
      mode: 448
    });
    chmodSync(options.preferredDir, 448);
    if (resolveDirState(options.preferredDir) !== "available" && !tryRepairWritableBits(options.preferredDir)) return ensureTrustedFallbackDir();
    return options.preferredDir;
  } catch {
    return ensureTrustedFallbackDir();
  }
}
//#endregion /* v9-ae97466667609078 */
