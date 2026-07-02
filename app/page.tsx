export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-4xl font-semibold text-gray-900">CronLens</h1>
        <p className="mt-2 text-gray-600">
          Paste a cron expression and see exactly when it runs.
        </p>
        <p className="mt-6 text-sm text-gray-400">
          Phase 0 scaffold — the tool lands next.
        </p>
      </div>
    </main>
  );
}
