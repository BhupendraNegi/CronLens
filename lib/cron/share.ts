// Shareable URL params (Design §18). Only the expression, timezone, and run
// count are encoded — never a start time or anything sensitive.

export interface ShareParams {
  expr: string;
  tz: string;
  n: number;
}

export function encodeShare(p: ShareParams): string {
  const q = new URLSearchParams();
  q.set("expr", p.expr);
  q.set("tz", p.tz);
  q.set("n", String(p.n));
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
  return out;
}

export function buildShareUrl(base: string, p: ShareParams): string {
  return `${base}?${encodeShare(p)}`;
}
