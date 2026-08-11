"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = void 0;exports.c = hasCopilotVisionInput;exports.n = exports.i = void 0;exports.o = buildCopilotDynamicHeaders;exports.r = void 0;exports.s = buildCopilotIdeHeaders;exports.t = void 0; //#region src/agents/copilot-dynamic-headers.ts
/** @deprecated GitHub Copilot provider-owned helper; do not use from third-party plugins. */
const COPILOT_EDITOR_VERSION = exports.n = "vscode/1.107.0";
/** @deprecated GitHub Copilot provider-owned helper; do not use from third-party plugins. */
const COPILOT_USER_AGENT = exports.a = "GitHubCopilotChat/0.35.0";
/** @deprecated GitHub Copilot provider-owned helper; do not use from third-party plugins. */
const COPILOT_EDITOR_PLUGIN_VERSION = exports.t = "copilot-chat/0.35.0";
/** @deprecated GitHub Copilot provider-owned helper; do not use from third-party plugins. */
const COPILOT_GITHUB_API_VERSION = exports.r = "2025-04-01";
/** @deprecated GitHub Copilot provider-owned helper; do not use from third-party plugins. */
const COPILOT_INTEGRATION_ID = exports.i = "vscode-chat";
/** @deprecated GitHub Copilot provider-owned helper; do not use from third-party plugins. */
function buildCopilotIdeHeaders(params = {}) {
  return {
    "Accept-Encoding": "identity",
    "Editor-Version": COPILOT_EDITOR_VERSION,
    "Editor-Plugin-Version": COPILOT_EDITOR_PLUGIN_VERSION,
    "User-Agent": COPILOT_USER_AGENT,
    ...(params.includeApiVersion ? { "X-Github-Api-Version": COPILOT_GITHUB_API_VERSION } : {})
  };
}
function inferCopilotInitiator(messages) {
  const last = messages[messages.length - 1];
  if (!last) return "user";
  if (last.role === "user" && containsCopilotContentType(last.content, "tool_result")) return "agent";
  return last.role === "user" ? "user" : "agent";
}
function containsCopilotContentType(value, type) {
  if (Array.isArray(value)) return value.some((item) => containsCopilotContentType(item, type));
  if (!value || typeof value !== "object") return false;
  const entry = value;
  return entry.type === type || containsCopilotContentType(entry.content, type);
}
function hasCopilotVisionInput(messages) {
  return messages.some((message) => {
    if (message.role === "user" && Array.isArray(message.content)) return message.content.some((item) => containsCopilotContentType(item, "image"));
    if (message.role === "toolResult" && Array.isArray(message.content)) return message.content.some((item) => containsCopilotContentType(item, "image"));
    return false;
  });
}
function buildCopilotDynamicHeaders(params) {
  return {
    ...buildCopilotIdeHeaders(),
    "Copilot-Integration-Id": COPILOT_INTEGRATION_ID,
    "Openai-Organization": "github-copilot",
    "x-initiator": inferCopilotInitiator(params.messages),
    ...(params.hasImages ? { "Copilot-Vision-Request": "true" } : {})
  };
}
//#endregion /* v9-8228e674e49ee160 */
