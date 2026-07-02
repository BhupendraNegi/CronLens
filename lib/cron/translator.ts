// Plain-English translation (Design §12) and field-by-field breakdown (§13).
// Pure functions over parsed fields. Adapted from the reference prototype.

import type { CronFieldExplanation } from "./types";
import type { ParsedField } from "./parser";
import type { ParsedFields } from "./expression";
import type { DomRule, DowRule } from "./special";

const MFULL = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DFULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const pad = (n: number) => String(n).padStart(2, "0");

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function listJoin(a: string[]): string {
  if (a.length === 0) return "";
  if (a.length === 1) return a[0];
  if (a.length === 2) return a[0] + " and " + a[1];
  return a.slice(0, -1).join(", ") + " and " + a[a.length - 1];
}

// Render a set of weekday numbers as English, collapsing contiguous runs.
function weekdayText(vals: number[]): string {
  const v = vals.slice().sort((a, b) => a - b);
  if (v.length === 1) return DFULL[v[0]];
  let contig = true;
  for (let i = 1; i < v.length; i++) if (v[i] !== v[i - 1] + 1) { contig = false; break; }
  if (contig && v.length > 2) return DFULL[v[0]] + " through " + DFULL[v[v.length - 1]];
  return listJoin(v.map((x) => DFULL[x]));
}

function monthText(vals: number[]): string {
  const v = vals.slice().sort((a, b) => a - b);
  if (v.length === 1) return MFULL[v[0]];
  let contig = true;
  for (let i = 1; i < v.length; i++) if (v[i] !== v[i - 1] + 1) { contig = false; break; }
  if (contig && v.length > 2) return MFULL[v[0]] + " through " + MFULL[v[v.length - 1]];
  return listJoin(v.map((x) => MFULL[x]));
}

interface TimePhrase {
  text: string;
  freq: boolean; // true = a frequency ("Every 5 minutes"), false = a point ("At 09:00")
}

function timePhrase(minF: ParsedField, hourF: ParsedField): TimePhrase {
  const minWild = minF.raw === "*";
  const hourWild = hourF.raw === "*";
  const minVals = minF.values;
  const hourVals = hourF.values;
  const oneSeg = (f: ParsedField) => (f.segments.length === 1 ? f.segments[0] : null);
  const ms = oneSeg(minF);
  const hs = oneSeg(hourF);
  const minStep = ms && ms.type === "step" ? ms.step : null;
  const hourRange = hs && hs.type === "range" ? hs : null;

  if (minWild && hourWild) return { text: "Every minute", freq: true };
  if (minStep && hourWild) return { text: "Every " + minStep + " minutes", freq: true };
  if (minStep && hourRange)
    return {
      text: `Every ${minStep} minutes from ${pad(hourRange.lo)}:00 through ${pad(hourRange.hi)}:59`,
      freq: true,
    };
  if (minStep && !hourWild)
    return { text: `Every ${minStep} minutes past hours ${hourVals.map(pad).join(", ")}`, freq: true };
  if (!minWild && hourWild) {
    if (minVals.length === 1) {
      const v = minVals[0];
      return { text: v === 0 ? "At the start of every hour" : "At minute " + v + " of every hour", freq: true };
    }
    return { text: "At minutes " + minVals.join(", ") + " of every hour", freq: true };
  }
  if (minWild && !hourWild)
    return { text: "Every minute during " + listJoin(hourVals.map((h) => pad(h) + ":00")), freq: true };

  const combos: { h: number; m: number }[] = [];
  for (const h of hourVals) for (const m of minVals) combos.push({ h, m });
  if (combos.length === 1) {
    const { h, m } = combos[0];
    const t = h === 0 && m === 0 ? "At midnight" : h === 12 && m === 0 ? "At noon" : `At ${pad(h)}:${pad(m)}`;
    return { text: t, freq: false };
  }
  if (combos.length <= 6)
    return { text: "At " + listJoin(combos.map((c) => pad(c.h) + ":" + pad(c.m))), freq: false };
  return {
    text: `At minutes ${minVals.join(", ")} past hours ${hourVals.map(pad).join(", ")}`,
    freq: false,
  };
}

interface DatePhrase {
  point: string; // used after a point-in-time phrase ("... every Monday")
  freq: string; // used after a frequency phrase ("..., Monday through Friday")
}

// Quartz L/W/# phrasings (capitalized for the field breakdown).
function describeDomSpecial(r: DomRule): string {
  switch (r.kind) {
    case "lastDay":
      return "On the last day of the month";
    case "lastDayOffset":
      return `${r.offset} day${r.offset === 1 ? "" : "s"} before the last day of the month`;
    case "lastWeekday":
      return "On the last weekday of the month";
    case "nearestWeekday":
      return `On the weekday nearest the ${ordinal(r.day)}`;
  }
}

function describeDowSpecial(r: DowRule): string {
  const day = DFULL[r.dow];
  return r.kind === "lastOfWeekday"
    ? `On the last ${day} of the month`
    : `On the ${ordinal(r.nth)} ${day} of the month`;
}

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

