import { describe, it, expect } from "vitest";
import { parseExpression } from "../expression";
import { buildSummary, buildFieldExplanations } from "../translator";

function summary(expr: string): string {
  const p = parseExpression(expr);
  expect(p.fields).not.toBeNull();
  return buildSummary(p.fields!);
}

describe("buildSummary — Design §12 examples", () => {
  it("*/5 * * * * → Every 5 minutes.", () => {
    expect(summary("*/5 * * * *")).toBe("Every 5 minutes.");
  });

  it("0 9 * * 1-5 → At 09:00 every Monday through Friday.", () => {
    expect(summary("0 9 * * 1-5")).toBe("At 09:00 every Monday through Friday.");
  });

  it("30 2 1 * * → At 02:30 on the 1st of every month.", () => {
    expect(summary("30 2 1 * *")).toBe("At 02:30 on the 1st of every month.");
  });

  it("0 0 * * 0 → At midnight every Sunday.", () => {
    expect(summary("0 0 * * 0")).toBe("At midnight every Sunday.");
  });
});

describe("buildSummary — Design §22 edge cases", () => {
  it("* * * * * → Every minute.", () => {
    expect(summary("* * * * *")).toBe("Every minute.");
  });

  it("0 9,17 * * * → At 09:00 and 17:00 every day.", () => {
    expect(summary("0 9,17 * * *")).toBe("At 09:00 and 17:00 every day.");
  });

  it("*/15 9-17 * * MON-FRI → work-hours phrasing", () => {
    expect(summary("*/15 9-17 * * MON-FRI")).toBe(
      "Every 15 minutes from 09:00 through 17:59, Monday through Friday.",
    );
  });

  it("0 12 * * SUN → At noon every Sunday.", () => {
    expect(summary("0 12 * * SUN")).toBe("At noon every Sunday.");
  });
});

describe("buildFieldExplanations — Design §13 breakdown of 0 9 * * 1-5", () => {
  it("explains each field", () => {
    const p = parseExpression("0 9 * * 1-5");
    const rows = buildFieldExplanations(p.fields!);
    expect(rows).toEqual([
      { field: "minute", rawValue: "0", normalizedValue: "0", explanation: "At minute 0", hasError: false },
      { field: "hour", rawValue: "9", normalizedValue: "9", explanation: "At 09:00", hasError: false },
      { field: "dayOfMonth", rawValue: "*", normalizedValue: expect.any(String), explanation: "Every day of the month", hasError: false },
      { field: "month", rawValue: "*", normalizedValue: expect.any(String), explanation: "Every month", hasError: false },
      { field: "dayOfWeek", rawValue: "1-5", normalizedValue: "1,2,3,4,5", explanation: "Monday through Friday", hasError: false },
    ]);
  });
});
