# Application Data Migration Guide

This project now uses a single canonical applications schema.

- Logical grouping: `applications/type/uid`
- Firestore document path: `applications/{type}/uid/{uid}`

Where `{type}` is one of:
- `course_assistant`
- `supervised_teaching`

## Why this change

- One canonical record per user and application type.
- No dual-write drift between multiple schemas.
- Simpler reads/updates for approval/status operations.

## Migration script

Use the script in `src/scripts/migrateApplications.ts`.

It supports all known source layouts:
- `applications/{uid}` (legacy)
- `course_assistant/{docId}` (flat)
- `supervised_teaching/{docId}` (flat)

### Dry run

```bash
npm run migrate:applications:dry
```

### Execute migration

```bash
npm run migrate:applications -- --execute
```

### Execute and delete old source documents

```bash
npm run migrate:applications -- --execute --delete-old
```

### Execute and overwrite existing target docs

```bash
npm run migrate:applications -- --execute --overwrite
```

## Verification checklist

1. Confirm documents exist under:
   - `applications/course_assistant/uid/{uid}`
   - `applications/supervised_teaching/uid/{uid}`
2. Confirm each document includes:
   - `uid`
   - `application_type`
   - `updated_at`
3. Submit new applications from the UI and ensure they write to the same path.
4. Approve/deny flows should update `courses.<courseKey>` inside:
   - `applications/course_assistant/uid/{uid}`

## Operational note

Run a Firestore export before any non-dry migration run if this is production data.
