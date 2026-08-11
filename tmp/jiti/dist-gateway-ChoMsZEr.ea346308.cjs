"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.t = loadGatewayTlsRuntime;var _utilsDvkbxKCZ = require("./utils-DvkbxKCZ.js");
var _fingerprintD6fsY8CD = require("./fingerprint-D6fsY8CD.js");
var _resolveSystemBinD_kr6Ra = require("./resolve-system-bin-D_kr6Ra3.js");
var _nodePath = _interopRequireDefault(require("node:path"));
var _promises = _interopRequireDefault(require("node:fs/promises"));
var _nodeChild_process = require("node:child_process");
var _nodeCrypto = require("node:crypto");
var _nodeUtil = require("node:util");function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}
//#region src/infra/tls/gateway.ts
const execFileAsync = (0, _nodeUtil.promisify)(_nodeChild_process.execFile);
async function fileExists(filePath) {
  try {
    await _promises.default.access(filePath);
    return true;
  } catch {
    return false;
  }
}
async function generateSelfSignedCert(params) {
  const certDir = _nodePath.default.dirname(params.certPath);
  const keyDir = _nodePath.default.dirname(params.keyPath);
  await (0, _utilsDvkbxKCZ.s)(certDir);
  if (keyDir !== certDir) await (0, _utilsDvkbxKCZ.s)(keyDir);
  const opensslBin = (0, _resolveSystemBinD_kr6Ra.t)("openssl");
  if (!opensslBin) throw new Error("openssl not found in trusted system directories. Install it in an OS-managed location.");
  await execFileAsync(opensslBin, [
  "req",
  "-x509",
  "-newkey",
  "rsa:2048",
  "-sha256",
  "-days",
  "3650",
  "-nodes",
  "-keyout",
  params.keyPath,
  "-out",
  params.certPath,
  "-subj",
  "/CN=openclaw-gateway"]
  );
  await _promises.default.chmod(params.keyPath, 384).catch(() => {});
  await _promises.default.chmod(params.certPath, 384).catch(() => {});
  params.log?.info?.(`gateway tls: generated self-signed cert at ${(0, _utilsDvkbxKCZ.h)(params.certPath)}`);
}
async function loadGatewayTlsRuntime(cfg, log) {
  if (!cfg || cfg.enabled !== true) return {
    enabled: false,
    required: false
  };
  const autoGenerate = cfg.autoGenerate !== false;
  const baseDir = _nodePath.default.join(_utilsDvkbxKCZ.t, "gateway", "tls");
  const certPath = (0, _utilsDvkbxKCZ.p)(cfg.certPath ?? _nodePath.default.join(baseDir, "gateway-cert.pem"));
  const keyPath = (0, _utilsDvkbxKCZ.p)(cfg.keyPath ?? _nodePath.default.join(baseDir, "gateway-key.pem"));
  const caPath = cfg.caPath ? (0, _utilsDvkbxKCZ.p)(cfg.caPath) : void 0;
  const hasCert = await fileExists(certPath);
  const hasKey = await fileExists(keyPath);
  if (!hasCert && !hasKey && autoGenerate) try {
    await generateSelfSignedCert({
      certPath,
      keyPath,
      log
    });
  } catch (err) {
    return {
      enabled: false,
      required: true,
      certPath,
      keyPath,
      error: `gateway tls: failed to generate cert (${String(err)})`
    };
  }
  if (!(await fileExists(certPath)) || !(await fileExists(keyPath))) return {
    enabled: false,
    required: true,
    certPath,
    keyPath,
    error: "gateway tls: cert/key missing"
  };
  try {
    const cert = await _promises.default.readFile(certPath, "utf8");
    const key = await _promises.default.readFile(keyPath, "utf8");
    const ca = caPath ? await _promises.default.readFile(caPath, "utf8") : void 0;
    const fingerprintSha256 = (0, _fingerprintD6fsY8CD.t)(new _nodeCrypto.X509Certificate(cert).fingerprint256 ?? "");
    if (!fingerprintSha256) return {
      enabled: false,
      required: true,
      certPath,
      keyPath,
      caPath,
      error: "gateway tls: unable to compute certificate fingerprint"
    };
    return {
      enabled: true,
      required: true,
      certPath,
      keyPath,
      caPath,
      fingerprintSha256,
      tlsOptions: {
        cert,
        key,
        ca,
        minVersion: "TLSv1.3"
      }
    };
  } catch (err) {
    return {
      enabled: false,
      required: true,
      certPath,
      keyPath,
      caPath,
      error: `gateway tls: failed to load cert (${String(err)})`
    };
  }
}
//#endregion /* v9-c04cc39c5c1a6799 */
