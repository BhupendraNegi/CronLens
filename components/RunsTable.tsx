import type { CronPreviewResult } from "@/lib/cron/types";
import { buildRunsText, buildMarkdown } from "@/lib/cron/exporters";
import { CopyButton } from "./CopyButton";

export function RunsTable({
  result,
  startLabel,
}: {
  result: CronPreviewResult;
  startLabel: string;
}) {
  const runs = result.runs;

  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-[#111827]">
            Next {runs.length} {runs.length === 1 ? "run" : "runs"}
          </h2>
          <p className="text-sm text-[#9ca3af]">{startLabel}</p>
        </div>
        {runs.length > 0 && (
          <div className="flex gap-2">
            <CopyButton label="Copy runs" getText={() => buildRunsText(result)} />
            <CopyButton label="Copy Markdown" getText={() => buildMarkdown(result)} />
          </div>
        )}
      </div>

      {runs.length === 0 ? (
        <p className="mt-4 text-sm text-[#6b7280]">
          No matching run was found within the search horizon (15 years).
        </p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {runs.map((r, i) => {
            const isNext = i === 0;
            return (
              <li
                key={r.index}
                className={`flex items-center gap-3.5 rounded-xl border p-3 ${
                  isNext ? "border-[#fecaca] bg-[#fff1f0]" : "border-[#eef0f3] bg-[#f9fafb]"
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold ${
                    isNext ? "bg-[#fee2e2] text-[#f97066]" : "bg-[#e0e7ff] text-[#4338ca]"
                  }`}
                >
                  {r.index}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-sm font-semibold text-[#111827]">
                    {r.localDateTime}
                  </p>
                  <p className="truncate font-mono text-xs text-[#9ca3af]">
                    {r.utcDateTime} · {r.utcOffset}
                  </p>
                  {r.notes.length > 0 && (
                    <p className="mt-0.5 text-xs text-[#92400e]">{r.notes[0]}</p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {isNext && (
                    <span className="rounded-md bg-[#f97066] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                      Next
                    </span>
                  )}
                  <span className="whitespace-nowrap text-sm text-[#6b7280]">{r.relativeLabel}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
