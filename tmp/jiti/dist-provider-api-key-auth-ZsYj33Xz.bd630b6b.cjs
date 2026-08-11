"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.t = createProviderApiKeyAuthMethod;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
var _stringNormalizationDgUPESoD = require("./string-normalization-DgUPESoD.js");
var _normalizeSecretInputCH0hjbpb = require("./normalize-secret-input-CH0hjbpb.js");
var _lazyRuntimeV5ClJo = require("./lazy-runtime-v5ClJo9-.js");
var _profilesBu_OqYpj = require("./profiles-Bu_OqYpj.js");function _interopRequireWildcard(e, t) {if ("function" == typeof WeakMap) var r = new WeakMap(),n = new WeakMap();return (_interopRequireWildcard = function (e, t) {if (!t && e && e.__esModule) return e;var o,i,f = { __proto__: null, default: e };if (null === e || "object" != typeof e && "function" != typeof e) return f;if (o = t ? n : r) {if (o.has(e)) return o.get(e);o.set(e, f);}for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]);return f;})(e, t);}
//#region src/plugins/provider-api-key-auth.ts
const loadProviderApiKeyAuthRuntime = (0, _lazyRuntimeV5ClJo.a)(() => Promise.resolve().then(() => jitiImport("./provider-api-key-auth.runtime.js").then((m) => _interopRequireWildcard(m))), ({ providerApiKeyAuthRuntime }) => providerApiKeyAuthRuntime);
function resolveStringOption(opts, optionKey) {
  return (0, _normalizeSecretInputCH0hjbpb.t)(opts?.[optionKey]);
}
function resolveProfileId(params) {
  return (0, _stringCoerceLndEvhRk.c)(params.profileId) || `${params.providerId}:default`;
}
function resolveProfileIds(params) {
  const explicit = Array.from(new Set((0, _stringNormalizationDgUPESoD.s)(params.profileIds ?? [])));
  if (explicit.length > 0) return explicit;
  return [resolveProfileId(params)];
}
async function upsertAuthProfileWithLockOrThrow(params) {
  if (!(await (0, _profilesBu_OqYpj.s)(params))) throw new Error("Failed to update auth profile store; the auth store lock may be busy. Wait a moment and retry.");
}
async function applyApiKeyConfig(params) {
  const { applyAuthProfileConfig, applyPrimaryModel } = await loadProviderApiKeyAuthRuntime();
  let next = params.ctx.config;
  for (const profileId of params.profileIds) next = applyAuthProfileConfig(next, {
    profileId,
    provider: (0, _stringCoerceLndEvhRk.c)(profileId.split(":", 1)[0]) || params.providerId,
    mode: "api_key"
  });
  if (params.applyConfig) next = params.applyConfig(next);
  return params.defaultModel ? applyPrimaryModel(next, params.defaultModel) : next;
}
function createProviderApiKeyAuthMethod(params) {
  return {
    id: params.methodId,
    label: params.label,
    hint: params.hint,
    kind: "api_key",
    wizard: params.wizard,
    run: async (ctx) => {
      const opts = ctx.opts;
      const flagValue = resolveStringOption(opts, params.optionKey);
      let capturedSecretInput;
      let capturedCredential = false;
      let capturedMode;
      const { buildApiKeyCredential, ensureApiKeyFromOptionEnvOrPrompt, normalizeApiKeyInput, validateApiKeyInput } = await loadProviderApiKeyAuthRuntime();
      await ensureApiKeyFromOptionEnvOrPrompt({
        token: flagValue ?? (0, _normalizeSecretInputCH0hjbpb.t)(ctx.opts?.token),
        tokenProvider: flagValue ? params.providerId : (0, _normalizeSecretInputCH0hjbpb.t)(ctx.opts?.tokenProvider),
        secretInputMode: ctx.allowSecretRefPrompt === false ? ctx.secretInputMode ?? "plaintext" : ctx.secretInputMode,
        config: ctx.config,
        env: ctx.env,
        expectedProviders: params.expectedProviders ?? [params.providerId],
        provider: params.providerId,
        envLabel: params.envVar,
        promptMessage: params.promptMessage,
        normalize: normalizeApiKeyInput,
        validate: validateApiKeyInput,
        prompter: ctx.prompter,
        noteMessage: params.noteMessage,
        noteTitle: params.noteTitle,
        setCredential: async (apiKey, mode) => {
          capturedSecretInput = apiKey;
          capturedCredential = true;
          capturedMode = mode;
        }
      });
      if (!capturedCredential) throw new Error(`Missing API key input for provider "${params.providerId}".`);
      const credentialInput = capturedSecretInput ?? "";
      return {
        profiles: resolveProfileIds(params).map((profileId) => ({
          profileId,
          credential: buildApiKeyCredential((0, _stringCoerceLndEvhRk.c)(profileId.split(":", 1)[0]) || params.providerId, credentialInput, params.metadata, capturedMode ? {
            secretInputMode: capturedMode,
            config: ctx.config
          } : void 0)
        })),
        ...(params.applyConfig ? { configPatch: params.applyConfig(ctx.config) } : {}),
        ...(params.defaultModel ? { defaultModel: params.defaultModel } : {})
      };
    },
    runNonInteractive: async (ctx) => {
      const opts = ctx.opts;
      const resolved = await ctx.resolveApiKey({
        provider: params.providerId,
        flagValue: resolveStringOption(opts, params.optionKey),
        flagName: params.flagName,
        envVar: params.envVar,
        ...(params.allowProfile === false ? { allowProfile: false } : {})
      });
      if (!resolved) return null;
      const profileIds = resolveProfileIds(params);
      if (resolved.source !== "profile") for (const profileId of profileIds) {
        const credential = ctx.toApiKeyCredential({
          provider: (0, _stringCoerceLndEvhRk.c)(profileId.split(":", 1)[0]) || params.providerId,
          resolved,
          ...(params.metadata ? { metadata: params.metadata } : {})
        });
        if (!credential) return null;
        await upsertAuthProfileWithLockOrThrow({
          profileId,
          credential,
          agentDir: ctx.agentDir
        });
      }
      return await applyApiKeyConfig({
        ctx,
        providerId: params.providerId,
        profileIds,
        defaultModel: params.defaultModel,
        applyConfig: params.applyConfig
      });
    }
  };
}
//#endregion /* v9-be2a5bbb0efe036e */
