import { describe, it, expect } from "vitest";
import type { CronDialect } from "../types";

// Phase 0 smoke test: proves the test runner + TS path resolution work.
// Replaced by real parser/scheduler tests in Phase 1.
describe("scaffold", () => {
  it("resolves core types and runs vitest", () => {
    const dialect: CronDialect = "standard-5-field";
    expect(dialect).toBe("standard-5-field");
  });
});
