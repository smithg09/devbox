import cityTimezones from "city-timezones";
import * as ct from "countries-and-timezones";
import { TimeFormat } from "./types";
export function getSupportedTimeZones(): string[] {
  try {
    if (typeof Intl.supportedValuesOf === "function") {
      // @ts-ignore
      return Intl.supportedValuesOf("timeZone") as string[];
    }
  } catch {
    // ignore
  }
  // Fallback curated list
  return [
    "UTC",
    "America/Los_Angeles",
    "America/New_York",
    "Europe/London",
    "Europe/Berlin",
    "Asia/Kolkata",
    "Asia/Tokyo",
    "Asia/Singapore",
    "Australia/Sydney",
  ];
}

export interface TimezoneSearchItem {
  id: string; // IANA timezone
  label: string; // Friendly label with city/country/abbr
}

// Build a searchable catalog using countries-and-timezones
let cachedCatalog: TimezoneSearchItem[] | null = null;
export function getTimezoneCatalog(): TimezoneSearchItem[] {
  if (cachedCatalog) return cachedCatalog;
  const zones = ct.getAllTimezones();
  const countries = ct.getAllCountries();
  const countryById: Record<string, string> = {};
  Object.values(countries).forEach((c: any) => {
    countryById[c.id] = c.name as string;
  });

  const items: TimezoneSearchItem[] = Object.values(zones).map((z: any) => {
    const countryName = z.countries?.[0] ? countryById[z.countries[0] as string] : "";
    const city = (z.name as string).split("/")[1]?.replace(/_/g, " ") || (z.name as string);
    const abbr = (z.abbr as string) || "";
    const parts = [city, countryName, abbr, z.name].filter(Boolean);
    return {
      id: z.name as string,
      label: parts.join(" • "),
    };
  });

  cachedCatalog = items.sort((a, b) => a.label.localeCompare(b.label));
  return cachedCatalog;
}
export function formatInTimezone(
  date: Date,
  timeZone: string,
  timeFormat: TimeFormat,
  showSeconds: boolean
): string {
  const hour12 = timeFormat === "h12";
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: showSeconds ? ("2-digit" as const) : undefined,
      hour12,
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}
export function toISO(date: Date): string {
  return date.toISOString();
}
export function getUtcOffsetString(date: Date, timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "shortOffset",
      hour: "2-digit",
      minute: "2-digit",
    })
      .formatToParts(date)
      .find(p => p.type === "timeZoneName");

    return parts?.value?.replace("GMT", "UTC") || "UTC±00:00";
  } catch {
    return "UTC±00:00";
  }
}

// Common abbreviation to IANA zone suggestions (non-exhaustive)
const ABBREVIATION_TO_TIMEZONES: Record<string, string[]> = {
  PST: ["America/Los_Angeles"],
  PDT: ["America/Los_Angeles"],
  CST: ["America/Chicago", "Asia/Shanghai"],
  CDT: ["America/Chicago"],
  IST: ["Asia/Kolkata"],
  CEST: ["Europe/Berlin", "Europe/Paris", "Europe/Madrid", "Europe/Rome"],
  CET: ["Europe/Berlin", "Europe/Paris", "Europe/Madrid", "Europe/Rome"],
};

export function abbreviationMatches(timeZone: string, query: string): boolean {
  const key = (query || "").toUpperCase().trim();
  if (!key) return false;
  const zones = ABBREVIATION_TO_TIMEZONES[key];
  if (!zones) return false;
  return zones.includes(timeZone);
}

