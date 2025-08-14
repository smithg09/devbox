import { v1, v3, v4, v5 } from "uuid";
import { ulid } from "ulid";
import { createId } from "@paralleldrive/cuid2";
import { customAlphabet, nanoid } from "nanoid";
import { Generator, GeneratorConfig, GeneratorOption } from "../types/ids";

// Generator options with descriptions
export const generatorOptions: GeneratorOption[] = [
  {
    value: "v4",
    label: "UUID v4",
    description: "Random UUID (most common)",
    example: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  },
  {
    value: "v1",
    label: "UUID v1",
    description: "Time-based UUID with MAC address",
    example: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  },
  {
    value: "v3",
    label: "UUID v3",
    description: "Name-based UUID using MD5",
    example: "6fa459ea-ee8a-3ca4-894e-db77e160355e",
  },
  {
    value: "v5",
    label: "UUID v5",
    description: "Name-based UUID using SHA-1",
    example: "886313e1-3b8a-5372-9b90-0c9aee199e5d",
  },
  {
    value: "ulid",
    label: "ULID",
    description: "Universally Unique Lexicographically Sortable",
    example: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  },
  {
    value: "objectid",
    label: "MongoDB ObjectId",
    description: "12-byte MongoDB identifier",
    example: "507f1f77bcf86cd799439011",
  },
  {
    value: "snowflake",
    label: "Snowflake ID",
    description: "Twitter's distributed ID system",
    example: "1234567890123456789",
  },
  {
    value: "cuid2",
    label: "CUID2",
    description: "Collision-resistant unique identifier",
    example: "clhqxf8w60000qwvk5q9b2q9k",
  },
  {
    value: "nanoid",
    label: "Nano ID",
    description: "URL-safe unique string generator",
    example: "V1StGXR8_Z5jdHi6B-myT",
  },
  {
    value: "custom",
    label: "Custom",
    description: "Custom alphabet and length",
    example: "ABC123XYZ",
  },
];

// MongoDB ObjectId generator
function generateObjectId(): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const machineId = Math.floor(Math.random() * 0xffffff);
  const processId = Math.floor(Math.random() * 0xffff);
  const counter = Math.floor(Math.random() * 0xffffff);

  return [
    timestamp.toString(16).padStart(8, "0"),
    machineId.toString(16).padStart(6, "0"),
    processId.toString(16).padStart(4, "0"),
    counter.toString(16).padStart(6, "0"),
  ].join("");
}

// Snowflake ID generator
function generateSnowflake(config?: { epoch?: number; machineId?: number }): string {
  const epoch = config?.epoch || 1288834974657; // Twitter's epoch
  const machineId = config?.machineId || Math.floor(Math.random() * 1024);
  const timestamp = Date.now() - epoch;
  const sequence = Math.floor(Math.random() * 4096);

  // 64-bit Snowflake: 42 bits timestamp + 10 bits machine + 12 bits sequence
  const snowflake = (BigInt(timestamp) << 22n) | (BigInt(machineId) << 12n) | BigInt(sequence);
  return snowflake.toString();
}

// Default namespace for UUID v3/v5
const DNS_NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

export function generateId(generator: Generator, config?: GeneratorConfig): string {
  switch (generator) {
    case "v1":
      return v1();
    case "v3":
      return v3(config?.uuidV3V5?.name || "example", config?.uuidV3V5?.namespace || DNS_NAMESPACE);
    case "v4":
      return v4();
    case "v5":
      return v5(config?.uuidV3V5?.name || "example", config?.uuidV3V5?.namespace || DNS_NAMESPACE);
    case "ulid":
      return ulid();
    case "objectid":
      return generateObjectId();
    case "snowflake":
      return generateSnowflake(config?.snowflake);
    case "cuid2":
      return createId();
    case "nanoid":
      return nanoid();
    case "custom":
      if (config?.custom) {
        return customAlphabet(config.custom.alphabet)(config.custom.length);
      }
      return customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789")(16);
    default:
      return v4();
  }
}

export function generateBulkIds(
  generator: Generator,
  count: number,
  config?: GeneratorConfig
): string[] {
  return Array.from({ length: count }, () => generateId(generator, config));
}
