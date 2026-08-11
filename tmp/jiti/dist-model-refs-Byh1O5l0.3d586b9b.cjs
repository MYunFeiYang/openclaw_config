"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = collectConfiguredModelRefs;exports.t = void 0;var _utilsCKsuXgDI = require("./utils-CKsuXgDI.js");
//#region src/config/model-refs.ts
const AGENT_MODEL_CONFIG_KEYS = exports.t = [
"model",
"imageModel",
"imageGenerationModel",
"videoGenerationModel",
"musicGenerationModel",
"pdfModel"];

function collectConfiguredModelRefs(config, options = {}) {
  const refs = [];
  const pushModelRef = (path, value) => {
    if (typeof value === "string" && value.trim()) refs.push({
      path,
      value: value.trim()
    });
  };
  const collectModelConfig = (path, value) => {
    if (typeof value === "string") {
      pushModelRef(path, value);
      return;
    }
    if (!(0, _utilsCKsuXgDI.c)(value)) return;
    pushModelRef(`${path}.primary`, value.primary);
    if (Array.isArray(value.fallbacks)) for (const [index, entry] of value.fallbacks.entries()) pushModelRef(`${path}.fallbacks.${index}`, entry);
  };
  const collectFromAgent = (path, agent) => {
    if (!(0, _utilsCKsuXgDI.c)(agent)) return;
    for (const key of AGENT_MODEL_CONFIG_KEYS) collectModelConfig(`${path}.${key}`, agent[key]);
    pushModelRef(`${path}.heartbeat.model`, (0, _utilsCKsuXgDI.c)(agent.heartbeat) ? agent.heartbeat.model : void 0);
    collectModelConfig(`${path}.subagents.model`, (0, _utilsCKsuXgDI.c)(agent.subagents) ? agent.subagents.model : void 0);
    if ((0, _utilsCKsuXgDI.c)(agent.compaction)) {
      pushModelRef(`${path}.compaction.model`, agent.compaction.model);
      pushModelRef(`${path}.compaction.memoryFlush.model`, (0, _utilsCKsuXgDI.c)(agent.compaction.memoryFlush) ? agent.compaction.memoryFlush.model : void 0);
    }
    if ((0, _utilsCKsuXgDI.c)(agent.models)) for (const modelRef of Object.keys(agent.models)) pushModelRef(`${path}.models.${modelRef}`, modelRef);
  };
  const root = (0, _utilsCKsuXgDI.c)(config) ? config : {};
  const agents = (0, _utilsCKsuXgDI.c)(root.agents) ? root.agents : {};
  collectFromAgent("agents.defaults", agents.defaults);
  if (Array.isArray(agents.list)) for (const [index, entry] of agents.list.entries()) collectFromAgent(`agents.list.${index}`, entry);
  if (options.includeChannelModelOverrides !== false) {
    const channels = (0, _utilsCKsuXgDI.c)(root.channels) ? root.channels : {};
    const modelByChannel = (0, _utilsCKsuXgDI.c)(channels.modelByChannel) ? channels.modelByChannel : {};
    for (const [channelId, channelMap] of Object.entries(modelByChannel)) {
      if (!(0, _utilsCKsuXgDI.c)(channelMap)) continue;
      for (const [targetId, modelRef] of Object.entries(channelMap)) pushModelRef(`channels.modelByChannel.${channelId}.${targetId}`, modelRef);
    }
  }
  const hooks = (0, _utilsCKsuXgDI.c)(root.hooks) ? root.hooks : {};
  if (Array.isArray(hooks.mappings)) for (const [index, mapping] of hooks.mappings.entries()) pushModelRef(`hooks.mappings.${index}.model`, (0, _utilsCKsuXgDI.c)(mapping) ? mapping.model : void 0);
  pushModelRef("hooks.gmail.model", (0, _utilsCKsuXgDI.c)(hooks.gmail) ? hooks.gmail.model : void 0);
  pushModelRef("messages.tts.summaryModel", (0, _utilsCKsuXgDI.c)(root.messages) && (0, _utilsCKsuXgDI.c)(root.messages.tts) ? root.messages.tts.summaryModel : void 0);
  pushModelRef("channels.discord.voice.model", (0, _utilsCKsuXgDI.c)(root.channels) && (0, _utilsCKsuXgDI.c)(root.channels.discord) && (0, _utilsCKsuXgDI.c)(root.channels.discord.voice) ? root.channels.discord.voice.model : void 0);
  return refs;
}
//#endregion /* v9-b08894750d2fafe9 */
