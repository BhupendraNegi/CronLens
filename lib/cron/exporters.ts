// Copy/export formats (Design §18): plain summary, runs list, and full Markdown.

import type { CronPreviewResult } from "./types";

export function buildSummaryText(result: CronPreviewResult): string {
  if (!result.summary) return "";
  return `${result.summary} (Timezone: ${result.timezone})`;
}

export function buildRunsText(result: CronPreviewResult): string {
  return result.runs
    .map((r) => `${r.index}. ${r.localDateTime}  (${r.utcDateTime} ${r.utcOffset}) · ${r.relativeLabel}`)
    .join("\n");
}

export function buildMarkdown(result: CronPreviewResult): string {
  const lines: string[] = [];
  lines.push(`**\`${result.expression}\`** — ${result.summary ?? "(invalid)"}`);
  lines.push("");
  lines.push(`Timezone: ${result.timezone}`);

  if (result.warnings.length > 0) {
    lines.push("");
    for (const w of result.warnings) lines.push(`> ${w.severity === "warning" ? "⚠️" : "ℹ️"} ${w.message}`);
  }

  if (result.runs.length > 0) {
    lines.push("");
    lines.push("| # | Local time | UTC time |");
    lines.push("|---|---|---|");
    for (const r of result.runs) {
      lines.push(`| ${r.index} | ${r.localDateTime} | ${r.utcDateTime} ${r.utcOffset} |`);
    }
  }

  return lines.join("\n");
}
