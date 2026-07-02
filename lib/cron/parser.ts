// Field parser for standard 5-field cron. Pure, framework-agnostic.
// Adapted from the reference prototype in docs/Design Document.
//
// Each field parses into both a sorted set of allowed `values` (what the
// scheduler matches against) and a list of `segments` (what the translator
// turns into English in Phase 2).

import type { CronField } from "./types";
import type { DomRule, DowRule } from "./special";

export type Segment =
  | { type: "all" }
  | { type: "step"; step: number }
  | { type: "stepFrom"; lo: number; step: number }
  | { type: "single"; v: number }
  | { type: "range"; lo: number; hi: number }
  | { type: "rangeStep"; lo: number; hi: number; step: number };

export interface ParsedField {
  raw: string;
  values: number[];
  segments: Segment[];
  errors: string[];
  isWild: boolean;
  // Quartz L/W/# day rule, evaluated per-date by the scheduler.
  special?: DomRule | DowRule;
}

export interface FieldMeta {
  key: CronField;
  label: string;
  min: number;
  max: number;
  names: Record<string, number> | null;
  dow: boolean;
}

export const MONTH_NAMES: Record<string, number> = {
  JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
  JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
};

export const DAY_NAMES: Record<string, number> = {
  SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6,
};

// Field order and bounds for standard 5-field cron.
export const FIELD_META: FieldMeta[] = [
  { key: "minute", label: "Minute", min: 0, max: 59, names: null, dow: false },
  { key: "hour", label: "Hour", min: 0, max: 23, names: null, dow: false },
  { key: "dayOfMonth", label: "Day of month", min: 1, max: 31, names: null, dow: false },
  { key: "month", label: "Month", min: 1, max: 12, names: MONTH_NAMES, dow: false },
  { key: "dayOfWeek", label: "Day of week", min: 0, max: 7, names: DAY_NAMES, dow: true },
];

export interface ParseFieldOptions {
  allowQuestion?: boolean;
  // Map a raw value onto JS weekday numbering; overrides the default 7→0 alias.
  normalizeDow?: (v: number) => number;
}

export function parseField(
  raw: string,
  min: number,
  max: number,
  nameMap: Record<string, number> | null,
  isDow: boolean,
  opts: ParseFieldOptions = {},
): ParsedField {
  const errors: string[] = [];
  const segments: Segment[] = [];
  const valueSet = new Set<number>();
  // Day-of-week accepts 7 as an alias for Sunday (0) unless a dialect overrides.
  const norm =
    opts.normalizeDow ?? ((v: number) => (isDow && v === 7 ? 0 : v));

  if (/[?]/.test(raw)) {
    if (opts.allowQuestion && raw === "?") {
      // '?' = "no specific value" → unrestricted, same as '*' for matching.
      for (let i = min; i <= max; i++) valueSet.add(norm(i));
      return { raw, values: Array.from(valueSet).sort((a, b) => a - b), segments: [{ type: "all" }], errors, isWild: true };
    }
    errors.push(
      "The '?' character isn't supported in this dialect. Try a Quartz-compatible dialect.",
    );
    return { raw, values: [], segments, errors, isWild: false };
  }
  if (/[LW#]/.test(raw)) {
    errors.push("Special characters (L, W, #) aren't supported yet.");
    return { raw, values: [], segments, errors, isWild: false };
  }

  const resolve = (tok: string): number | null => {
    const up = tok.toUpperCase();
    if (nameMap && nameMap[up] != null) return nameMap[up];
    if (/^\d+$/.test(tok)) {
      const n = +tok;
      if (n < min || n > max) {
        errors.push(`Value ${n} is out of range for this field (${min}–${max}).`);
        return null;
      }
      return n;
    }
    errors.push(`Unrecognized value '${tok}'.`);
    return null;
  };

  for (const partRaw of raw.split(",")) {
    const part = partRaw.trim();
    if (part === "") {
      errors.push("Empty term in an expression list.");
      continue;
    }
    let base = part;
    let step = 1;
    let hasStep = false;
    if (part.indexOf("/") !== -1) {
      const bits = part.split("/");
      base = bits[0];
      hasStep = true;
      if (!/^\d+$/.test(bits[1]) || +bits[1] <= 0) {
        errors.push(`Invalid step '${bits[1]}'. Step must be a positive number.`);
        continue;
      }
      step = +bits[1];
    }

    let lo: number;
    let hi: number;
    if (base === "*") {
      lo = min;
      hi = max;
      segments.push(hasStep ? { type: "step", step } : { type: "all" });
    } else if (base.indexOf("-") !== -1) {
      const rb = base.split("-");
      const rlo = resolve(rb[0]);
      const rhi = resolve(rb[1]);
      if (rlo == null || rhi == null) continue;
      if (rlo > rhi) {
        errors.push(`Range ${rb[0]}-${rb[1]} is backwards (start is after end).`);
        continue;
      }
      lo = rlo;
      hi = rhi;
      segments.push(hasStep ? { type: "rangeStep", lo, hi, step } : { type: "range", lo, hi });
    } else {
      const v = resolve(base);
      if (v == null) continue;
      if (hasStep) {
        lo = v;
        hi = max;
        segments.push({ type: "stepFrom", lo: v, step });
      } else {
        lo = v;
        hi = v;
        segments.push({ type: "single", v });
      }
    }
    for (let i = lo; i <= hi; i += step) valueSet.add(norm(i));
  }

  const values = Array.from(valueSet).sort((a, b) => a - b);
  return { raw, values, segments, errors, isWild: raw === "*" };
}
