import { Generator, IdInspectionResult } from "../types/ids";

// Regex patterns for different ID types
const patterns = {
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  ulid: /^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}$/,
  objectid: /^[0-9a-f]{24}$/i,
  snowflake: /^\d{18,19}$/,
  cuid2: /^[a-z][a-z0-9]{20,32}$/,
  nanoid: /^[A-Za-z0-9_-]{21}$/,
};

export function validateId(id: string): boolean {
  if (!id || typeof id !== "string") return false;

  return Object.values(patterns).some(pattern => pattern.test(id));
}

export function detectIdType(id: string): Generator | "unknown" {
  if (!id || typeof id !== "string") return "unknown";

  // UUID detection (check version)
  if (patterns.uuid.test(id)) {
    const version = id.charAt(14);
    switch (version) {
      case "1":
        return "v1";
      case "3":
        return "v3";
      case "4":
        return "v4";
      case "5":
        return "v5";
      default:
        return "v4"; // fallback
    }
  }

  if (patterns.ulid.test(id)) return "ulid";
  if (patterns.objectid.test(id)) return "objectid";
  if (patterns.snowflake.test(id)) return "snowflake";
  if (patterns.cuid2.test(id)) return "cuid2";
  if (patterns.nanoid.test(id)) return "nanoid";

  return "unknown";
}

export function inspectId(id: string): IdInspectionResult {
  const type = detectIdType(id);
  const valid = validateId(id);

  const result: IdInspectionResult = {
    type,
    valid,
    format: getIdFormat(type),
    description: getIdDescription(type),
  };

  // Extract metadata based on type
  if (valid && type !== "unknown") {
    result.metadata = extractMetadata(id, type);
  }

  return result;
}

function getIdFormat(type: Generator | "unknown"): string {
  switch (type) {
    case "v1":
    case "v3":
    case "v4":
    case "v5":
      return "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX";
    case "ulid":
      return "01ARZ3NDEKTSV4RRFFQ69G5FAV";
    case "objectid":
      return "507f1f77bcf86cd799439011";
    case "snowflake":
      return "1234567890123456789";
    case "cuid2":
      return "clhqxf8w60000qwvk5q9b2q9k";
    case "nanoid":
      return "V1StGXR8_Z5jdHi6B-myT";
    default:
      return "Unknown format";
  }
}

function getIdDescription(type: Generator | "unknown"): string {
  switch (type) {
    case "v1":
      return "Time-based UUID with MAC address";
    case "v3":
      return "Name-based UUID using MD5 hashing";
    case "v4":
      return "Random UUID (most common)";
    case "v5":
      return "Name-based UUID using SHA-1 hashing";
    case "ulid":
      return "Universally Unique Lexicographically Sortable Identifier";
    case "objectid":
      return "MongoDB 12-byte identifier";
    case "snowflake":
      return "Twitter's distributed ID generation algorithm";
    case "cuid2":
      return "Collision-resistant unique identifier";
    case "nanoid":
      return "URL-safe unique string generator";
    default:
      return "Unknown identifier type";
  }
}

function extractMetadata(id: string, type: Generator): Record<string, any> {
  const metadata: Record<string, any> = {};

  try {
    switch (type) {
      case "v1": {
        metadata.version = "1";
        // Extract timestamp from UUID v1
        const timestampHex = id.substring(15, 18) + id.substring(9, 13) + id.substring(0, 8);
        const timestampNum = parseInt(timestampHex, 16);
        const uuidEpoch = 0x01b21dd213814000;
        metadata.timestamp = new Date(Math.floor((timestampNum - uuidEpoch) / 10000));
        break;
      }
      case "v3": {
        metadata.version = "3";
        metadata.hashingAlgorithm = "MD5";
        break;
      }
      case "v4": {
        metadata.version = "4";
        metadata.randomBits = 122;
        break;
      }
      case "v5": {
        metadata.version = "5";
        metadata.hashingAlgorithm = "SHA-1";
        break;
      }
      case "ulid": {
        // Extract timestamp from ULID (first 10 characters)
        const ulidTimestamp = id.substring(0, 10);
        const crockfordAlphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
        let ulidTimestampNum = 0;
        for (let i = 0; i < ulidTimestamp.length; i++) {
          ulidTimestampNum = ulidTimestampNum * 32 + crockfordAlphabet.indexOf(ulidTimestamp[i]);
        }
        metadata.timestamp = new Date(ulidTimestampNum);
        metadata.randomness = id.substring(10);
        break;
      }
      case "objectid": {
        // Extract timestamp from ObjectId (first 8 characters)
        const objIdTimestamp = parseInt(id.substring(0, 8), 16);
        metadata.timestamp = new Date(objIdTimestamp * 1000);
        metadata.machineId = id.substring(8, 14);
        metadata.processId = id.substring(14, 18);
        metadata.counter = id.substring(18, 24);
        break;
      }
      case "snowflake": {
        // Extract timestamp from Snowflake ID
        const snowflakeId = BigInt(id);
        const extractedTimestamp = (snowflakeId >> 22n) + 1288834974657n; // Twitter epoch
        metadata.timestamp = new Date(Number(extractedTimestamp));
        metadata.machineId = Number((snowflakeId >> 12n) & 0x3ffn);
        metadata.sequence = Number(snowflakeId & 0xfffn);
        break;
      }
      case "cuid2": {
        metadata.length = id.length;
        metadata.entropy = "High";
        break;
      }
      case "nanoid": {
        metadata.length = id.length;
        metadata.alphabet = "URL-safe (A-Za-z0-9_-)";
        break;
      }
    }
  } catch (error) {
    metadata.extractionError = "Could not extract metadata";
  }

  return metadata;
}
