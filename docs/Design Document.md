Design Document: CronLens
1. Product Summary

CronLens is a lightweight cron expression visualizer that lets users paste a cron string and instantly see:

Plain-English meaning
Next N scheduled run times
Timezone-aware interpretation
Validation errors and warnings
Edge-case explanations, especially around day-of-week, day-of-month, and daylight saving time

The product is intentionally small, fast, and reusable. It should feel like a developer utility people bookmark and return to repeatedly.

2. Problem Statement

Cron expressions are compact but hard to verify by sight. Developers often write or copy a cron string and are unsure whether it means:

0 9 * * 1-5

“Every weekday at 9 AM”
or something slightly different depending on the cron dialect, timezone, or runtime environment.

Common issues include:

Forgetting the field order
Confusing day-of-month and day-of-week behavior
Misreading ranges, steps, and lists
Not accounting for timezone differences
Not understanding daylight saving time behavior
Using the wrong cron dialect for a platform
Wanting to know the next actual fire times, not just a vague translation

CronLens solves this by showing the expression, the interpretation, and the concrete next run times together.

3. Goals
Primary Goals
Allow a user to paste a cron expression and immediately understand it.
Show the next N scheduled executions in a selected timezone.
Generate a plain-English explanation of the expression.
Validate invalid or ambiguous cron expressions.
Make timezone and daylight saving behavior visible, not hidden.
Support a simple, fast, no-login utility experience.
Secondary Goals
Let users copy the result or share a permalink.
Support multiple cron dialects over time.
Provide warnings for expressions that are technically valid but surprising.
Offer examples for common schedules.
4. Non-Goals

For the initial version, CronLens will not:

Execute jobs.
Store scheduled tasks.
Replace production schedulers.
Support every cron dialect perfectly on day one.
Require user accounts.
Provide monitoring, logging, or alerting.
Integrate directly with cloud schedulers in the MVP.
5. Target Users
Primary Users
Backend engineers
DevOps engineers
SREs
Data engineers
QA engineers
Technical founders
Anyone configuring scheduled jobs
Typical Use Cases
“What does this cron string mean?”
“When will this job run next?”
“Will this run in UTC or my timezone?”
“Does this run every 5 minutes or at minute 5?”
“Why is my monthly job not firing when expected?”
“How does this behave around daylight saving time?”
6. Core User Flow
Main Flow
User opens CronLens.
User pastes a cron expression.
CronLens validates the expression.
CronLens displays:
Plain-English translation
Field-by-field breakdown
Next N run times
Selected timezone
Any warnings
User optionally changes:
Timezone
Cron dialect
Number of future runs
Start date/reference time
Results update instantly.
7. MVP Scope

The MVP should support:

Inputs
Cron expression input
Timezone selector
Number of upcoming runs
Optional “start from” date/time
Cron dialect selector with one default dialect
Outputs
Valid/invalid status
Plain-English translation
Next N run times
Field-by-field explanation
Timezone display
Warning messages
Copy/share controls
Default MVP Behavior
Default dialect: Standard 5-field cron
Default timezone: user’s local timezone
Default preview count: 10 next runs
Default start time: now
8. Cron Expression Support
MVP Cron Format

CronLens should initially support the common 5-field cron format:

* * * * *
│ │ │ │ │
│ │ │ │ └── Day of week
│ │ │ └──── Month
│ │ └────── Day of month
│ └──────── Hour
└────────── Minute
Supported Field Syntax

Each field should support:

Syntax	Example	Meaning
Wildcard	*	Every valid value
Specific value	5	At value 5
List	1,2,3	At values 1, 2, and 3
Range	1-5	From 1 through 5
Step	*/10	Every 10 units
Range with step	1-30/5	Every 5 units from 1 through 30
Month names	JAN, FEB	Named months
Day names	MON, TUE	Named weekdays
Optional Later Support

Later versions can support:

6-field cron with seconds
Quartz cron
AWS EventBridge scheduled expressions
Kubernetes CronJob behavior
GitHub Actions cron behavior
Jenkins-specific cron syntax
Nicknames like @daily, @hourly, @weekly
9. Cron Dialect Handling

Cron syntax is not universal. CronLens should make dialect explicit.

MVP Dialect

The MVP should use a clearly labeled default:

Standard 5-field cron

Fields:

minute hour day-of-month month day-of-week
Future Dialect Options

CronLens can later add presets such as:

Standard Unix cron
Vixie-style cron
Kubernetes CronJob
GitHub Actions
AWS EventBridge
Quartz
Jenkins

Each dialect should define:

