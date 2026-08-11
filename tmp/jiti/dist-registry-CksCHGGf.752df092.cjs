"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = unregisterAcpRuntimeBackend;exports.i = void 0;exports.n = registerAcpRuntimeBackend;exports.r = requireAcpRuntimeBackend;exports.t = getAcpRuntimeBackend;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
var _globalSingletonB2nbp4Tq = require("./global-singleton-B2nbp4Tq.js");
var _errorsCxRPaST = require("./errors-CxRPaST6.js");
//#region src/acp/runtime/registry.ts
const ACP_RUNTIME_REGISTRY_STATE_KEY = Symbol.for("openclaw.acpRuntimeRegistryState");
function resolveAcpRuntimeRegistryGlobalState() {
  const processStore = process;
  const existing = processStore[ACP_RUNTIME_REGISTRY_STATE_KEY];
  if (existing) return existing;
  const created = (0, _globalSingletonB2nbp4Tq.n)(ACP_RUNTIME_REGISTRY_STATE_KEY, () => ({ backendsById: /* @__PURE__ */new Map() }));
  processStore[ACP_RUNTIME_REGISTRY_STATE_KEY] = created;
  return created;
}
const ACP_BACKENDS_BY_ID = resolveAcpRuntimeRegistryGlobalState().backendsById;
function isBackendHealthy(backend) {
  if (!backend.healthy) return true;
  try {
    return backend.healthy();
  } catch {
    return false;
  }
}
function registerAcpRuntimeBackend(backend) {
  const id = (0, _stringCoerceLndEvhRk.s)(backend.id) || "";
  if (!id) throw new Error("ACP runtime backend id is required");
  if (!backend.runtime) throw new Error(`ACP runtime backend "${id}" is missing runtime implementation`);
  ACP_BACKENDS_BY_ID.set(id, {
    ...backend,
    id
  });
}
function unregisterAcpRuntimeBackend(id) {
  const normalized = (0, _stringCoerceLndEvhRk.s)(id) || "";
  if (!normalized) return;
  ACP_BACKENDS_BY_ID.delete(normalized);
}
function getAcpRuntimeBackend(id) {
  const normalized = (0, _stringCoerceLndEvhRk.s)(id) || "";
  if (normalized) return ACP_BACKENDS_BY_ID.get(normalized) ?? null;
  if (ACP_BACKENDS_BY_ID.size === 0) return null;
  for (const backend of ACP_BACKENDS_BY_ID.values()) if (isBackendHealthy(backend)) return backend;
  return ACP_BACKENDS_BY_ID.values().next().value ?? null;
}
function requireAcpRuntimeBackend(id) {
  const normalized = (0, _stringCoerceLndEvhRk.s)(id) || "";
  const backend = getAcpRuntimeBackend(normalized || void 0);
  if (!backend) throw new _errorsCxRPaST.n("ACP_BACKEND_MISSING", "ACP runtime backend is not configured. Install and enable the acpx runtime plugin.");
  if (!isBackendHealthy(backend)) throw new _errorsCxRPaST.n("ACP_BACKEND_UNAVAILABLE", "ACP runtime backend is currently unavailable. Try again in a moment.");
  if (normalized && backend.id !== normalized) throw new _errorsCxRPaST.n("ACP_BACKEND_MISSING", `ACP runtime backend "${normalized}" is not registered.`);
  return backend;
}
const testing = exports.i = {
  resetAcpRuntimeBackendsForTests() {
    ACP_BACKENDS_BY_ID.clear();
  },
  getAcpRuntimeRegistryGlobalStateForTests() {
    return resolveAcpRuntimeRegistryGlobalState();
  }
};
//#endregion /* v9-48d0f331e5b57590 */
