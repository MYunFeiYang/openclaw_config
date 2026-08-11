"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.a = publicKeyRawBase64UrlFromPem;exports.i = normalizeDevicePublicKeyBase64Url;exports.n = loadDeviceIdentityIfPresent;exports.o = signDevicePayload;exports.r = loadOrCreateDeviceIdentity;exports.s = verifyDeviceSignature;exports.t = deriveDeviceIdFromPublicKey;var _pathsB2cMKWd = require("./paths-B2cMK-wd.js");
var _nodeFs = _interopRequireDefault(require("node:fs"));
var _nodePath = _interopRequireDefault(require("node:path"));
var _nodeCrypto = _interopRequireDefault(require("node:crypto"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}
//#region src/infra/device-identity.ts
function resolveDefaultIdentityPath() {
  return _nodePath.default.join((0, _pathsB2cMKWd._)(), "identity", "device.json");
}
function ensureDir(filePath) {
  _nodeFs.default.mkdirSync(_nodePath.default.dirname(filePath), { recursive: true });
}
const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");
function base64UrlEncode(buf) {
  return buf.toString("base64").replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}
function base64UrlDecode(input) {
  const normalized = input.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
  return Buffer.from(padded, "base64");
}
function derivePublicKeyRaw(publicKeyPem) {
  const spki = _nodeCrypto.default.createPublicKey(publicKeyPem).export({
    type: "spki",
    format: "der"
  });
  if (spki.length === ED25519_SPKI_PREFIX.length + 32 && spki.subarray(0, ED25519_SPKI_PREFIX.length).equals(ED25519_SPKI_PREFIX)) return spki.subarray(ED25519_SPKI_PREFIX.length);
  return spki;
}
function fingerprintPublicKey(publicKeyPem) {
  const raw = derivePublicKeyRaw(publicKeyPem);
  return _nodeCrypto.default.createHash("sha256").update(raw).digest("hex");
}
function generateIdentity() {
  const { publicKey, privateKey } = _nodeCrypto.default.generateKeyPairSync("ed25519");
  const publicKeyPem = publicKey.export({
    type: "spki",
    format: "pem"
  });
  const privateKeyPem = privateKey.export({
    type: "pkcs8",
    format: "pem"
  });
  return {
    deviceId: fingerprintPublicKey(publicKeyPem),
    publicKeyPem,
    privateKeyPem
  };
}
function loadOrCreateDeviceIdentity(filePath = resolveDefaultIdentityPath()) {
  try {
    if (_nodeFs.default.existsSync(filePath)) {
      const raw = _nodeFs.default.readFileSync(filePath, "utf8");
      const parsed = JSON.parse(raw);
      if (parsed?.version === 1 && typeof parsed.deviceId === "string" && typeof parsed.publicKeyPem === "string" && typeof parsed.privateKeyPem === "string") {
        const derivedId = fingerprintPublicKey(parsed.publicKeyPem);
        if (derivedId && derivedId !== parsed.deviceId) {
          const updated = {
            ...parsed,
            deviceId: derivedId
          };
          _nodeFs.default.writeFileSync(filePath, `${JSON.stringify(updated, null, 2)}\n`, { mode: 384 });
          try {
            _nodeFs.default.chmodSync(filePath, 384);
          } catch {}
          return {
            deviceId: derivedId,
            publicKeyPem: parsed.publicKeyPem,
            privateKeyPem: parsed.privateKeyPem
          };
        }
        return {
          deviceId: parsed.deviceId,
          publicKeyPem: parsed.publicKeyPem,
          privateKeyPem: parsed.privateKeyPem
        };
      }
    }
  } catch {}
  const identity = generateIdentity();
  ensureDir(filePath);
  const stored = {
    version: 1,
    deviceId: identity.deviceId,
    publicKeyPem: identity.publicKeyPem,
    privateKeyPem: identity.privateKeyPem,
    createdAtMs: Date.now()
  };
  _nodeFs.default.writeFileSync(filePath, `${JSON.stringify(stored, null, 2)}\n`, { mode: 384 });
  try {
    _nodeFs.default.chmodSync(filePath, 384);
  } catch {}
  return identity;
}
function loadDeviceIdentityIfPresent(filePath = resolveDefaultIdentityPath()) {
  try {
    if (!_nodeFs.default.existsSync(filePath)) return null;
    const raw = _nodeFs.default.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed?.version !== 1 || typeof parsed.deviceId !== "string" || typeof parsed.publicKeyPem !== "string" || typeof parsed.privateKeyPem !== "string") return null;
    const derivedId = fingerprintPublicKey(parsed.publicKeyPem);
    if (!derivedId || derivedId !== parsed.deviceId) return null;
    return {
      deviceId: parsed.deviceId,
      publicKeyPem: parsed.publicKeyPem,
      privateKeyPem: parsed.privateKeyPem
    };
  } catch {
    return null;
  }
}
function signDevicePayload(privateKeyPem, payload) {
  const key = _nodeCrypto.default.createPrivateKey(privateKeyPem);
  return base64UrlEncode(_nodeCrypto.default.sign(null, Buffer.from(payload, "utf8"), key));
}
function normalizeDevicePublicKeyBase64Url(publicKey) {
  try {
    if (publicKey.includes("BEGIN")) return base64UrlEncode(derivePublicKeyRaw(publicKey));
    const raw = base64UrlDecode(publicKey);
    if (raw.length === 0) return null;
    return base64UrlEncode(raw);
  } catch {
    return null;
  }
}
function deriveDeviceIdFromPublicKey(publicKey) {
  try {
    const raw = publicKey.includes("BEGIN") ? derivePublicKeyRaw(publicKey) : base64UrlDecode(publicKey);
    if (raw.length === 0) return null;
    return _nodeCrypto.default.createHash("sha256").update(raw).digest("hex");
  } catch {
    return null;
  }
}
function publicKeyRawBase64UrlFromPem(publicKeyPem) {
  return base64UrlEncode(derivePublicKeyRaw(publicKeyPem));
}
function verifyDeviceSignature(publicKey, payload, signatureBase64Url) {
  try {
    const key = publicKey.includes("BEGIN") ? _nodeCrypto.default.createPublicKey(publicKey) : _nodeCrypto.default.createPublicKey({
      key: Buffer.concat([ED25519_SPKI_PREFIX, base64UrlDecode(publicKey)]),
      type: "spki",
      format: "der"
    });
    const sig = (() => {
      try {
        return base64UrlDecode(signatureBase64Url);
      } catch {
        return Buffer.from(signatureBase64Url, "base64");
      }
    })();
    return _nodeCrypto.default.verify(null, Buffer.from(payload, "utf8"), key, sig);
  } catch {
    return false;
  }
}
//#endregion /* v9-1511eb3a6a0eabbb */
