# Multi-Department Support — Requirements

**Date:** 2026-04-18
**Status:** Ready for planning

## Problem

Course Connect was built around a single, implicit department and that assumption leaks through the codebase. Three departments (ECE, CISE, MAE) use the app today and 1–2 more are in active conversation about onboarding. The system needs to support adding departments without engineering intervention before those conversations convert. Onboarding a new department today is blocked in three ways:

1. **Department is a free-form string, not an entity.** It appears on users, courses, applications, research, and announcements (`src/types/User.ts:7`, `src/types/research.ts:41`, etc.) with no canonical source. The announcements type hardcodes the full list as `'ECE' | 'CISE' | 'MAE'` in `src/types/announcement.ts:2`, and the admin courses page defaults new rows to `department: 'ECE'` (`src/app/admincourses/page.tsx:281`). A new department can't be added without code changes.
2. **Admin authority is not scoped.** The role enum in `src/types/User.ts` has `admin` with no department attached, so an admin today is effectively global. There is no role above admin, so there's no one who can legitimately spin up a new department, assign its first admin, or see cross-department state.
3. **No onboarding path.** There is no UI, script, or workflow for "stand up a new department" — creating the department record, seeding its first admin, importing its courses, inviting its faculty — so each new department would require engineering work.

## Goals

- Make **department a first-class entity**: departments are created, named, and managed through the app, not through code edits or string conventions.
- Introduce a **super admin** role that is the only role capable of creating departments and assigning their first admin.
- Scope **admin authority to a single department** so a CISE admin cannot manage ECE courses, users, or applications. Multi-department admin is explicitly out of scope for this pass; faculty joint appointments remain supported.
- Keep users, research, and announcements working across departments the way they do today — single account, cross-department research visibility, announcements targetable across or within departments.
- Make **onboarding a new department** a repeatable, self-service flow: super admin creates the department and invites an admin; the admin finishes setup (courses, faculty, defaults) using flows that already exist.
- Migrate existing ECE/CISE/MAE data into the new model with **no user-visible disruption** — no re-signup, no lost applications or announcements.

## Non-goals (this pass)

- Multi-institution / multi-university tenancy. UF remains the only institution; "department" is the tenant boundary. (An institution layer can be added later if needed, but is not designed for now.)
- Custom branding, domains, or theming per department.
- Per-department billing, quotas, or usage limits.
- SSO, SAML, or institution-specific identity providers.
- Department-level feature flags (departments all run the same feature set).
- Permission-based / capability-based access control. Role-based access with department scoping is sufficient.
- Audit log UI for super admin actions (the underlying writes may be captured, but no browsing UI this pass).

## Tenancy model

**Tenant = department.** Every piece of department-owned data (course, application, faculty-stats row, department-scoped announcement) belongs to exactly one department and is accessed only by users with a role in that department (plus super admins).

**User accounts are global.** A student signs up once with their UF email and can apply to positions in any department they qualify for. Faculty can hold roles in multiple departments (joint appointments). Admins are scoped to exactly one department this pass. The `department` field on `User` is replaced by per-(user, department) role assignments.

**Cross-department scope rules:**

