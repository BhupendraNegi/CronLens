"use client";

import { useState } from "react";
import type { CronPreviewResult } from "@/lib/cron/types";
import { buildSummaryText, buildRunsText, buildMarkdown } from "@/lib/cron/exporters";
import { buildShareUrl } from "@/lib/cron/share";

export function CopyActions({ result, count }: { result: CronPreviewResult; count: number }) {
  const [copied, setCopied] = useState<string>("");

  function copy(key: string, text: string) {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied((c) => (c === key ? "" : c)), 1400);
  }

  const shareUrl = () => {
    const base = window.location.origin + window.location.pathname;
    return buildShareUrl(base, { expr: result.expression, tz: result.timezone, n: count });
  };

  const label = (key: string, base: string) => (copied === key ? "Copied!" : base);

  const btn = "rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-700 hover:border-gray-400 hover:text-gray-900";

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" className={btn} onClick={() => copy("summary", buildSummaryText(result))}>
        {label("summary", "Copy summary")}
      </button>
      <button type="button" className={btn} onClick={() => copy("runs", buildRunsText(result))}>
        {label("runs", "Copy runs")}
      </button>
      <button type="button" className={btn} onClick={() => copy("md", buildMarkdown(result))}>
        {label("md", "Copy as Markdown")}
      </button>
      <button type="button" className={btn} onClick={() => copy("share", shareUrl())}>
        {label("share", "Copy share link")}
      </button>
    </div>
  );
}