Number of fields
Supported special characters
Timezone behavior
Day-of-week numbering
Day-of-month and day-of-week matching behavior
Seconds support
Year field support
10. Timezone Design

Timezone handling is a core feature, not an afterthought.

Requirements

CronLens must:

Default to the user’s local timezone.
Allow selecting any IANA timezone, such as:
UTC
Asia/Kolkata
America/New_York
Europe/London
Show timezone abbreviation where helpful.
Show UTC offset for each run time.
Clearly show when daylight saving time affects a schedule.
Let users compare local time and UTC time.
Time Display Format

Each next run should show:

Mon, Jul 6, 2026, 09:00 Asia/Kolkata
UTC: Mon, Jul 6, 2026, 03:30 UTC

Recommended table columns:

#	Local time	UTC time	Timezone	Notes
1	Mon, Jul 6, 2026, 09:00	Mon, Jul 6, 2026, 03:30	Asia/Kolkata	—
2	Tue, Jul 7, 2026, 09:00	Tue, Jul 7, 2026, 03:30	Asia/Kolkata	—
11. Daylight Saving Time Behavior

CronLens should not silently hide DST issues.

DST Edge Cases

There are two major DST cases:

Spring forward
Some local times do not exist.
Example: 02:30 may be skipped on DST transition day.
Fall back
Some local times occur twice.
Example: 01:30 may happen twice with different UTC offsets.
MVP Policy

CronLens should define and display its behavior clearly:

If a scheduled local time does not exist, mark it as skipped due to DST.
If a scheduled local time occurs twice, show both UTC instants or show a warning depending on dialect mode.
Add a note like:
This timezone has a daylight saving transition near this run. Actual scheduler behavior may vary by platform.
Example Warning
Warning: This expression schedules a time that may be affected by daylight saving transitions in America/New_York.
12. Plain-English Translation

CronLens should generate a concise plain-English explanation.

Examples
Expression
*/5 * * * *

Translation:

Every 5 minutes.
Expression
0 9 * * 1-5

Translation:

At 09:00 every Monday through Friday.
Expression
30 2 1 * *

Translation:

At 02:30 on the 1st day of every month.
Expression
0 0 * * 0

Translation:

At midnight every Sunday.
Translation Requirements

The translation should:

Be human-readable.
Avoid overly technical wording.
Match the selected cron dialect.
Mention timezone separately instead of embedding it awkwardly.
Highlight ambiguous or surprising behavior.

Example:

At 09:00 every weekday.
Timezone: Asia/Kolkata.
13. Field-by-Field Breakdown

Below the plain-English summary, CronLens should show a detailed explanation.

Example for:

0 9 * * 1-5
Field	Value	Meaning
Minute	0	At minute 0
Hour	9	At 09:00
Day of month	*	Every day of the month
Month	*	Every month
Day of week	1-5	Monday through Friday

This helps users debug the expression when the summary is not enough.

14. Next-N-Runs Preview

The next-run preview is the core utility.

Requirements

Users should be able to choose:

5 runs
10 runs
25 runs
50 runs
Custom count, within a safe limit
Recommended MVP Limit

Maximum preview count:

100 runs

This keeps the interface fast and prevents expensive calculations for rare schedules.

Display Rules

Each run should include:

Sequence number
Local date and time
UTC date and time
Relative time
DST note, if applicable

Example:

#	Local time	UTC time	Relative
1	Wed, Jul 1, 2026, 09:00	Wed, Jul 1, 2026, 03:30	Today
2	Thu, Jul 2, 2026, 09:00	Thu, Jul 2, 2026, 03:30	Tomorrow
3	Fri, Jul 3, 2026, 09:00	Fri, Jul 3, 2026, 03:30	In 2 days
15. Validation and Error Handling

CronLens should provide clear, actionable errors.

Example Invalid Input
61 * * * *

Error:

Invalid minute value: 61. Minute must be between 0 and 59.
Example Missing Field
0 9 * *

Error:

This expression has 4 fields, but Standard 5-field cron requires 5 fields.
Expected: minute hour day-of-month month day-of-week.
Example Unsupported Syntax
0 9 ? * MON

Error:

The '?' character is not supported in Standard 5-field cron. Try switching to a Quartz-compatible dialect.
Validation Categories

CronLens should distinguish between:

Errors
Expression cannot be parsed.
No preview can be generated.
Warnings
Expression is valid but may behave unexpectedly.
Platform behavior may differ.
DST may affect results.
Info
Helpful explanation or suggestion.
16. Warning Examples
Day-of-Month and Day-of-Week Warning

Expression:

0 9 1 * MON

Potential warning:

