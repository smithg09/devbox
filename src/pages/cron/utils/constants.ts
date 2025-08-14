import { CronPreset, CronFieldConfig } from "../types/cron.types";

export const CRON_PRESETS: CronPreset[] = [
  {
    label: "Every minute",
    value: "* * * * *",
    description: "Runs every minute",
    category: "common",
  },
  {
    label: "Every 5 minutes",
    value: "*/5 * * * *",
    description: "Runs every 5 minutes",
    category: "common",
  },
  {
    label: "Every hour",
    value: "0 * * * *",
    description: "Runs at the start of every hour",
    category: "common",
  },
  {
    label: "Every day at midnight",
    value: "0 0 * * *",
    description: "Runs daily at 12:00 AM",
    category: "common",
  },
  {
    label: "Every day at noon",
    value: "0 12 * * *",
    description: "Runs daily at 12:00 PM",
    category: "common",
  },
  {
    label: "Every week on Sunday",
    value: "0 0 * * 0",
    description: "Runs weekly on Sunday at midnight",
    category: "common",
  },
  {
    label: "Every month on 1st",
    value: "0 0 1 * *",
    description: "Runs monthly on the 1st at midnight",
    category: "common",
  },
  {
    label: "Every weekday at 9 AM",
    value: "0 9 * * 1-5",
    description: "Runs Monday to Friday at 9:00 AM",
    category: "advanced",
  },
  {
    label: "Every 15 minutes during business hours",
    value: "*/15 9-17 * * 1-5",
    description: "Runs every 15 minutes from 9 AM to 5 PM, weekdays only",
    category: "advanced",
  },
];

export const CRON_FIELD_CONFIG: CronFieldConfig[] = [
  {
    name: "minute",
    label: "Minute",
    description: "Minute of the hour",
    range: "0-59",
    examples: ["0", "15", "30", "45", "*/5"],
    specialChars: ["*", "/", "-", ","],
  },
  {
    name: "hour",
    label: "Hour",
    description: "Hour of the day",
    range: "0-23",
    examples: ["0", "12", "18", "9-17", "*/2"],
    specialChars: ["*", "/", "-", ","],
  },
  {
    name: "day",
    label: "Day",
    description: "Day of the month",
    range: "1-31",
    examples: ["1", "15", "*/2", "1,15"],
    specialChars: ["*", "/", "-", ","],
  },
  {
    name: "month",
    label: "Month",
    description: "Month of the year",
    range: "1-12",
    examples: ["1", "6", "1,3,5", "*/3"],
    specialChars: ["*", "/", "-", ","],
  },
  {
    name: "weekday",
    label: "Weekday",
    description: "Day of the week",
    range: "0-6 (0=Sunday)",
    examples: ["0", "1", "1-5", "6,0"],
    specialChars: ["*", "/", "-", ","],
  },
];

export const CRON_EXAMPLES = [
  { expression: "* * * * *", description: "Every minute" },
  { expression: "0 * * * *", description: "Every hour" },
  { expression: "0 0 * * *", description: "Every day at 12:00 AM" },
  { expression: "0 0 * * 0", description: "At 12:00 AM, only on Friday" },
  { expression: "0 0 1 * *", description: "At 12:00 AM, on day 1 of the month" },
  { expression: "*/5 * * * *", description: "Every 5 minutes" },
  { expression: "0 */2 * * *", description: "Every 2 hours" },
  { expression: "0 9-17 * * 1-5", description: "Every hour from 9 AM to 5 PM, Monday to Friday" },
];

export const SPECIAL_CHARACTERS = [
  { char: "*", description: "Any value (wildcard)" },
  { char: "/", description: "Step values (e.g., */5 = every 5)" },
  { char: "-", description: "Range of values (e.g., 1-5)" },
  { char: ",", description: "List of values (e.g., 1,3,5)" },
];
