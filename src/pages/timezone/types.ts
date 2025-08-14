export type TimeFormat = "h12" | "h24";

export interface TimezoneRow {
  id: string;
  label: string;
  timeZone: string; // IANA timezone, e.g., "Asia/Kolkata"
  // Per-card state
  live?: boolean; // if true or undefined, follows real-time clock
  referenceIso?: string; // when live is false, card uses this reference instant
  // UI-only: when true, this row is being edited inline and should render editor UI
  isDraft?: boolean;
  // UI-only: marks a newly added unsaved row so Cancel can remove instead of reverting
  isNew?: boolean;
}

export type SliderZoom = "hours" | "days";

export interface TimezonePreferencesV1 {
  version: 1;
  rows: TimezoneRow[];
  timeFormat: TimeFormat;
  lastReferenceIso?: string;
  sliderZoom: SliderZoom;
}

export const TIMEZONE_PREFERENCES_KEY = "timezone.preferences";
