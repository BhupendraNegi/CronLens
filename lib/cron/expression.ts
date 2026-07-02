// Expression-level parse: expand nicknames, split into fields, validate count
// for the chosen dialect, and parse each field. Produces the parsed fields plus
// structured errors (Design §15, §21).

import type { CronDialect, CronError } from "./types";
import { parseField, type ParsedField } from "./parser";
import { getDialect, NICKNAMES, type FieldSpec } from "./dialects";

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
  specs.forEach((spec, i) => {
    const f = parseField(toks[i], spec.min, spec.max, spec.names, !!spec.isDow, {
      allowQuestion: dialect.allowQuestion,
      normalizeDow: spec.normalizeDow,
    });
    parsed[spec.key] = f;
    for (const message of f.errors) {
      errors.push({ code: "field-value", field: spec.key === "second" || spec.key === "year" ? undefined : spec.key, message: `${spec.label} field — ${message}` });
    }
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
