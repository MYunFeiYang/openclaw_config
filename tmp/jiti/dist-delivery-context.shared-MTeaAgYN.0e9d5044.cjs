"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = normalizeDeliveryChannelRoute;exports.c = normalizeAccountId;exports.i = mergeDeliveryContext;exports.n = deliveryContextFromSession;exports.o = normalizeDeliveryContext;exports.r = deliveryContextKey;exports.s = normalizeSessionDeliveryFields;exports.t = deliveryContextFromChannelRoute;var _accountId9_btbLFO = require("./account-id-9_btbLFO.js");
var _messageChannelCoreRsgWXY6u = require("./message-channel-core-rsgWXY6u.js");
var _channelRouteCS6L3bdG = require("./channel-route-cS6L3bdG.js");
//#region src/utils/account-id.ts
function normalizeAccountId(value) {
  return (0, _accountId9_btbLFO.r)(value);
}
//#endregion
//#region src/utils/delivery-context.shared.ts
function normalizeDeliveryContext(context) {
  if (!context) return;
  const route = (0, _channelRouteCS6L3bdG.f)({
    channel: typeof context.channel === "string" ? (0, _messageChannelCoreRsgWXY6u.n)(context.channel) ?? context.channel.trim() : void 0,
    to: context.to,
    accountId: context.accountId,
    threadId: context.threadId
  });
  if (!route) return;
  const normalized = {
    channel: route.channel,
    to: (0, _channelRouteCS6L3bdG.a)(route),
    accountId: normalizeAccountId(route.accountId)
  };
  const threadId = (0, _channelRouteCS6L3bdG.c)(route);
  if (threadId != null) normalized.threadId = threadId;
  return normalized;
}
function normalizeDeliveryChannelRoute(route) {
  if (!route || typeof route !== "object" || Array.isArray(route)) return;
  const candidate = route;
  return (0, _channelRouteCS6L3bdG.d)({
    channel: candidate.channel,
    to: candidate.target?.to,
    rawTo: candidate.target?.rawTo,
    chatType: candidate.target?.chatType,
    accountId: candidate.accountId,
    threadId: candidate.thread?.id,
    threadKind: candidate.thread?.kind,
    threadSource: candidate.thread?.source
  });
}
function deliveryContextFromChannelRoute(route) {
  const normalized = normalizeDeliveryChannelRoute(route);
  return normalizeDeliveryContext({
    channel: normalized?.channel,
    to: (0, _channelRouteCS6L3bdG.a)(normalized),
    accountId: normalized?.accountId,
    threadId: (0, _channelRouteCS6L3bdG.c)(normalized)
  });
}
function channelRouteFromDeliveryContext(context) {
  return (0, _channelRouteCS6L3bdG.f)(normalizeDeliveryContext(context));
}
function mergeRouteMetadataWithDeliveryContext(route, context) {
  if (!route) return channelRouteFromDeliveryContext(context);
  return (0, _channelRouteCS6L3bdG.d)({
    channel: route.channel ?? context.channel,
    to: route.target?.to ?? context.to,
    rawTo: route.target?.rawTo,
    chatType: route.target?.chatType,
    accountId: route.accountId ?? context.accountId,
    threadId: route.thread?.id ?? context.threadId,
    threadKind: route.thread?.kind,
    threadSource: route.thread?.source
  });
}
function normalizeSessionDeliveryFields(source) {
  if (!source) return {
    route: void 0,
    deliveryContext: void 0,
    lastChannel: void 0,
    lastTo: void 0,
    lastAccountId: void 0,
    lastThreadId: void 0
  };
  const normalizedRoute = normalizeDeliveryChannelRoute(source.route);
  const merged = mergeDeliveryContext(deliveryContextFromChannelRoute(normalizedRoute), mergeDeliveryContext(normalizeDeliveryContext({
    channel: source.lastChannel ?? source.channel,
    to: source.lastTo,
    accountId: source.lastAccountId,
    threadId: source.lastThreadId
  }), normalizeDeliveryContext(source.deliveryContext)));
  if (!merged) return {
    route: void 0,
    deliveryContext: void 0,
    lastChannel: void 0,
    lastTo: void 0,
    lastAccountId: void 0,
    lastThreadId: void 0
  };
  return {
    route: mergeRouteMetadataWithDeliveryContext(normalizedRoute, merged),
    deliveryContext: merged,
    lastChannel: merged.channel,
    lastTo: merged.to,
    lastAccountId: merged.accountId,
    lastThreadId: merged.threadId
  };
}
function deliveryContextFromSession(entry) {
  if (!entry) return;
  return normalizeSessionDeliveryFields({
    route: entry.route,
    channel: entry.channel ?? entry.origin?.provider,
    lastChannel: entry.lastChannel,
    lastTo: entry.lastTo,
    lastAccountId: entry.lastAccountId ?? entry.origin?.accountId,
    lastThreadId: entry.lastThreadId ?? entry.deliveryContext?.threadId ?? entry.origin?.threadId,
    origin: entry.origin,
    deliveryContext: entry.deliveryContext
  }).deliveryContext;
}
function mergeDeliveryContext(primary, fallback) {
  const normalizedPrimary = normalizeDeliveryContext(primary);
  const normalizedFallback = normalizeDeliveryContext(fallback);
  if (!normalizedPrimary && !normalizedFallback) return;
  const channelsConflict = normalizedPrimary?.channel && normalizedFallback?.channel && normalizedPrimary.channel !== normalizedFallback.channel;
  return normalizeDeliveryContext({
    channel: normalizedPrimary?.channel ?? normalizedFallback?.channel,
    to: channelsConflict ? normalizedPrimary?.to : normalizedPrimary?.to ?? normalizedFallback?.to,
    accountId: channelsConflict ? normalizedPrimary?.accountId : normalizedPrimary?.accountId ?? normalizedFallback?.accountId,
    threadId: channelsConflict ? normalizedPrimary?.threadId : normalizedPrimary?.threadId ?? normalizedFallback?.threadId
  });
}
function deliveryContextKey(context) {
  return (0, _channelRouteCS6L3bdG.t)(normalizeDeliveryContext(context));
}
//#endregion /* v9-2e1ec1db83ab217c */
