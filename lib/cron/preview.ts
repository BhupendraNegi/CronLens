// Orchestrator: turn an expression + context into a CronPreviewResult
// (Design §20). Ties together parse → translate → schedule → format.
// Warnings are added in Phase 4.

import type { CronDialect, CronPreviewResult, CronRun } from "./types";
import { parseExpression } from "./expression";
import { buildSummary, buildFieldExplanations } from "./translator";
import { computeRuns } from "./scheduler";
import { buildWarnings } from "./warnings";
import { formatWall, relativeLabel, instantOffset } from "./format";
import { formatOffset, wallParts } from "./timezone";

export interface PreviewInput {
  expression: string;
  timezone: string;
  count: number;
  startInstant: number;
  now: number;
  dialect?: CronDialect;
  hour12?: boolean;
}

const EMPTY = (input: PreviewInput): CronPreviewResult => ({
  valid: false,
  expression: input.expression,
  timezone: input.timezone,
  dialect: input.dialect ?? "standard-5-field",
  summary: null,
  fields: [],
  runs: [],
  warnings: [],
  errors: [],
});

export function buildPreview(input: PreviewInput): CronPreviewResult {
  const { expression, timezone, count, startInstant, now, hour12 = false } = input;
  const dialect = input.dialect ?? "standard-5-field";
  const parsed = parseExpression(expression, dialect);

  if (parsed.empty) return EMPTY(input);

  if (parsed.fields === null || parsed.errors.length > 0) {
    return { ...EMPTY(input), errors: parsed.errors };
  }

  const { runs: scheduled, skipped } = computeRuns(parsed.fields, timezone, startInstant, count);
  const runs: CronRun[] = scheduled.map((r, i) => ({
    index: i + 1,
    localDateTime: formatWall(r.instant, timezone, hour12),
    utcDateTime: formatWall(r.instant, "UTC", hour12),
    timezone,
    utcOffset: formatOffset(instantOffset(timezone, r.instant)),
    relativeLabel: relativeLabel(r.instant, now, timezone),
    notes: r.dstNear ? ["Near a daylight-saving transition — the local time may shift."] : [],
  }));

  return {
    valid: true,
    expression,
    timezone,
    dialect,
    summary: buildSummary(parsed.fields),
    fields: buildFieldExplanations(parsed.fields),
    runs,
    warnings: buildWarnings(parsed.fields, timezone, skipped, wallParts(timezone, now).y),
    errors: [],
  };
}
