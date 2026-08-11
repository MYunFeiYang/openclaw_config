"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.n = privateFileStoreSync;exports.t = privateFileStore;require("./fs-safe-defaults-azXCfv92.js");
var _fileStoreIjIAbY2X = require("./file-store-ijIAbY2X.js");
//#region src/infra/private-file-store.ts
function privateFileStore(rootDir) {
  return (0, _fileStoreIjIAbY2X.t)({
    rootDir,
    private: true
  });
}
function privateFileStoreSync(rootDir) {
  return (0, _fileStoreIjIAbY2X.n)({
    rootDir,
    private: true
  });
}
//#endregion /* v9-7e8e079a501e97f1 */
