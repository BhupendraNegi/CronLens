import { describe, it, expect } from "vitest";
import { parseExpression } from "../expression";

describe("parseExpression", () => {
  it("flags empty input", () => {
    const r = parseExpression("   ");
    expect(r.empty).toBe(true);
    expect(r.fields).toBeNull();
  });

  it("parses a valid 5-field expression", () => {
    const r = parseExpression("0 9 * * 1-5");
    expect(r.empty).toBe(false);
    expect(r.errors).toEqual([]);
    expect(r.fields!.minute.values).toEqual([0]);
    expect(r.fields!.hour.values).toEqual([9]);
    expect(r.fields!.dayOfWeek.values).toEqual([1, 2, 3, 4, 5]);
  });

  it("rejects wrong field count with a fatal error", () => {
    const r = parseExpression("0 9 * *");
    expect(r.fields).toBeNull();
    expect(r.errors[0].code).toBe("field-count");
    expect(r.errors[0].message).toMatch(/4 fields/);
  });

  it("prefixes field-value errors with the field label", () => {
    const r = parseExpression("61 * * * *");
    expect(r.errors[0].field).toBe("minute");
    expect(r.errors[0].message).toMatch(/Minute field —/);
  });

  it("normalizes internal whitespace", () => {
    const r = parseExpression("0   9 *  * 1-5");
    expect(r.errors).toEqual([]);
    expect(r.fields!.hour.values).toEqual([9]);
  });
});
