export type Generator =
  | "v1"
  | "v3"
  | "v4"
  | "v5"
  | "ulid"
  | "objectid"
  | "snowflake"
  | "cuid2"
  | "nanoid"
  | "custom";

export interface CustomConfig {
  alphabet: string;
  length: number;
}

export interface UuidV3V5Config {
  namespace: string;
  name: string;
}

export interface SnowflakeConfig {
  epoch: number;
  machineId: number;
}

export interface GeneratorConfig {
  custom?: CustomConfig;
  uuidV3V5?: UuidV3V5Config;
  snowflake?: SnowflakeConfig;
}

export interface IdInspectionResult {
  type: Generator | "unknown";
  valid: boolean;
  metadata?: {
    version?: string;
    timestamp?: Date;
    node?: string;
    clockSequence?: number;
    namespace?: string;
    name?: string;
    epoch?: number;
    machineId?: number;
    sequence?: number;
    properties?: Record<string, any>;
  };
  format?: string;
  description?: string;
}

export interface GeneratorOption {
  value: Generator;
  label: string;
  description: string;
  example: string;
}
