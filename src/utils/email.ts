// Canonical "username" for a UF user. The local part of the email before
// `@` is stable across `john.doe@ufl.edu`, `john.doe@ece.ufl.edu`, etc., so
// course → professor matching keys off this instead of the full address.
//
// Lowercased and trimmed so an Excel row of "John.Doe@ECE.ufl.edu" matches
// a session whose `auth.email` is `john.doe@ufl.edu`.
export function emailToUsername(email: string | null | undefined): string {
  if (!email) return '';
  const at = email.indexOf('@');
  const local = at === -1 ? email : email.slice(0, at);
  return local.trim().toLowerCase();
}

// Map a list of emails to a deduped, lowercased list of usernames. Stored on
// course docs as `professor_usernames` and used by faculty queries.
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
