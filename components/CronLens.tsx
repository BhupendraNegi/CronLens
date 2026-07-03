"use client";

import { useEffect, useMemo, useState } from "react";
import type { CronDialect } from "@/lib/cron/types";
import { buildPreview } from "@/lib/cron/preview";
import { SELECTABLE_DIALECTS, DIALECTS } from "@/lib/cron/dialects";
import { decodeShare } from "@/lib/cron/share";
import { wallToInstant, offsetMinutes, formatOffset } from "@/lib/cron/timezone";
import { localInputValue } from "@/lib/cron/format";
import { SummaryCard } from "./SummaryCard";
import { FieldBreakdown } from "./FieldBreakdown";
import { RunsTable } from "./RunsTable";
import { WarningsPanel } from "./WarningsPanel";

const COMMON_TZ = [
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Kolkata",
  "Asia/Tokyo",
  "Australia/Sydney",
];

const COUNTS = [5, 10, 25, 50, 100];

const EXAMPLES: { label: string; expr: string }[] = [
  { label: "Every minute", expr: "* * * * *" },
  { label: "Every 5 min", expr: "*/5 * * * *" },
  { label: "Hourly", expr: "0 * * * *" },
  { label: "Daily midnight", expr: "0 0 * * *" },
  { label: "Weekdays 9 AM", expr: "0 9 * * MON-FRI" },
  { label: "Monthly 1st", expr: "0 0 1 * *" },
  { label: "Sundays noon", expr: "0 12 * * SUN" },
];

const CARD = "rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]";
const LABEL = "text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]";
const FIELD =
  "w-full rounded-xl border border-[#d1d5db] bg-white px-3 py-2.5 text-sm text-[#111827] focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20";

