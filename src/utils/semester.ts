// Helpers for reasoning about stored semester strings like "Fall 2025",
// "Spring 2026", "Summer 2024". Within a year the terms run
// Spring < Summer < Fall.
const TERM_ORDER: Record<string, number> = { spring: 0, summer: 1, fall: 2 };

/**
 * Chronological rank for a semester string, or null if it isn't a
 * recognizable "Term YYYY". Higher rank = later in time, so ranks are
 * directly comparable with `<` / `>`.
 */
export function semesterRank(sem: string): number | null {
  const s = sem.trim().toLowerCase();
  const term = Object.keys(TERM_ORDER).find((t) => s.includes(t));
  const yearMatch = s.match(/\b(\d{4})\b/);
  if (!term || !yearMatch) return null;
  return Number(yearMatch[1]) * 10 + TERM_ORDER[term];
}

/** Normalize a `semesters` field (array | string | missing) into a string[]. */
export function normalizeSemesters(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((s) => String(s).trim()).filter(Boolean);
  }
  if (typeof raw === 'string' && raw.trim()) return [raw.trim()];
  return [];
}