function datePhrase(domF: ParsedField, monthF: ParsedField, dowF: ParsedField): DatePhrase {
  // '*' and Quartz '?' are both unrestricted.
  const domR = !domF.isWild;
  const monthR = !monthF.isWild;
  const dowR = !dowF.isWild;
  const months = () => monthText(monthF.values);
  const doms = () => listJoin(domF.values.map((d) => ordinal(d)));

  // Quartz L/W/# rules describe the day directly.
  if (domF.special || dowF.special) {
    const parts: string[] = [];
    if (domF.special) parts.push(lowerFirst(describeDomSpecial(domF.special as DomRule)));
    if (dowF.special) parts.push(lowerFirst(describeDowSpecial(dowF.special as DowRule)));
    let base = parts.join(" and ");
    if (monthR) base += " in " + months();
    return { point: base, freq: base };
  }

  if (!domR && !dowR) {
    if (!monthR) return { point: "every day", freq: "" };
    return { point: "every day in " + months(), freq: "in " + months() };
  }
  if (dowR && !domR) {
    const wd = weekdayText(dowF.values);
    if (monthR) return { point: "every " + wd + " in " + months(), freq: wd + " in " + months() };
    return { point: "every " + wd, freq: wd };
  }
  if (domR && !dowR) {
    if (monthR) {
      if (monthF.values.length === 1 && domF.values.length === 1) {
        const t = "on " + MFULL[monthF.values[0]] + " " + domF.values[0];
        return { point: t, freq: t };
      }
      const t = "on the " + doms() + " of " + months();
      return { point: t, freq: t };
    }
    const t = "on the " + doms() + " of every month";
    return { point: t, freq: t };
  }
  const wd = weekdayText(dowF.values);
  let base = "on the " + doms() + " and every " + wd;
  if (monthR) base += " in " + months();
  return { point: base, freq: base };
}

export function buildSummary(fields: ParsedFields): string {
  const tp = timePhrase(fields.minute, fields.hour);
  const dp = datePhrase(fields.dayOfMonth, fields.month, fields.dayOfWeek);

  // Fold seconds into the time phrase for dialects that carry them. Second 0 is
  // the implicit default and never mentioned (keeps minute-dialect output stable).
  let text = tp.text;
  let freq = tp.freq;
  const sec = fields.second;
  if (fields.hasSeconds && sec.raw !== "0") {
    const seg = sec.segments.length === 1 ? sec.segments[0] : null;
    if (sec.isWild) {
      text = "Every second";
      freq = true;
    } else if (seg && seg.type === "step") {
      text = `Every ${seg.step} seconds`;
      freq = true;
    } else if (sec.values.length === 1 && !tp.freq && /\d\d:\d\d$/.test(tp.text)) {
      text = `${tp.text}:${pad(sec.values[0])}`;
    } else {
      text = `${tp.text} at second ${sec.values.join(", ")}`;
    }
  }

  let s: string;
  if (freq) s = text + (dp.freq ? ", " + dp.freq : "");
  else s = text + (dp.point ? " " + dp.point : "");
  return s.trim() + ".";
}

type BreakdownKey = CronFieldExplanation["field"] | "second" | "year";

// Field-by-field breakdown (Design §13). Full names for month/weekday.
function describeField(field: BreakdownKey, F: ParsedField): string {
  if (F.special) {
    return field === "dayOfMonth"
      ? describeDomSpecial(F.special as DomRule)
      : describeDowSpecial(F.special as DowRule);
  }
  if (F.isWild) {
    return {
      second: "Every second",
      minute: "Every minute",
      hour: "Every hour",
      dayOfMonth: "Every day of the month",
      month: "Every month",
      dayOfWeek: "Every day of the week",
      year: "Every year",
    }[field];
  }

  switch (field) {
    case "second":
      return F.values.length === 1 ? `At second ${F.values[0]}` : `At seconds ${F.values.join(", ")}`;
    case "minute":
      return F.values.length === 1 ? `At minute ${F.values[0]}` : `At minutes ${F.values.join(", ")}`;
    case "hour":
      return F.values.length === 1
        ? `At ${pad(F.values[0])}:00`
        : "At " + listJoin(F.values.map((h) => pad(h) + ":00"));
    case "dayOfMonth":
      return F.values.length === 1
        ? `On the ${ordinal(F.values[0])}`
        : "On the " + listJoin(F.values.map((d) => ordinal(d)));
    case "month":
      return "In " + monthText(F.values);
    case "dayOfWeek":
      return weekdayText(F.values);
    case "year":
      return F.values.length === 1 ? `In ${F.values[0]}` : "In " + listJoin(F.values.map(String));
  }
}

export function buildFieldExplanations(fields: ParsedFields): CronFieldExplanation[] {
  const rows: { key: BreakdownKey; f: ParsedField }[] = [];
  if (fields.hasSeconds) rows.push({ key: "second", f: fields.second });
  rows.push(
    { key: "minute", f: fields.minute },
    { key: "hour", f: fields.hour },
    { key: "dayOfMonth", f: fields.dayOfMonth },
    { key: "month", f: fields.month },
    { key: "dayOfWeek", f: fields.dayOfWeek },
  );
  if (fields.hasYear && fields.year) rows.push({ key: "year", f: fields.year });

  return rows.map(({ key, f }) => ({
    field: key as CronFieldExplanation["field"],
    rawValue: f.raw,
    normalizedValue: f.values.join(","),
    explanation: describeField(key, f),
  }));
}
