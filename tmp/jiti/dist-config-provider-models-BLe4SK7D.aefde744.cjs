"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = normalizeMediaProviderId;exports.t = resolveImageCapableConfigProviderIds;var _providerIdDMUF3fJY = require("./provider-id-DMUF3fJY.js");
//#region src/media-understanding/provider-id.ts
function normalizeMediaProviderId(id) {
  const normalized = (0, _providerIdDMUF3fJY.r)(id);
  if (normalized === "gemini") return "google";
  return normalized;
}
//#endregion
//#region src/media-understanding/config-provider-models.ts
function hasImageCapableModel(providerCfg) {
  return (providerCfg.models ?? []).some((model) => Array.isArray(model?.input) && model.input.includes("image"));
}
function resolveImageCapableConfigProviderIds(cfg) {
  const configProviders = cfg?.models?.providers;
  if (!configProviders || typeof configProviders !== "object") return [];
  const providerIds = [];
  for (const [providerKey, providerCfg] of Object.entries(configProviders)) {
    if (!providerKey?.trim() || !hasImageCapableModel(providerCfg)) continue;
    providerIds.push(normalizeMediaProviderId(providerKey));
  }
  return providerIds;
}
//#endregion /* v9-0e1f3220bee170e6 */
