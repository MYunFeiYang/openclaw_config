"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.createAcpxRuntimeService = createAcpxRuntimeService;var _acpRuntimeBackend = require("openclaw/plugin-sdk/acp-runtime-backend");function _interopRequireWildcard(e, t) {if ("function" == typeof WeakMap) var r = new WeakMap(),n = new WeakMap();return (_interopRequireWildcard = function (e, t) {if (!t && e && e.__esModule) return e;var o,i,f = { __proto__: null, default: e };if (null === e || "object" != typeof e && "function" != typeof e) return f;if (o = t ? n : r) {if (o.has(e)) return o.get(e);o.set(e, f);}for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]);return f;})(e, t);}
//#region extensions/acpx/register.runtime.ts
const ACPX_BACKEND_ID = "acpx";
let serviceModulePromise = null;
function loadServiceModule() {
  serviceModulePromise ??= Promise.resolve().then(() => jitiImport("./service-CeDUeFlN.js").then((m) => _interopRequireWildcard(m)));
  return serviceModulePromise;
}
async function startRealService(state) {
  if (state.realRuntime) return state.realRuntime;
  if (!state.ctx) throw new Error("ACPX runtime service is not started");
  state.startPromise ??= (async () => {
    const { createAcpxRuntimeService } = await loadServiceModule();
    const service = createAcpxRuntimeService(state.params);
    state.realService = service;
    await service.start(state.ctx);
    const backend = (0, _acpRuntimeBackend.getAcpRuntimeBackend)(ACPX_BACKEND_ID);
    if (!backend?.runtime) throw new Error("ACPX runtime service did not register an ACP backend");
    state.realRuntime = backend.runtime;
    return state.realRuntime;
  })();
  return await state.startPromise;
}
function createAcpxRuntimeService(params = {}) {
  const state = {
    ctx: null,
    params,
    realRuntime: null,
    realService: null,
    startPromise: null
  };
  return {
    id: "acpx-runtime",
    async start(ctx) {
      if (process.env.OPENCLAW_SKIP_ACPX_RUNTIME === "1") {
        ctx.logger.info("skipping embedded acpx runtime backend (OPENCLAW_SKIP_ACPX_RUNTIME=1)");
        return;
      }
      state.ctx = ctx;
      await startRealService(state);
    },
    async stop(ctx) {
      if (state.realService) await state.realService.stop?.(ctx);else
      (0, _acpRuntimeBackend.unregisterAcpRuntimeBackend)(ACPX_BACKEND_ID);
      state.ctx = null;
      state.realRuntime = null;
      state.realService = null;
      state.startPromise = null;
    }
  };
}
//#endregion /* v9-490054192752ba7e */
