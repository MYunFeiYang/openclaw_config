"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = logWarn;exports.i = logSuccess;exports.n = logError;exports.r = logInfo;exports.t = logDebug;var _themeCStEj1vt = require("./theme-CStEj1vt.js");
var _runtimeDDH_zqCr = require("./runtime-DDH_zqCr.js");
var _loggerD7Ndr2M = require("./logger-D7Ndr2M8.js");
var _subsystemCH8Q21Y = require("./subsystem-C-H8Q21Y.js");
//#region src/logger.ts
const subsystemPrefixRe = /^([a-z][a-z0-9-]{1,20}):\s+(.*)$/i;
function splitSubsystem(message) {
  const match = message.match(subsystemPrefixRe);
  if (!match) return null;
  const [, subsystem, rest] = match;
  return {
    subsystem,
    rest
  };
}
function logWithSubsystem(params) {
  const parsed = params.runtime === _runtimeDDH_zqCr.n ? splitSubsystem(params.message) : null;
  if (parsed) {
    (0, _subsystemCH8Q21Y.t)(parsed.subsystem)[params.subsystemMethod](parsed.rest);
    return;
  }
  params.runtime[params.runtimeMethod](params.runtimeFormatter(params.message));
  (0, _loggerD7Ndr2M.i)()[params.loggerMethod](params.message);
}
const info = _themeCStEj1vt.r.info;
const warn = _themeCStEj1vt.r.warn;
const success = _themeCStEj1vt.r.success;
const danger = _themeCStEj1vt.r.error;
function logInfo(message, runtime = _runtimeDDH_zqCr.n) {
  logWithSubsystem({
    message,
    runtime,
    runtimeMethod: "log",
    runtimeFormatter: info,
    loggerMethod: "info",
    subsystemMethod: "info"
  });
}
function logWarn(message, runtime = _runtimeDDH_zqCr.n) {
  logWithSubsystem({
    message,
    runtime,
    runtimeMethod: "log",
    runtimeFormatter: warn,
    loggerMethod: "warn",
    subsystemMethod: "warn"
  });
}
function logSuccess(message, runtime = _runtimeDDH_zqCr.n) {
  logWithSubsystem({
    message,
    runtime,
    runtimeMethod: "log",
    runtimeFormatter: success,
    loggerMethod: "info",
    subsystemMethod: "info"
  });
}
function logError(message, runtime = _runtimeDDH_zqCr.n) {
  logWithSubsystem({
    message,
    runtime,
    runtimeMethod: "error",
    runtimeFormatter: danger,
    loggerMethod: "error",
    subsystemMethod: "error"
  });
}
function logDebug(message) {
  (0, _loggerD7Ndr2M.i)().debug(message);
  if ((0, _loggerD7Ndr2M.b)()) console.log(_themeCStEj1vt.r.muted(message));
}
//#endregion /* v9-1306b68f6573fecf */
