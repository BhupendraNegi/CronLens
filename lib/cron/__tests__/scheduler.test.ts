import { describe, it, expect } from "vitest";
import { parseExpression } from "../expression";
import { computeRuns } from "../scheduler";

// Fixed reference start: 2026-07-02T00:00:00Z (a Thursday, per Design §33).
const START = Date.UTC(2026, 6, 2, 0, 0, 0);

function runs(expr: string, tz: string, count = 5): number[] {
  const parsed = parseExpression(expr);
  expect(parsed.errors).toEqual([]);
  expect(parsed.fields).not.toBeNull();
  return computeRuns(parsed.fields!, tz, START, count).runs.map((r) => r.instant);
}

describe("computeRuns — canonical expressions (Design §29 integration set)", () => {
  it("0 9 * * 1-5 in UTC → weekday 09:00, skipping the weekend", () => {
    expect(runs("0 9 * * 1-5", "UTC")).toEqual([
      Date.UTC(2026, 6, 2, 9, 0), // Thu
      Date.UTC(2026, 6, 3, 9, 0), // Fri
      Date.UTC(2026, 6, 6, 9, 0), // Mon (skips Sat 4 / Sun 5)
      Date.UTC(2026, 6, 7, 9, 0), // Tue
      Date.UTC(2026, 6, 8, 9, 0), // Wed
    ]);
  });

  it("0 9 * * 1-5 in Asia/Kolkata → 09:00 IST == 03:30 UTC (no DST)", () => {
    expect(runs("0 9 * * 1-5", "Asia/Kolkata")).toEqual([
      Date.UTC(2026, 6, 2, 3, 30),
      Date.UTC(2026, 6, 3, 3, 30),
      Date.UTC(2026, 6, 6, 3, 30),
      Date.UTC(2026, 6, 7, 3, 30),
      Date.UTC(2026, 6, 8, 3, 30),
    ]);
  });

  it("*/5 * * * * in UTC → every 5 minutes from the start", () => {
    expect(runs("*/5 * * * *", "UTC", 3)).toEqual([
      START,
      START + 5 * 60000,
      START + 10 * 60000,
    ]);
  });

  it("0 0 1 * * in UTC → midnight on the 1st (July already passed)", () => {
    expect(runs("0 0 1 * *", "UTC", 3)).toEqual([
      Date.UTC(2026, 7, 1, 0, 0), // Aug 1
      Date.UTC(2026, 8, 1, 0, 0), // Sep 1
      Date.UTC(2026, 9, 1, 0, 0), // Oct 1
    ]);
  });

  it("0 0 29 2 * in UTC → next leap-year Feb 29", () => {
    expect(runs("0 0 29 2 *", "UTC", 1)).toEqual([Date.UTC(2028, 1, 29, 0, 0)]);
  });

  it("0 9,17 * * * in UTC → twice daily", () => {
    expect(runs("0 9,17 * * *", "UTC", 3)).toEqual([
      Date.UTC(2026, 6, 2, 9, 0),
      Date.UTC(2026, 6, 2, 17, 0),
      Date.UTC(2026, 6, 3, 9, 0),
    ]);
  });
});

describe("computeRuns — day-of-month AND day-of-week is OR", () => {
  it("0 0 1 * MON fires on the 1st OR any Monday", () => {
    const out = runs("0 0 1 * MON", "UTC", 6);
    // Aug 1 2026 is a Saturday (the 1st), and the Mondays before it in July.
    expect(out).toContain(Date.UTC(2026, 6, 6, 0, 0)); // Mon Jul 6
    expect(out).toContain(Date.UTC(2026, 7, 1, 0, 0)); // 1st (Sat Aug 1)
  });
});

describe("computeRuns — count and horizon", () => {
  it("respects the requested count", () => {
    expect(runs("* * * * *", "UTC", 50).length).toBe(50);
  });
});
