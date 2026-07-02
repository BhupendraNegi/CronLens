import { describe, it, expect } from "vitest";
import { buildPreview } from "../preview";

const NOW = Date.UTC(2026, 6, 2, 0, 0, 0);

describe("buildPreview", () => {
  it("empty expression → not valid, no errors, no runs", () => {
    const r = buildPreview({ expression: "  ", timezone: "UTC", count: 10, startInstant: NOW, now: NOW });
    expect(r.valid).toBe(false);
    expect(r.errors).toEqual([]);
    expect(r.runs).toEqual([]);
    expect(r.summary).toBeNull();
  });

  it("invalid expression → errors, not valid", () => {
    const r = buildPreview({ expression: "61 * * * *", timezone: "UTC", count: 10, startInstant: NOW, now: NOW });
    expect(r.valid).toBe(false);
    expect(r.errors[0].message).toMatch(/Minute field/);
  });

  it("valid expression → summary, fields, and formatted runs", () => {
    const r = buildPreview({ expression: "0 9 * * 1-5", timezone: "UTC", count: 3, startInstant: NOW, now: NOW });
    expect(r.valid).toBe(true);
    expect(r.summary).toBe("At 09:00 every Monday through Friday.");
    expect(r.fields).toHaveLength(5);
    expect(r.runs).toHaveLength(3);
    expect(r.runs[0].utcOffset).toBe("UTC+00:00");
    expect(r.runs[0].localDateTime).toMatch(/Jul 2, 2026/);
  });

  it("carries the UTC offset for a non-UTC zone", () => {
    const r = buildPreview({ expression: "0 9 * * *", timezone: "Asia/Kolkata", count: 1, startInstant: NOW, now: NOW });
    expect(r.runs[0].utcOffset).toBe("UTC+05:30");
  });
});
