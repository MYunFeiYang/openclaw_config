"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = runCommandWithRuntime;exports.r = withManager;exports.t = resolveOptionFromCommand;require("./errors-g8SYDTCe.js");
//#region src/cli/cli-utils.ts
async function withManager(params) {
  const { manager, error } = await params.getManager();
  if (!manager) {
    params.onMissing(error);
    return;
  }
  try {
    await params.run(manager);
  } finally {
    try {
      await params.close(manager);
    } catch (err) {
      params.onCloseError?.(err);
    }
  }
}
async function runCommandWithRuntime(runtime, action, onError) {
  try {
    await action();
  } catch (err) {
    if (onError) {
      onError(err);
      return;
    }
    runtime.error(String(err));
    runtime.exit(1);
  }
}
function resolveOptionFromCommand(command, key) {
  let current = command;
  while (current) {
    const opts = current.opts?.() ?? {};
    if (opts[key] !== void 0) return opts[key];
    current = current.parent ?? void 0;
  }
}
//#endregion /* v9-3fbe88b05f901e18 */
