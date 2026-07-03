import type { CronPreviewResult } from "@/lib/cron/types";
import { buildSummaryText } from "@/lib/cron/exporters";
import { buildShareUrl } from "@/lib/cron/share";
import { CopyButton } from "./CopyButton";

const CARD = "rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]";

export function SummaryCard({ result, count }: { result: CronPreviewResult; count: number }) {
  const empty = result.expression.trim() === "";
  const invalid = result.errors.length > 0;

  if (empty) {
    return (
      <div className="rounded-2xl border border-dashed border-[#d1d5db] bg-white/60 p-6">
        <p className="font-display text-lg font-semibold text-[#111827]">
          Paste a cron expression to begin
        </p>
        <p className="mt-1 text-sm text-[#6b7280]">
          You&apos;ll get a plain-English summary, the next run times, and a field-by-field breakdown.
        </p>
      </div>
    );
  }

  const shareUrl = () =>
    buildShareUrl(window.location.origin + window.location.pathname, {
      expr: result.expression,
      tz: result.timezone,
      n: count,
      dialect: result.dialect,
    });

  return (
    <div className={CARD}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-sm font-semibold">
          <span
            className={`h-2.5 w-2.5 rounded-full ${invalid ? "bg-[#f97066]" : "bg-emerald-500"}`}
          />
          <span className={invalid ? "text-[#f97066]" : "text-emerald-600"}>
            {invalid ? "Invalid expression" : "Valid expression"}
          </span>
        </span>
        {!invalid && (
          <div className="flex gap-2">
            <CopyButton label="Copy summary" getText={() => buildSummaryText(result)} />
            <CopyButton label="Share link" getText={shareUrl} />
          </div>
        )}
      </div>

      {invalid ? (
        <div className="mt-4 space-y-3" role="alert" aria-live="assertive">
          {result.errors.map((e, i) => (
            <div
              key={i}
              className="flex gap-2.5 rounded-xl border border-[#fecaca] bg-[#fee2e2] p-3.5 text-sm text-[#991b1b]"
            >
              <span aria-hidden className="mt-0.5 shrink-0">
                &#9432;
              </span>
              <span>{e.message}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3" aria-live="polite">
          <p className="font-display text-xl font-semibold leading-snug text-[#111827]">
            {result.summary}
          </p>
          <p className="mt-1.5 text-sm text-[#6b7280]">Timezone: {result.timezone}</p>
        </div>
      )}
    </div>
  );
}
