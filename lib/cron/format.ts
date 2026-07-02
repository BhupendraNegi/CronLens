// Presentation helpers for run times. Adapted from the reference prototype.

import { offsetMinutes } from "./timezone";

export function formatWall(instant: number, tz: string, hour12: boolean): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12,
  }).format(new Date(instant));
}

export function tzAbbr(tz: string, date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "short" }).formatToParts(date);
  const t = parts.find((x) => x.type === "timeZoneName");
  return t ? t.value : "";
}

// Human "In 2 days" / "Tomorrow" / "In 3 hr · today" style label.
export function relativeLabel(instant: number, now: number, tz: string): string {
  const dayKey = (t: number) => {
    const d = new Date(t);
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const m: Record<string, string> = {};
    dtf.formatToParts(d).forEach((p) => {
      if (p.type !== "literal") m[p.type] = p.value;
    });
    return Date.UTC(+m.year, +m.month - 1, +m.day);
  };

  const diffMs = instant - now;
  const dayDiff = Math.round((dayKey(instant) - dayKey(now)) / 86400000);
  if (dayDiff === 0) {
    if (diffMs < 60000) return "Now";
    const mins = Math.round(diffMs / 60000);
    if (mins < 60) return "In " + mins + " min";
    return "In " + Math.round(mins / 60) + " hr · today";
  }
  if (dayDiff === 1) return "Tomorrow";
  if (dayDiff < 0) return "Past";
  if (dayDiff <= 45) return "In " + dayDiff + " days";
  if (dayDiff <= 400) return "In " + Math.round(dayDiff / 30) + " months";
  return "In " + (dayDiff / 365).toFixed(1) + " years";
}

// UTC offset (minutes) for an instant in a tz — re-exported convenience.
export function instantOffset(tz: string, instant: number): number {
  return offsetMinutes(tz, new Date(instant));
}

// "YYYY-MM-DDTHH:mm" wall-clock value in `tz`, for seeding a datetime-local input.
export function localInputValue(instant: number, tz: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(instant));
  const m: Record<string, string> = {};
  parts.forEach((p) => {
    if (p.type !== "literal") m[p.type] = p.value;
  });
  const hh = String(+m.hour % 24).padStart(2, "0");
  return `${m.year}-${m.month}-${m.day}T${hh}:${m.minute}`;
}
