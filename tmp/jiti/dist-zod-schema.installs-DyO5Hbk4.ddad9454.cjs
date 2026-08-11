"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.t = exports.n = void 0;var _schemasBmna8ihM = require("./schemas-Bmna8ihM.js");
//#region src/config/zod-schema.installs.ts
const InstallSourceSchema = (0, _schemasBmna8ihM.Xn)([
(0, _schemasBmna8ihM.dn)("npm"),
(0, _schemasBmna8ihM.dn)("archive"),
(0, _schemasBmna8ihM.dn)("path"),
(0, _schemasBmna8ihM.dn)("clawhub"),
(0, _schemasBmna8ihM.dn)("git")]
);
const PluginInstallSourceSchema = (0, _schemasBmna8ihM.Xn)([InstallSourceSchema, (0, _schemasBmna8ihM.dn)("marketplace")]);
const InstallRecordShape = exports.t = {
  source: InstallSourceSchema,
  spec: (0, _schemasBmna8ihM.Rn)().optional(),
  sourcePath: (0, _schemasBmna8ihM.Rn)().optional(),
  installPath: (0, _schemasBmna8ihM.Rn)().optional(),
  version: (0, _schemasBmna8ihM.Rn)().optional(),
  resolvedName: (0, _schemasBmna8ihM.Rn)().optional(),
  resolvedVersion: (0, _schemasBmna8ihM.Rn)().optional(),
  resolvedSpec: (0, _schemasBmna8ihM.Rn)().optional(),
  integrity: (0, _schemasBmna8ihM.Rn)().optional(),
  shasum: (0, _schemasBmna8ihM.Rn)().optional(),
  resolvedAt: (0, _schemasBmna8ihM.Rn)().optional(),
  installedAt: (0, _schemasBmna8ihM.Rn)().optional(),
  clawhubUrl: (0, _schemasBmna8ihM.Rn)().optional(),
  clawhubPackage: (0, _schemasBmna8ihM.Rn)().optional(),
  clawhubFamily: (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.dn)("code-plugin"), (0, _schemasBmna8ihM.dn)("bundle-plugin")]).optional(),
  clawhubChannel: (0, _schemasBmna8ihM.Xn)([
  (0, _schemasBmna8ihM.dn)("official"),
  (0, _schemasBmna8ihM.dn)("community"),
  (0, _schemasBmna8ihM.dn)("private")]
  ).optional(),
  artifactKind: (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.dn)("legacy-zip"), (0, _schemasBmna8ihM.dn)("npm-pack")]).optional(),
  artifactFormat: (0, _schemasBmna8ihM.Xn)([(0, _schemasBmna8ihM.dn)("zip"), (0, _schemasBmna8ihM.dn)("tgz")]).optional(),
  npmIntegrity: (0, _schemasBmna8ihM.Rn)().optional(),
  npmShasum: (0, _schemasBmna8ihM.Rn)().optional(),
  npmTarballName: (0, _schemasBmna8ihM.Rn)().optional(),
  clawpackSha256: (0, _schemasBmna8ihM.Rn)().optional(),
  clawpackSpecVersion: (0, _schemasBmna8ihM.wn)().int().nonnegative().optional(),
  clawpackManifestSha256: (0, _schemasBmna8ihM.Rn)().optional(),
  clawpackSize: (0, _schemasBmna8ihM.wn)().int().nonnegative().optional(),
  gitUrl: (0, _schemasBmna8ihM.Rn)().optional(),
  gitRef: (0, _schemasBmna8ihM.Rn)().optional(),
  gitCommit: (0, _schemasBmna8ihM.Rn)().optional()
};
const PluginInstallRecordShape = exports.n = {
  ...InstallRecordShape,
  source: PluginInstallSourceSchema,
  marketplaceName: (0, _schemasBmna8ihM.Rn)().optional(),
  marketplaceSource: (0, _schemasBmna8ihM.Rn)().optional(),
  marketplacePlugin: (0, _schemasBmna8ihM.Rn)().optional()
};
//#endregion /* v9-9c490a89dbd6f456 */
