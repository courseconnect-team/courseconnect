---
title: 'feat: Announcements overhaul (read state, ack, visibility polish)'
type: feat
status: active
date: 2026-04-18
origin: docs/brainstorms/announcements-overhaul-requirements.md
---

# feat: Announcements overhaul (read state, ack, visibility polish)

## Overview

Rebuild the announcements experience around three fixes: a reliable per-announcement read model, a real acknowledgment flow with sender visibility, and surface-level polish so unread is impossible to miss and bodies render as formatted markdown.

## Problem Frame

The current feature has three compounding issues (see origin: `docs/brainstorms/announcements-overhaul-requirements.md`):

- The top-bar bell has no badge — the `<Badge>` in `src/components/TopBar/TopBar.tsx` is commented out, so only the two similar-looking bell icons change.
- Read state is broken at the source. `src/firebase/util/GetAnnouncementTimestamp.js:29` checks `data.timestamp` but the field written on read is `lastSeenAnnouncementsAt`, so the check never passes and the hook always falls back to "one year ago". Every recent announcement stays "unread" forever.
- `requireAck` is captured in the composer but has no recipient-side action, no sender visibility, and no markdown rendering in the detail view. Pinned items sort first but look identical to unpinned.

## Requirements Trace

- **R1** — Unread is obvious from anywhere: real badge with count on the top-bar bell.
- **R2** — Read state is reliable and per-announcement (not a single global timestamp).
- **R3** — Opening an announcement marks it read; per-row "Mark read/unread" and list-level "Mark all read" work.
- **R4** — `requireAck` is a real flow end-to-end: recipient clicks "I acknowledge"; unacked items stay in Unread even after being opened.
- **R5** — Sender / admin can see which recipients have and have not acknowledged for a given required-ack announcement.
- **R6** — Markdown bodies render as formatted content in the detail view; list preview shows plain text (no raw `**` / `#`).
- **R7** — Pinned announcements are visually distinct in the list (pin icon + tint), not just ordered first.
- **R8** — Composer copy makes the effect of "Require acknowledgment" legible.

## Scope Boundaries

- No search / filter across announcements.
- No edit or delete of existing announcements post-send.
- No email-channel delivery fixes (the `email` checkbox in the composer stays wired through to `channels.email` as today).
- No expiration UX changes (expired items already filter server-side via the existing query).
- No push / OS-level notifications.

### Deferred to Separate Tasks

- Firestore security rules for `announcements` and `users/{uid}/announcementStates` — the repo has no `firestore.rules` file today, so the rule audit is a separate concern and not created by this plan. Noted in Risks.
- Migration of historical `lastSeenAnnouncementsAt` → per-user announcement state. The origin doc deferred this; see Key Technical Decisions for the accepted hard-cutover.

## Context & Research

### Relevant Code and Patterns

- **Announcements data flow**

  - `src/contexts/AnnouncementsContext.tsx` — the single source of truth for the recipient's list. Already partitions into `{read, unread}` using the broken timestamp; this plan replaces that partition with per-announcement state.
  - `src/firebase/util/GetAnnouncementTimestamp.js` — the broken hook; will be removed in the cleanup unit.
  - `src/hooks/Announcements/markAnnouncementAsSeen.ts` — the current global-timestamp marker; will be replaced by per-announcement marker hooks.
  - `src/hooks/Announcements/useFetchAnnouncementById.ts` — already uses React Query (`@tanstack/react-query`); follow this pattern for any new query-based hooks.
  - `src/hooks/Announcements/usePostAnnouncement.ts` — already persists `requireAck`; extend to also snapshot `recipientCount` at send time.
  - `src/hooks/Announcements/useFetchAnnouncements.ts` — secondary fetch hook kept in sync; do not regress.

- **UI surfaces**

  - `src/components/TopBar/TopBar.tsx` — bell lives here; `<Badge>` import site already scaffolded (commented).
  - `src/app/announcements/page.tsx` — list page; runs `markAnnouncementsSeen` on mount (will change behavior).
  - `src/app/announcements/AnnouncementSections.tsx` — splits the list into Unread / Read; target for the "Mark all as read" control and empty state.
  - `src/app/announcements/AnnouncementsRow.tsx` — row presentation; target for pin icon, body-preview plain-text, and the per-row read-toggle affordance.
  - `src/app/announcements/AnnouncementDialogue.tsx` — composer; already captures `requireAck` and markdown body via `src/components/Messagebody/MessageBody.tsx` (which uses `@uiw/react-md-editor`).
  - `src/app/announcements/[id]/page.tsx` — detail route; target for mark-read-on-view and the ack button.
  - `src/components/AnnouncementView/AnnouncementView.tsx` — currently renders body as raw text (`<div className="whitespace-pre-wrap">`); swap in `@uiw/react-markdown-preview`.

