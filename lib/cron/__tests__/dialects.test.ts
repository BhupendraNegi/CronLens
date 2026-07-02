import { describe, it, expect } from "vitest";
import { parseExpression } from "../expression";
import { buildSummary, buildFieldExplanations } from "../translator";
import { computeRuns } from "../scheduler";

function sum(expr: string, dialect: Parameters<typeof parseExpression>[1]): string {
  const p = parseExpression(expr, dialect);
  expect(p.errors).toEqual([]);
  expect(p.fields).not.toBeNull();
  return buildSummary(p.fields!);
}

const START = Date.UTC(2026, 6, 2, 0, 0, 0);
function runs(expr: string, dialect: Parameters<typeof parseExpression>[1], count = 3): number[] {
  const p = parseExpression(expr, dialect);
  expect(p.errors).toEqual([]);
  return computeRuns(p.fields!, "UTC", START, count).runs.map((r) => r.instant);
}

describe("nicknames", () => {
  it("@daily → midnight every day", () => {
    expect(sum("@daily", "standard-5-field")).toBe("At midnight every day.");
  });
  it("@hourly → start of every hour", () => {
    expect(sum("@hourly", "standard-5-field")).toBe("At the start of every hour.");
  });
  it("@weekly → midnight every Sunday", () => {
    expect(sum("@weekly", "standard-5-field")).toBe("At midnight every Sunday.");
  });
  it("unknown nickname is an error", () => {
    expect(parseExpression("@bogus", "standard-5-field").errors[0].code).toBe("unknown-nickname");
  });
});

describe("6-field (seconds)", () => {
  it("*/30 * * * * * → every 30 seconds", () => {
    expect(sum("*/30 * * * * *", "standard-6-field")).toBe("Every 30 seconds.");
  });
  it("0 0 9 * * 1-5 → second 0 is silent, reads like the 5-field form", () => {
    expect(sum("0 0 9 * * 1-5", "standard-6-field")).toBe("At 09:00 every Monday through Friday.");
  });
  it("breakdown includes a Second row", () => {
    const p = parseExpression("15 0 9 * * *", "standard-6-field");
    expect(buildFieldExplanations(p.fields!)[0]).toMatchObject({ field: "second", explanation: "At second 15" });
  });
  it("a 5-field expression under the 6-field dialect is a count error", () => {
    expect(parseExpression("0 9 * * 1-5", "standard-6-field").errors[0].code).toBe("field-count");
  });
  it("schedules on seconds", () => {
    expect(runs("*/30 * * * * *", "standard-6-field", 3)).toEqual([START, START + 30_000, START + 60_000]);
  });
});

describe("quartz", () => {
  it("? on day-of-week is unrestricted", () => {
    expect(sum("0 0 12 * * ?", "quartz")).toBe("At noon every day.");
  });
  it("day-of-week numbering is 1=Sunday, so MON=2 → Monday", () => {
    expect(sum("0 0 12 ? * MON", "quartz")).toBe("At noon every Monday.");
  });
  it("honors an optional year field", () => {
    expect(runs("0 0 12 1 1 ? 2027", "quartz", 1)).toEqual([Date.UTC(2027, 0, 1, 12, 0, 0)]);
  });
  it("accepts L/W/# day expressions (see special.test.ts for behavior)", () => {
    expect(parseExpression("0 0 12 L * ?", "quartz").errors).toEqual([]);
  });
});
