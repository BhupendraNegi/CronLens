import type { CronWarning } from "@/lib/cron/types";

const STYLES: Record<
  CronWarning["severity"],
  { box: string; tag: string; icon: string }
> = {
  warning: {
    box: "border-[#fde68a] bg-[#fef3c7]",
    tag: "text-[#92400e]",
    icon: "⚠",
  },
  info: {
    box: "border-[#bae6fd] bg-[#e0f2fe]",
    tag: "text-[#075985]",
    icon: "ⓘ",
  },
};

// A short uppercase tag derived from the warning code.
const TAGS: Record<string, string> = {
  "every-minute": "Runs every minute",
  frequent: "Frequent schedule",
  "dom-and-dow": "Day-of-month AND day-of-week set",
  "leap-year": "Leap-year only",
  "some-months-skipped": "Some months skipped",
  "dst-gap": "A run was skipped (DST)",
  "tz-observes-dst": "Timezone observes DST",
};

export function WarningsPanel({ warnings }: { warnings: CronWarning[] }) {
  if (warnings.length === 0) return null;
  return (
    <div className="space-y-3">
      {warnings.map((w) => {
        const s = STYLES[w.severity];
        return (
          <div key={w.code} className={`flex gap-3 rounded-2xl border p-4 ${s.box}`}>
            <span aria-hidden className={`mt-0.5 shrink-0 ${s.tag}`}>
              {s.icon}
            </span>
            <div>
              <p className={`text-[11px] font-bold uppercase tracking-wider ${s.tag}`}>
                {TAGS[w.code] ?? w.code}
              </p>
              <p className="mt-0.5 text-sm text-[#374151]">{w.message}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
