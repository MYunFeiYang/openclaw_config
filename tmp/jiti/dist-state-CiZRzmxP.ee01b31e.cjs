"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.t = void 0; //#region src/logging/state.ts
const loggingState = exports.t = {
  cachedLogger: null,
  cachedSettings: null,
  cachedConsoleSettings: null,
  overrideSettings: null,
  invalidEnvLogLevelValue: null,
  consolePatched: false,
  forceConsoleToStderr: false,
  consoleTimestampPrefix: false,
  consoleSubsystemFilter: null,
  resolvingConsoleSettings: false,
  streamErrorHandlersInstalled: false,
  rawConsole: null
};
//#endregion /* v9-43c7ce5f41420bdb */