- **Tech stack signals**
  - Firebase **compat SDK** (`firebase.firestore().collection(...)` style) — use throughout, do not introduce modular SDK.
  - React Query 5 is the data-fetching pattern of choice (see `useFetchAnnouncementById`, `usePostAnnouncement`).
  - `@uiw/react-markdown-preview@5.1.5` is already a dependency — use it for rendering; do not add a new renderer.
  - MUI 6 + Tailwind 4 coexist; use MUI primitives for interactive controls (`Badge`, `IconButton`, `Menu`) and Tailwind for layout.
  - Firestore indexes live in `firestore.indexes.json`; add the new collection-group index there.

### Institutional Learnings

No `docs/solutions/` directory in this repo. Nothing to draw from.

### External References

Not consulted — local patterns are strong for every layer this plan touches (Firestore compat, React Query, MUI Badge). `@uiw/react-markdown-preview` usage is standard and documented by the same vendor as the existing `@uiw/react-md-editor`.

## Key Technical Decisions

- **Per-(user, announcement) state lives in a per-user subcollection**: `users/{uid}/announcementStates/{announcementId}` with fields `{ announcementId, readAt, ackedAt }`. Rationale: writes go to the user's own doc subtree (no cross-user write contention on the announcement doc); per-user queries are cheap; sender-side ack dashboard uses a collection-group query on `announcementStates` filtered by `announcementId`.
- **Mark-read-on-open writes the state doc with `readAt: serverTimestamp()`**; idempotent via `{ merge: true }`.
- **`ackedAt` implies read**. When a user acknowledges, the same write sets both `readAt` (if absent) and `ackedAt`. "Unread-but-acked" is not a representable state.
- **Unread bucket definition**: an announcement is Unread if either (a) no state doc exists, (b) `readAt` is missing, or (c) `requireAck === true` AND `ackedAt` is missing. This keeps required-ack items in Unread until explicitly acknowledged, even after the detail view has been opened.
- **Recipient count snapshot at send time**: `usePostAnnouncement` writes `recipientCount: number` (and, for `audience.type === 'users'`, a `recipientUids: string[]`) when the announcement is created. This powers the sender panel's "Acknowledged (n/total)" display without a live re-count at view time. Accepted tradeoff: users created after send time who match the audience won't be included in the denominator. Noted as open.
- **Hard cutover on read state**: obsolete `lastSeenAnnouncementsAt` and `GetAnnouncementTimestamp.js` are removed; no backfill. Users see the currently-visible announcements as unread once on first load post-cutover. Acceptable because the broken bug already made "unread" meaningless.
- **Sender-visibility scope**: the ack panel is visible to the announcement's `senderId` and to any user with `role === 'admin'`. Faculty who are not the sender do not see another sender's ack status. Matches the origin-doc default.
- **Badge cap**: counts over 9 display as `9+` via MUI `<Badge max={9}>`.

## Open Questions

### Resolved During Planning

- **Storage shape for per-user read state** (see Key Technical Decisions): per-user subcollection, not a map on the announcement doc.
- **Markdown renderer choice**: reuse `@uiw/react-markdown-preview` (already in deps).
- **Migration strategy**: hard cutover (see Key Technical Decisions).
- **Sender-visibility scope**: sender + admin only (see Key Technical Decisions).
- **Recipient-count approach**: snapshot at send time (see Key Technical Decisions).

### Deferred to Implementation

- Exact helper name(s) for stripping markdown → preview text (`bodyMdToPreview` vs. inlining into `AnnouncementsRow`). Decide while implementing Unit 6.
- Whether the collection-group query for the ack dashboard needs pagination in practice (depends on typical audience size). Default: no pagination in v1; revisit if a sender has >500 acks to render.
- Whether to denormalize `senderId` into `announcementStates` docs to power alternative queries (e.g., "every user's unacked items across all senders"). Default: no — not needed for R1–R8.
- Firestore security rules for the new subcollection — flagged in Risks; not produced by this plan.

## High-Level Technical Design

> _This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce._

