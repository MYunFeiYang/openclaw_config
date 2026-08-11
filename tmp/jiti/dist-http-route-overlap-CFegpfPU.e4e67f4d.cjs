"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = normalizePluginHttpPath;exports.t = findOverlappingPluginHttpRoute;var _stringCoerceLndEvhRk = require("./string-coerce-LndEvhRk.js");
var _securityPathCORVlEK = require("./security-path-CORVlEK-.js");
//#region src/plugins/http-path.ts
function normalizePluginHttpPath(path, fallback) {
  const trimmed = (0, _stringCoerceLndEvhRk.c)(path);
  if (!trimmed) {
    const fallbackTrimmed = (0, _stringCoerceLndEvhRk.c)(fallback);
    if (!fallbackTrimmed) return null;
    return fallbackTrimmed.startsWith("/") ? fallbackTrimmed : `/${fallbackTrimmed}`;
  }
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}
//#endregion
//#region src/plugins/http-route-overlap.ts
function prefixMatchPath(pathname, prefix) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`) || pathname.startsWith(`${prefix}%`);
}
function doPluginHttpRoutesOverlap(a, b) {
  const aPath = (0, _securityPathCORVlEK.r)(a.path);
  const bPath = (0, _securityPathCORVlEK.r)(b.path);
  if (a.match === "exact" && b.match === "exact") return aPath === bPath;
  if (a.match === "prefix" && b.match === "prefix") return prefixMatchPath(aPath, bPath) || prefixMatchPath(bPath, aPath);
  const prefixRoute = a.match === "prefix" ? a : b;
  return prefixMatchPath((0, _securityPathCORVlEK.r)((a.match === "exact" ? a : b).path), (0, _securityPathCORVlEK.r)(prefixRoute.path));
}
function findOverlappingPluginHttpRoute(routes, candidate) {
  return routes.find((route) => doPluginHttpRoutesOverlap(route, candidate));
}
//#endregion /* v9-cb7b73bc8cf4d7cf */