| Resource          | Scope                                                                                                                                                                 |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User account      | Global (one account, used everywhere)                                                                                                                                 |
| Role assignment   | Faculty: per department, multi-department allowed. Admin: per department, single-department this pass. Student: global (application-level status is per application). |
| Courses           | Department-owned                                                                                                                                                      |
| Applications      | Department-owned (tied to a department's course/position)                                                                                                             |
| Faculty stats     | Department-owned                                                                                                                                                      |
| Research listings | **Read:** any authenticated user, university-wide. **Write** (create, edit, archive): faculty/admin of the owning department + super admin.                           |
| Announcements     | Super admin can target one, many, or all departments; department admins can only target their own                                                                     |

## Roles

The role enum is replaced with a small, fixed set of role types:

- `super_admin` — global, no department. Can create/rename/archive departments, assign any role in any department, view anything. There is always at least one super admin (seeded at migration).
- `admin` — exactly one department. A user holds at most one admin role. Everything a department admin does today (manage courses, review applications, post announcements into their department, invite faculty).
- `faculty` — per department. A user can hold faculty in multiple departments (joint appointments). Unchanged behavior within each department.
- `student` — global, unscoped. A user becomes a `student` the moment they start any application. There are no per-department sub-states on the user role.
- `unapproved` — global; user has signed up but has no other role yet.

**Application status is per-application, not per-role.** The existing `student_applying`, `student_applied`, `student_accepted`, and `student_denied` sub-states on `User.role` are replaced with a `status` field on each application document. A student with an accepted CISE application and an in-progress ECE application has two application rows, each carrying its own status independently. This removes the "what state is this user in?" ambiguity the old enum created when a student had multiple active applications.

Planning picks the storage shape for role assignments (array on user, subcollection, separate collection) — the brainstorm only commits to the semantic above.

## Super admin model

- Super admin is a separate role type, not a flag layered on admin. This keeps permission checks readable (`role === 'super_admin'` vs. inspecting nested flags).
- Bootstrapping: a one-time migration seeds the initial super admin(s) from a configured allowlist (env var or migration script input). After bootstrap, additional super admins can only be promoted by an existing super admin.
- Super admins see a **Departments** management area not visible to anyone else: list of departments, create/rename/archive, manage admins per department.
- Super admins can **read-only preview** any department admin's dashboard — the department admin's views render with their scoped data, but the preview is strictly non-mutating. Writes from the preview view are rejected by both the UI and Firestore rules. A clear banner (or equivalent) marks the session as "previewing as [admin] in [department]" with an explicit exit control. Audit-logged write-through impersonation is out of scope (audit-log UI is a non-goal).

## Department entity

A department has, at minimum:

- A stable id (used everywhere that previously used the department string).
- A short code (e.g., `CISE`, `ECE`, `MAE`) used in UI and in generated course codes. Codes must be uppercase A–Z only, 2–6 characters, and unique across active and archived departments (codes are never reused).
- A human-readable name (e.g., "Computer and Information Sciences and Engineering"), 1–120 characters.
- A status: `active` | `archived`.
- Timestamps for created / archived.

**Archival behavior (decided):**

- Archived departments are **hidden** from new-application pickers, faculty invite flows, and any "pick a department" UI shown to students.
- Archived departments remain listed (with a clear visual marker) in the super admin's Departments area and the admin's own historical dashboards.
- Admin roles in an archived department are **suspended**: the admin loses the admin navigation for that department but retains read-only access to their historical data. Faculty roles are preserved read-only — faculty can still view historical courses and applications they owned.
- Students keep visibility into their own historical applications to archived departments.
- Announcements are not delivered to newly-created recipients after archival; historical announcements remain visible to their original recipients.
- Archival is reversible: a super admin can un-archive, which restores active-department behavior.

Any other per-department configuration (default announcement channels, application form variations, custom branding, etc.) is explicitly **out of scope** for this pass.

## Onboarding flow

"Onboard a new department" is a two-step collaboration:

**Super admin (one screen):**

1. Open **Departments → New department**.
2. Enter code, name, and the email of the first department admin.
3. Submit. The department is created in `active` status and a Cloud Function dispatches an invite email via the existing nodemailer setup (`functions/src/nodemailer.ts`).

**New department admin (self-service):**

4. Accept the invite, sign in (or sign up if new). Lands on their department's admin dashboard, now scoped to the new department.
5. Import courses via the existing xlsx upload flow (`src/app/admincourses`).
6. Invite faculty by email; inviting grants the `faculty` role scoped to this department.
7. Optionally post a welcome announcement scoped to the department.

After step 3, the super admin is done; the department functions exactly like an existing one. No code changes, no config files.

### Invite links (admin and faculty)

All invite links (super admin → new dept admin, dept admin → faculty) share the same security contract:

- **TTL:** 72 hours from dispatch. Expired links show a clear "invite expired — ask your admin to resend" page.
- **Single-use:** consumed on first successful acceptance. Subsequent clicks show an "already accepted" page.
- **Email-bound:** the invite is tied to the invited email address. Accepting with a Firebase Auth account whose email does not match is rejected with a clear message.
- **Existing-account handling:** if the invited email already has an account, acceptance adds the new role to that account without creating a duplicate. If the account is currently `unapproved` or holds a different role, the new role is added alongside (for faculty) or the admin role is granted if the user holds no admin role yet.
- **State tracking:** invites are stored with state `pending | accepted | expired | revoked`. The inviting party can see outstanding invites and resend or revoke from their admin view.
- **Archived-department guard:** if the department is archived between invite dispatch and acceptance, the link is rejected with a clear message.

Planning decides whether invites use Firebase Auth's email-link sign-in (which solves TTL/verification natively) or a custom token scheme dispatched by the Cloud Function. Either satisfies the contract above.

## Prerequisite: Firestore security rules baseline

This project does not currently ship a `firestore.rules` file, and `firebase.json` does not reference one — production access is enforced by client code only. Department scoping is load-bearing on server-side rules (any authenticated client can otherwise read any department's data directly). Before the department work ships:

1. Author a baseline `firestore.rules` that replicates today's de-facto access (authenticated read/write, no cross-user constraints) and wire it into `firebase.json`.
2. Audit every client write path (admincourses, applications, announcements, research) for the fields any new rule will demand.
3. Deploy the baseline rules and confirm no regression in production flows.
4. Only then layer department-scoping rules on top: dept-scoped reads/writes for courses/applications/faculty-stats, university-wide read + department-scoped write for research, role-assignment visibility limited to the owning user + that user's dept admin + super admin.

Skipping this prerequisite means the first department-scoping rules ship into a codebase that has never been written to pass rules checks, breaking the "no user-visible disruption" goal.

## Migration

Ship the following with the first release, in this order:

1. **Create department records** for `ECE`, `CISE`, and `MAE` with the canonical codes and names already in use in the codebase (e.g., `'Computer and Information Sciences and Engineering'` for CISE, per `src/constants/research.ts`).
2. **Backfill the `department` field** on every existing course, application, research listing, and announcement to the new department id. Applications inherit their course's department; research listings inherit their author's department; announcements inherit from their historical audienceTokens.
3. **Backfill users to a primary department** using, in order: (a) their most-recent application's department, (b) their most-recent faculty-authored content (courses, faculty-stats, research), (c) their existing `User.department` string if it maps cleanly to ECE/CISE/MAE. Users with no signal (unapproved accounts, orphaned faculty) are listed in a pre-cutover reconciliation report for the super admin to assign manually before the migration is declared complete. No silent drops.
4. **Seed the initial super admin(s)** from a configured allowlist (env var or migration input). No existing user is auto-promoted unless explicitly listed.
5. **Promote existing admins** to single-department `admin` in the department their historical records indicate.
6. **Deprecate the hardcoded department strings:** the union in `src/types/announcement.ts`, the `'ECE'` default in `src/app/admincourses/page.tsx:281`, the `userDepartment = 'ECE'` assignment in `src/contexts/AnnouncementsContext.tsx` (currently mis-targets every CISE and MAE user as ECE), and the `['ECE', 'CISE', 'MAE']` default list in `src/app/announcements/AnnouncementDialogue.tsx`. Each is replaced with values fetched from the departments collection.
7. **Rewrite `audienceTokens` on every existing announcement.** The announcements composite index is keyed on `audienceTokens`; moving department identity from short-code strings to department ids requires a backfill pass that rewrites `dept:<code>` tokens to the chosen final format (decided in planning). Historical announcements must remain visible to their original audience after the rewrite.
8. **Keep `User.department` as a read-only denormalized mirror for one release cycle** after the migration: no new code writes it, existing reads degrade gracefully, and a follow-up removal PR deletes it after the release is stable. This provides a safe rollback window.

The migration is a one-time script. Rollback strategy, exact query shapes, and a document-count budget (batch vs streaming execution) are planning concerns.

## User stories

**Super admin**

- I see a **Departments** tab in the navigation that no one else sees.
- I can create a new department with a code, name, and first-admin email, and the admin receives an invite.
- I can list all departments, archive one, and rename one.
- I can view application counts, course counts, and active user counts per department at a glance.
- I can post an announcement that targets any subset of departments — one, many, or all.

**Department admin**

- My admin views (courses, applications, users, announcements) show only data from my department. I admin exactly one department, so there is no department picker.
- When I import courses via xlsx, every row is automatically attached to my department — I don't have to (and can't) set a department column. The upload UI displays the target department clearly before committing.
- When I post an announcement, the audience picker only lists my department.
- I can invite faculty by email; they get `faculty` in my department only. I can see outstanding invites and resend or revoke them before they're accepted.

**Faculty**

- My course list shows the union of courses across every department where I hold a faculty role. Each course is labeled with its department.
- I can only review applications for courses in my department(s).
- I can create, edit, and archive research listings owned by my department(s). All students see the listing university-wide.

**Student**

- Sign-up is unchanged: one UF email, one account.
- When I apply for a position, the application is attached to the department that owns that course and has its own `status` (applying, applied, accepted, denied). My application history shows all my applications across departments in one list, each labeled with its department and status.
- Research listings are unchanged — I browse all listings university-wide. I cannot edit listings I don't own.
- Announcements I receive: from every department where I have an application (past or present), plus any cross-department announcement a super admin sends. `unapproved` users with no application history see only super-admin cross-department announcements until they apply somewhere.

## Success criteria

This work is done when:

1. A super admin can create a new department via a single form in the Departments UI (code, name, first-admin email) without any engineering involvement. The new admin receives their invite email in the normal expected delivery window for UF email infrastructure.
2. After migration: every existing course, application, research listing, and announcement is attached to `ECE`, `CISE`, or `MAE`; every existing user with any department signal is attached to a primary department; users with no signal are reconciled manually before cutover, never silently dropped. No existing flow regresses (confirmed by smoke-test of each role's dashboard).
3. No code path branches on a specific department code: renaming or archiving any seeded department via the Departments UI does not break any other department's flows. A CI lint additionally verifies that hardcoded `'ECE'` / `'CISE'` / `'MAE'` references in `src/` appear only in the migration script and tests.
4. A department admin attempting to access another department's data (by URL, by id guess, or by forging a request) is blocked by both UI routing and Firestore security rules.
5. The super admin Departments area lists "who admins this department" and, from the user-directory view, "what roles does this user hold in which departments" without ad-hoc queries.
6. Read-only preview of a department admin's dashboard by a super admin cannot perform any write — writes are rejected by both UI and rules — and the preview state is visually unambiguous.

## Open questions for planning

These are implementation questions deliberately deferred:

- Exact Firestore layout: `departments` collection + denormalized `departmentId` on each record, vs. subcollections under `departments/{id}`. Cross-department queries (super-admin announcements, student global application history, research) and the role-assignment read pattern should drive the choice.
- Exact storage shape for role assignments: array on user, subcollection, or separate `roles` collection. A call-site audit of current `role ===` checks (admincourses, announcements, Research, applications, useSemesterData, etc.) should inform the choice, since the chosen shape will be read by all of them.
- Whether `audienceTokens` after migration key on department id (`dept:<id>`) or short code (`dept:<code>`). Id-keyed survives rename; code-keyed stays human-readable and requires rewriting tokens on department rename.
- Whether to adopt Firebase custom claims for the most-frequently-read role flags (super_admin, dept admin) to avoid a Firestore lookup on every security rule evaluation.
- Whether invite emails use Firebase Auth's email-link sign-in (simpler TTL/verification) or custom tokens dispatched via the existing nodemailer Cloud Function. Both can satisfy the invite-link contract above.
- Super admin audience-picker shape for cross-department announcements: explicit multi-select vs. all/subset toggle, and the exact token emitted for "all departments" (a literal `all` token vs. an expanded set of dept tokens).
- Pre-cutover reconciliation UI for users with no department signal — is it a simple report the super admin reads, or a small assign-in-place view?

## Super admin cross-department announcement — acceptance rules

Kept in scope per decision. Planning resolves the implementation details, but the product behavior is:

- The audience picker is available only to super admins. Department admins see their own department only.
- Selecting zero departments is a validation error.
- Selecting "all departments" emits an audience that matches every active department at dispatch time.
- If a targeted department is archived between schedule and dispatch, the announcement still dispatches to the audience snapshot taken at schedule time (archival does not silently drop recipients).
- Recipient-count and reach telemetry are captured on the announcement as they are today.
