// Warnings for expressions that are valid but surprising (Design §16, §22).
// Pure function over parsed fields + scheduling context.

import type { CronWarning } from "./types";
import type { ParsedFields } from "./expression";
import { observesDST } from "./timezone";

export function buildWarnings(
  fields: ParsedFields,
  tz: string,
  skipped: boolean,
  year: number,
): CronWarning[] {
  const w: CronWarning[] = [];
  const domR = !fields.dayOfMonth.isWild;
  const dowR = !fields.dayOfWeek.isWild;
  const keys = ["minute", "hour", "dayOfMonth", "month", "dayOfWeek"] as const;
  const allWild = keys.every((k) => fields[k].isWild);

  const minSeg = fields.minute.segments;
  if (allWild) {
    w.push({
      code: "every-minute",
      severity: "warning",
      message: "This fires every minute — 1,440 times per day. Double-check you meant this frequency.",
    });
  } else if (
    minSeg.length === 1 &&
    minSeg[0].type === "step" &&
    fields.hour.raw === "*" &&
    minSeg[0].step <= 5
  ) {
    const perDay = Math.round(60 / minSeg[0].step) * 24;
    w.push({
      code: "frequent",
      severity: "info",
      message: `This runs roughly ${perDay.toLocaleString()} times per day.`,
    });
  }

  if (domR && dowR) {
    w.push({
      code: "dom-and-dow",
      severity: "warning",
      message:
        "Both day-of-month and day-of-week are set. Most cron implementations run when EITHER matches (OR); " +
        "some platforms differ — confirm against your target scheduler.",
    });
  }

  if (
    fields.month.values.length === 1 &&
    fields.month.values[0] === 2 &&
    fields.dayOfMonth.values.includes(29)
  ) {
    w.push({
      code: "leap-year",
      severity: "warning",
      message: "February 29 only exists in leap years, so this fires roughly once every four years.",
    });
  } else if (domR && Math.max(...fields.dayOfMonth.values) >= 29) {
    const maxD = Math.max(...fields.dayOfMonth.values);
    w.push({
      code: "some-months-skipped",
      severity: "info",
      message: `Day ${maxD} doesn't exist in every month, so months without it are skipped.`,
    });
  }

  if (skipped) {
    w.push({
      code: "dst-gap",
      severity: "warning",
      message:
        "A scheduled local time falls in a daylight-saving gap and doesn't exist on the clock, so it was " +
        "skipped. Real scheduler behavior varies by platform.",
    });
  }

  if (observesDST(tz, year)) {
    w.push({
      code: "tz-observes-dst",
      severity: "info",
      message: `${tz} changes clocks for daylight saving time. Runs near a transition may shift by an hour.`,
    });
  }

  return w;
}
