import forge from "node-forge";

export type ParsedPublicKey = {
  type: string;
  sizeBits?: number;
  details?: Record<string, unknown>;
};

export type ParsedExtension = {
  oid: string;
  name?: string;
  value: unknown;
};

export type ParsedCertificate = {
  pem?: string;
  der?: Uint8Array;
  type: "cert" | "csr";
  subject?: Record<string, string>;
  issuer?: Record<string, string>;
  serialHex?: string;
  version?: number;
  validFrom?: string;
  validTo?: string;
  signatureAlgorithm?: string;
  publicKey?: ParsedPublicKey;
  fingerprints?: { sha1?: string; sha256?: string };
  extensions?: ParsedExtension[];
};

const OIDS = forge.pki.oids as Record<string, string>;

function binStrToUint8Array(bin: string): Uint8Array {
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i) & 0xff;
  return out;
}

export function pemToDerBytes(pem: string): Uint8Array {
  const base64 = pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");
  const binStr = atob(base64);
  return binStrToUint8Array(binStr);
}

async function digestHex(data: Uint8Array, algo: "SHA-1" | "SHA-256"): Promise<string> {
  const buf = await crypto.subtle.digest(algo, data);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function parseDistinguishedName(
  attrs: Array<{ name?: string; shortName?: string; value: string; type?: string }>
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const a of attrs) {
    const key = a.shortName || a.name || a.type || "unknown";
    map[key] = a.value;
  }
  return map;
}

function getSignatureAlgorithmName(cert: forge.pki.Certificate): string | undefined {
  const oid = cert.siginfo?.algorithmOid || cert.signatureOid;
  if (!oid) return undefined;
  const name = OIDS[oid];
  return name ? `${name} (${oid})` : oid;
}

function getPublicKeyInfo(cert: forge.pki.Certificate): ParsedPublicKey | undefined {
  const pk: any = cert.publicKey;
  // RSA
  if (pk && pk.n && pk.e) {
    return {
      type: "RSA",
      sizeBits: pk.n.bitLength?.() || undefined,
      details: { exponent: pk.e?.toString?.(10) },
    };
  }
  // EC
  if (pk && pk.Q) {
    // Try to locate curve OID from subjectPublicKeyInfo
    try {
      const asn1 = forge.pki.certificateToAsn1(cert);
      const spki = (asn1.value as any)[0].value[6];
      const algId = spki.value[0];
      const params = algId.value[1];
      let curveOid = "";
      if (params && params.type === forge.asn1.Type.OID) {
        curveOid = forge.asn1.derToOid(params.value as string);
      }
      const curveName = (OIDS as any)[curveOid] || curveOid || undefined;
      return {
        type: "EC",
        sizeBits: pk.Q?.x?.length ? pk.Q.x.length * 8 : undefined,
        details: { curve: curveName },
      };
    } catch {
      return { type: "EC" };
    }
  }
  return undefined;
}

async function computeFingerprints(
  cert: forge.pki.Certificate
): Promise<{ sha1: string; sha256: string }> {
  const asn1 = forge.pki.certificateToAsn1(cert);
  const der = forge.asn1.toDer(asn1).getBytes();
  const u8 = binStrToUint8Array(der);
  const [sha1, sha256] = await Promise.all([digestHex(u8, "SHA-1"), digestHex(u8, "SHA-256")]);
  return { sha1, sha256 };
}