### Data shape

    announcements/{announcementId}
      ├── title, bodyMd, pinned, requireAck, ...
      ├── audience, audienceTokens, senderId, senderName
      ├── recipientCount         # NEW — snapshot at send time
      └── recipientUids?         # NEW — only when audience.type === 'users'

    users/{uid}/announcementStates/{announcementId}   # NEW subcollection
      ├── announcementId         # for collection-group queries
      ├── readAt?                # serverTimestamp, set on open / mark-read / ack
      └── ackedAt?               # serverTimestamp, set on explicit acknowledgment

### Partition logic (replacing the broken timestamp compare)

    for each announcement a in visibleAnnouncements:
      state = statesById.get(a.id)
      isRead = state?.readAt != null
      isAcked = state?.ackedAt != null
      bucket = (a.requireAck && !isAcked) ? "unread"
             : isRead ? "read"
             : "unread"

### Read-state transitions per (user, announcement)

    none ──open-detail──▶ read ──mark-unread──▶ unread(state-doc-exists)
      │                    │
      │                  ack-clicked
      │                    ▼
      └──ack-clicked──▶ read+acked (terminal for ack)

### Sender ack dashboard query

    collection-group('announcementStates')
      .where('announcementId', '==', id)
      // returns one doc per user who has touched this announcement
      // count ackedAt != null → "acknowledged"
      // (recipientCount - that count) → "not acknowledged"

## Implementation Units

- [x] **Unit 1: Per-user announcement state model + read hook**

**Goal:** Introduce the per-(user, announcement) state subcollection and a hook that subscribes to it for the current user. Replace the broken timestamp-based read check in the announcements context so the partition uses per-announcement state. No UI changes yet; this unit just makes "read" storable per item.

**Requirements:** R2

**Dependencies:** None

**Files:**

- Create: `src/hooks/Announcements/useAnnouncementStates.ts`
- Create: `src/hooks/Announcements/markAnnouncementState.ts`
- Modify: `src/types/announcement.ts` (add `AnnouncementState` type; add optional `recipientCount`, `recipientUids` fields to `Announcement`)
- Modify: `src/contexts/AnnouncementsContext.tsx` (replace timestamp-based partition with state-based partition; expose `markRead`, `markUnread`, `markAllRead` in the context value)
- Test: `tests/e2e/announcements-read-state.spec.ts`

**Approach:**

- New hook `useAnnouncementStates(uid)` subscribes to `users/{uid}/announcementStates` and returns a `Map<announcementId, AnnouncementState>` plus loading/error. Mirror the subscription pattern already used inside `AnnouncementsContext` (compat SDK, `onSnapshot`, cleanup on unmount).
- New module `markAnnouncementState.ts` exports `markRead(uid, id)`, `markUnread(uid, id)`, `markAck(uid, id)`, `markAllRead(uid, ids[])`. Each uses `set({...}, { merge: true })` with `serverTimestamp()` for the appropriate field. `markUnread` uses `FieldValue.delete()` on `readAt`. `markAck` sets both `readAt` (if absent) and `ackedAt`. `markAllRead` uses a `WriteBatch` and sets `readAt` on each passed id's state doc.
- `AnnouncementsContext` consumes `useAnnouncementStates(user.uid)`, computes `{read, unread}` using the partition rule from High-Level Technical Design, and exposes the mark-\* functions in its value so downstream components don't import the hook directly.

**Patterns to follow:**

- `src/hooks/Announcements/useFetchAnnouncementById.ts` for React-Query-based hooks, but this one is a live subscription, so follow the `onSnapshot` pattern already inside `AnnouncementsContext`.
- `src/hooks/Announcements/markAnnouncementAsSeen.ts` for the `set({...}, { merge: true })` style.

**Test scenarios:**

- Happy path — a signed-in student with two visible announcements and no state docs sees both in Unread; after `markRead` writes for one, the other is still Unread and the marked one moves to Read on the next snapshot tick.
- Happy path — `markAllRead` clears every currently-unread item in a single batched write (verified by observing the Unread list empty after one round-trip).
- Edge case — `markUnread` on a previously read item restores it to Unread (readAt is deleted, ackedAt untouched).
- Edge case — `markAck` on a fresh announcement both marks read and acked; subsequent `markUnread` deletes `readAt` but leaves `ackedAt` intact, and the partition keeps the item in Read because the item no longer meets the unread criteria (it's not requireAck-without-ack; it's already acked).
- Integration — the `AnnouncementsContext` partition reflects writes within one snapshot tick without a page reload.

