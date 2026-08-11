"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = prepareProviderRuntimeAuth;exports.i = formatProviderAuthProfileApiKeyWithPlugin;exports.n = buildProviderAuthDoctorHintWithPlugin;exports.o = refreshProviderOAuthCredentialWithPlugin;exports.r = buildProviderMissingAuthMessageWithPlugin;exports.t = augmentModelCatalogWithProviderPlugins;var _lazyPromiseSFT4i6yI = require("./lazy-promise-SFT4i6yI.js");function _interopRequireWildcard(e, t) {if ("function" == typeof WeakMap) var r = new WeakMap(),n = new WeakMap();return (_interopRequireWildcard = function (e, t) {if (!t && e && e.__esModule) return e;var o,i,f = { __proto__: null, default: e };if (null === e || "object" != typeof e && "function" != typeof e) return f;if (o = t ? n : r) {if (o.has(e)) return o.get(e);o.set(e, f);}for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]);return f;})(e, t);}
//#region src/plugins/provider-runtime.runtime.ts
const providerRuntimeLoader = (0, _lazyPromiseSFT4i6yI.t)(() => Promise.resolve().then(() => jitiImport("./provider-runtime-C59_jlTh.js").then((m) => _interopRequireWildcard(m))));
async function loadProviderRuntime() {
  return await providerRuntimeLoader.load();
}
async function augmentModelCatalogWithProviderPlugins(...args) {
  return (await loadProviderRuntime()).augmentModelCatalogWithProviderPlugins(...args);
}
async function buildProviderAuthDoctorHintWithPlugin(...args) {
  return (await loadProviderRuntime()).buildProviderAuthDoctorHintWithPlugin(...args);
}
async function buildProviderMissingAuthMessageWithPlugin(...args) {
  return (await loadProviderRuntime()).buildProviderMissingAuthMessageWithPlugin(...args);
}
async function formatProviderAuthProfileApiKeyWithPlugin(...args) {
  return (await loadProviderRuntime()).formatProviderAuthProfileApiKeyWithPlugin(...args);
}
async function prepareProviderRuntimeAuth(...args) {
  return (await loadProviderRuntime()).prepareProviderRuntimeAuth(...args);
}
async function refreshProviderOAuthCredentialWithPlugin(...args) {
  return (await loadProviderRuntime()).refreshProviderOAuthCredentialWithPlugin(...args);
}
//#endregion /* v9-fb785080800a8e88 */
