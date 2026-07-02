import { describe, it, expect } from "vitest";
import { parseField, MONTH_NAMES, DAY_NAMES } from "../parser";

const minute = (raw: string) => parseField(raw, 0, 59, null, false);
const dom = (raw: string) => parseField(raw, 1, 31, null, false);
const month = (raw: string) => parseField(raw, 1, 12, MONTH_NAMES, false);
const dow = (raw: string) => parseField(raw, 0, 7, DAY_NAMES, true);

describe("parseField — syntax", () => {
  it("wildcard covers the full range", () => {
    const f = minute("*");
    expect(f.isWild).toBe(true);
    expect(f.values.length).toBe(60);
    expect(f.values[0]).toBe(0);
    expect(f.values[59]).toBe(59);
    expect(f.errors).toEqual([]);
  });

  it("single value", () => {
    expect(minute("5").values).toEqual([5]);
  });

  it("list", () => {
    expect(minute("1,2,3").values).toEqual([1, 2, 3]);
  });

  it("range", () => {
    expect(minute("1-5").values).toEqual([1, 2, 3, 4, 5]);
  });

  it("step over wildcard", () => {
    expect(minute("*/10").values).toEqual([0, 10, 20, 30, 40, 50]);
  });

  it("range with step", () => {
    expect(minute("1-30/5").values).toEqual([1, 6, 11, 16, 21, 26]);
  });

  it("step from a single value runs to max", () => {
    expect(minute("45/5").values).toEqual([45, 50, 55]);
  });

  it("dedupes and sorts overlapping lists", () => {
    expect(minute("5,1,5,3").values).toEqual([1, 3, 5]);
  });
});

describe("parseField — names", () => {
  it("month names, case-insensitive", () => {
    expect(month("JAN").values).toEqual([1]);
    expect(month("jan-mar").values).toEqual([1, 2, 3]);
  });

  it("weekday names", () => {
    expect(dow("MON-FRI").values).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("parseField — day-of-week Sunday aliasing", () => {
  it("accepts both 0 and 7 as Sunday", () => {
    expect(dow("0").values).toEqual([0]);
    expect(dow("7").values).toEqual([0]);
  });

  it("SUN resolves to 0", () => {
    expect(dow("SUN").values).toEqual([0]);
  });
});

describe("parseField — errors", () => {
  it("value out of range", () => {
    const f = minute("61");
    expect(f.values).toEqual([]);
    expect(f.errors[0]).toMatch(/out of range/);
  });

  it("backwards range", () => {
    expect(dom("5-1").errors[0]).toMatch(/backwards/);
  });

  it("invalid step", () => {
    expect(minute("*/0").errors[0]).toMatch(/Step must be a positive number/);
  });

  it("unrecognized token", () => {
    expect(minute("abc").errors[0]).toMatch(/Unrecognized value/);
  });

  it("rejects Quartz '?'", () => {
    expect(dow("?").errors[0]).toMatch(/isn't supported/);
  });

  it("rejects L/W/# specials", () => {
    expect(dom("L").errors[0]).toMatch(/aren't supported/);
  });

  it("empty list term", () => {
    expect(minute("1,,3").errors[0]).toMatch(/Empty term/);
  });
});
