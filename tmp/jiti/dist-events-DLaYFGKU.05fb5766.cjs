"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.i = resolveMemoryHostEventLogPath;exports.n = appendMemoryHostEvent;exports.r = readMemoryHostEvents;exports.t = void 0;var _nodePath = _interopRequireDefault(require("node:path"));
var _promises = _interopRequireDefault(require("node:fs/promises"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}
//#region src/memory-host-sdk/events.ts
const MEMORY_HOST_EVENT_LOG_RELATIVE_PATH = exports.t = _nodePath.default.join("memory", ".dreams", "events.jsonl");
function resolveMemoryHostEventLogPath(workspaceDir) {
  return _nodePath.default.join(workspaceDir, MEMORY_HOST_EVENT_LOG_RELATIVE_PATH);
}
async function appendMemoryHostEvent(workspaceDir, event) {
  const eventLogPath = resolveMemoryHostEventLogPath(workspaceDir);
  await _promises.default.mkdir(_nodePath.default.dirname(eventLogPath), { recursive: true });
  await _promises.default.appendFile(eventLogPath, `${JSON.stringify(event)}\n`, "utf8");
}
async function readMemoryHostEvents(params) {
  const eventLogPath = resolveMemoryHostEventLogPath(params.workspaceDir);
  const raw = await _promises.default.readFile(eventLogPath, "utf8").catch((err) => {
    if (err?.code === "ENOENT") return "";
    throw err;
  });
  if (!raw.trim()) return [];
  const events = raw.split("\n").map((line) => line.trim()).filter(Boolean).flatMap((line) => {
    try {
      return [JSON.parse(line)];
    } catch {
      return [];
    }
  });
  if (!Number.isFinite(params.limit)) return events;
  const limit = Math.max(0, Math.floor(params.limit));
  return limit === 0 ? [] : events.slice(-limit);
}
//#endregion /* v9-fc9fa2ca6d17bac8 */
