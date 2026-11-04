// Fills in professor emails on semester-course docs. ONE.UF doesn't return
// instructor emails, so we look each prof up in the UF directory once and
// store the result on the doc.

import { emailsToUsernames } from '../email';
import type { DirectoryLookup } from './directory';
import { getAllInChunks } from './firestoreBatch';
import { isPlaceholderInstructor } from './instructors';
import type { SemesterCourseEntry } from './runTypes';

const DIRECTORY_CONCURRENCY = 4;

function existingEmailsOf(
  snap: FirebaseFirestore.DocumentSnapshot | undefined
): string[] {
  const raw = snap?.exists ? snap.data()?.professor_emails : undefined;
  return Array.isArray(raw)
    ? raw.map((e) => String(e ?? '').trim()).filter(Boolean)
    : [];
}

// Look each name up with DIRECTORY_CONCURRENCY lookups in flight. Failures
// and names without a unique match become warnings, never errors.
async function lookUpEmails(
  names: string[],
  lookup: DirectoryLookup,
  warnings: string[]
): Promise<Map<string, string>> {
  const found = new Map<string, string>();
  const unmatched: string[] = [];
  const queue = [...names];
  const worker = async () => {
    for (let name = queue.shift(); name; name = queue.shift()) {
      try {
        const email = await lookup(name);
        if (email) found.set(name, email);
        else unmatched.push(name);
      } catch (err) {
        warnings.push(
          `directory lookup failed for ${name}: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }
    }
  };
  await Promise.all(
    Array.from({ length: DIRECTORY_CONCURRENCY }, () => worker())
  );
  if (unmatched.length > 0) {
    const shown = unmatched.slice(0, 20).join(', ');
    const more =
      unmatched.length > 20 ? `, +${unmatched.length - 20} more` : '';
    warnings.push(
      `directory: no unique email match for ${unmatched.length} instructor(s): ${shown}${more}`
    );
  }
  return found;
}

// Docs that already have an email per instructor (from a previous run or an
// Excel upload) are left alone and never trigger a lookup. Returns the
// emails to write per doc id; a doc missing from the map keeps whatever it
// has. Also returns which of the docs already exist.
export async function resolveProfessorEmails(
  db: FirebaseFirestore.Firestore,
  entries: SemesterCourseEntry[],
  lookup: DirectoryLookup,
  warnings: string[]
): Promise<{ emails: Map<string, string[]>; existingIds: Set<string> }> {
  const snaps = await getAllInChunks(
    db,
    entries.map((e) => e.ref)
  );

  // Which docs still need emails, and which names to look up for them.
  const pending: Array<{ id: string; existing: string[]; names: string[] }> =
    [];
  const namesToLookUp = new Set<string>();
  for (const entry of entries) {
    if (isPlaceholderInstructor(entry.instructorKey)) continue;
    const instructors = entry.sections[0].instructors;
    const names = instructors.map((i) => i.name.trim()).filter(Boolean);
    const existing = existingEmailsOf(snaps.get(entry.ref.id));
    if (names.length === 0 || existing.length >= names.length) continue;
    pending.push({ id: entry.ref.id, existing, names });
    for (const i of instructors) {
      if (!i.email && i.name.trim()) namesToLookUp.add(i.name.trim());
    }
  }

  const found = await lookUpEmails([...namesToLookUp], lookup, warnings);

  const providerEmails = new Map<string, string>();
  for (const entry of entries) {
    for (const i of entry.sections[0].instructors) {
      if (i.email) providerEmails.set(i.name.trim(), i.email);
    }
  }
  const out = new Map<string, string[]>();
  for (const { id, existing, names } of pending) {
    const emails = new Set(existing.map((e) => e.toLowerCase()));
    for (const name of names) {
      const email = providerEmails.get(name) ?? found.get(name);
      if (email) emails.add(email.toLowerCase());
    }
    out.set(id, [...emails]);
  }
  const existingIds = new Set(
    [...snaps.values()].filter((s) => s.exists).map((s) => s.id)
  );
  return { emails: out, existingIds };
}

// Only touch the email fields on an existing doc when we have something to
// write, so a run never wipes emails already there.
export function applyResolvedEmails(
  payload: Record<string, unknown>,
  emails: string[] | undefined,
  docExists: boolean
): void {
  if (emails && emails.length > 0) {
    payload.professor_emails = emails;
    payload.professor_usernames = emailsToUsernames(emails);
  } else if (!docExists) {
    payload.professor_emails = [];
    payload.professor_usernames = [];
  } else {
    delete payload.professor_emails;
    delete payload.professor_usernames;
  }
}
