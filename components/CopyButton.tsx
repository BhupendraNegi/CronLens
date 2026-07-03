"use client";

import { useState } from "react";

export function CopyButton({ label, getText }: { label: string; getText: () => string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard?.writeText(getText()).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-full border border-[#e5e7eb] bg-white px-3.5 py-1.5 text-xs font-medium text-[#374151] transition-colors hover:border-[#c7cbd1] hover:text-[#111827]"
    >
      {copied ? "Copied!" : label}
    </button>
  );
}
