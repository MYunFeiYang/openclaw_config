"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports._ = mediaKindFromMime;exports.a = imageMimeFromFormat;exports.c = kindFromMime;exports.d = sliceMimeSniffBuffer;exports.f = void 0;exports.g = maxBytesForKind;exports.h = void 0;exports.i = getFileExtension;exports.l = mimeTypeFromFilePath;exports.m = void 0;exports.n = detectMime;exports.o = isAudioFileName;exports.p = void 0;exports.r = extensionForMime;exports.s = isGifMedia;exports.t = void 0;exports.u = normalizeMimeType;var _lazyPromiseSFT4i6yI = require("./lazy-promise-SFT4i6yI.js");
var _nodePath = _interopRequireDefault(require("node:path"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}function _interopRequireWildcard(e, t) {if ("function" == typeof WeakMap) var r = new WeakMap(),n = new WeakMap();return (_interopRequireWildcard = function (e, t) {if (!t && e && e.__esModule) return e;var o,i,f = { __proto__: null, default: e };if (null === e || "object" != typeof e && "function" != typeof e) return f;if (o = t ? n : r) {if (o.has(e)) return o.get(e);o.set(e, f);}for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]);return f;})(e, t);}
//#region src/media/constants.ts
const MAX_IMAGE_BYTES = exports.m = 6 * 1024 * 1024;
const MAX_AUDIO_BYTES = exports.f = 16 * 1024 * 1024;
const MAX_VIDEO_BYTES = exports.h = 16 * 1024 * 1024;
const MAX_DOCUMENT_BYTES = exports.p = 100 * 1024 * 1024;
function mediaKindFromMime(mime) {
  if (!mime) return;
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("video/")) return "video";
  if (mime === "application/pdf") return "document";
  if (mime.startsWith("text/")) return "document";
  if (mime.startsWith("application/")) return "document";
}
function maxBytesForKind(kind) {
  switch (kind) {
    case "image":return MAX_IMAGE_BYTES;
    case "audio":return MAX_AUDIO_BYTES;
    case "video":return MAX_VIDEO_BYTES;
    case "document":return MAX_DOCUMENT_BYTES;
    default:return MAX_DOCUMENT_BYTES;
  }
}
//#endregion
//#region src/media/mime.ts
/** @internal */
const FILE_TYPE_SNIFF_MAX_BYTES = exports.t = 1024 * 1024;
const EXT_BY_MIME = {
  "image/heic": ".heic",
  "image/heif": ".heif",
  "image/bmp": ".bmp",
  "image/jpg": ".jpg",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/svg+xml": ".svg",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "audio/ogg": ".ogg",
  "audio/mpeg": ".mp3",
  "audio/mp3": ".mp3",
  "audio/wav": ".wav",
  "audio/wave": ".wav",
  "audio/x-wav": ".wav",
  "audio/flac": ".flac",
  "audio/aac": ".aac",
  "audio/opus": ".opus",
  "audio/webm": ".webm",
  "audio/x-m4a": ".m4a",
  "audio/mp4": ".m4a",
  "audio/x-caf": ".caf",
  "video/x-msvideo": ".avi",
  "video/mp4": ".mp4",
  "video/x-matroska": ".mkv",
  "video/webm": ".webm",
  "video/x-flv": ".flv",
  "video/x-ms-wmv": ".wmv",
  "video/quicktime": ".mov",
  "application/pdf": ".pdf",
  "application/json": ".json",
  "application/zip": ".zip",
  "application/gzip": ".gz",
  "application/x-tar": ".tar",
  "application/x-7z-compressed": ".7z",
  "application/vnd.rar": ".rar",
  "application/msword": ".doc",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.ms-powerpoint": ".ppt",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
  "text/csv": ".csv",
  "text/plain": ".txt",
  "text/markdown": ".md",
  "text/html": ".html",
  "text/xml": ".xml",
  "text/css": ".css",
  "application/xml": ".xml"
};
function buildMimeByExt() {
  const byExt = {};
  for (const [mime, ext] of Object.entries(EXT_BY_MIME)) byExt[ext] ??= mime;
  return byExt;
}
const MIME_BY_EXT = {
  ...buildMimeByExt(),
  ".jpg": "image/jpeg",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".webm": "video/webm",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript",
  ".log": "text/plain",
  ".htm": "text/html",
  ".xml": "text/xml"
};
const AUDIO_FILE_EXTENSIONS = new Set([
".aac",
".caf",
".flac",
".m4a",
".mp3",
".oga",
".ogg",
".opus",
".wav"]
);
const fileTypeModuleLoader = (0, _lazyPromiseSFT4i6yI.t)(() => Promise.resolve().then(() => jitiImport("file-type").then((m) => _interopRequireWildcard(m))));
function normalizeMimeType(mime) {
  if (!mime) return;
  const cleaned = mime.split(";")[0]?.trim().toLowerCase();
  if (cleaned === "image/apng") return "image/png";
  return cleaned || void 0;
}
/** @internal */
function sliceMimeSniffBuffer(buffer) {
  if (buffer.byteLength <= 1048576) return buffer;
  return buffer.subarray(0, FILE_TYPE_SNIFF_MAX_BYTES);
}
async function sniffMime(buffer) {
  if (!buffer) return;
  try {
    const { fileTypeFromBuffer } = await fileTypeModuleLoader.load();
    const type = await fileTypeFromBuffer(sliceMimeSniffBuffer(buffer));
    if (type?.mime) return normalizeMimeType(type.mime);
  } catch {}
  return sniffKnownAudioMagic(buffer);
}
function sniffKnownAudioMagic(buffer) {
  if (buffer.byteLength >= 4 && buffer.toString("ascii", 0, 4) === "caff") return "audio/x-caf";
}
function getFileExtension(filePath) {
  if (!filePath) return;
  try {
    if (/^https?:\/\//i.test(filePath)) {
      const url = new URL(filePath);
      return _nodePath.default.extname(url.pathname).toLowerCase() || void 0;
    }
  } catch {}
  return _nodePath.default.extname(filePath).toLowerCase() || void 0;
}
function mimeTypeFromFilePath(filePath) {
  const ext = getFileExtension(filePath);
  if (!ext) return;
  return MIME_BY_EXT[ext];
}
function isAudioFileName(fileName) {
  const ext = getFileExtension(fileName);
  if (!ext) return false;
  return AUDIO_FILE_EXTENSIONS.has(ext);
}
function detectMime(opts) {
  return detectMimeImpl(opts);
}
function isGenericMime(mime) {
  if (!mime) return true;
  const m = mime.toLowerCase();
  return m === "application/octet-stream" || m === "application/zip";
}
function isImageMime(mime) {
  return mediaKindFromMime(normalizeMimeType(mime)) === "image";
}
async function detectMimeImpl(opts) {
  const ext = getFileExtension(opts.filePath);
  const extMime = ext ? MIME_BY_EXT[ext] : void 0;
  const headerMime = normalizeMimeType(opts.headerMime);
  const sniffed = await sniffMime(opts.buffer);
  const sniffedGenericContainer = sniffed && isGenericMime(sniffed);
  const trustedExtMime = sniffedGenericContainer && isImageMime(extMime) ? void 0 : extMime;
  const trustedHeaderMime = sniffedGenericContainer && isImageMime(headerMime) ? void 0 : headerMime;
  if (sniffed && (!isGenericMime(sniffed) || !trustedExtMime)) return sniffed;
  if (trustedExtMime) return trustedExtMime;
  if (trustedHeaderMime && !isGenericMime(trustedHeaderMime)) return trustedHeaderMime;
  if (sniffed) return sniffed;
  if (trustedHeaderMime) return trustedHeaderMime;
}
function extensionForMime(mime) {
  const normalized = normalizeMimeType(mime);
  if (!normalized) return;
  return EXT_BY_MIME[normalized];
}
function isGifMedia(opts) {
  if (opts.contentType?.toLowerCase() === "image/gif") return true;
  return getFileExtension(opts.fileName) === ".gif";
}
function imageMimeFromFormat(format) {
  if (!format) return;
  switch (format.toLowerCase()) {
    case "jpg":
    case "jpeg":return "image/jpeg";
    case "heic":return "image/heic";
    case "heif":return "image/heif";
    case "png":return "image/png";
    case "webp":return "image/webp";
    case "gif":return "image/gif";
    default:return;
  }
}
function kindFromMime(mime) {
  return mediaKindFromMime(normalizeMimeType(mime));
}
//#endregion /* v9-a85c946ecdaa3dd6 */