This expression restricts both day-of-month and day-of-week. Some cron implementations treat this as OR, while others may behave differently. Check your target scheduler.
Rare Schedule Warning

Expression:

0 0 29 2 *

Warning:

This expression only runs on February 29, so it fires only in leap years.
Very Frequent Schedule Warning

Expression:

* * * * *

Warning:

This expression runs every minute.
17. User Interface Design
Layout

Recommended desktop layout:

┌──────────────────────────────────────────────────────────────┐
│ CronLens                                                     │
│ Paste a cron expression and see exactly when it runs.         │
├──────────────────────────────────────────────────────────────┤
│ Cron expression                                               │
│ [ 0 9 * * 1-5                                      ]          │
│                                                              │
│ Timezone        Dialect                  Runs                 │
│ [Asia/Kolkata]  [Standard 5-field cron]  [10]                 │
│                                                              │
│ Start from                                                   │
│ [Now / custom date-time]                                      │
├──────────────────────────────────────────────────────────────┤
│ Summary                                                       │
│ At 09:00 every Monday through Friday.                         │
│                                                              │
│ Status: Valid                                                 │
├──────────────────────────────────────────────────────────────┤
│ Next runs                                                     │
│ #   Local time                       UTC time                 │
│ 1   Mon, Jul 6, 2026, 09:00 IST      03:30 UTC                │
│ 2   Tue, Jul 7, 2026, 09:00 IST      03:30 UTC                │
├──────────────────────────────────────────────────────────────┤
│ Field breakdown                                               │
│ Minute: 0 — at minute 0                                       │
│ Hour: 9 — at 09:00                                            │
│ Day of month: * — every day                                   │
│ Month: * — every month                                        │
│ Day of week: 1-5 — Monday through Friday                      │
└──────────────────────────────────────────────────────────────┘
Mobile Layout

On mobile:

Stack all controls vertically.
Keep cron input at the top.
Show summary immediately after input.
Put next runs before the field breakdown.
Use compact date formatting.
Avoid horizontal table overflow by using cards.

Example mobile run card:

#1
Mon, Jul 6, 2026
09:00 Asia/Kolkata
03:30 UTC
18. Interaction Details
Input Behavior
Update results as the user types.
Debounce parsing slightly to avoid flicker.
Preserve user input exactly.
Show partial validation for incomplete expressions.
Allow paste from clipboard naturally.
Trim leading/trailing whitespace but do not silently alter internal spacing.
Copy Buttons

CronLens should provide copy actions for:

Cron expression
Plain-English summary
Next run times
Full result as Markdown
Shareable URL

CronLens should support a shareable URL with encoded parameters:

expression
timezone
dialect
start time
preview count

Example conceptual format:

/preview?expr=0%209%20*%20*%201-5&tz=Asia%2FKolkata&n=10

Do not include sensitive data. Cron strings are generally not secrets, but users may still paste internal job schedules, so keep sharing explicit.

19. Accessibility Requirements

CronLens should be usable without a mouse.

Requirements
Full keyboard navigation
Clear focus states
Proper labels for all inputs
Screen-reader-friendly validation messages
Sufficient color contrast
Do not rely on color alone for valid/error states
Use real text instead of images for schedule results
Error Accessibility

When the cron expression is invalid:

Announce the error message to screen readers.
Keep focus in the input.
Do not erase the user’s expression.
20. Data Model
CronPreviewRequest
type CronPreviewRequest = {
  expression: string;
  timezone: string;
  dialect: CronDialect;
  startAt: string;
  count: number;
};
CronDialect
type CronDialect =
  | "standard-5-field"
  | "standard-6-field"
  | "quartz"
  | "kubernetes"
  | "github-actions"
  | "aws-eventbridge";

For the MVP, only standard-5-field needs to be implemented.

CronPreviewResult
type CronPreviewResult = {
  valid: boolean;
  expression: string;
  timezone: string;
  dialect: CronDialect;
  summary: string | null;
  fields: CronFieldExplanation[];
  runs: CronRun[];
  warnings: CronWarning[];
  errors: CronError[];
};
CronRun
type CronRun = {
  index: number;
  localDateTime: string;
  utcDateTime: string;
  timezone: string;
  utcOffset: string;
  relativeLabel: string;
  notes: string[];
};
CronFieldExplanation
type CronFieldExplanation = {
  field: "minute" | "hour" | "dayOfMonth" | "month" | "dayOfWeek";
  rawValue: string;
  normalizedValue: string;
  explanation: string;
};
CronError
type CronError = {
  code: string;
  message: string;
  field?: string;
};
CronWarning
type CronWarning = {
  code: string;
  message: string;
  severity: "info" | "warning";
};
21. Parsing and Preview Algorithm
High-Level Algorithm
Normalize input.
Split into fields.
Validate field count.
Parse each field into allowed values.
Generate plain-English explanation.
Starting from startAt, search forward minute by minute.
Match candidate times against parsed field constraints.
Convert each matching instant into selected timezone and UTC.
Continue until N runs are found or a safety limit is reached.
Return runs, warnings, and errors.
Matching Logic

