// Data model — verbatim from Design Document §20.
// This module is pure types: no React, no DOM, no runtime. The whole cron
// engine (parser/validator/translator/scheduler) builds on these.

export type CronDialect =
  | "standard-5-field"
  | "standard-6-field"
  | "quartz"
  | "kubernetes"
  | "github-actions"
  | "aws-eventbridge";

export type CronField =
  | "minute"
  | "hour"
  | "dayOfMonth"
  | "month"
  | "dayOfWeek";

export interface CronPreviewRequest {
  expression: string;
  timezone: string;
  dialect: CronDialect;
  startAt: string;
  count: number;
}

export interface CronFieldExplanation {
  field: CronField;
  rawValue: string;
  normalizedValue: string;
  explanation: string;
}

export interface CronRun {
  index: number;
  localDateTime: string;
  utcDateTime: string;
  timezone: string;
  utcOffset: string;
  relativeLabel: string;
  notes: string[];
}

export interface CronError {
  code: string;
  message: string;
  field?: string;
}

export interface CronWarning {
  code: string;
  message: string;
  severity: "info" | "warning";
}

export interface CronPreviewResult {
  valid: boolean;
  expression: string;
  timezone: string;
  dialect: CronDialect;
  summary: string | null;
  fields: CronFieldExplanation[];
  runs: CronRun[];
  warnings: CronWarning[];
  errors: CronError[];
}
