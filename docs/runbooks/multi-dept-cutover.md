---
title: Multi-Department Cutover Runbook
status: ready
---

# Multi-Department Cutover

Unit 7 of the multi-department support plan. The backfill migration + scoping
rules deploy together in a short pre-announced maintenance window.

Before running any command here, read the whole runbook. Every step has a
rollback path. None are irreversible.

---

## Prerequisites

1. **Baseline rules are deployed.** Your production `firestore.rules`
   should match the file at the repo root (the tight baseline, not the old
   permissive wildcard).
2. **Cloud Functions up to date.** `firebase deploy --only functions`
   has been run with at least `9c83b07` (server-resolves applications
   `departmentIds[]`).
3. **A super admin exists.** Run `npm run bootstrap:super-admin -- --email=you@ufl.edu` if not.
4. **Departments seeded.** Run `npm run seed:departments:dry` then
   `npm run seed:departments` if `departments/ece`, `departments/cise`,
   `departments/mae` don't exist.
5. **`GOOGLE_APPLICATION_CREDENTIALS`** points at your service-account
   key (same credential file used for the other admin-SDK scripts).
6. **Announce the maintenance window** 24 hours in advance via an
   in-app announcement. Target ≤30 minutes; this migration is small.

---

## Step 1 — Dry run the backfill

```powershell
npm run backfill:multidept:dry
```

Expected output:

- One line per user that will be promoted (admins + faculty with a
  resolvable legacy `department` string).
- One line per application whose `departmentIds[]` will be populated
  from its course list.
- One line per research listing whose `departmentId` will be stamped.
- A "no signal" section listing admins/faculty whose legacy
  `department` doesn't resolve to a known department. These need
  manual reconciliation before live execution.

**Review the dry-run output carefully.** Look for:

- Users flagged as "no signal" — open the super admin Users page and
  set their `department` field to a valid code before the live run,
  OR note that they'll need to be assigned via the Departments UI
  after cutover.
- Unexpected updates — if a user appears that shouldn't be promoted,
  check their legacy `role` and `department` fields first.
- Error lines — any write failure during the dry run is a read
  failure; fix credentials before proceeding.

---

## Step 2 — Reconcile no-signal users

For each user flagged in the dry run:

- If they're an active admin/faculty who just has a malformed
  `department` string, fix the string on their `users/{uid}` doc and
  re-run the dry run until no one is flagged.
- If they're inactive / orphan, leave them — they'll retain legacy
  access until the cleanup PR and can be cleaned up manually.

---

## Step 3 — Live backfill

```powershell
npm run backfill:multidept
```

This performs the writes previewed in the dry run. Re-runs are
idempotent — the script skips any user/application/listing whose new
fields already match the derived values.

**Rollback:** the script only adds fields; nothing is deleted. To
undo, unset `users/{uid}.roles`, `adminOfDepartmentIds`,
`facultyOfDepartmentIds`, `departmentIds` manually via the Firebase
Console. In practice the new fields are harmless to leave — the
legacy rules path doesn't read them.

---

## Step 4 — Deploy the scoping rules

Swap the rules file:

```powershell
# Windows PowerShell
Move-Item firestore.rules firestore.rules.baseline
Move-Item firestore.rules.scoped firestore.rules
firebase deploy --only firestore:rules
```

The new rules check `users/{uid}.adminOfDepartmentIds` /
`facultyOfDepartmentIds` / `departmentIds` — fields the migration
just populated. Legacy `role === 'admin'` is still honored as a
transitional fallback so nothing breaks if the backfill missed an
edge case.

---

## Step 5 — Smoke test

Sign in as each role in turn and verify:

- **Super admin:** can see the Departments tab; can archive/unarchive;
  can invite admins/faculty.
- **Department admin (ECE):** can upload xlsx courses (lands in ECE);
  can post ECE announcements; cannot write to CISE data (confirmed
  via browser console — direct Firestore write to a CISE course
  returns permission-denied).
- **Department admin (CISE):** mirror of the ECE test.
- **Faculty:** can view their courses; can create a research listing
  that stamps their department.
- **Student:** can sign up; can submit an application; the
  application doc now carries `departmentIds[]`.
- **Announcements feed** is correct for each role (fix shipped in
  Unit 0 means CISE/MAE users no longer see ECE-only announcements).

---

## Step 6 — Rollback if needed

If anything breaks:

```powershell
# Revert to baseline rules
Move-Item firestore.rules firestore.rules.scoped
Move-Item firestore.rules.baseline firestore.rules
firebase deploy --only firestore:rules
```

Takes ~15 seconds to propagate. The backfilled fields stay on the
user docs — harmless, and they set up the next rules attempt
correctly.

Notify the maintenance channel. Do not re-attempt step 4 until the
root cause is understood.

---

## Follow-up (separate PR, one release later)

- Drop legacy `User.department` field references from all code paths.
- Drop `isLegacyAdmin()` / `isLegacyStaff()` fallbacks from the
  scoping rules.
- Remove the `users/{uid}.role === 'admin'` / `.role === 'faculty'`
  compatibility paths from:
  - `functions/src/roles.ts` canManageFacultyIn
  - `functions/src/invites.ts` callerAdminsDept
  - `src/app/admincourses/page.tsx` (currentUser.legacyDepartment fallback)
  - any remaining `GetUserRole` call sites
- Add CI lint for hardcoded `'ECE'` / `'CISE'` / `'MAE'` strings in
  `src/` outside of the migration + tests.
