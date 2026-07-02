// IANA timezone helpers built on Intl.DateTimeFormat — no external deps.
// Adapted from the reference prototype in docs/Design Document.
//
// "instant" = epoch milliseconds (UTC). "wall" = the clock reading in a tz.

export interface WallParts {
  y: number;
  mo: number; // 1-12
  d: number;
  h: number; // 0-23
  mi: number;
}

// Offset (minutes) of `tz` from UTC at the given instant. East of UTC is positive.
export function offsetMinutes(tz: string, date: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const m: Record<string, string> = {};
  dtf.formatToParts(date).forEach((p) => {
    if (p.type !== "literal") m[p.type] = p.value;
  });
  const asUTC = Date.UTC(+m.year, +m.month - 1, +m.day, +m.hour % 24, +m.minute, +m.second);
  return Math.round((asUTC - date.getTime()) / 60000);
}

// Convert a wall-clock time in `tz` to an instant. Handles DST transitions by
// re-checking the offset at the candidate instant.
export function wallToInstant(
  tz: string,
  y: number,
  mo: number,
  d: number,
  h: number,
  mi: number,
): number {
  const guess = Date.UTC(y, mo - 1, d, h, mi, 0);
  const off = offsetMinutes(tz, new Date(guess));
  let inst = guess - off * 60000;
  const off2 = offsetMinutes(tz, new Date(inst));
  if (off2 !== off) inst = guess - off2 * 60000;
  return inst;
}

// Wall-clock parts of an instant in `tz`.
export function wallParts(tz: string, instant: number): WallParts {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const m: Record<string, string> = {};
  dtf.formatToParts(new Date(instant)).forEach((p) => {
    if (p.type !== "literal") m[p.type] = p.value;
  });
  return { y: +m.year, mo: +m.month, d: +m.day, h: +m.hour % 24, mi: +m.minute };
}

export function formatOffset(min: number): string {
  const sign = min < 0 ? "-" : "+";
  const a = Math.abs(min);
  const pad = (n: number) => String(n).padStart(2, "0");
  return "UTC" + sign + pad(Math.floor(a / 60)) + ":" + pad(a % 60);
}

// Does `tz` observe DST in the given year (Jan vs Jul offset differ)?
export function observesDST(tz: string, year: number): boolean {
  const jan = offsetMinutes(tz, new Date(Date.UTC(year, 0, 1, 12)));
  const jul = offsetMinutes(tz, new Date(Date.UTC(year, 6, 1, 12)));
  return jan !== jul;
}
