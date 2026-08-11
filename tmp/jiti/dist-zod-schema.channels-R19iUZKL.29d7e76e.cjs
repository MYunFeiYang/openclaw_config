"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.t = exports.n = void 0;var _schemasBmna8ihM = require("./schemas-Bmna8ihM.js");
//#region src/config/zod-schema.channels.ts
const ChannelHeartbeatVisibilitySchema = exports.n = (0, _schemasBmna8ihM.Tn)({
  showOk: (0, _schemasBmna8ihM.At)().optional(),
  showAlerts: (0, _schemasBmna8ihM.At)().optional(),
  useIndicator: (0, _schemasBmna8ihM.At)().optional()
}).strict().optional();
const ChannelHealthMonitorSchema = exports.t = (0, _schemasBmna8ihM.Tn)({ enabled: (0, _schemasBmna8ihM.At)().optional() }).strict().optional();
//#endregion /* v9-3e0c76c98215522c */