For each candidate local time:

minute matches
AND hour matches
AND month matches
AND day-of-month / day-of-week rule matches

The day-of-month and day-of-week rule should be clearly defined by dialect.

For MVP, CronLens should document its default behavior and warn users when both are restricted.

Safety Bounds

To avoid infinite or expensive searches:

Maximum preview count: 100
Maximum search horizon: configurable, for example 10 years
If no run is found within the horizon, show an error or warning

Example:

No matching run was found within the next 10 years.
22. Edge Cases

CronLens should explicitly handle these cases.

Every Minute
* * * * *

Display:

Every minute.

Warning:

This expression runs very frequently.
Leap Day
0 0 29 2 *

Display:

At midnight on February 29.

Warning:

This only runs in leap years.
Month-End Misunderstanding
0 0 31 * *

Warning:

This expression only runs in months that have a 31st day.
Weekday Morning
0 9 * * MON-FRI

Display:

At 09:00 every Monday through Friday.
Multiple Daily Runs
0 9,17 * * *

Display:

At 09:00 and 17:00 every day.
Every 15 Minutes During Work Hours
*/15 9-17 * * MON-FRI

Display:

Every 15 minutes from 09:00 through 17:59, Monday through Friday.
23. Architecture
Recommended MVP Architecture

CronLens can be built as a client-side web app.

Browser
  ├── Cron input component
  ├── Timezone selector
  ├── Dialect selector
  ├── Parser/validator
  ├── Schedule generator
  ├── English translator
  └── Next-runs renderer
Client-Side Benefits
Instant feedback
No server cost for basic usage
No account system required
Better privacy because cron expressions do not need to leave the browser
Easier static deployment
Optional Backend Later

A backend may be useful later for:

Shared saved snippets
Team libraries
Analytics
API access
Platform-specific integrations
Persistent user preferences
24. Component Design
UI Components
CronInput
TimezoneSelect
DialectSelect
RunCountSelect
StartDateTimePicker
SummaryCard
ValidationPanel
NextRunsTable
FieldBreakdown
WarningsPanel
CopyActions
ExamplesPanel
Logic Modules
cronParser
cronValidator
cronTranslator
cronScheduler
timezoneUtils
dstDetector
dialectRegistry
shareUrlEncoder
Dialect Registry

Each dialect can be represented as a configuration object:

type DialectDefinition = {
  id: CronDialect;
  label: string;
  fieldCount: number;
  fields: CronFieldDefinition[];
  supportsSeconds: boolean;
  supportsYear: boolean;
  supportsQuestionMark: boolean;
  supportsLastDay: boolean;
  supportsNearestWeekday: boolean;
  dayOfWeekBase: "zero-or-seven-sunday" | "one-monday" | "custom";
  dayMatchingRule: "or" | "and" | "platform-specific";
};

This allows CronLens to grow without rewriting the core parser.

25. Example States
Empty State
Paste a cron expression to preview upcoming run times.

Try:
0 9 * * 1-5
Valid State
Valid cron expression

At 09:00 every Monday through Friday.
Timezone: Asia/Kolkata.
Invalid State
Invalid cron expression

The hour field contains 25, but hour must be between 0 and 23.
Warning State
Valid cron expression with warnings

This expression restricts both day-of-month and day-of-week. Scheduler behavior may vary by platform.
26. Example Presets

CronLens should include quick examples users can click.

Label	Cron expression	Meaning
Every minute	* * * * *	Every minute
Every 5 minutes	*/5 * * * *	Every 5 minutes
Hourly	0 * * * *	At the start of every hour
Daily at midnight	0 0 * * *	Every day at 00:00
Weekdays at 9 AM	0 9 * * MON-FRI	Monday through Friday at 09:00
Monthly on the 1st	0 0 1 * *	First day of every month
Sundays at noon	0 12 * * SUN	Every Sunday at 12:00
27. Privacy

CronLens should be privacy-friendly by default.

MVP Privacy Principles
No login required.
Cron expressions are processed locally in the browser.
Do not send pasted expressions to a server for the MVP.
Share links should only be generated when the user clicks a share button.
Avoid storing cron history unless explicitly added later.
Analytics

If analytics are used, avoid logging raw cron expressions. Track only generic events such as:

