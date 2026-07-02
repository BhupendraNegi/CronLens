// Dialect registry (Design §9, §24). Each dialect describes its field order,
// bounds, day-of-week numbering, special-char support, and nicknames — so the
// parser generalizes over dialects instead of forking per format.

import type { CronDialect } from "./types";
import { MONTH_NAMES, DAY_NAMES } from "./parser";

// Quartz numbers day-of-week 1..7 with 1 = Sunday.
export const QUARTZ_DAY_NAMES: Record<string, number> = {
  SUN: 1, MON: 2, TUE: 3, WED: 4, THU: 5, FRI: 6, SAT: 7,
};

export type FieldKey =
  | "second"
  | "minute"
  | "hour"
  | "dayOfMonth"
  | "month"
  | "dayOfWeek"
  | "year";

export interface FieldSpec {
  key: FieldKey;
  label: string;
  min: number;
  max: number;
  names: Record<string, number> | null;
  isDow?: boolean;
  // Map a raw field value onto JS weekday numbering (0=Sun..6=Sat).
  normalizeDow?: (v: number) => number;
}

export interface DialectDefinition {
  id: CronDialect;
  label: string;
  order: FieldSpec[];
  minFields: number;
  maxFields: number;
  allowQuestion: boolean;
  nicknames: boolean;
}

const SECOND: FieldSpec = { key: "second", label: "Second", min: 0, max: 59, names: null };
const MINUTE: FieldSpec = { key: "minute", label: "Minute", min: 0, max: 59, names: null };
const HOUR: FieldSpec = { key: "hour", label: "Hour", min: 0, max: 23, names: null };
const DOM: FieldSpec = { key: "dayOfMonth", label: "Day of month", min: 1, max: 31, names: null };
const MONTH: FieldSpec = { key: "month", label: "Month", min: 1, max: 12, names: MONTH_NAMES };
const YEAR: FieldSpec = { key: "year", label: "Year", min: 1970, max: 2099, names: null };

const DOW_STD: FieldSpec = {
  key: "dayOfWeek",
  label: "Day of week",
  min: 0,
  max: 7,
  names: DAY_NAMES,
  isDow: true,
  normalizeDow: (v) => (v === 7 ? 0 : v),
};

const DOW_QUARTZ: FieldSpec = {
  key: "dayOfWeek",
  label: "Day of week",
  min: 1,
  max: 7,
  names: QUARTZ_DAY_NAMES,
  isDow: true,
  normalizeDow: (v) => v - 1,
};

export const DIALECTS: Record<string, DialectDefinition> = {
  "standard-5-field": {
    id: "standard-5-field",
    label: "Standard 5-field cron",
    order: [MINUTE, HOUR, DOM, MONTH, DOW_STD],
    minFields: 5,
    maxFields: 5,
    allowQuestion: false,
    nicknames: true,
  },
  "standard-6-field": {
    id: "standard-6-field",
    label: "6-field (with seconds)",
    order: [SECOND, MINUTE, HOUR, DOM, MONTH, DOW_STD],
    minFields: 6,
    maxFields: 6,
    allowQuestion: false,
    nicknames: true,
  },
  quartz: {
    id: "quartz",
    label: "Quartz",
    order: [SECOND, MINUTE, HOUR, DOM, MONTH, DOW_QUARTZ, YEAR],
    minFields: 6,
    maxFields: 7,
    allowQuestion: true,
    nicknames: false,
  },
};

// Dialects surfaced in the UI (others in the CronDialect union remain "soon").
export const SELECTABLE_DIALECTS: CronDialect[] = ["standard-5-field", "standard-6-field", "quartz"];

export function getDialect(id: CronDialect): DialectDefinition {
  return DIALECTS[id] ?? DIALECTS["standard-5-field"];
}

// Nickname → equivalent minute-based fields (Design §8). Seconds are prepended
// by the parser when the dialect has a seconds field.
export const NICKNAMES: Record<string, string> = {
  "@yearly": "0 0 1 1 *",
  "@annually": "0 0 1 1 *",
  "@monthly": "0 0 1 * *",
  "@weekly": "0 0 * * 0",
  "@daily": "0 0 * * *",
  "@midnight": "0 0 * * *",
  "@hourly": "0 * * * *",
};
