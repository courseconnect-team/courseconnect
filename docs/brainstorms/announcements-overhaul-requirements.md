# Announcements Overhaul — Requirements

**Date:** 2026-04-18
**Status:** Ready for planning

## Problem

The announcements feature has three compounding issues that together make it hard to trust:

1. **Unread is invisible.** The top-bar bell swaps between two similar icons when there's unread, but no badge or count is rendered (the `<Badge>` is commented out in `src/components/TopBar/TopBar.tsx`). Users don't notice new announcements.
2. **Read receipts don't work.** `src/firebase/util/GetAnnouncementTimestamp.js:29` checks `data.timestamp` but the field written on read is `lastSeenAnnouncementsAt`. The condition is never true, so the hook always falls back to "one year ago" and every recent announcement stays "unread" forever — regardless of whether the user has visited the page.
3. **The whole flow feels clunky.** `requireAck` is captured in the composer but never surfaced to recipients or senders. Body content is stored as markdown but rendered as raw characters. Pinned items sort to the top but look identical to unpinned ones. There's no way to mark a single row read/unread or clear all unread.

## Goals

- New announcements are obvious at a glance from anywhere in the app.
- Read state reflects what the user has actually seen — reliably, per announcement.
- `requireAck` becomes a real end-to-end feature (recipient action + sender visibility).
- The list is scannable: pinned items stand out, body previews are legible, triage is one click.

## Non-goals (this pass)

- Search / filter across announcements.
- Edit or delete existing announcements post-send.
- Email-channel delivery fixes.
- Expiration UX changes (expired items already filter server-side via existing query).
- Notifications outside the app (push, OS, etc.).

## User stories

**Student / recipient**

- I see a red badge with a count on the bell whenever I have unread announcements.
- When I open an announcement's detail view, it's marked read automatically.
- From the list, I can mark a single row read or unread without opening it, and I can clear everything with "Mark all as read".
- If a sender requires acknowledgment, I see a clear "I acknowledge" button on the detail view. Until I click it, the item stays in my unread bucket even if I've opened it.
- The body of an announcement renders as formatted markdown, not raw `**` and `#` characters.
- Pinned announcements are visually distinct in the list (pin icon + subtle tint), not just ordered first.

**Faculty / admin / sender**

- When I compose with "Require acknowledgment", I can later see which recipients have acknowledged and which haven't.
- The composer clearly indicates the consequence of the requireAck checkbox ("Recipients will be asked to explicitly acknowledge").

## Read-tracking model

Move from the current single `lastSeenAnnouncementsAt` timestamp per user to **per-announcement** state per user.

- **Read transition:** opening `/announcements/[id]` marks that announcement read for the current user.
- **Explicit controls:** per-row "Mark read / Mark unread" action, and a top-of-list "Mark all as read" button.
- **Ack supersedes read:** when `requireAck=true`, opening the detail view marks it read but keeps it in the unread bucket until the user clicks "I acknowledge". Acknowledgment implies read.

Planning will choose the exact storage shape (readBy map on the announcement doc vs. per-user subcollection vs. per-announcement subcollection). The brainstorm only commits to the semantic: "per (user, announcement) pair we track read-at and acked-at timestamps."

The existing `lastSeenAnnouncementsAt` and `GetAnnouncementTimestamp.js` become obsolete once the new model lands. Any backfill/migration strategy is a planning concern.

## Acknowledgment model

- `requireAck` is already in `Announcement` and captured in `src/app/announcements/AnnouncementDialogue.tsx`. Keep it.
- Recipient UI: detail view shows a sticky "I acknowledge" button when `requireAck=true` and the current user has not yet acknowledged. After ack, show "Acknowledged on {date}" in its place.
- Unacknowledged required-ack items stay in the "Unread" section of the list even after they've been opened.
- Sender UI: the detail view (for the sender, admin, or faculty) shows a small panel listing "Acknowledged ({n}/{total})" with the ability to expand and see who has and hasn't. "Total" is the audience size at send time; planning will decide whether to snapshot it or derive it.

## Visible UI changes (scope of this pass)

1. **Top-bar bell (`src/components/TopBar/TopBar.tsx`)** — Real badge with unread count, capped display at "9+". Icon stays consistent. Click still routes to `/announcements`.
2. **List (`src/app/announcements/AnnouncementSections.tsx`)** — Keep Unread / Read sections. Add "Mark all as read" button above Unread when the list is non-empty. Add empty-state copy when there are zero announcements (already exists) and zero unread (new: friendly "You're all caught up").
3. **Row (`src/app/announcements/AnnouncementsRow.tsx`)** — Render pinned items with a pin icon and a subtle background tint. Show a compact menu / icon for "Mark read" or "Mark unread" on hover / focus. The body preview shows plain-text derived from the markdown (no raw `**` / `#`).
4. **Detail view (`src/components/AnnouncementView/AnnouncementView.tsx`)** — Render the body as markdown (reuse whatever renderer the `MessageBody` component already relies on). Show the "I acknowledge" button when applicable. Show the sender-side ack panel when the viewer is the sender, an admin, or (scope TBD in planning) faculty.
5. **Composer (`src/app/announcements/AnnouncementDialogue.tsx`)** — Light copy tweak so "Require acknowledgment" makes its effect legible ("Recipients will be asked to explicitly acknowledge").

## Success criteria

- A user with 3 new announcements sees a "3" badge on the bell from any page.
- Opening an announcement's detail page marks it read; reloading the list reflects that without a hard refresh.
- An announcement sent with `requireAck=true` stays in the user's Unread bucket after being opened, and only leaves once the user clicks "I acknowledge".
- The sender of an ack-required announcement can see the list of recipients who have and have not acknowledged.
- Pinned items are visually distinct at a glance, not just ordered first.
- Rendered announcement bodies show formatted markdown, not raw characters.
- "Mark all as read" moves every unread item into the Read bucket and drops the bell badge to zero.

## Open questions for planning

- Storage shape for per-(user, announcement) read state (map on doc vs. subcollection) and its implications for Firestore cost + security rules.
- Migration: is a backfill of the old `lastSeenAnnouncementsAt` into the new model needed, or do we accept that everything before the cutover reads as "unread" one last time?
- Sender-side ack visibility: admins always, sender always — should faculty see ack status for any announcement they _didn't_ send? (Default assumption: no.)
- How is "total recipients" computed for the ack panel when the audience is `role`, `dept`, or `all` (snapshot at send time vs. live count)?
- Which markdown renderer is already in use by `src/components/Messagebody/MessageBody.tsx`? Reuse, don't introduce a new one.

## Referenced files

- `src/components/TopBar/TopBar.tsx`
- `src/contexts/AnnouncementsContext.tsx`
- `src/firebase/util/GetAnnouncementTimestamp.js`
- `src/hooks/Announcements/markAnnouncementAsSeen.ts`
- `src/hooks/Announcements/useFetchAnnouncements.ts`
- `src/app/announcements/page.tsx`
- `src/app/announcements/AnnouncementSections.tsx`
- `src/app/announcements/AnnouncementsRow.tsx`
- `src/app/announcements/AnnouncementDialogue.tsx`
- `src/components/AnnouncementView/AnnouncementView.tsx`
- `src/components/Messagebody/MessageBody.tsx`
- `src/types/announcement.ts`
