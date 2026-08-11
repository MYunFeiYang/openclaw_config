"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.t = collectTtsApiKeyAssignments;var _utilsDvkbxKCZ = require("./utils-DvkbxKCZ.js");
require("./shared-C9ga15VD.js");
var _runtimeSharedClUz2kEK = require("./runtime-shared-ClUz2kEK.js");
//#region src/secrets/runtime-config-collectors-tts.ts
function collectProviderApiKeyAssignment(params) {
  (0, _runtimeSharedClUz2kEK.n)({
    value: params.providerConfig.apiKey,
    path: `${params.pathPrefix}.providers.${params.providerId}.apiKey`,
    expected: "string",
    defaults: params.defaults,
    context: params.context,
    active: params.active,
    inactiveReason: params.inactiveReason,
    apply: (value) => {
      params.providerConfig.apiKey = value;
    }
  });
}
function collectTtsApiKeyAssignments(params) {
  const providers = params.tts.providers;
  if ((0, _utilsDvkbxKCZ.c)(providers)) {
    for (const [providerId, providerConfig] of Object.entries(providers)) {
      if (!(0, _utilsDvkbxKCZ.c)(providerConfig)) continue;
      collectProviderApiKeyAssignment({
        providerId,
        providerConfig,
        pathPrefix: params.pathPrefix,
        defaults: params.defaults,
        context: params.context,
        active: params.active,
        inactiveReason: params.inactiveReason
      });
    }
    return;
  }
}
//#endregion /* v9-27f8a34e47ca1720 */