**Verification:**

- Opening the list for a user with no `announcementStates` docs yields every visible announcement in the Unread bucket. Writing a `readAt` to one of those state docs via the hook moves it to Read on the next snapshot, without touching the announcement documents.

---

- [ ] **Unit 2: Mark-on-detail-view, per-row toggle, and mark-all-read**

**Goal:** Wire the UI to the new mark-\* functions. Opening `/announcements/[id]` auto-marks read. The list shows a "Mark all as read" button above Unread when non-empty. Each row exposes a compact "Mark read" / "Mark unread" action on hover / focus.

**Requirements:** R3

**Dependencies:** Unit 1

**Files:**

- Modify: `src/app/announcements/[id]/page.tsx` (replace the existing `markAnnouncementsSeen` effect with a `markRead(uid, params.id)` effect guarded by `didMarkRef`)
- Modify: `src/app/announcements/AnnouncementSections.tsx` (add "Mark all as read" button; pipe `markAllRead` from the context; add the empty-state "You're all caught up" when there are read items but zero unread)
- Modify: `src/app/announcements/AnnouncementsRow.tsx` (add per-row read-toggle `IconButton` / overflow menu item; accept `onMarkRead` / `onMarkUnread` callbacks as props)
- Test: `tests/e2e/announcements-read-state.spec.ts` (extends the file from Unit 1)

**Approach:**

- Detail page effect: on mount, once user is resolved and the id is known, call `markRead(user.uid, id)` through the context. The existing `didMarkRef` guard prevents double-invoke in Strict Mode.
- List page "Mark all as read" sits above the Unread section header; disabled while there are no unread items. Calls `markAllRead(user.uid, unread.map(a => a.id!))`.
- Row action is a trailing icon that only appears on hover / keyboard focus; it calls the appropriate mark-\* callback. Click on the icon should stopPropagation so the underlying `<Link>` doesn't also navigate.
- Acknowledgment items (`requireAck && !acked`) do NOT allow "Mark read" via the row action — the affordance should be hidden or disabled with a tooltip directing the user to open and acknowledge. Prevents the illusion of clearing a required-ack item without acking.

**Patterns to follow:**

- `src/app/announcements/page.tsx` for the `didMarkRef` + useEffect pattern.
- MUI `IconButton` + `Tooltip` already used in `src/components/TopBar/TopBar.tsx`.

**Test scenarios:**

