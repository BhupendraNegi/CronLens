"use client";

import { useEffect, useMemo, useState } from "react";
import type { CronDialect } from "@/lib/cron/types";
import { buildPreview } from "@/lib/cron/preview";
import { SELECTABLE_DIALECTS, DIALECTS } from "@/lib/cron/dialects";
import { decodeShare } from "@/lib/cron/share";
import { wallToInstant } from "@/lib/cron/timezone";
import { localInputValue } from "@/lib/cron/format";
import { SummaryCard } from "./SummaryCard";
import { FieldBreakdown } from "./FieldBreakdown";
import { RunsTable } from "./RunsTable";
import { WarningsPanel } from "./WarningsPanel";
import { CopyActions } from "./CopyActions";

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
  { label: "Every 5 minutes", expr: "*/5 * * * *" },
  { label: "Hourly", expr: "0 * * * *" },
  { label: "Daily at midnight", expr: "0 0 * * *" },
  { label: "Weekdays at 9 AM", expr: "0 9 * * MON-FRI" },
  { label: "Monthly on the 1st", expr: "0 0 1 * *" },
];

export function CronLens() {
  const [expression, setExpression] = useState("0 9 * * 1-5");
  const [timezone, setTimezone] = useState("UTC");
  const [count, setCount] = useState(10);
  const [dialect, setDialect] = useState<CronDialect>("standard-5-field");
  const [now, setNow] = useState(() => Date.now());
  const [startMode, setStartMode] = useState<"now" | "custom">("now");
  const [customStart, setCustomStart] = useState("");

  // Resolve the user's local timezone and any shared URL params on mount.
  // (Kept out of initial state to avoid a hydration mismatch on static export.)
  useEffect(() => {
    let localTz = "UTC";
    try {
      localTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {}
    const shared = decodeShare(window.location.search);
    const resolvedTz = shared.tz || localTz;
    setTimezone(resolvedTz);
    setCustomStart(localInputValue(Date.now(), resolvedTz));
    if (shared.expr != null) setExpression(shared.expr);
    if (shared.n) setCount(shared.n);
    if (shared.dialect) setDialect(shared.dialect);

    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  // Resolve the start instant: "now" tracks the clock; "custom" reads the
  // datetime-local value as a wall-clock time in the selected timezone.
  const startInstant = useMemo(() => {
    if (startMode === "custom" && customStart) {
      const m = customStart.match(/^(\d+)-(\d+)-(\d+)T(\d+):(\d+)/);
      if (m) return wallToInstant(timezone, +m[1], +m[2], +m[3], +m[4], +m[5]);
    }
    return now;
  }, [startMode, customStart, timezone, now]);

  const tzOptions = useMemo(() => {
    const set = new Set(COMMON_TZ);
    set.add(timezone);
    return Array.from(set).sort();
  }, [timezone]);

  const result = useMemo(
    () =>
      buildPreview({
        expression,
        timezone,
        count,
        dialect,
        startInstant,
        now,
      }),
    [expression, timezone, count, dialect, startInstant, now],
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">CronLens</h1>
        <p className="mt-1 text-gray-600">Paste a cron expression and see exactly when it runs.</p>
        <p className="mt-0.5 text-xs text-gray-400">Runs in your browser · nothing leaves this page</p>
      </header>

      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <label htmlFor="cron" className="text-sm font-medium text-gray-700">
          Cron expression
        </label>
        <input
          id="cron"
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-lg text-gray-900 focus:border-gray-900 focus:outline-none"
          placeholder="minute hour day-of-month month day-of-week"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.expr}
              type="button"
              onClick={() => setExpression(ex.expr)}
              className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:border-gray-400 hover:text-gray-900"
              title={ex.expr}
            >
              {ex.label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="tz" className="text-sm font-medium text-gray-700">
              Timezone
            </label>
            <select
              id="tz"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
            >
              {tzOptions.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="dialect" className="text-sm font-medium text-gray-700">
              Dialect
            </label>
            <select
              id="dialect"
              value={dialect}
              onChange={(e) => setDialect(e.target.value as CronDialect)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
            >
              {SELECTABLE_DIALECTS.map((d) => (
                <option key={d} value={d}>
                  {DIALECTS[d].label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="count" className="text-sm font-medium text-gray-700">
              Runs
            </label>
            <select
              id="count"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
            >
              {COUNTS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <span className="text-sm font-medium text-gray-700">Start from</span>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-1.5 text-sm text-gray-700">
              <input
                type="radio"
                name="startMode"
                checked={startMode === "now"}
                onChange={() => setStartMode("now")}
              />
              Now
            </label>
            <label className="flex items-center gap-1.5 text-sm text-gray-700">
              <input
                type="radio"
                name="startMode"
                checked={startMode === "custom"}
                onChange={() => setStartMode("custom")}
              />
              Custom
            </label>
            {startMode === "custom" && (
              <input
                type="datetime-local"
                aria-label="Custom start date and time"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
              />
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        <SummaryCard result={result} />
        {result.valid && (
          <>
            <CopyActions result={result} count={count} />
            <WarningsPanel warnings={result.warnings} />
            <RunsTable runs={result.runs} />
            <FieldBreakdown fields={result.fields} />
          </>
        )}
      </div>

      <footer className="mt-10 text-center text-xs text-gray-400">
        CronLens · 5-field, 6-field (seconds), and Quartz dialects · nicknames like @daily · names like MON/JAN
      </footer>
    </main>
  );
}
