import type { CronRun } from "@/lib/cron/types";

export function RunsTable({ runs }: { runs: CronRun[] }) {
  if (runs.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <p className="text-sm text-gray-500">
          No matching run was found within the search horizon (15 years).
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-gray-900">Next {runs.length} runs</h2>

      {/* Desktop: table */}
      <table className="mt-3 hidden w-full text-left text-sm sm:table">
        <thead>
          <tr className="text-xs uppercase tracking-wide text-gray-400">
            <th className="py-2 pr-3 font-medium">#</th>
            <th className="py-2 pr-3 font-medium">Local time</th>
            <th className="py-2 pr-3 font-medium">UTC time</th>
            <th className="py-2 font-medium">Relative</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {runs.map((r) => (
            <tr key={r.index} className="align-top">
              <td className="py-2 pr-3 text-gray-400">{r.index}</td>
              <td className="py-2 pr-3 text-gray-900">
                {r.localDateTime}
                {r.notes.length > 0 && (
                  <span className="mt-0.5 block text-xs text-amber-600">{r.notes[0]}</span>
                )}
              </td>
              <td className="py-2 pr-3 text-gray-600">
                {r.utcDateTime} · {r.utcOffset}
              </td>
              <td className="py-2 text-gray-500">{r.relativeLabel}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile: cards */}
      <ul className="mt-3 space-y-3 sm:hidden">
        {runs.map((r) => (
          <li key={r.index} className="rounded-md border border-gray-100 p-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-gray-400">#{r.index}</span>
              <span className="text-xs text-gray-500">{r.relativeLabel}</span>
            </div>
            <p className="mt-1 text-sm text-gray-900">{r.localDateTime}</p>
            <p className="text-xs text-gray-500">
              {r.utcDateTime} · {r.utcOffset}
            </p>
            {r.notes.length > 0 && <p className="mt-1 text-xs text-amber-600">{r.notes[0]}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