- Happy path — user clicks an Unread row → lands on the detail page → Back → the row is now under Read on the list.
- Happy path — with three Unread items, user clicks "Mark all as read" → all three move under Read, the button becomes disabled / hidden.
- Edge case — per-row "Mark unread" on a Read item returns it to Unread without navigating away.
- Edge case — on a `requireAck` unread item, the per-row "Mark read" affordance is hidden or disabled; only opening the detail view and clicking "I acknowledge" moves it to Read.
- Error path — network failure on the state write surfaces a toast via `react-hot-toast` (already a dependency) and does not corrupt the optimistic UI (context's snapshot subscription is the ground truth).

**Verification:**

- A student user moves through the list, opens items, toggles per-row state, and uses "Mark all read"; every state change is reflected without a page reload and survives reload.

---

- [ ] **Unit 3: Recipient acknowledgment flow**

**Goal:** Render an "I acknowledge" action on the detail view when `requireAck === true` and the current user has not yet acknowledged. Clicking it writes `ackedAt` (and `readAt` if absent) via the `markAck` helper. Unacknowledged required-ack items stay in the Unread bucket.

**Requirements:** R4

**Dependencies:** Unit 1, Unit 2

**Files:**

- Modify: `src/components/AnnouncementView/AnnouncementView.tsx` (add the ack button and "Acknowledged on {date}" confirmation state)
- Modify: `src/app/announcements/[id]/page.tsx` (pass through the current user's state doc for this id so the view can render the correct ack state)
- Modify: `src/contexts/AnnouncementsContext.tsx` (confirm partition logic from Unit 1 already keeps unacked `requireAck` items in Unread — no further change expected, but verify)
- Test: `tests/e2e/announcements-acknowledgment.spec.ts`

**Approach:**

- `AnnouncementView` accepts an additional prop `state?: AnnouncementState` and a `onAcknowledge: () => Promise<void>` callback. When `announcement.requireAck && !state?.ackedAt`, render a prominent sticky-at-bottom button "I acknowledge". When acked, render "Acknowledged on {formatted date}" in the same slot.
- Keep the button out of the detail view's main reading flow (sticky bottom bar pattern) so long-form content scrolls above it.
- Clicking the button calls `markAck(uid, id)` through the context, awaits the write, and relies on the snapshot listener to update `state` on the next tick.

**Patterns to follow:**

- MUI `Button` with `variant="contained"` and `Stack` sticky footer — consistent with the existing composer's dialog actions.
- Date formatting pattern in `AnnouncementView`'s `formatPostedAt`.

**Test scenarios:**

- Happy path — student receives a `requireAck=true` announcement, opens it, sees "I acknowledge" button; after click, button is replaced with "Acknowledged on ..." and the item leaves the Unread bucket on the list page.
- Edge case — opening a `requireAck=true` item and navigating away without clicking acknowledge leaves the item in Unread (readAt was set, but ackedAt is absent, so partition keeps it in Unread).
- Edge case — opening a non-`requireAck` announcement does not render the button; the detail view looks the same as today plus markdown rendering from Unit 6.
- Error path — ack write fails (simulated offline) → toast surfaces, button remains in "not yet acked" state; retry succeeds.
- Integration — the bell badge count (Unit 5) correctly excludes non-requireAck read items but includes unacked requireAck items even after they've been opened.

**Verification:**

- Unacknowledged `requireAck` items remain in Unread on the list and keep contributing to the bell badge until the user clicks "I acknowledge".

---

- [ ] **Unit 4: Sender-side ack dashboard**

**Goal:** When the viewer is the sender of a `requireAck` announcement (or an admin), show a panel on the detail view listing how many people have acknowledged and expanding to show who has and hasn't.

**Requirements:** R5

**Dependencies:** Unit 1, Unit 3

**Files:**

- Modify: `src/hooks/Announcements/usePostAnnouncement.ts` (snapshot `recipientCount`; for `audience.type === 'users'`, also persist `recipientUids`)
- Create: `src/hooks/Announcements/useAckSummary.ts` (hook returning `{ ackedUsers, pendingUsers, total }` for a given announcement id)
- Create: `src/components/AnnouncementView/AckPanel.tsx` (sender-visibility panel; collapsible)
- Modify: `src/components/AnnouncementView/AnnouncementView.tsx` (render the panel when viewer is sender or admin AND `announcement.requireAck`)
- Modify: `firestore.indexes.json` (add collection-group index on `announcementStates` for `announcementId` + `ackedAt`)
- Test: `tests/e2e/announcements-acknowledgment.spec.ts` (extends the file from Unit 3 with sender-side flow)

**Approach:**

- `usePostAnnouncement`: extend the write payload with `recipientCount` derived from the audience tokens at send time. Three cases:
  - `audience.type === 'users'` → `recipientCount = audience.emails.length`, also store `recipientUids: string[]` by resolving emails to uids via a one-shot `users` query (follow the existing `users` collection lookup style in `functions/src/index.ts`).
  - `audience.type === 'roles' | 'departments'` → query the `users` collection with matching `role` / `department` field filter, use `.count().get()` (Firestore aggregate query), store the integer only (no uid list — too many).
  - `audience.type === 'all'` → `.count().get()` on the full `users` collection.
- `useAckSummary(id)` uses a collection-group query:
  `firebase.firestore().collectionGroup('announcementStates').where('announcementId', '==', id)`.
  Returns state docs. Cross-reference each with the `users` collection (single batched `in` query on uid) to pull display names. `ackedUsers` = those with `ackedAt != null`; `pendingUsers` = `recipientCount - ackedUsers.length` (or, when `recipientUids` is available, the set difference showing names).
- `AckPanel`: renders "Acknowledged ({ackedUsers.length}/{total})" header. Expands to two lists — acknowledged (names + dates) and pending (names only, when derivable).
- Index: add composite index in `firestore.indexes.json` under `indexes[]`:
  ```
  { "collectionGroup": "announcementStates", "queryScope": "COLLECTION_GROUP",
    "fields": [{ "fieldPath": "announcementId", "order": "ASCENDING" },
               { "fieldPath": "ackedAt", "order": "ASCENDING" }] }
  ```

**Patterns to follow:**

- `src/hooks/Announcements/useFetchAnnouncements.ts` for React-Query usage.
- `src/components/AnnouncementView/AnnouncementView.tsx` for the containing layout of collapsible sections.
- The `users` collection query style already used in `functions/src/index.ts` (`db.collection('users').doc(uid).get()`).

**Test scenarios:**

- Happy path (sender) — faculty sends a `requireAck=true` announcement to 3 students → opens the detail view → sees "Acknowledged (0/3)" → one student acks → faculty's panel updates to "Acknowledged (1/3)" on the next snapshot tick without reload.
- Happy path (admin) — admin opens any `requireAck` announcement (not sent by them) and sees the same panel.
- Edge case — non-sender, non-admin faculty opens a `requireAck` announcement they did not send and sees no panel at all.
- Edge case — audience is `all` with 500 users; panel header shows the correct total from the snapshot `recipientCount`, expanded list shows only the acked names (pending names are not listed when `recipientUids` is absent).
- Error path — the collection-group query fails (missing index) → panel surfaces an inline error with a "Retry" action; does not crash the detail view.
- Integration — snapshot-at-send-time `recipientCount` does NOT change when new users sign up after send; accepted tradeoff.

**Verification:**

- A sender views their own `requireAck` announcement and sees an accurate, live-updating ack count. An admin sees the same for any `requireAck` announcement. Other faculty do not see the panel for announcements they did not send.

---

- [ ] **Unit 5: Top-bar bell badge with count**

**Goal:** Replace the icon-swap with a real badge showing the unread count. Cap display at `9+`.

**Requirements:** R1

**Dependencies:** Unit 1

**Files:**

- Modify: `src/components/TopBar/TopBar.tsx`

**Approach:**

- Keep the `Link` routing to `/announcements`.
- Use MUI `<Badge badgeContent={unread.length} color="error" max={9} overlap="circular">` wrapping a single consistent bell icon (prefer `NotificationsNoneOutlinedIcon` for the neutral look; drop the icon swap).
- Hide the badge when `unread.length === 0` via `invisible={unread.length === 0}` (avoids a lingering dot at zero).

**Patterns to follow:**

- The commented-out `<Badge>` scaffolding already in `TopBar.tsx` shows the intended integration point.

**Test scenarios:**

- Happy path — user with 3 unread sees `3` on the bell from any page (dashboard, profile, announcements list itself).
- Happy path — user with 12 unread sees `9+` on the bell.
- Edge case — user with 0 unread sees no badge.
- Integration — after clicking a row and opening the detail view (Unit 2 marks it read), the bell decrements on the next snapshot tick.
- Integration — after "Mark all as read" (Unit 2), the bell drops to 0 and the badge disappears.

**Verification:**

- The bell badge count equals `unread.length` from the `AnnouncementsContext` at all times and updates live.

---

- [ ] **Unit 6: Presentation polish (pin, markdown rendering, preview snippet, composer copy)**

**Goal:** Make the list scannable and the detail view legible. Pinned rows get a pin icon and a subtle tint. Row body previews show plain text derived from the markdown. The detail view renders markdown as formatted content. The composer's requireAck checkbox has a helper string.

**Requirements:** R6, R7, R8

**Dependencies:** Unit 1 (for pinned info on the row) — independent of 2/3/4 otherwise

**Files:**

- Create: `src/firebase/util/markdownToPreview.ts` (plain-text extractor; strips markdown formatting characters conservatively)
- Modify: `src/app/announcements/AnnouncementsRow.tsx` (render pin icon for `pinned === true`; tint with a subtle Tailwind class; swap `{body}` for `markdownToPreview(body)`; accept a `pinned` prop from the parent)
- Modify: `src/app/announcements/AnnouncementSections.tsx` (pass `pinned` through to `AnnouncementsRow`)
- Modify: `src/components/AnnouncementView/AnnouncementView.tsx` (replace the `<div className="whitespace-pre-wrap">` body with `<MDPreview source={announcement.bodyMd} />` from `@uiw/react-markdown-preview`; wrap with `data-color-mode="light"` like the editor does)
- Modify: `src/app/announcements/AnnouncementDialogue.tsx` (add helper text under the "Require acknowledgment" `FormControlLabel`: "Recipients will be asked to explicitly acknowledge this announcement.")
- Test: `tests/e2e/announcements-visual.spec.ts`

**Approach:**

- `markdownToPreview`: a small utility that strips the handful of formatting characters the composer produces (`**bold**`, `_italic_`, `# headings`, `- lists`, `[link](url)` → keep the text). Keep it narrow — not a full markdown parser, just enough to avoid raw `**` in the row preview. Document in a comment that the source-of-truth rendering happens in the detail view.
- Pin icon: use `@mui/icons-material/PushPin` at a size matching the sender avatar. Place it adjacent to the title. Tint: a subtle `bg-amber-50` on the row container for pinned items, preserved through hover.
- Markdown rendering: `@uiw/react-markdown-preview` accepts a `source` prop. Import as `import MDPreview from '@uiw/react-markdown-preview';`. Constrain with the existing Tailwind typographic classes in the detail view.
- Composer helper: add a `<FormHelperText>` (MUI) under the requireAck `FormControlLabel`. Keep copy to one short sentence.

**Patterns to follow:**

- `src/components/Messagebody/MessageBody.tsx` for `data-color-mode="light"` wrapping on `@uiw/*` components.
- Tailwind utility class usage already present throughout `src/app/announcements/*`.

**Test scenarios:**

- Happy path — a pinned announcement displays a pin icon and a visibly distinct row background; sort order remains pinned-first.
- Happy path — row preview of a body that starts with `## Heads up — **important**` shows "Heads up — important", not raw markdown.
- Happy path — detail view of the same body renders "Heads up — important" with an H2 and a bold span.
- Edge case — empty body renders an empty preview and an empty detail without errors.
- Edge case — body with a code block (` ```ts `) renders as code in the detail view and as plain text in the preview.
- Integration — composer with "Require acknowledgment" checked shows the helper sentence below the checkbox.

**Verification:**

- Pinned items stand out at a glance. Previews are legible. Detail view renders markdown. Composer conveys the effect of the ack checkbox.

---

- [ ] **Unit 7: Firestore indexes and rules note**

**Goal:** Update `firestore.indexes.json` to include the collection-group index used by the ack dashboard. Document (not create) the gap in Firestore security rules.

**Requirements:** R5 (index only)

**Dependencies:** Unit 4

**Files:**

- Modify: `firestore.indexes.json`
- Modify: `docs/plans/2026-04-18-001-feat-announcements-overhaul-plan.md` (no code change — leave a Risks note only; the actual rules file is out of scope for this plan)

**Approach:**

- Add the `announcementStates` collection-group index described in Unit 4 to the `indexes` array in `firestore.indexes.json`. Leave `fieldOverrides` untouched.
- Flag in the Risks section that `firestore.rules` is absent and that a separate task should define rules covering: `announcements` (read if user matches audience; write only if `senderId === request.auth.uid` or admin); `users/{uid}/announcementStates/{*}` (read/write only when `request.auth.uid === uid`, except collection-group reads for ack dashboard, which need a separate allow rule scoped to sender/admin).

**Patterns to follow:**

- The existing entries in `firestore.indexes.json`.

**Test scenarios:**

- Test expectation: none — this is pure configuration. Verify via the ack-dashboard E2E from Unit 4 succeeding without a "missing index" console error in a staging / emulated Firestore.

**Verification:**

- `firebase deploy --only firestore:indexes` runs clean against the updated config, and Unit 4's ack dashboard query returns results without an index-needed error.

---

- [ ] **Unit 8: Remove obsolete timestamp hook**

**Goal:** Delete the broken `GetAnnouncementTimestamp.js` and the now-unused `markAnnouncementAsSeen.ts`. Ensure nothing still imports them.

**Requirements:** R2

**Dependencies:** Units 1, 2, 3 (every caller must be migrated first)

**Files:**

- Delete: `src/firebase/util/GetAnnouncementTimestamp.js`
- Delete: `src/hooks/Announcements/markAnnouncementAsSeen.ts`
- Modify: any remaining importers (sweep before delete — origin list: `src/contexts/AnnouncementsContext.tsx`, `src/app/announcements/page.tsx`)

**Approach:**

- Grep the repo for the module names and the `lastSeenAnnouncementsAt` field. Remove every reference. Leave the `users` document field orphaned (no cleanup needed; hard cutover per Key Technical Decisions).

**Patterns to follow:**

- Straightforward deletion.

**Test scenarios:**

- Test expectation: none — this is cleanup. Full E2E suites from Units 2–4 continue to pass after the files are removed.

**Verification:**

- `grep -r GetAnnouncementTimestamp src` returns nothing. `grep -r markAnnouncementsSeen src` returns nothing. `grep -r lastSeenAnnouncementsAt src` returns nothing. Build passes.

## System-Wide Impact

- **Interaction graph:** The `AnnouncementsContext` becomes the hub for all read/ack state. The TopBar, the list page, the detail page, and the composer all depend on it. Changes to the context's value shape are the highest-blast-radius change in this plan — Unit 1 must land before anything else consumes the new shape.
- **Error propagation:** State writes use Firestore's built-in retry. Surface failures via `react-hot-toast`. The snapshot listener is the source of truth; optimistic UI is not used (context re-renders on snapshot).
- **State lifecycle risks:** Partial writes on `markAllRead` — if a batch fails mid-way, some items will be marked and others not. Acceptable because the batch is idempotent; the user can retry and already-marked items are no-ops.
- **API surface parity:** The `Announcement` type gains optional `recipientCount` and `recipientUids` fields. Non-breaking for existing consumers because they're optional. The context's value shape gains `markRead`, `markUnread`, `markAllRead` — anything consuming the context must not destructure unknown keys strictly.
- **Integration coverage:** E2E tests in `tests/e2e/announcements-*.spec.ts` cover cross-layer flows (Firestore write → snapshot → UI partition). Unit tests are not introduced because the repo has no unit test framework today (Playwright E2E only); this is flagged in Risks.
- **Unchanged invariants:** `audienceTokens` partitioning, `dispatchStatus` filtering, `pinned`/`createdAt` ordering, the composer's persistence path, and the email channel flag all remain unchanged.

## Risks & Dependencies

| Risk                                                                                                              | Mitigation                                                                                                                                                                                               |
| ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No `firestore.rules` file exists in the repo — all changes rely on whatever default / console rules are in place. | Out of scope for this plan; flagged as a Deferred-to-Separate-Tasks item. Document the minimum rule set needed (see Unit 7).                                                                             |
| Unit test coverage is not available; only Playwright E2E exists.                                                  | Each feature-bearing unit enumerates E2E scenarios. Accept the cost of heavier integration tests instead of fast unit tests.                                                                             |
| Collection-group query cost scales with audience size for the ack dashboard.                                      | For v1, no pagination; acceptable at department scale. Flagged as deferred (see Open Questions).                                                                                                         |
| `recipientCount` snapshot drifts from reality as users join post-send.                                            | Accepted tradeoff; documented. Admins can see the drift by expanding the panel and comparing listed acked names to the live `users` collection if needed.                                                |
| Hard cutover means users will briefly see everything as "unread" after deploy.                                    | Acceptable because the current state is already effectively "everything is unread forever." Communicate in release notes if desired.                                                                     |
| Concurrent tabs writing the same state doc.                                                                       | Firestore's last-write-wins with `{ merge: true }` is safe; `serverTimestamp()` avoids client-clock drift.                                                                                               |
| Removing `markAnnouncementAsSeen.ts` while a deployed client is still running mid-session.                        | Non-issue in practice — the deleted code path only fired on list mount; stale tabs continue to function because the new hook is subscription-based and the old code simply stops running on next reload. |

## Documentation / Operational Notes

- Update the announcements section of any onboarding or README once the feature ships (no `README.md` / `ONBOARDING.md` updates appear necessary from the current repo scan; verify at execution time).
- After deploy, run `firebase deploy --only firestore:indexes` to apply the new collection-group index.
- Release-note the "your inbox will look fresh for a moment" cutover so support isn't surprised.

## Sources & References

- **Origin document:** `docs/brainstorms/announcements-overhaul-requirements.md`
- Related code:
  - `src/contexts/AnnouncementsContext.tsx`
  - `src/components/TopBar/TopBar.tsx`
  - `src/firebase/util/GetAnnouncementTimestamp.js` (to be removed)
  - `src/hooks/Announcements/markAnnouncementAsSeen.ts` (to be removed)
  - `src/hooks/Announcements/usePostAnnouncement.ts`
  - `src/hooks/Announcements/useFetchAnnouncementById.ts`
  - `src/app/announcements/page.tsx`
  - `src/app/announcements/[id]/page.tsx`
  - `src/app/announcements/AnnouncementSections.tsx`
  - `src/app/announcements/AnnouncementsRow.tsx`
  - `src/app/announcements/AnnouncementDialogue.tsx`
  - `src/components/AnnouncementView/AnnouncementView.tsx`
  - `src/components/Messagebody/MessageBody.tsx`
  - `src/types/announcement.ts`
  - `firestore.indexes.json`
- Related PRs / issues: none tracked in repo.
- External docs: `@uiw/react-markdown-preview` (already a dependency at 5.1.5).
