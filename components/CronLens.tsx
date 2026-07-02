"use client";

import { useEffect, useMemo, useState } from "react";
import { buildPreview } from "@/lib/cron/preview";
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
  const [now, setNow] = useState(() => Date.now());

  // Resolve the user's local timezone and any shared URL params on mount.
  // (Kept out of initial state to avoid a hydration mismatch on static export.)
  useEffect(() => {
    let localTz = "UTC";
    try {
      localTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {}
    const params = new URLSearchParams(window.location.search);
    const expr = params.get("expr");
    const tz = params.get("tz");
    const n = params.get("n");
    setTimezone(tz || localTz);
    if (expr != null) setExpression(expr);
    if (n) {
      const parsed = parseInt(n, 10);
      if (parsed > 0 && parsed <= 100) setCount(parsed);
    }

    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

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
        startInstant: now,
        now,
      }),
    [expression, timezone, count, now],
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

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
      </div>

      <div className="mt-6 space-y-6">
        <SummaryCard result={result} />
        {result.valid && (
          <>
            <WarningsPanel warnings={result.warnings} />
            <RunsTable runs={result.runs} />
            <FieldBreakdown fields={result.fields} />
          </>
        )}
      </div>

      <footer className="mt-10 text-center text-xs text-gray-400">
        CronLens · standard 5-field cron · day-of-week accepts 0 or 7 for Sunday, and names like MON/JAN
      </footer>
    </main>
  );
}
