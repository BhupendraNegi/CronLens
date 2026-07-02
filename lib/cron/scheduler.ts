// Next-N-runs search. Iterates calendar days from the start instant, matching
// each candidate wall-clock time against the parsed fields, and converts
// matches to instants in the target timezone.
//
// Day-of-month / day-of-week rule (Design §21): if BOTH are restricted, a day
// matches when EITHER matches (OR). Adapted from the reference prototype.

import type { ParsedFields } from "./expression";
import { offsetMinutes, wallParts, wallToInstant } from "./timezone";

export interface ScheduledRun {
  instant: number; // epoch ms (UTC)
  dstNear: boolean; // a DST transition is within a day either side
}

export interface ScheduleResult {
  runs: ScheduledRun[];
  skipped: boolean; // a candidate local time didn't exist (spring-forward gap)
}

// 15-year search horizon (Design §21 safety bound).
const MAX_DAYS = 366 * 15;

export function computeRuns(
  fields: ParsedFields,
  tz: string,
  startInstant: number,
  count: number,
): ScheduleResult {
  const minutes = fields.minute.values;
  const hours = fields.hour.values;
  const monthSet = new Set(fields.month.values);
  const domSet = new Set(fields.dayOfMonth.values);
  const dowSet = new Set(fields.dayOfWeek.values);
  const domR = fields.dayOfMonth.raw !== "*";
  const dowR = fields.dayOfWeek.raw !== "*";

  const runs: ScheduledRun[] = [];
  let skipped = false;

  const startWall = wallParts(tz, startInstant);
  let dayCursor = Date.UTC(startWall.y, startWall.mo - 1, startWall.d);

  for (let dc = 0; dc < MAX_DAYS && runs.length < count; dc++) {
    const dObj = new Date(dayCursor);
    const y = dObj.getUTCFullYear();
    const mo = dObj.getUTCMonth() + 1;
    const d = dObj.getUTCDate();
    const wd = dObj.getUTCDay();
    dayCursor += 86400000;

    if (!monthSet.has(mo)) continue;

    const domMatch = domSet.has(d);
    const dowMatch = dowSet.has(wd);
    let dayOk: boolean;
    if (domR && dowR) dayOk = domMatch || dowMatch;
    else if (domR) dayOk = domMatch;
    else if (dowR) dayOk = dowMatch;
    else dayOk = true;
    if (!dayOk) continue;

    for (const h of hours) {
      for (const mi of minutes) {
        const inst = wallToInstant(tz, y, mo, d, h, mi);
        // If converting back doesn't reproduce the wall time, it fell in a
        // spring-forward gap and doesn't exist on the clock — skip it.
        const back = wallParts(tz, inst);
        if (back.d !== d || back.h !== h || back.mi !== mi) {
          skipped = true;
          continue;
        }
        if (inst < startInstant) continue;

        const offA = offsetMinutes(tz, new Date(inst));
        const offB = offsetMinutes(tz, new Date(inst + 86400000));
        const offC = offsetMinutes(tz, new Date(inst - 86400000));
        runs.push({ instant: inst, dstNear: offA !== offB || offA !== offC });
        if (runs.length >= count) break;
      }
      if (runs.length >= count) break;
    }
  }

  return { runs, skipped };
}
