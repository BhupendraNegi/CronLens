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
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">
        Field breakdown
      </h2>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {fields.map((f) => {
          const err = f.hasError;
          return (
            <div
              key={f.field}
              className={`rounded-xl border p-3.5 ${
                err ? "border-[#fecaca] bg-[#fee2e2]" : "border-[#eef0f3] bg-[#f9fafb]"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">
                  {LABELS[f.field]}
                </span>
                <span
                  className={`rounded-md px-1.5 py-0.5 font-mono text-xs font-semibold ${
                    err ? "bg-[#fecaca] text-[#991b1b]" : "bg-[#e0e7ff] text-[#4338ca]"
                  }`}
                >
                  {f.rawValue}
                </span>
              </div>
              <p className={`mt-1.5 text-sm ${err ? "text-[#991b1b]" : "text-[#374151]"}`}>
                {f.explanation}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