function parseExtensions(cert: forge.pki.Certificate): ParsedExtension[] {
  const out: ParsedExtension[] = [];
  for (const ext of cert.extensions || []) {
    const name = (ext as any).name as string | undefined;
    const oid = (ext as any).id as string | undefined;
    const resolvedName = name || (oid ? OIDS[oid] : undefined);
    const value: any = {};
    if (ext.name === "basicConstraints") {
      value.ca = (ext as any).cA || false;
      if ((ext as any).pathLenConstraint !== undefined)
        value.pathLen = (ext as any).pathLenConstraint;
    } else if (ext.name === "keyUsage") {
      Object.assign(value, ext);
    } else if (ext.name === "extKeyUsage") {
      Object.assign(value, ext);
    } else if (ext.name === "subjectAltName") {
      value.altNames = (ext as any).altNames || [];
    } else if (ext.name === "subjectKeyIdentifier") {
      value.subjectKeyIdentifier = (ext as any).subjectKeyIdentifier;
    } else if (ext.name === "authorityKeyIdentifier") {
      value.authorityKeyIdentifier = (ext as any).keyIdentifier;
    } else if (ext.name === "authorityInfoAccess") {
      value.accessDescriptions = (ext as any).accessDescriptions;
    } else if (ext.name === "cRLDistributionPoints") {
      value.distributionPoints = (ext as any).distributionPoints;
    } else {
      Object.assign(value, ext);
    }
    out.push({ oid: oid || "", name: resolvedName, value });
  }
  return out;
}

export async function parsePemCertificate(pem: string): Promise<ParsedCertificate> {
  const type: "cert" | "csr" =
    pem.includes("BEGIN CERTIFICATE REQUEST") || pem.includes("BEGIN NEW CERTIFICATE REQUEST")
      ? "csr"
      : "cert";
  if (type === "csr") {
    // CSR: forge parses via pki.certificationRequestFromPem
    const csr = forge.pki.certificationRequestFromPem(pem);
    const der = pemToDerBytes(pem);
    const [sha1, sha256] = await Promise.all([digestHex(der, "SHA-1"), digestHex(der, "SHA-256")]);
    return {
      type: "csr",
      pem,
      der,
      subject: parseDistinguishedName(csr.subject.attributes as any),
      publicKey: getPublicKeyInfo({ publicKey: csr.publicKey } as any),
      fingerprints: { sha1, sha256 },
    };
  }

  const cert = forge.pki.certificateFromPem(pem);
  const subject = parseDistinguishedName(cert.subject.attributes as any);
  const issuer = parseDistinguishedName(cert.issuer.attributes as any);
  const version = (cert.version || 0) + 1;
  const serialHex = cert.serialNumber;
  const validFrom = cert.validity.notBefore?.toISOString();
  const validTo = cert.validity.notAfter?.toISOString();
  const signatureAlgorithm = getSignatureAlgorithmName(cert);
  const publicKey = getPublicKeyInfo(cert);
  const extensions = parseExtensions(cert);
  const fingerprints = await computeFingerprints(cert);
  const der = pemToDerBytes(pem);
  return {
    type: "cert",
    pem,
    der,
    subject,
    issuer,
    version,
    serialHex,
    validFrom,
    validTo,
    signatureAlgorithm,
    publicKey,
    extensions,
    fingerprints,
  };
}

export async function parseDerCertificate(der: Uint8Array): Promise<ParsedCertificate> {
  const bin = Array.from(der)
    .map(b => String.fromCharCode(b))
    .join("");
  const asn1 = forge.asn1.fromDer(bin);
  // Try CSR first
  try {
    const csr = forge.pki.certificationRequestFromAsn1(asn1);
    const [sha1, sha256] = await Promise.all([digestHex(der, "SHA-1"), digestHex(der, "SHA-256")]);
    return {
      type: "csr",
      der,
      subject: parseDistinguishedName(csr.subject.attributes as any),
      publicKey: getPublicKeyInfo({ publicKey: csr.publicKey } as any),
      fingerprints: { sha1, sha256 },
    };
  } catch {
    // Not a CSR, try cert
  }

  const cert = forge.pki.certificateFromAsn1(asn1);
  // Reuse PEM path data
  const tmpPem = forge.pki.certificateToPem(cert);
  return parsePemCertificate(tmpPem);
}

export function splitPemBlocks(pem: string): string[] {
  const blocks: string[] = [];
  const regex = /-----BEGIN [^-]+-----[\s\S]*?-----END [^-]+-----/g;
  const matches = pem.match(regex) || [];
  for (const m of matches) blocks.push(m.trim());
  return blocks;
}
