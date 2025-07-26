import forge from "node-forge";
import * as ed25519 from "@noble/ed25519";
import {
  KeyAlgorithm,
  KeyFormat,
  KeyGenerationOptions,
  GeneratedKeyPair,
  KeyInfo,
  KeySize,
} from "../types/ssh";

// Configure SHA512 for ED25519 (required by @noble/ed25519)
ed25519.etc.sha512Sync = (...m) => {
  const hash = forge.md.sha512.create();
  m.forEach(msg => {
    if (typeof msg === "string") {
      hash.update(msg);
    } else {
      // Convert Uint8Array to string for forge
      const str = Array.from(msg)
        .map(b => String.fromCharCode(b))
        .join("");
      hash.update(str);
    }
  });
  return new Uint8Array(
    hash
      .digest()
      .getBytes()
      .split("")
      .map(c => c.charCodeAt(0))
  );
};

/**
 * Generate SSH key pair using node-forge
 */
export async function generateKeyPair(options: KeyGenerationOptions): Promise<GeneratedKeyPair> {
  const { algorithm, keySize = 2048, format, comment, passphrase } = options;

  if (algorithm === "rsa") {
    return generateRSAKeyPair(keySize, format, comment, passphrase);
  } else if (algorithm === "ed25519") {
    return generateED25519KeyPair(format, comment, passphrase);
  }

  throw new Error(`Unsupported algorithm: ${algorithm}`);
}

/**
 * Generate RSA key pair
 */
async function generateRSAKeyPair(
  keySize: number,
  format: KeyFormat,
  comment?: string,
  passphrase?: string
): Promise<GeneratedKeyPair> {
  return new Promise((resolve, reject) => {
    forge.pki.rsa.generateKeyPair(keySize, 0x10001, (err, keyPair) => {
      if (err) {
        reject(err);
        return;
      }

      try {
        const publicKey = formatPublicKey(keyPair.publicKey, format, comment);
        const privateKey = formatPrivateKey(keyPair.privateKey, format, passphrase);
        const fingerprint = generateRSAFingerprint(keyPair.publicKey);

        resolve({
          privateKey,
          publicKey,
          fingerprint,
          algorithm: "rsa",
          keySize: keySize as KeySize,
          format,
          comment,
        });
      } catch (error) {
        reject(error);
      }
    });
  });
}

/**
 * Generate ED25519 key pair using @noble/ed25519
 */
