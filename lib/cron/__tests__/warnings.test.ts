import { describe, it, expect } from "vitest";
import { parseExpression } from "../expression";
import { buildWarnings } from "../warnings";

function codes(expr: string, tz = "UTC", skipped = false, year = 2026): string[] {
  const p = parseExpression(expr);
  expect(p.fields).not.toBeNull();
  return buildWarnings(p.fields!, tz, skipped, year).map((w) => w.code);
}

describe("buildWarnings — Design §16 / §22", () => {
  it("* * * * * → every-minute warning", () => {
    expect(codes("* * * * *")).toContain("every-minute");
  });

  it("*/2 * * * * → frequent info", () => {
    expect(codes("*/2 * * * *")).toContain("frequent");
  });

  it("0 9 1 * MON → day-of-month AND day-of-week", () => {
    expect(codes("0 9 1 * MON")).toContain("dom-and-dow");
  });

  it("0 0 29 2 * → leap-year", () => {
    expect(codes("0 0 29 2 *")).toContain("leap-year");
  });

  it("0 0 31 * * → some-months-skipped", () => {
    expect(codes("0 0 31 * *")).toContain("some-months-skipped");
  });

  it("DST-skipped run raises dst-gap", () => {
    expect(codes("0 9 * * *", "UTC", true)).toContain("dst-gap");
  });

  it("a DST-observing zone raises tz-observes-dst; a non-DST zone does not", () => {
    expect(codes("0 9 * * *", "America/New_York")).toContain("tz-observes-dst");
    expect(codes("0 9 * * *", "Asia/Kolkata")).not.toContain("tz-observes-dst");
  });

  it("a plain weekday schedule in UTC has no warnings", () => {
    expect(codes("0 9 * * 1-5")).toEqual([]);
  });
});
