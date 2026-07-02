import type { CronPreviewResult } from "@/lib/cron/types";

export function SummaryCard({ result }: { result: CronPreviewResult }) {
  const { summary, errors, timezone, expression } = result;
  const empty = expression.trim() === "";

  if (empty) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <p className="font-medium text-gray-900">Paste a cron expression to begin</p>
        <p className="mt-1 text-sm text-gray-500">
          You&apos;ll get a plain-English summary, the next run times, and a field-by-field breakdown.
        </p>
      </div>
    );
  }

  if (errors.length > 0) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-5" role="alert" aria-live="assertive">
        <p className="text-sm font-semibold text-red-700">Invalid cron expression</p>
        <ul className="mt-2 space-y-1">
          {errors.map((e, i) => (
            <li key={i} className="text-sm text-red-700">
              {e.message}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5" aria-live="polite">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Valid</p>
      <p className="mt-1 text-lg font-semibold text-gray-900">{summary}</p>
      <p className="mt-1 text-sm text-gray-600">Timezone: {timezone}</p>
    </div>
  );
}
