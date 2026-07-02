// Quartz special day expressions: L (last), W (nearest weekday), # (nth weekday).
// These can't be precomputed into a value set because they depend on the month,
// so the scheduler evaluates them per candidate date.

export type DomRule =
  | { kind: "lastDay" } // L
  | { kind: "lastDayOffset"; offset: number } // L-<n>
  | { kind: "lastWeekday" } // LW
  | { kind: "nearestWeekday"; day: number }; // <day>W

export type DowRule =
  | { kind: "lastOfWeekday"; dow: number } // <day>L  (dow in JS 0-6)
  | { kind: "nthOfWeekday"; dow: number; nth: number }; // <day>#<nth>

export interface SpecialParse<R> {
  rule?: R;
  error?: string;
}

function daysInMonth(y: number, mo: number): number {
  return new Date(Date.UTC(y, mo, 0)).getUTCDate();
}

function weekdayOf(y: number, mo: number, d: number): number {
  return new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
}

function lastWeekdayOfMonth(y: number, mo: number): number {
  const dim = daysInMonth(y, mo);
  const wd = weekdayOf(y, mo, dim);
  if (wd === 6) return dim - 1; // Sat → Fri
  if (wd === 0) return dim - 2; // Sun → Fri
  return dim;
}

function nearestWeekdayOfMonth(y: number, mo: number, day: number): number {
  const dim = daysInMonth(y, mo);
  const d = Math.min(day, dim);
  const wd = weekdayOf(y, mo, d);
  if (wd === 6) return d - 1 < 1 ? d + 2 : d - 1; // Sat → Fri, or Mon if it underflows
  if (wd === 0) return d + 1 > dim ? d - 2 : d + 1; // Sun → Mon, or Fri if it overflows
  return d;
}

// ---------- parsing ----------

// Returns null when the token isn't a special expression at all.
export function parseDomSpecial(rawToken: string): SpecialParse<DomRule> | null {
  const t = rawToken.toUpperCase();
  if (t === "L") return { rule: { kind: "lastDay" } };
  if (t === "LW") return { rule: { kind: "lastWeekday" } };
  const off = t.match(/^L-(\d+)$/);
  if (off) {
    const offset = +off[1];
    if (offset < 1 || offset > 30) return { error: `Offset in 'L-${off[1]}' must be 1–30.` };
    return { rule: { kind: "lastDayOffset", offset } };
  }
  const w = t.match(/^(\d+)W$/);
  if (w) {
    const day = +w[1];
    if (day < 1 || day > 31) return { error: `Day in '${w[1]}W' must be 1–31.` };
    return { rule: { kind: "nearestWeekday", day } };
  }
  if (/[LW]/.test(t)) return { error: `Unsupported day-of-month expression '${rawToken}'.` };
  return null;
}

// resolveDow maps a name or number token onto JS weekday numbering (0-6).
export function parseDowSpecial(
  rawToken: string,
  resolveDow: (tok: string) => number | null,
): SpecialParse<DowRule> | null {
  const t = rawToken.toUpperCase();
  if (t === "L") return { rule: { kind: "lastOfWeekday", dow: 6 } }; // bare L = Saturday
  const hash = t.match(/^(.+)#(\d+)$/);
  if (hash) {
    const dow = resolveDow(hash[1]);
    const nth = +hash[2];
    if (dow == null) return { error: `Unrecognized day-of-week '${hash[1]}'.` };
    if (nth < 1 || nth > 5) return { error: `Occurrence in '${rawToken}' must be 1–5.` };
    return { rule: { kind: "nthOfWeekday", dow, nth } };
  }
  const last = t.match(/^(.+)L$/);
  if (last) {
    const dow = resolveDow(last[1]);
    if (dow == null) return { error: `Unrecognized day-of-week '${last[1]}'.` };
    return { rule: { kind: "lastOfWeekday", dow } };
  }
  if (/[L#]/.test(t)) return { error: `Unsupported day-of-week expression '${rawToken}'.` };
  return null;
}

// ---------- matching ----------

export function domRuleMatches(rule: DomRule, y: number, mo: number, d: number): boolean {
  switch (rule.kind) {
    case "lastDay":
      return d === daysInMonth(y, mo);
    case "lastDayOffset":
      return d === daysInMonth(y, mo) - rule.offset;
    case "lastWeekday":
      return d === lastWeekdayOfMonth(y, mo);
    case "nearestWeekday":
      return d === nearestWeekdayOfMonth(y, mo, rule.day);
  }
}

export function dowRuleMatches(rule: DowRule, y: number, mo: number, d: number, wd: number): boolean {
  if (wd !== rule.dow) return false;
  if (rule.kind === "lastOfWeekday") return d + 7 > daysInMonth(y, mo);
  return Math.floor((d - 1) / 7) + 1 === rule.nth;
}
