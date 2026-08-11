"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = parseProcCmdline;exports.r = parseWindowsCmdline;exports.t = isGatewayArgv;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
//#region src/infra/gateway-process-argv.ts
function normalizeProcArg(arg) {
  return (0, _stringCoerceLndEvhRk.a)(arg.replaceAll("\\", "/"));
}
function parseProcCmdline(raw) {
  return raw.split("\0").map((entry) => entry.trim()).filter(Boolean);
}
/**
* Parse a Windows command line string into argv-style tokens,
* handling double-quoted paths (e.g. `"C:\Program Files\node.exe" gateway run`).
*/
function parseWindowsCmdline(raw) {
  const args = [];
  let current = "";
  let inQuote = false;
  for (const char of raw) if (char === "\"") inQuote = !inQuote;else
  if (char === " " && !inQuote) {
    if (current) {
      args.push(current);
      current = "";
    }
  } else current += char;
  if (current) args.push(current);
  return args;
}
function isGatewayArgv(args, opts) {
  const normalized = args.map(normalizeProcArg);
  if (!normalized.includes("gateway")) return false;
  const entryCandidates = [
  "dist/index.js",
  "dist/entry.js",
  "openclaw.mjs",
  "scripts/run-node.mjs",
  "src/entry.ts",
  "src/index.ts"];

  if (normalized.some((arg) => entryCandidates.some((entry) => arg.endsWith(entry)))) return true;
  const exe = (normalized[0] ?? "").replace(/\.(bat|cmd|exe)$/i, "");
  return exe.endsWith("/openclaw") || exe === "openclaw" || opts?.allowGatewayBinary === true && exe.endsWith("/openclaw-gateway");
}
//#endregion /* v9-1b7820a0e198a54f */
