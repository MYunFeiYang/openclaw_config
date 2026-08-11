"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.i = signalVerifiedGatewayPidSync;exports.n = formatGatewayPidList;exports.r = readGatewayProcessArgsSync;exports.t = findVerifiedGatewayListenerPidsOnPortSync;var _gatewayProcessArgvCCetDqqU = require("./gateway-process-argv-CCetDqqU.js");
var _restartStalePidsNnyHR5tg = require("./restart-stale-pids-nnyHR5tg.js");
var _nodeFs = _interopRequireDefault(require("node:fs"));
var _nodeChild_process = require("node:child_process");function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}
//#region src/infra/gateway-processes.ts
function readGatewayProcessArgsSync(pid) {
  if (process.platform === "linux") try {
    return (0, _gatewayProcessArgvCCetDqqU.n)(_nodeFs.default.readFileSync(`/proc/${pid}/cmdline`, "utf8"));
  } catch {
    return null;
  }
  if (process.platform === "darwin") {
    const ps = (0, _nodeChild_process.spawnSync)("ps", [
    "-o",
    "command=",
    "-p",
    String(pid)],
    {
      encoding: "utf8",
      timeout: 1e3
    });
    if (ps.error || ps.status !== 0) return null;
    const command = ps.stdout.trim();
    return command ? command.split(/\s+/) : null;
  }
  if (process.platform === "win32") return (0, _restartStalePidsNnyHR5tg.a)(pid);
  return null;
}
function signalVerifiedGatewayPidSync(pid, signal) {
  const args = readGatewayProcessArgsSync(pid);
  if (!args || !(0, _gatewayProcessArgvCCetDqqU.t)(args, { allowGatewayBinary: true })) throw new Error(`refusing to signal non-gateway process pid ${pid}`);
  process.kill(pid, signal);
}
function findVerifiedGatewayListenerPidsOnPortSync(port) {
  const rawPids = process.platform === "win32" ? (0, _restartStalePidsNnyHR5tg.i)(port) : (0, _restartStalePidsNnyHR5tg.n)(port);
  return Array.from(new Set(rawPids)).filter((pid) => Number.isFinite(pid) && pid > 0 && pid !== process.pid).filter((pid) => {
    const args = readGatewayProcessArgsSync(pid);
    return args != null && (0, _gatewayProcessArgvCCetDqqU.t)(args, { allowGatewayBinary: true });
  });
}
function formatGatewayPidList(pids) {
  return pids.join(", ");
}
//#endregion /* v9-35214166fdbd84a3 */
