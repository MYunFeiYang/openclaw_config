"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = buildNestedDmConfigSchema;exports.i = buildJsonChannelConfigSchema;exports.n = buildCatchallMultiAccountChannelSchema;exports.o = emptyChannelConfigSchema;exports.r = buildChannelConfigSchema;exports.t = void 0;var _schemasBmna8ihM = require("./schemas-Bmna8ihM.js");
var _schemaValidatorWgurAMJR = require("./schema-validator-wgurAMJR.js");
var _zodSchemaCoreQTf3ki3e = require("./zod-schema.core-QTf3ki3e.js");
const AllowFromListSchema = exports.t = (0, _schemasBmna8ihM.Et)((0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.Rn)(), (0, _schemasBmna8ihM.wn)()])).optional();
function buildNestedDmConfigSchema(extraShape) {
  const baseShape = {
    enabled: (0, _schemasBmna8ihM.At)().optional(),
    policy: _zodSchemaCoreQTf3ki3e.o.optional(),
    allowFrom: AllowFromListSchema
  };
  return (0, _schemasBmna8ihM.Tn)(extraShape ? {
    ...baseShape,
    ...extraShape
  } : baseShape).optional();
}
function buildCatchallMultiAccountChannelSchema(accountSchema) {
  return accountSchema.extend({
    accounts: (0, _schemasBmna8ihM.Tn)({}).catchall(accountSchema).optional(),
    defaultAccount: (0, _schemasBmna8ihM.Rn)().optional()
  });
}
function cloneRuntimeIssue(issue) {
  const record = issue && typeof issue === "object" ? issue : {};
  const path = Array.isArray(record.path) ? record.path.filter((segment) => {
    const kind = typeof segment;
    return kind === "string" || kind === "number";
  }) : void 0;
  return {
    ...record,
    ...(path ? { path } : {})
  };
}
function safeParseRuntimeSchema(schema, value) {
  const result = schema.safeParse(value);
  if (result.success) return {
    success: true,
    data: result.data
  };
  return {
    success: false,
    issues: result.error.issues.map((issue) => cloneRuntimeIssue(issue))
  };
}
function toIssuePath(path) {
  if (!path || path === "<root>") return [];
  return path.split(".").map((segment) => {
    const index = Number(segment);
    return Number.isInteger(index) && String(index) === segment ? index : segment;
  });
}
function safeParseJsonSchema(schema, cacheKey, value) {
  const result = (0, _schemaValidatorWgurAMJR.t)({
    schema,
    cacheKey,
    value,
    applyDefaults: true
  });
  if (result.ok) return {
    success: true,
    data: result.value
  };
  return {
    success: false,
    issues: result.errors.map((issue) => ({
      path: toIssuePath(issue.path),
      message: issue.message
    }))
  };
}
function buildJsonChannelConfigSchema(schema, options) {
  return {
    schema,
    ...(options?.uiHints ? { uiHints: options.uiHints } : {}),
    runtime: options?.runtime ?? { safeParse: (value) => safeParseJsonSchema(schema, options?.cacheKey ?? "channel-config-schema:json", value) }
  };
}
function buildChannelConfigSchema(schema, options) {
  const schemaWithJson = schema;
  if (typeof schemaWithJson.toJSONSchema === "function") return {
    schema: schemaWithJson.toJSONSchema({
      target: "draft-07",
      unrepresentable: "any"
    }),
    ...(options?.uiHints ? { uiHints: options.uiHints } : {}),
    runtime: { safeParse: (value) => safeParseRuntimeSchema(schema, value) }
  };
  return {
    schema: {
      type: "object",
      additionalProperties: true
    },
    ...(options?.uiHints ? { uiHints: options.uiHints } : {}),
    runtime: { safeParse: (value) => safeParseRuntimeSchema(schema, value) }
  };
}
function emptyChannelConfigSchema() {
  return {
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {}
    },
    runtime: { safeParse(value) {
        if (value === void 0) return {
          success: true,
          data: void 0
        };
        if (!value || typeof value !== "object" || Array.isArray(value)) return {
          success: false,
          issues: [{
            path: [],
            message: "expected config object"
          }]
        };
        if (Object.keys(value).length > 0) return {
          success: false,
          issues: [{
            path: [],
            message: "config must be empty"
          }]
        };
        return {
          success: true,
          data: value
        };
      } }
  };
}
//#endregion /* v9-d6856c553a3662c3 */