export function CronLens() {
  const [expression, setExpression] = useState("0 9 * * 1-5");
  const [timezone, setTimezone] = useState("UTC");
  const [localTz, setLocalTz] = useState("UTC");
  const [count, setCount] = useState(10);
  const [dialect, setDialect] = useState<CronDialect>("standard-5-field");
  const [now, setNow] = useState(() => Date.now());
  const [startMode, setStartMode] = useState<"now" | "custom">("now");
  const [customStart, setCustomStart] = useState("");

  useEffect(() => {
    let tz = "UTC";
    try {
      tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {}
    setLocalTz(tz);

    const shared = decodeShare(window.location.search);
    const resolvedTz = shared.tz || tz;
    setTimezone(resolvedTz);
    setCustomStart(localInputValue(Date.now(), resolvedTz));
    if (shared.expr != null) setExpression(shared.expr);
    if (shared.n) setCount(shared.n);
    if (shared.dialect) setDialect(shared.dialect);

    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const tzOptions = useMemo(() => {
    const set = new Set(COMMON_TZ);
    set.add(timezone);
    set.add(localTz);
    return Array.from(set).sort();
  }, [timezone, localTz]);

  const tzLabel = (tz: string) => {
    let off = "";
    try {
      off = ` · ${formatOffset(offsetMinutes(tz, new Date(now)))}`;
    } catch {}
    return `${tz === localTz ? "★ " : ""}${tz}${off}`;
  };

  const startInstant = useMemo(() => {
    if (startMode === "custom" && customStart) {
      const m = customStart.match(/^(\d+)-(\d+)-(\d+)T(\d+):(\d+)/);
      if (m) return wallToInstant(timezone, +m[1], +m[2], +m[3], +m[4], +m[5]);
    }
    return now;
  }, [startMode, customStart, timezone, now]);

  const result = useMemo(
    () => buildPreview({ expression, timezone, count, dialect, startInstant, now }),
    [expression, timezone, count, dialect, startInstant, now],
  );

  const hints = DIALECTS[dialect].order.map((f) => f.label.toLowerCase());
  const seg = (active: boolean) =>
    `flex-1 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
      active ? "bg-white text-[#4338ca] shadow-sm" : "text-[#6b7280] hover:text-[#374151]"
    }`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:py-10">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4338ca] to-[#6366f1] shadow-[0_8px_20px_rgba(67,56,202,0.28)]">
            <svg
              viewBox="0 0 24 24"
              width="26"
              height="26"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
          </span>
          <div>
            <h1 className="font-display text-3xl font-bold leading-none">
              Cron<span className="text-[#4338ca]">Lens.</span>
            </h1>
            <p className="mt-1.5 text-sm text-[#4b5563]">
              Paste a cron expression and see exactly when it runs.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-4 py-2 text-sm text-[#374151] shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
          <svg
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="none"
            stroke="#6b7280"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <rect x="4" y="11" width="16" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
          Runs in your browser · nothing leaves this page
        </span>
      </header>

      {/* Two-column body */}
      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        {/* Left */}
        <div className="space-y-6">
          <div className={CARD}>
            <label htmlFor="cron" className={LABEL}>
              Cron expression
            </label>
            <input
              id="cron"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              spellCheck={false}
              autoComplete="off"
              className="mt-2 w-full rounded-xl border border-[#d1d5db] bg-[#f9fafb] px-4 py-3.5 font-mono text-xl tracking-wide text-[#111827] focus:border-[#6366f1] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
              placeholder={hints.join(" ")}
            />
            <p className="mt-2 font-mono text-xs text-[#9ca3af]">{hints.join("  ")}</p>

            <p className={`mt-4 ${LABEL}`}>Examples</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.expr}
                  type="button"
                  onClick={() => setExpression(ex.expr)}
                  title={ex.expr}
                  className="rounded-full border border-[#e5e7eb] bg-white px-3 py-1.5 font-mono text-xs text-[#4b5563] transition-colors hover:border-[#c7cbd1] hover:text-[#111827]"
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>

          <div className={CARD}>
            <label htmlFor="tz" className={LABEL}>
              Timezone
            </label>
            <select id="tz" value={timezone} onChange={(e) => setTimezone(e.target.value)} className={`mt-2 ${FIELD}`}>
              {tzOptions.map((tz) => (
                <option key={tz} value={tz}>
                  {tzLabel(tz)}
                </option>
              ))}
            </select>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="dialect" className={LABEL}>
                  Dialect
                </label>
                <select
                  id="dialect"
                  value={dialect}
                  onChange={(e) => setDialect(e.target.value as CronDialect)}
                  className={`mt-2 ${FIELD}`}
                >
                  {SELECTABLE_DIALECTS.map((d) => (
                    <option key={d} value={d}>
                      {DIALECTS[d].label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="count" className={LABEL}>
                  Runs
                </label>
                <select
                  id="count"
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className={`mt-2 ${FIELD}`}
                >
                  {COUNTS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <p className={`mt-4 ${LABEL}`}>Start from</p>
            <div className="mt-2 flex gap-1 rounded-xl bg-[#f3f4f6] p-1">
              <button type="button" className={seg(startMode === "now")} onClick={() => setStartMode("now")}>
                Now
              </button>
              <button
                type="button"
                className={seg(startMode === "custom")}
                onClick={() => setStartMode("custom")}
              >
                Custom
              </button>
            </div>
            {startMode === "custom" && (
              <input
                type="datetime-local"
                aria-label="Custom start date and time"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className={`mt-3 ${FIELD}`}
              />
            )}
          </div>
        </div>

        {/* Right */}
        <div className="space-y-6">
          <SummaryCard result={result} count={count} />
          <FieldBreakdown fields={result.fields} />
          <WarningsPanel warnings={result.warnings} />
          {result.valid && (
            <RunsTable
              result={result}
              startLabel={startMode === "custom" ? "Starting from your custom time" : "Starting from now"}
            />
          )}
        </div>
      </div>

      <footer className="mt-12 text-center text-xs text-[#9ca3af]">
        CronLens · 5-field, 6-field (seconds), and Quartz dialects · nicknames like @daily · names like MON/JAN
      </footer>
    </div>
  );
}
