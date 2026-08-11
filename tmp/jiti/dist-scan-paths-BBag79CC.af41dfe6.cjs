"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.t = extensionUsesSkippedScannerPath;require("./path-safety-BSMeaGzV.js");
//#region src/security/scan-paths.ts
function extensionUsesSkippedScannerPath(entry) {
  return entry.split(/[\\/]+/).filter(Boolean).some((segment) => segment === "node_modules" || segment.startsWith(".") && segment !== "." && segment !== "..");
}
//#endregion /* v9-0a4e71c8b4759b6c */
