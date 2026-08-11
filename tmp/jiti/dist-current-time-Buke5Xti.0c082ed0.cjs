"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = resolveCronStyleNow;exports.t = appendCronStyleCurrentTimeLine;var _dateTimeBlRL_Bre = require("./date-time-BlRL_Bre.js");
//#region src/agents/current-time.ts
function resolveCronStyleNow(cfg, nowMs) {
  const userTimezone = (0, _dateTimeBlRL_Bre.i)(cfg.agents?.defaults?.userTimezone);
  const userTimeFormat = (0, _dateTimeBlRL_Bre.r)(cfg.agents?.defaults?.timeFormat);
  const formattedTime = (0, _dateTimeBlRL_Bre.t)(new Date(nowMs), userTimezone, userTimeFormat) ?? new Date(nowMs).toISOString();
  return {
    userTimezone,
    formattedTime,
    timeLine: `Current time: ${formattedTime} (${userTimezone}) / ${new Date(nowMs).toISOString().replace("T", " ").slice(0, 16) + " UTC"}`
  };
}
function appendCronStyleCurrentTimeLine(text, cfg, nowMs) {
  const base = text.trimEnd();
  if (!base || base.includes("Current time:")) return base;
  const { timeLine } = resolveCronStyleNow(cfg, nowMs);
  return `${base}\n${timeLine}`;
}
//#endregion /* v9-50b2de5a18dd6ad4 */
