// Shareable URL params (Design §18). Only the expression, timezone, dialect,
// and run count are encoded — never a start time or anything sensitive.

import type { CronDialect } from "./types";
import { SELECTABLE_DIALECTS } from "./dialects";

export interface ShareParams {
  expr: string;
  tz: string;
  n: number;
  dialect?: CronDialect;
}

export function encodeShare(p: ShareParams): string {
  const q = new URLSearchParams();
  q.set("expr", p.expr);
  q.set("tz", p.tz);
  q.set("n", String(p.n));
  if (p.dialect && p.dialect !== "standard-5-field") q.set("d", p.dialect);
  return q.toString();
}

export function decodeShare(query: string): Partial<ShareParams> {
  const q = new URLSearchParams(query);
  const out: Partial<ShareParams> = {};
  const expr = q.get("expr");
  if (expr != null) out.expr = expr;
  const tz = q.get("tz");
  if (tz) out.tz = tz;
  const n = q.get("n");
  if (n) {
    const v = parseInt(n, 10);
    if (v > 0 && v <= 100) out.n = v;
  }
  const d = q.get("d");
  if (d && (SELECTABLE_DIALECTS as string[]).includes(d)) out.dialect = d as CronDialect;
  return out;
}

export function buildShareUrl(base: string, p: ShareParams): string {
  return `${base}?${encodeShare(p)}`;
}
