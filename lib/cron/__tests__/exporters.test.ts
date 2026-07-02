import { describe, it, expect } from "vitest";
import { buildPreview } from "../preview";
import { buildSummaryText, buildRunsText, buildMarkdown } from "../exporters";

const NOW = Date.UTC(2026, 6, 2, 0, 0, 0);
const result = buildPreview({ expression: "0 9 * * 1-5", timezone: "UTC", count: 3, startInstant: NOW, now: NOW });

describe("exporters", () => {
  it("summary text includes the timezone", () => {
    expect(buildSummaryText(result)).toBe("At 09:00 every Monday through Friday. (Timezone: UTC)");
  });

  it("runs text is one numbered line per run", () => {
    const lines = buildRunsText(result).split("\n");
    expect(lines).toHaveLength(3);
    expect(lines[0]).toMatch(/^1\. .*Jul 2, 2026/);
  });

  it("markdown has a code-quoted expression and a runs table", () => {
    const md = buildMarkdown(result);
    expect(md).toContain("**`0 9 * * 1-5`**");
    expect(md).toContain("| # | Local time | UTC time |");
    expect(md).toContain("Timezone: UTC");
  });
});
