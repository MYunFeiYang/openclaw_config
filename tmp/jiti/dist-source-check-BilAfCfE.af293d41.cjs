"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.t = hasAnyAuthProfileStoreSource;var _runtimeSnapshotsCbKCG9ZW = require("./runtime-snapshots-CbKCG9ZW.js");
var _nodeFs = _interopRequireDefault(require("node:fs"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}
//#region src/agents/auth-profiles/source-check.ts
function hasStoredAuthProfileFiles(agentDir) {
  return _nodeFs.default.existsSync((0, _runtimeSnapshotsCbKCG9ZW.l)(agentDir)) || _nodeFs.default.existsSync((0, _runtimeSnapshotsCbKCG9ZW.s)(agentDir)) || _nodeFs.default.existsSync((0, _runtimeSnapshotsCbKCG9ZW.d)(agentDir));
}
function hasAnyAuthProfileStoreSource(agentDir) {
  if ((0, _runtimeSnapshotsCbKCG9ZW.r)(agentDir)) return true;
  if (hasStoredAuthProfileFiles(agentDir)) return true;
  const authPath = (0, _runtimeSnapshotsCbKCG9ZW.l)(agentDir);
  const mainAuthPath = (0, _runtimeSnapshotsCbKCG9ZW.l)();
  if (agentDir && authPath !== mainAuthPath && hasStoredAuthProfileFiles(void 0)) return true;
  return false;
}
//#endregion /* v9-c5b0ca17424905ad */
