// Mirrored from `src/utils/email.ts`. Cloud Functions can't reach into the
// Next.js `src/` tree, so we keep a small copy here. Keep these in sync.

export function emailToUsername(email: string | null | undefined): string {
  if (!email) return '';
  const at = email.indexOf('@');
  const local = at === -1 ? email : email.slice(0, at);
  return local.trim().toLowerCase();
}

export function emailsToUsernames(
  emails: ReadonlyArray<string | null | undefined> | null | undefined
): string[] {
  if (!emails) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const e of emails) {
    const u = emailToUsername(e);
    if (u && !seen.has(u)) {
      seen.add(u);
      out.push(u);
    }
  }
  return out;
}
