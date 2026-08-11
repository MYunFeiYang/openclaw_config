"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = buildSecretInputArraySchema;exports.r = buildSecretInputSchema;exports.t = buildOptionalSecretInputSchema;var _typesSecretsCJS3n8Im = require("./types.secrets-CJS3n8Im.js");
var _schemasBmna8ihM = require("./schemas-Bmna8ihM.js");
var _refContractBR8wwaMv = require("./ref-contract-BR8wwaMv.js");
var _zodSchemaSensitiveSjBPHVTu = require("./zod-schema.sensitive-SjBPHVTu.js");
//#region src/plugin-sdk/secret-input-schema.ts
function buildSecretInputSchema() {
  return secretInputSchema;
}
const providerSchema = (0, _schemasBmna8ihM.Rn)().regex(_refContractBR8wwaMv.r, "Secret reference provider must match /^[a-z][a-z0-9_-]{0,63}$/ (example: \"default\").");
const secretInputSchema = (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.Rn)(), (0, _schemasBmna8ihM.Bt)("source", [
(0, _schemasBmna8ihM.Tn)({
  source: (0, _schemasBmna8ihM.dn)("env"),
  provider: providerSchema,
  id: (0, _schemasBmna8ihM.Rn)().regex(_typesSecretsCJS3n8Im.n, "Env secret reference id must match /^[A-Z][A-Z0-9_]{0,127}$/ (example: \"OPENAI_API_KEY\").")
}),
(0, _schemasBmna8ihM.Tn)({
  source: (0, _schemasBmna8ihM.dn)("file"),
  provider: providerSchema,
  id: (0, _schemasBmna8ihM.Rn)().refine(_refContractBR8wwaMv.s, "File secret reference id must be an absolute JSON pointer (example: \"/providers/openai/apiKey\"), or \"value\" for singleValue mode.")
}),
(0, _schemasBmna8ihM.Tn)({
  source: (0, _schemasBmna8ihM.dn)("exec"),
  provider: providerSchema,
  id: (0, _schemasBmna8ihM.Rn)().refine(_refContractBR8wwaMv.o, (0, _refContractBR8wwaMv.a)())
})]
)]).register(_zodSchemaSensitiveSjBPHVTu.t);
//#endregion
//#region src/plugin-sdk/secret-input.ts
/** Optional version of the shared secret-input schema. */
function buildOptionalSecretInputSchema() {
  return buildSecretInputSchema().optional();
}
/** Array version of the shared secret-input schema. */
function buildSecretInputArraySchema() {
  return (0, _schemasBmna8ihM.Et)(buildSecretInputSchema());
}
//#endregion /* v9-c260dcea5fb8f197 */
