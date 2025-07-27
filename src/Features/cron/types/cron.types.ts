export interface CronField {
  value: string;
  label: string;
  description: string;
}

export interface CronPreset {
  label: string;
  value: string;
  description: string;
  category: "common" | "advanced";
}

export interface CronValidation {
  isValid: boolean;
  error?: string;
  details?: string;
}

export interface CronExecution {
  date: Date;
  humanReadable: string;
  fromNow: string;
}

export interface CronFieldConfig {
  name: string;
  label: string;
  description: string;
  range: string;
  examples: string[];
  specialChars: string[];
}
