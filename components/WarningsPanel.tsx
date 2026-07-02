import type { CronWarning } from "@/lib/cron/types";

const STYLES: Record<CronWarning["severity"], { box: string; tag: string; label: string }> = {
  warning: { box: "border-amber-200 bg-amber-50", tag: "text-amber-700", label: "Warning" },
  info: { box: "border-sky-200 bg-sky-50", tag: "text-sky-700", label: "Info" },
};

export function WarningsPanel({ warnings }: { warnings: CronWarning[] }) {
  if (warnings.length === 0) return null;
  return (
    <div className="space-y-2">
      {warnings.map((w) => {
        const s = STYLES[w.severity];
        return (
          <div key={w.code} className={`rounded-lg border p-3 ${s.box}`}>
            <span className={`text-xs font-semibold uppercase tracking-wide ${s.tag}`}>{s.label}</span>
            <p className="mt-0.5 text-sm text-gray-700">{w.message}</p>
          </div>
        );
      })}
    </div>
  );
}
