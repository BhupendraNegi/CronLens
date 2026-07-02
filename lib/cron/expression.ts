// Expression-level parse: expand nicknames, split into fields, validate count
// for the chosen dialect, and parse each field. Produces the parsed fields plus
// structured errors (Design §15, §21).

import type { CronDialect, CronError } from "./types";
import { parseField, type ParsedField } from "./parser";
import { getDialect, NICKNAMES, QUARTZ_DAY_NAMES, type FieldSpec } from "./dialects";
import { parseDomSpecial, parseDowSpecial, type DomRule, type DowRule } from "./special";

// Map a Quartz day-of-week token (name or 1-7) onto JS weekday numbering (0-6).
function resolveQuartzDow(tok: string): number | null {
  const up = tok.toUpperCase();
  if (QUARTZ_DAY_NAMES[up] != null) return QUARTZ_DAY_NAMES[up] - 1;
  if (/^\d+$/.test(tok)) {
    const n = +tok;
    if (n >= 1 && n <= 7) return n - 1;
  }
  return null;
}

function specialField(raw: string, rule: DomRule | DowRule): ParsedField {
  return { raw, values: [], segments: [], errors: [], isWild: false, special: rule };
}

export interface ParsedFields {
  second: ParsedField;
  minute: ParsedField;
  hour: ParsedField;
  dayOfMonth: ParsedField;
  month: ParsedField;
  dayOfWeek: ParsedField;
  year: ParsedField | null;
  hasSeconds: boolean;
  hasYear: boolean;
  dialect: CronDialect;
}

export interface ParsedExpression {
  raw: string;
  empty: boolean;
  fields: ParsedFields | null;
  errors: CronError[];
}

// A field fixed to second 0 — the implicit seconds for minute-granularity dialects.
function secondZero(): ParsedField {
  return parseField("0", 0, 59, null, false);
}

export function parseExpression(
  expression: string,
  dialectId: CronDialect = "standard-5-field",
): ParsedExpression {
  const dialect = getDialect(dialectId);
  let raw = (expression ?? "").trim();
  if (raw === "") {
    return { raw, empty: true, fields: null, errors: [] };
  }

  // Nickname expansion (Design §8). Nicknames are always minute-based; prepend
  // seconds if the dialect carries a seconds field.
  if (dialect.nicknames && raw.startsWith("@")) {
    const expanded = NICKNAMES[raw.toLowerCase()];
    if (!expanded) {
      return {
        raw,
        empty: false,
        fields: null,
        errors: [{ code: "unknown-nickname", message: `Unknown nickname '${raw}'.` }],
      };
    }
    raw = dialect.order.some((f) => f.key === "second") ? `0 ${expanded}` : expanded;
  }

  const toks = raw.split(/\s+/);
  if (toks.length < dialect.minFields || toks.length > dialect.maxFields) {
    const expected =
      dialect.minFields === dialect.maxFields
        ? `${dialect.minFields}`
        : `${dialect.minFields}–${dialect.maxFields}`;
    return {
      raw,
      empty: false,
      fields: null,
      errors: [
        {
          code: "field-count",
          message:
            `This expression has ${toks.length} field${toks.length === 1 ? "" : "s"}, ` +
            `but ${dialect.label} requires ${expected}.`,
        },
      ],
    };
  }

  // The trailing field (year in Quartz) may be optional: use the last N specs.
  const specs: FieldSpec[] = dialect.order.slice(0, toks.length);

  const parsed: Partial<Record<FieldSpec["key"], ParsedField>> = {};
  const errors: CronError[] = [];
  const pushErr = (spec: FieldSpec, message: string) =>
    errors.push({
      code: "field-value",
      field: spec.key === "second" || spec.key === "year" ? undefined : spec.key,
      message: `${spec.label} field — ${message}`,
    });

  specs.forEach((spec, i) => {
    const tok = toks[i];
    const isDayField = spec.key === "dayOfMonth" || spec.key === "dayOfWeek";

    // Quartz L/W/# day expressions parse into per-date rules, not value sets.
    if (dialect.id === "quartz" && isDayField && /[lLwW#]/.test(tok)) {
      const res =
        spec.key === "dayOfMonth" ? parseDomSpecial(tok) : parseDowSpecial(tok, resolveQuartzDow);
      if (res?.rule) {
        parsed[spec.key] = specialField(tok, res.rule);
        return;
      }
      if (res?.error) {
        pushErr(spec, res.error);
        parsed[spec.key] = { raw: tok, values: [], segments: [], errors: [res.error], isWild: false };
        return;
      }
    }

    const f = parseField(tok, spec.min, spec.max, spec.names, !!spec.isDow, {
      allowQuestion: dialect.allowQuestion,
      normalizeDow: spec.normalizeDow,
    });
    parsed[spec.key] = f;
    for (const message of f.errors) pushErr(spec, message);
  });

  const hasSeconds = !!parsed.second;
  const hasYear = !!parsed.year;

  const fields: ParsedFields = {
    second: parsed.second ?? secondZero(),
    minute: parsed.minute!,
    hour: parsed.hour!,
    dayOfMonth: parsed.dayOfMonth!,
    month: parsed.month!,
    dayOfWeek: parsed.dayOfWeek!,
    year: parsed.year ?? null,
    hasSeconds,
    hasYear,
    dialect: dialectId,
  };

  return { raw, empty: false, fields, errors };
}
