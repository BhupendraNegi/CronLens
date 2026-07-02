import type { CronFieldExplanation } from "@/lib/cron/types";

const LABELS: Record<CronFieldExplanation["field"], string> = {
  second: "Second",
  minute: "Minute",
  hour: "Hour",
  dayOfMonth: "Day of month",
  month: "Month",
  dayOfWeek: "Day of week",
  year: "Year",
};

export function FieldBreakdown({ fields }: { fields: CronFieldExplanation[] }) {
  if (fields.length === 0) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-gray-900">Field breakdown</h2>
      <dl className="mt-3 divide-y divide-gray-100">
        {fields.map((f) => (
          <div key={f.field} className="grid grid-cols-[9rem_4rem_1fr] items-baseline gap-3 py-2">
            <dt className="text-sm text-gray-500">{LABELS[f.field]}</dt>
            <dd className="font-mono text-sm text-gray-900">{f.rawValue}</dd>
            <dd className="text-sm text-gray-700">{f.explanation}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