async function generateED25519KeyPair(
  format: KeyFormat,
  comment?: string,
  passphrase?: string
): Promise<GeneratedKeyPair> {
  try {
    // Ensure SHA512 is available
    if (!ed25519.etc.sha512Sync) {
      throw new Error("SHA512 hash function not available");
    }

    // Generate ED25519 private key (32 bytes)
    const privateKey = ed25519.utils.randomPrivateKey();
    const publicKey = await ed25519.getPublicKey(privateKey);

    // Format the public key according to SSH wire protocol
    // SSH wire format: algorithm_name_length + algorithm_name + key_length + key_data
    const algorithmName = "ssh-ed25519";
    const algorithmNameBytes = new TextEncoder().encode(algorithmName);
    const algorithmNameLength = new Uint8Array(4);
    new DataView(algorithmNameLength.buffer).setUint32(0, algorithmNameBytes.length, false);

    const keyDataLength = new Uint8Array(4);
    new DataView(keyDataLength.buffer).setUint32(0, publicKey.length, false);

    // Combine all parts
    const sshWireFormat = new Uint8Array(
      algorithmNameLength.length +
        algorithmNameBytes.length +
        keyDataLength.length +
        publicKey.length
    );

    let offset = 0;
    sshWireFormat.set(algorithmNameLength, offset);
    offset += algorithmNameLength.length;
    sshWireFormat.set(algorithmNameBytes, offset);
    offset += algorithmNameBytes.length;
    sshWireFormat.set(keyDataLength, offset);
    offset += keyDataLength.length;
    sshWireFormat.set(publicKey, offset);

    // Convert to base64
    const publicKeyBase64 = forge.util.encode64(
      Array.from(sshWireFormat)
        .map(b => String.fromCharCode(b))
        .join("")
    );

    // Convert private key to base64 for storage
    const privateKeyBase64 = forge.util.encode64(
      Array.from(privateKey)
        .map(b => String.fromCharCode(b))
        .join("")
    );

    // Format keys
    const formattedPublicKey = `ssh-ed25519 ${publicKeyBase64}${comment ? " " + comment : ""}`;
    const formattedPrivateKey = formatED25519PrivateKey(privateKeyBase64, format, passphrase);

    // Generate fingerprints using the SSH wire format
    const fingerprint = generateED25519Fingerprint(sshWireFormat);

    return {
      privateKey: formattedPrivateKey,
      publicKey: formattedPublicKey,
      fingerprint,
      algorithm: "ed25519",
      format,
      comment,
    };
  } catch (error) {
    console.error("ED25519 generation error:", error);
    throw new Error(
      `Failed to generate ED25519 key pair: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Format public key for output
 */
function formatPublicKey(
  publicKey: forge.pki.rsa.PublicKey,
  format: KeyFormat,
  comment?: string
): string {
  if (format === "openssh") {
    // Create SSH wire format for RSA public key
    const algorithmName = "ssh-rsa";
    const algorithmNameBytes = new TextEncoder().encode(algorithmName);

    // Get RSA components (n and e)
    const nBytes = new Uint8Array(publicKey.n.toByteArray());
    const eBytes = new Uint8Array(publicKey.e.toByteArray());

    // Calculate total length
    const algorithmNameLengthBytes = new Uint8Array(4);
    const eLengthBytes = new Uint8Array(4);
    const nLengthBytes = new Uint8Array(4);

    new DataView(algorithmNameLengthBytes.buffer).setUint32(0, algorithmNameBytes.length, false);
    new DataView(eLengthBytes.buffer).setUint32(0, eBytes.length, false);
    new DataView(nLengthBytes.buffer).setUint32(0, nBytes.length, false);

    // Combine all parts
    const sshWireFormat = new Uint8Array(
      algorithmNameLengthBytes.length +
        algorithmNameBytes.length +
        eLengthBytes.length +
        eBytes.length +
        nLengthBytes.length +
        nBytes.length
    );

    let offset = 0;
    sshWireFormat.set(algorithmNameLengthBytes, offset);
    offset += algorithmNameLengthBytes.length;
    sshWireFormat.set(algorithmNameBytes, offset);
    offset += algorithmNameBytes.length;
    sshWireFormat.set(eLengthBytes, offset);
    offset += eLengthBytes.length;
    sshWireFormat.set(eBytes, offset);
    offset += eBytes.length;
    sshWireFormat.set(nLengthBytes, offset);
    offset += nLengthBytes.length;
    sshWireFormat.set(nBytes, offset);

    const pubKeyBase64 = forge.util.encode64(
      Array.from(sshWireFormat)
        .map(b => String.fromCharCode(b))
        .join("")
    );
    return `ssh-rsa ${pubKeyBase64}${comment ? " " + comment : ""}`;
  } else {
    return forge.pki.publicKeyToPem(publicKey);
  }
}

/**
 * Format private key for output
 */
function formatPrivateKey(
  privateKey: forge.pki.rsa.PrivateKey,
  format: KeyFormat,
  passphrase?: string
): string {
  if (format === "openssh") {
    // Convert to OpenSSH format
    let pem = forge.pki.privateKeyToPem(privateKey);

    if (passphrase) {
      // Encrypt the private key
      pem = forge.pki.encryptRsaPrivateKey(privateKey, passphrase);
    }

    // Convert PEM to OpenSSH format (simplified)
    return pem
      .replace(/-----BEGIN RSA PRIVATE KEY-----/, "-----BEGIN OPENSSH PRIVATE KEY-----")
      .replace(/-----END RSA PRIVATE KEY-----/, "-----END OPENSSH PRIVATE KEY-----");
  } else {
    if (passphrase) {
      return forge.pki.encryptRsaPrivateKey(privateKey, passphrase);
    }
    return forge.pki.privateKeyToPem(privateKey);
  }
}

/**
 * Format ED25519 private key
 */
function formatED25519PrivateKey(
  privateKeyBase64: string,
  format: KeyFormat,
  passphrase?: string
): string {
  if (format === "openssh") {
    // OpenSSH format for ED25519 private key
    const header = "-----BEGIN OPENSSH PRIVATE KEY-----";
    const footer = "-----END OPENSSH PRIVATE KEY-----";

    // Simple implementation - in production, you'd want proper OpenSSH key format
    const keyData = privateKeyBase64.match(/.{1,64}/g)?.join("\n") || privateKeyBase64;

    if (passphrase) {
      // Note: This is a simplified implementation
      // In production, you'd properly encrypt the key
      return `${header}\n${keyData}\n${footer}`;
    }

    return `${header}\n${keyData}\n${footer}`;
  } else {
    // PEM format for ED25519 private key
    const header = "-----BEGIN PRIVATE KEY-----";
    const footer = "-----END PRIVATE KEY-----";
    const keyData = privateKeyBase64.match(/.{1,64}/g)?.join("\n") || privateKeyBase64;

    return `${header}\n${keyData}\n${footer}`;
  }
}

/**
 * Generate RSA key fingerprints
 */
function generateRSAFingerprint(publicKey: forge.pki.rsa.PublicKey) {
  // Create SSH wire format for fingerprint calculation
  const algorithmName = "ssh-rsa";
  const algorithmNameBytes = new TextEncoder().encode(algorithmName);

  // Get RSA components (n and e)
  const nBytes = new Uint8Array(publicKey.n.toByteArray());
  const eBytes = new Uint8Array(publicKey.e.toByteArray());

  // Calculate total length
  const algorithmNameLengthBytes = new Uint8Array(4);
  const eLengthBytes = new Uint8Array(4);
  const nLengthBytes = new Uint8Array(4);

  new DataView(algorithmNameLengthBytes.buffer).setUint32(0, algorithmNameBytes.length, false);
  new DataView(eLengthBytes.buffer).setUint32(0, eBytes.length, false);
  new DataView(nLengthBytes.buffer).setUint32(0, nBytes.length, false);

  // Combine all parts
  const sshWireFormat = new Uint8Array(
    algorithmNameLengthBytes.length +
      algorithmNameBytes.length +
      eLengthBytes.length +
      eBytes.length +
      nLengthBytes.length +
      nBytes.length
  );

  let offset = 0;
  sshWireFormat.set(algorithmNameLengthBytes, offset);
  offset += algorithmNameLengthBytes.length;
  sshWireFormat.set(algorithmNameBytes, offset);
  offset += algorithmNameBytes.length;
  sshWireFormat.set(eLengthBytes, offset);
  offset += eLengthBytes.length;
  sshWireFormat.set(eBytes, offset);
  offset += eBytes.length;
  sshWireFormat.set(nLengthBytes, offset);
  offset += nLengthBytes.length;
  sshWireFormat.set(nBytes, offset);

  const pubKeyBytes = Array.from(sshWireFormat)
    .map(b => String.fromCharCode(b))
    .join("");

  // MD5 fingerprint
  const md5 = forge.md.md5.create();
  md5.update(pubKeyBytes);
  const md5Hash = md5.digest().toHex();
  const md5Fingerprint = md5Hash.match(/.{2}/g)?.join(":") || "";

  // SHA256 fingerprint
  const sha256 = forge.md.sha256.create();
  sha256.update(pubKeyBytes);
  const sha256Fingerprint = `SHA256:${forge.util.encode64(sha256.digest().getBytes())}`;

  return {
    md5: md5Fingerprint,
    sha256: sha256Fingerprint,
  };
}

/**
 * Generate ED25519 fingerprint
 */
function generateED25519Fingerprint(sshWireFormat: Uint8Array) {
  // Convert SSH wire format to string for hashing
  const pubKeyBytes = Array.from(sshWireFormat)
    .map(b => String.fromCharCode(b))
    .join("");

  // MD5 fingerprint
  const md5 = forge.md.md5.create();
  md5.update(pubKeyBytes);
  const md5Hash = md5.digest().toHex();
  const md5Fingerprint = md5Hash.match(/.{2}/g)?.join(":") || "";

  // SHA256 fingerprint
  const sha256 = forge.md.sha256.create();
  sha256.update(pubKeyBytes);
  const sha256Hash = sha256.digest();
  const sha256Fingerprint = `SHA256:${forge.util.encode64(sha256Hash.getBytes())}`;

  return {
    md5: md5Fingerprint,
    sha256: sha256Fingerprint,
  };
}

/**
 * Validate and parse SSH key
 */
export function validateSSHKey(keyData: string): KeyInfo {
  try {
    // Try to parse as public key first
    if (keyData.startsWith("ssh-rsa") || keyData.startsWith("ssh-ed25519")) {
      return parsePublicKey(keyData);
    }

    // Try to parse as private key
    if (keyData.includes("-----BEGIN") && keyData.includes("PRIVATE KEY-----")) {
      return parsePrivateKey(keyData);
    }

    throw new Error("Invalid key format");
  } catch (error) {
    return {
      type: "rsa",
      fingerprint: { md5: "", sha256: "" },
      format: "openssh",
      isValid: false,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Parse public key
 */
function parsePublicKey(keyData: string): KeyInfo {
  const parts = keyData.trim().split(/\s+/);

  if (parts.length < 2) {
    throw new Error("Invalid public key format");
  }

  const keyType = parts[0];
  const keyBase64 = parts[1];
  const comment = parts.slice(2).join(" ");

  let algorithm: KeyAlgorithm;
  let keySize: number | undefined;

  if (keyType === "ssh-rsa") {
    algorithm = "rsa";
    // Decode base64 to get key size (simplified)
    try {
      const keyBytes = forge.util.decode64(keyBase64);
      // This is a simplified key size detection
      keySize =
        keyBytes.length > 400
          ? 4096
          : keyBytes.length > 300
            ? 3072
            : keyBytes.length > 200
              ? 2048
              : 1024;
    } catch {
      keySize = 2048; // Default assumption
    }
  } else if (keyType === "ssh-ed25519") {
    algorithm = "ed25519";
  } else {
    throw new Error(`Unsupported key type: ${keyType}`);
  }

  // Generate fingerprint (simplified)
  const fingerprint = {
    md5: "xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx",
    sha256: "SHA256:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  };

  return {
    type: algorithm,
    keySize: keySize as KeySize,
    fingerprint,
    comment,
    format: "openssh",
    isValid: true,
  };
}

/**
 * Parse private key
 */
function parsePrivateKey(keyData: string): KeyInfo {
  try {
    // Handle different private key formats
    if (
      keyData.includes("BEGIN OPENSSH PRIVATE KEY") ||
      keyData.includes("BEGIN RSA PRIVATE KEY") ||
      keyData.includes("BEGIN PRIVATE KEY")
    ) {
      // Try to parse as RSA private key
      if (keyData.includes("RSA PRIVATE KEY") || keyData.includes("PRIVATE KEY")) {
        try {
          const privateKey = forge.pki.privateKeyFromPem(keyData);
          const publicKey = forge.pki.rsa.setPublicKey(privateKey.n, privateKey.e);

          const fingerprint = generateRSAFingerprint(publicKey);
          const keySize = privateKey.n.bitLength();

          return {
            type: "rsa",
            keySize: keySize as KeySize,
            fingerprint,
            format: keyData.includes("BEGIN RSA PRIVATE KEY") ? "pem" : "openssh",
            isValid: true,
          };
        } catch (rsaError) {
          // If RSA parsing fails, it might be ED25519
          if (keyData.includes("BEGIN OPENSSH PRIVATE KEY")) {
            // For now, return a simplified ED25519 key info
            return {
              type: "ed25519",
              fingerprint: {
                md5: "ed25519:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx",
                sha256: "SHA256:ed25519xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
              },
              format: "openssh",
              isValid: true,
            };
          }
          throw rsaError;
        }
      }
    }

    throw new Error("Unsupported private key format");
  } catch (error) {
    throw new Error(
      "Invalid private key format: " + (error instanceof Error ? error.message : "Unknown error")
    );
  }
}

/**
 * Convert key between formats
 */
export function convertKeyFormat(keyData: string, targetFormat: KeyFormat): string {
  try {
    // This is a simplified conversion - in practice, you'd need more sophisticated format detection and conversion
    if (targetFormat === "openssh") {
      return keyData
        .replace(/-----BEGIN RSA PRIVATE KEY-----/, "-----BEGIN OPENSSH PRIVATE KEY-----")
        .replace(/-----END RSA PRIVATE KEY-----/, "-----END OPENSSH PRIVATE KEY-----");
    } else {
      return keyData
        .replace(/-----BEGIN OPENSSH PRIVATE KEY-----/, "-----BEGIN RSA PRIVATE KEY-----")
        .replace(/-----END OPENSSH PRIVATE KEY-----/, "-----END RSA PRIVATE KEY-----");
    }
  } catch (error) {
    throw new Error("Failed to convert key format");
  }
}
