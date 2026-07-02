// Expression-level parse: split into fields, validate count, parse each field.
// Produces the parsed fields plus structured errors (Design §15, §21).

import type { CronError, CronField } from "./types";
import { FIELD_META, parseField, type ParsedField } from "./parser";

export type ParsedFields = Record<CronField, ParsedField>;

export interface ParsedExpression {
  raw: string;
  empty: boolean;
  fields: ParsedFields | null;
  errors: CronError[];
}

export function parseExpression(expression: string): ParsedExpression {
  const raw = (expression ?? "").trim();
  if (raw === "") {
    return { raw, empty: true, fields: null, errors: [] };
  }

  const toks = raw.split(/\s+/);
  if (toks.length !== 5) {
    return {
      raw,
      empty: false,
      fields: null,
      errors: [
        {
          code: "field-count",
          message:
            `This expression has ${toks.length} field${toks.length === 1 ? "" : "s"}, ` +
            "but standard 5-field cron requires 5. " +
            "Expected: minute hour day-of-month month day-of-week.",
        },
      ],
    };
  }

  const fields = {} as ParsedFields;
  const errors: CronError[] = [];
  FIELD_META.forEach((m, i) => {
    const parsed = parseField(toks[i], m.min, m.max, m.names, m.dow);
    fields[m.key] = parsed;
    for (const message of parsed.errors) {
      errors.push({ code: "field-value", field: m.key, message: `${m.label} field — ${message}` });
    }
  });

  return { raw, empty: false, fields, errors };
}
