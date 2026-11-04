// UF directory lookup: fills in instructor emails that ONE.UF doesn't
// return (its schedule API only gives `{ name }` per instructor).
//
// Source: the public faculty/staff search at
// `https://directory.ufl.edu/directory/SearchPerson`. It's an HTML form POST
// (firstName, lastName, email, auth=false) — no JSON API — so we scrape the
// result count and the `mailto:` links from the response.
//
// Matching is conservative: an email is only accepted when the search
// returns exactly one person with exactly one email. Anything else (no
// match, several people with the same name, a match with no email) returns
// undefined and the caller records a warning instead of guessing.

import type { Fetcher } from './types';

const DIRECTORY_URL = 'https://directory.ufl.edu/directory/SearchPerson';

export type DirectoryLookup = (name: string) => Promise<string | undefined>;

// ONE.UF names are "First Last" or "First Middle Last". The directory
// searches first/last name separately, so take the first and last tokens.
export function splitInstructorName(
  name: string
): { firstName: string; lastName: string } | null {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return null;
  return { firstName: parts[0], lastName: parts[parts.length - 1] };
}

// Pull the "<N> Results Found" count and the distinct mailto: addresses out
// of a SearchPerson response. Exported for tests.
export function parseDirectoryResults(html: string): {
  resultCount: number;
  emails: string[];
} {
  const flat = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const countMatch = flat.match(/(\d+) Results? Found/i);
  const resultCount = countMatch ? Number(countMatch[1]) : 0;
  const emails = new Set<string>();
  for (const m of html.matchAll(/href="mailto:([^"?]+)"/gi)) {
    emails.add(m[1].trim().toLowerCase());
  }
  return { resultCount, emails: [...emails] };
}

async function searchDirectory(
  firstName: string,
  lastName: string,
  fetcher: Fetcher
): Promise<{ resultCount: number; emails: string[] }> {
  const body = new URLSearchParams({
    firstName,
    lastName,
    email: '',
    auth: 'false',
  });
  const res = await fetcher(DIRECTORY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent':
        'CourseConnect-Scraper/1.0 (+https://courseconnect.eng.ufl.edu)',
    },
    body: body.toString(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return parseDirectoryResults(await res.text());
}

export function createDirectoryLookup(fetcher?: Fetcher): DirectoryLookup {
  const use = fetcher ?? (globalThis.fetch as Fetcher);
  return async (name) => {
    const split = splitInstructorName(name);
    if (!split) return undefined;
    const { resultCount, emails } = await searchDirectory(
      split.firstName,
      split.lastName,
      use
    );
    return resultCount === 1 && emails.length === 1 ? emails[0] : undefined;
  };
}
