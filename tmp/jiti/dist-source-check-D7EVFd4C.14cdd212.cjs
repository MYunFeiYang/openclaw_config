"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.t = hasAnyAuthProfileStoreSource;var _runtimeSnapshotsBSv4EtU = require("./runtime-snapshots-B-sv4EtU.js");
var _nodeFs = _interopRequireDefault(require("node:fs"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}
//#region src/agents/auth-profiles/source-check.ts
function hasStoredAuthProfileFiles(agentDir) {
  return _nodeFs.default.existsSync((0, _runtimeSnapshotsBSv4EtU.l)(agentDir)) || _nodeFs.default.existsSync((0, _runtimeSnapshotsBSv4EtU.s)(agentDir)) || _nodeFs.default.existsSync((0, _runtimeSnapshotsBSv4EtU.d)(agentDir));
}
function hasAnyAuthProfileStoreSource(agentDir) {
  if ((0, _runtimeSnapshotsBSv4EtU.r)(agentDir)) return true;
  if (hasStoredAuthProfileFiles(agentDir)) return true;
  const authPath = (0, _runtimeSnapshotsBSv4EtU.l)(agentDir);
  const mainAuthPath = (0, _runtimeSnapshotsBSv4EtU.l)();
  if (agentDir && authPath !== mainAuthPath && hasStoredAuthProfileFiles(void 0)) return true;
  return false;
}
//#endregion /* v9-0a0f0eef0841998c */
