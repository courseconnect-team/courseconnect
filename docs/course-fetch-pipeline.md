# Course Fetch Pipeline

Admin-editable, periodically running pipeline that replaces the standalone
course-scraper script. All runtime code lives inside the existing app —
Cloud Functions do the work, Firestore stores results, and the Next.js admin
UI edits configs.

## What's in this feature

| Layer                       | Path                                            |
| --------------------------- | ----------------------------------------------- |
| Shared types (frontend)     | `src/types/courseFetch.ts`                      |
| Frontend API client         | `src/hooks/useCourseFetch.ts`                   |
| Admin UI                    | `src/app/admin-course-fetch/*`                  |
| Scraper service             | `functions/src/courseFetcher/*`                 |
| UF provider                 | `functions/src/courseFetcher/providers/uf.ts`   |
| HTTPS + scheduled endpoints | `functions/src/courseFetch.ts`                  |
| Firestore rules             | `firestore.rules` (course-fetch block)          |
| Firestore indexes           | `firestore.indexes.json` (course-fetch entries) |
| Tests                       | `functions/src/courseFetcher/__tests__/*`       |

## Data model

Four Firestore collections:

- `courseFetchConfigs/{id}` — admin-managed configs (label, provider, term,
  year, departments, filters, refresh cadence, enabled, status fields).
- `courseFetchConfigs/{id}/runs/{runId}` — one document per fetch attempt
  with status, counts, errors, warnings, and duration.
- `catalog/{courseId}` — normalized scraped courses. Doc id shape is
  `PROVIDER:termCode:CODE`, e.g. `UF:2268:COP3502`.
- `catalog/{courseId}/sections/{sectionId}` — sections under each course.
  Doc id shape is `PROVIDER:termCode:classNumber`, e.g. `UF:2268:11111`.

These collections are separate from the existing `semesters/{name}/courses`
collection used by the Excel-upload flow — no existing data is touched.

Rules: configs and runs are admin-only read; catalog collections are
readable by any authed user. All writes go through Cloud Functions using
the admin SDK, so client writes are denied.

Indexes: `courseFetchConfigs(enabled, nextRefreshAt)` for the scheduler,
`runs(configId, startedAt desc)` for history, `catalog(provider, termCode,
department, code)` for catalog queries, and a collection-group index on
`sections(termCode, courseCode, classNumber)`.

## How to add a new course-fetch config

1. Sign in as an admin.
2. Open **Course Fetch** in the admin sidebar (or navigate to
   `/admin-course-fetch`).
3. Click **New config**, fill in at minimum:
   - **Label** — e.g. `UF Spring CISE + Math`
   - **Provider** — `UF` (only option today)
   - **Term** + **Year** — e.g. `spring 2026`
   - **Departments** (optional) — comma-separated uppercase codes,
     e.g. `CISE, MATH`
   - **Code prefixes** (optional) — e.g. `COP, EEL, MAC`
   - **Refresh** — `Manual only`, `Hourly`, `Daily`, `Weekly`, or
     `Every N hours`
   - **Enabled** — leave off until you've run it once manually
4. Save, click the ▶ **Run now** action, and watch the status chip update.
   Use the 🕒 history button to inspect per-run details.

## How scheduled refresh works

`scheduledCourseFetchRefresh` (Firebase scheduled function) runs every 30
minutes:

1. Load all `courseFetchConfigs` where `enabled == true`.
2. Keep those whose `nextRefreshAt` is unset or `≤ now`.
3. For each, atomically claim a 10-minute `runLeaseUntil` lease in a
   Firestore transaction. A second scheduler firing during the same window
   will see the active lease and skip.
4. Run the same `runAndPersist()` the manual trigger uses. On completion,
   update `lastStatus`, `lastError`, `lastSuccessAt`, and push
   `nextRefreshAt` forward by the configured interval.

The job is idempotent: rerunning it either no-ops (lease held) or
reprocesses the same config, writing the same doc ids with `merge: true`.

## How to add a new school / data provider

1. Create `functions/src/courseFetcher/providers/<name>.ts` that exports
   a `Provider` (`id`, `resolveTermCode`, `fetch`). Keep all provider-
   specific transport and shape logic inside this file.
2. Register it in the `PROVIDERS` map in `functions/src/courseFetcher/pipeline.ts`.
3. Extend the `ProviderId` union in `functions/src/courseFetcher/types.ts`
   and `src/types/courseFetch.ts`.
4. Add the new ID to the allowed providers list in
   `functions/src/courseFetcher/validation.ts`.
5. Add provider-specific options to the admin form if needed.

## UF provider specifics

Modeled directly on `UFCourseGrabber.py` (in the repo root):

- Endpoint: `https://one.uf.edu/apix/soc/schedule/?category=RES&term=<code>&last-control-number=<n>`.
- Term code: `"2" + last-2-of-year + termDigit` where `spring=1, summer=5, fall=8`. Fall 2026 → `2268`.
- Pagination: N parallel workers (N = `concurrency`, 1–16). Worker `i` walks `last-control-number = 50*i, 50*i + 50*N, 50*i + 100*N, …` and stops when its response reports `RETRIEVEDROWS == 0`.
- The endpoint does not accept department or course-code query params, so admin-configured filters are applied post-normalization.
- Section-level metadata fields from the original Python cleaner (`EEP`, `LMS`, `acadCareer`, `addEligible`, `dNote`) are never promoted into the normalized shape, so there's nothing to delete.
- Meeting times are read from `meetTimeBegin` / `meetTimeEnd` (12h `H:MM AM/PM`) and normalized to 24h `HH:MM` when possible; otherwise the raw value is retained.

## Security notes

- No session cookies or API keys are hardcoded. The original Python scraper
  embedded `ONEUF_SESSION` values in source; those have been removed from
  the new pipeline. If UF's endpoint ever requires a cookie, the UF provider
  reads it from `process.env.ONE_UF_COOKIE` at runtime only.
- Admin-only Cloud Functions check `users/{uid}.role === 'admin'` after
  verifying the bearer token. Faculty cannot edit configs.
- Inputs are validated against a strict allowlist (provider enum, term
  enum, regex for department codes and course prefixes, numeric ranges).
  The admin UI does not supply URLs or arbitrary provider parameters —
  the UF provider constructs trusted `https://one.uf.edu/apix/soc/schedule`
  URLs internally.
- The scraper never logs request headers or cookies. Errors only include
  the status code and message.

## Tests

Pure-logic tests (no Firebase credentials required) live at
`functions/src/courseFetcher/__tests__/pipeline.test.ts` and run via Node's
built-in test runner:

```
cd functions
npm install
npm test
```

They cover: term-code mapping, code-space insertion, 24h time
normalization, filter logic, deduplication, course/section finalization,
config validation (including bad inputs), next-refresh computation, and an
end-to-end pipeline run against a stubbed fetcher (success, total-failure,
and non-JSON response paths).
