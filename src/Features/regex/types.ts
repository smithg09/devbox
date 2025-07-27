export interface MatchResult {
  index: number;
  match: string;
  groups: string[];
  namedGroups: Record<string, string>;
  start: number;
  end: number;
  length: number;
}

export interface GroupResult {
  index: number;
  name?: string;
  value: string;
  start: number;
  end: number;
}

export interface PerformanceMetrics {
  executionTime: number;
  matchCount: number;
  iterations: number;
}

export interface RegexTestResult {
  matches: MatchResult[];
  groups: GroupResult[];
  performance: PerformanceMetrics;
  error?: string;
}

export interface RegexFlags {
  global: boolean;
  ignoreCase: boolean;
  multiline: boolean;
  dotAll: boolean;
  unicode: boolean;
  sticky: boolean;
}

export interface PatternLibraryItem {
  id: string;
  name: string;
  pattern: string;
  flags: Partial<RegexFlags>;
  description: string;
  examples: string[];
  category: "url" | "date" | "common";
}

export type RegexMode = "normal" | "advanced";
