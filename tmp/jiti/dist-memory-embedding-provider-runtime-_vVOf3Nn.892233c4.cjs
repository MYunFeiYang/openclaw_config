"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = listMemoryEmbeddingProviders;exports.r = listRegisteredMemoryEmbeddingProviderAdapters;exports.t = getMemoryEmbeddingProvider;var _providerIdDMUF3fJY = require("./provider-id-DMUF3fJY.js");
var _memoryEmbeddingProvidersD8pp5pMx = require("./memory-embedding-providers-D8pp5pMx.js");
var _capabilityProviderRuntimeD2czy7T_ = require("./capability-provider-runtime-D2czy7T_.js");
//#region src/plugins/memory-embedding-provider-runtime.ts
function listRegisteredMemoryEmbeddingProviderAdapters() {
  return (0, _memoryEmbeddingProvidersD8pp5pMx.a)().map((entry) => entry.adapter);
}
function listMemoryEmbeddingProviders(cfg) {
  const registered = listRegisteredMemoryEmbeddingProviderAdapters();
  const merged = new Map(registered.map((adapter) => [adapter.id, adapter]));
  for (const adapter of (0, _capabilityProviderRuntimeD2czy7T_.n)({
    key: "memoryEmbeddingProviders",
    cfg
  })) if (!merged.has(adapter.id)) merged.set(adapter.id, adapter);
  return [...merged.values()];
}
function readConfiguredProviderApiId(providerId, cfg) {
  const providers = cfg?.models?.providers;
  if (!providers) return;
  const normalized = (0, _providerIdDMUF3fJY.r)(providerId);
  const api = (providers[providerId] ?? Object.entries(providers).find(([candidateId]) => (0, _providerIdDMUF3fJY.r)(candidateId) === normalized)?.[1])?.api?.trim();
  if (!api) return;
  const normalizedApi = (0, _providerIdDMUF3fJY.r)(api);
  return normalizedApi && normalizedApi !== normalized ? normalizedApi : void 0;
}
function resolveMemoryEmbeddingProviderLookupIds(id, cfg) {
  const ids = [id];
  const apiId = readConfiguredProviderApiId(id, cfg);
  if (apiId && !ids.some((candidate) => (0, _providerIdDMUF3fJY.r)(candidate) === apiId)) ids.push(apiId);
  return ids;
}
function getMemoryEmbeddingProvider(id, cfg) {
  const ids = resolveMemoryEmbeddingProviderLookupIds(id, cfg);
  for (const candidateId of ids) {
    const registered = (0, _memoryEmbeddingProvidersD8pp5pMx.r)(candidateId);
    if (registered) return registered.adapter;
  }
  for (const candidateId of ids) {
    const provider = (0, _capabilityProviderRuntimeD2czy7T_.t)({
      key: "memoryEmbeddingProviders",
      providerId: candidateId,
      cfg
    });
    if (provider) return provider;
  }
}
//#endregion /* v9-ed3d18d4a38177ec */
