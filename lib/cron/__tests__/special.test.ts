import { describe, it, expect } from "vitest";
import { parseExpression } from "../expression";
import { buildSummary, buildFieldExplanations } from "../translator";
import { computeRuns } from "../scheduler";

const START = Date.UTC(2026, 0, 1, 0, 0, 0); // 2026-01-01

function runs(expr: string, count = 3): number[] {
  const p = parseExpression(expr, "quartz");
  expect(p.errors).toEqual([]);
  return computeRuns(p.fields!, "UTC", START, count).runs.map((r) => r.instant);
}

function sum(expr: string): string {
  const p = parseExpression(expr, "quartz");
  expect(p.errors).toEqual([]);
  return buildSummary(p.fields!);
}

describe("day-of-month specials", () => {
  it("L → last day of the month", () => {
    // Jan 2026 has 31 days; Feb has 28.
    expect(runs("0 0 12 L * ?", 2)).toEqual([
      Date.UTC(2026, 0, 31, 12, 0),
      Date.UTC(2026, 1, 28, 12, 0),
    ]);
    expect(sum("0 0 12 L * ?")).toBe("At noon on the last day of the month.");
  });

  it("L-2 → two days before the end of the month", () => {
    expect(runs("0 0 12 L-2 * ?", 1)).toEqual([Date.UTC(2026, 0, 29, 12, 0)]);
  });

  it("LW → last weekday of the month", () => {
    // Jan 31 2026 is a Saturday → last weekday is Fri Jan 30.
    expect(runs("0 0 12 LW * ?", 1)).toEqual([Date.UTC(2026, 0, 30, 12, 0)]);
  });

  it("15W → nearest weekday to the 15th", () => {
    // Jan 15 2026 is a Thursday → itself.
    expect(runs("0 0 12 15W * ?", 1)).toEqual([Date.UTC(2026, 0, 15, 12, 0)]);
  });
});

describe("day-of-week specials", () => {
  it("6L → last Friday of the month (Quartz 6 = Friday)", () => {
    // Last Friday of Jan 2026 is Jan 30.
    expect(runs("0 0 12 ? * 6L", 1)).toEqual([Date.UTC(2026, 0, 30, 12, 0)]);
    expect(sum("0 0 12 ? * 6L")).toBe("At noon on the last Friday of the month.");
  });

  it("6#3 → third Friday of the month", () => {
    // Fridays in Jan 2026: 2, 9, 16, 23, 30 → third is Jan 16.
    expect(runs("0 0 12 ? * 6#3", 1)).toEqual([Date.UTC(2026, 0, 16, 12, 0)]);
    expect(sum("0 0 12 ? * 6#3")).toBe("At noon on the 3rd Friday of the month.");
  });

  it("MON#1 resolves the name", () => {
    // First Monday of Jan 2026 is Jan 5.
    expect(runs("0 0 12 ? * MON#1", 1)).toEqual([Date.UTC(2026, 0, 5, 12, 0)]);
  });
});

describe("breakdown + errors", () => {
  it("describes a dom special in the breakdown", () => {
    const p = parseExpression("0 0 12 LW * ?", "quartz");
    const dom = buildFieldExplanations(p.fields!).find((r) => r.field === "dayOfMonth");
    expect(dom?.explanation).toBe("On the last weekday of the month");
  });

  it("rejects a malformed occurrence", () => {
    expect(parseExpression("0 0 12 ? * 6#9", "quartz").errors[0].message).toMatch(/must be 1–5/);
  });

  it("L/W/# still rejected outside Quartz", () => {
    expect(parseExpression("0 0 12 L * *", "standard-6-field").errors[0].message).toMatch(/L, W, #/);
  });
});