export function filterTimezonesAdvanced(query: string): TimezoneSearchItem[] {
  const catalog = getTimezoneCatalog();
  const q = (query || "").trim();
  if (!q) return catalog;
  const qLower = q.toLowerCase();
  // Match abbreviation exactly (case-insensitive)
  const abbrMatches = catalog.filter(item => abbreviationMatches(item.id, q));
  // Match city names, country names, and IANA ids
  const textMatches = catalog.filter(
    item =>
      item.label.toLowerCase().includes(qLower) ||
      item.id.toLowerCase().includes(qLower) ||
      (qLower.length > 2 && item.label.startsWith(qLower))
  );
  // City name dataset (handles cities not reflected in IANA label directly)
  let cityMatches: TimezoneSearchItem[] = [];
  try {
    const results = cityTimezones.findFromCityStateProvince(q);
    const mapped = (results || []).map((r: any) => ({
      id: r.timezone as string,
      label: `${r.city} • ${r.iso2} • ${r.timezone}`,
    }));
    cityMatches = mapped as TimezoneSearchItem[];
  } catch {
    // ignore
  }
  const merged: Record<string, TimezoneSearchItem> = {};
  [...abbrMatches, ...textMatches, ...cityMatches].forEach(it => (merged[it.id] = it));
  // remove any records with null id
  const filtered = Object.values(merged).filter(it => it.id);
  return filtered.sort((a, b) => a.label.localeCompare(b.label));
}

// Build a friendly default label like "City, Country" from an IANA timezone
export function getCityCountryLabel(timeZone: string): string {
  try {
    const zone: any = (ct as any).getTimezone ? (ct as any).getTimezone(timeZone) : null;
    const city = (timeZone.split("/")[1] || timeZone).replace(/_/g, " ");
    let country = "";
    if (zone && Array.isArray(zone.countries) && zone.countries[0]) {
      const countryInfo: any = (ct as any).getCountry
        ? (ct as any).getCountry(zone.countries[0])
        : null;
      country = (countryInfo && (countryInfo.name as string)) || "";
    }
    return country ? `${city}, ${country}` : city;
  } catch {
    const city = (timeZone.split("/")[1] || timeZone).replace(/_/g, " ");
    return city;
  }
}

export function getUtcOffsetMinutes(date: Date, timeZone: string): number {
  const raw = getUtcOffsetString(date, timeZone); // e.g., UTC+05:30, UTC−07:00, UTC-7
  const s = raw
    .replace(/GMT/gi, "UTC")
    .replace(/\u2212/g, "-")
    .replace(/\s+/g, "");
  const match = s.match(/UTC([+\-])?(\d{1,2})(?::(\d{2}))?/);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  const hours = parseInt(match[2] || "0", 10);
  const minutes = parseInt(match[3] || "0", 10);
  return sign * (hours * 60 + (isNaN(minutes) ? 0 : minutes));
}

export function getLocalDateParts(
  date: Date,
  timeZone: string
): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => Number(parts.find(p => p.type === type)?.value || 0);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

export function getTimeOfDayMinutesInTz(date: Date, timeZone: string): number {
  const { hour, minute, second } = getLocalDateParts(date, timeZone);
  return hour * 60 + minute + second / 60;
}

export function buildInstantForTzDateAtTime(
  reference: Date,
  timeZone: string,
  minutesOfDay: number
): Date {
  // Determine local Y-M-D in target TZ from the reference instant
  const { year, month, day } = getLocalDateParts(reference, timeZone);
  const hours = Math.floor(minutesOfDay / 60);
  const minutes = Math.floor(minutesOfDay % 60);
  // Initial UTC guess assuming the same wall-clock as UTC
  const guessUtc = Date.UTC(year, month - 1, day, hours, minutes, 0, 0);
  // Compute offset at the guess and correct
  let off0 = getUtcOffsetMinutes(new Date(guessUtc), timeZone);
  let instant = guessUtc - off0 * 60000;
  // Re-check offset at the corrected instant (handles DST transitions)
  const off1 = getUtcOffsetMinutes(new Date(instant), timeZone);
  if (off1 !== off0) {
    instant = guessUtc - off1 * 60000;
  }
  return new Date(instant);
}

export function getDayDeltaLabel(
  reference: Date,
  timeZone: string
): "Yesterday" | "Today" | "Tomorrow" {
  try {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const localStr = fmt.format(reference); // yyyy-mm-dd
    const utcStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(reference);

    const localDate = new Date(localStr);
    const utcDate = new Date(utcStr);
    const deltaDays = Math.round((localDate.getTime() - utcDate.getTime()) / 86400000);
    if (deltaDays < 0) return "Yesterday";
    if (deltaDays > 0) return "Tomorrow";
    return "Today";
  } catch {
    return "Today";
  }
}