preview_generated
timezone_changed
dialect_changed
copy_clicked
example_selected
28. Performance Requirements

CronLens should feel instant.

Targets
Initial page load should be lightweight.
Parsing should complete immediately for normal expressions.
Preview generation for 10 runs should appear near-instantly.
Input typing should not lag.
Expensive expressions should be bounded by safety limits.
Optimization Notes
Debounce input parsing.
Cache parsed expressions.
Recompute only when expression, timezone, start time, dialect, or count changes.
Use efficient date iteration where possible.
Avoid minute-by-minute scanning for highly sparse schedules if a smarter search strategy is available.
29. Testing Strategy
Unit Tests

Test:

Field parsing
Range parsing
Step parsing
List parsing
Named months
Named weekdays
Invalid values
Field count errors
Plain-English translation
Timezone conversion
DST edge cases
Leap-year schedules
Integration Tests

Test full input-to-preview behavior:

*/5 * * * *
0 9 * * 1-5
0 0 1 * *
0 0 29 2 *
0 9,17 * * MON-FRI
Snapshot Tests

Useful for:

Translation output
Field breakdown output
Warning output
Manual QA Cases
User local timezone
UTC timezone
Asia/Kolkata, which has no daylight saving time
America/New_York, which has daylight saving time
Europe/London, which has daylight saving time
Rare schedules
Invalid syntax
Empty input
Very frequent schedules
30. Success Metrics

CronLens should be measured by usefulness and reuse.

Product Metrics
Number of previews generated
Repeat visits
Copy/share usage
Example preset usage
Time spent on page
Validation error rate
Timezone changes per session
Quality Metrics
Parser accuracy
Translation accuracy
DST warning accuracy
Number of unsupported valid expressions
User-reported incorrect previews
Desired Outcome

A successful MVP is one where users can paste a cron expression, trust the next-run preview, and quickly copy or share the result.

31. Release Plan
Version 0.1 — MVP
Standard 5-field cron support
Timezone selector
Next 10 runs
Plain-English translation
Field breakdown
Validation errors
Basic warnings
Copy results
Version 0.2 — Usability Improvements
Shareable URLs
More example presets
Custom start time
Better mobile UI
More detailed warning messages
Markdown export
Version 0.3 — Dialect Expansion
6-field cron support
Cron nicknames like @daily
Quartz-style syntax
Platform presets
Version 1.0 — Polished Utility
Robust dialect registry
DST-specific explanations
Platform-specific notes
Strong test coverage
Production-ready UI
Optional embeddable widget or public API
32. Open Questions

These should be decided before implementation begins:

Should MVP support only 5-field cron, or also 6-field cron with seconds?
Should Sunday be displayed as both 0 and 7 where supported?
What exact day-of-month/day-of-week matching rule should be used for the default dialect?
Should ambiguous DST times show one run or two?
Should share links encode the cron expression directly in the URL?
Should CronLens include platform presets in MVP or defer them?
Should the preview run entirely client-side?

Recommended MVP answers:

1. Support only 5-field cron first.
2. Support both 0 and 7 as Sunday.
3. Use a clearly documented standard behavior and warn when both fields are restricted.
4. Show DST warnings and make behavior explicit.
5. Yes, but only after user clicks Share.
6. Defer platform presets.
7. Yes, run entirely client-side.
33. Example Final User Experience

User enters:

0 9 * * MON-FRI

Selected timezone:

Asia/Kolkata

CronLens displays:

At 09:00 every Monday through Friday.
Timezone: Asia/Kolkata.

Next runs:

#	Local time	UTC time
1	Thu, Jul 2, 2026, 09:00 IST	Thu, Jul 2, 2026, 03:30 UTC
2	Fri, Jul 3, 2026, 09:00 IST	Fri, Jul 3, 2026, 03:30 UTC
3	Mon, Jul 6, 2026, 09:00 IST	Mon, Jul 6, 2026, 03:30 UTC
4	Tue, Jul 7, 2026, 09:00 IST	Tue, Jul 7, 2026, 03:30 UTC
5	Wed, Jul 8, 2026, 09:00 IST	Wed, Jul 8, 2026, 03:30 UTC

Field breakdown:

Minute: 0 — at minute 0
Hour: 9 — at 09:00
Day of month: * — every day of the month
Month: * — every month
Day of week: MON-FRI — Monday through Friday
34. Design Principle

CronLens should not just say what a cron expression “probably” means.

It should show:

What you wrote.
What it means.
When it will actually run.
Which timezone was used.
What could surprise you.

That combination is what makes CronLens small, trustworthy, and genuinely reusable.