// Validation for CourseFetchConfig input coming from the admin UI.
// Keep this dependency-free so it can run in both the Functions runtime and
// a plain node:test harness.

import type { ConfigSnapshot, SemesterTermLower } from './types';

export type ConfigInput = {
  label?: unknown;
  provider?: unknown;
  institution?: unknown;
  term?: unknown;
  year?: unknown;
  termCode?: unknown;
  departments?: unknown;
  codePrefixes?: unknown;
  numberMin?: unknown;
  numberMax?: unknown;
  campus?: unknown;
  level?: unknown;
  enabled?: unknown;
  refresh?: unknown;
  concurrency?: unknown;
};

export type ValidatedConfig = {
  label: string;
  provider: 'UF';
  institution: string;
  term: SemesterTermLower;
  year: number;
  termCode?: string;
  departments: string[];
  codePrefixes: string[];
  numberMin?: number;
  numberMax?: number;
  campus: 'main' | 'online' | 'any';
  level: 'undergraduate' | 'graduate' | 'any';
  enabled: boolean;
  refresh: {
    mode: 'manual' | 'hourly' | 'daily' | 'weekly' | 'everyNHours';
    everyHours?: number;
  };
  concurrency: number;
};

export type ValidationResult =
  | { ok: true; value: ValidatedConfig }
  | { ok: false; errors: string[] };

const TERMS: SemesterTermLower[] = ['spring', 'summer', 'fall'];
const PROVIDERS = ['UF'] as const;
const CAMPUSES = ['main', 'online', 'any'] as const;
const LEVELS = ['undergraduate', 'graduate', 'any'] as const;
const REFRESH_MODES = [
  'manual',
  'hourly',
  'daily',
  'weekly',
  'everyNHours',
] as const;
const DEPT_CODE = /^[A-Z]{2,6}$/;
const COURSE_PREFIX = /^[A-Z]{2,4}$/;

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

function toStringArray(
  v: unknown,
  pattern: RegExp,
  field: string,
  errors: string[]
): string[] {
  if (v == null) return [];
  if (!Array.isArray(v)) {
    errors.push(`${field} must be an array`);
    return [];
  }
  const out: string[] = [];
  for (const raw of v) {
    if (typeof raw !== 'string') {
      errors.push(`${field} entries must be strings`);
      continue;
    }
    const upper = raw.trim().toUpperCase();
    if (!pattern.test(upper)) {
      errors.push(`${field} entry "${raw}" is invalid`);
      continue;
    }
    if (!out.includes(upper)) out.push(upper);
  }
  return out;
}

export function validateConfigInput(input: ConfigInput): ValidationResult {
  const errors: string[] = [];

  const label = isNonEmptyString(input.label) ? input.label.trim() : '';
  if (!label || label.length > 120)
    errors.push('label is required (1–120 chars)');

  const provider = isNonEmptyString(input.provider)
    ? input.provider.trim()
    : '';
  if (!(PROVIDERS as readonly string[]).includes(provider)) {
    errors.push(`provider must be one of ${PROVIDERS.join(', ')}`);
  }

  const institution = isNonEmptyString(input.institution)
    ? input.institution.trim()
    : provider;
  if (!institution || institution.length > 32) {
    errors.push('institution is required (<= 32 chars)');
  }

  const term = isNonEmptyString(input.term)
    ? input.term.trim().toLowerCase()
    : '';
  if (!(TERMS as readonly string[]).includes(term)) {
    errors.push(`term must be one of ${TERMS.join(', ')}`);
  }

  const yearNum = Number(input.year);
  const year = Number.isFinite(yearNum) ? Math.floor(yearNum) : NaN;
  if (!Number.isFinite(year) || year < 2000 || year > 2100) {
    errors.push('year must be between 2000 and 2100');
  }

  // Optional explicit termCode — only accept digits-only strings up to 8 chars.
  let termCode: string | undefined;
  if (
    input.termCode !== undefined &&
    input.termCode !== null &&
    input.termCode !== ''
  ) {
    if (
      !isNonEmptyString(input.termCode) ||
      !/^[0-9]{1,8}$/.test(input.termCode.trim())
    ) {
      errors.push('termCode, if provided, must be 1–8 digits');
    } else {
      termCode = input.termCode.trim();
    }
  }

  const departments = toStringArray(
    input.departments,
    DEPT_CODE,
    'departments',
    errors
  );
  const codePrefixes = toStringArray(
    input.codePrefixes,
    COURSE_PREFIX,
    'codePrefixes',
    errors
  );

  let numberMin: number | undefined;
  let numberMax: number | undefined;
  if (input.numberMin != null && input.numberMin !== '') {
    const n = Number(input.numberMin);
    if (!Number.isFinite(n) || n < 0 || n > 9999) {
      errors.push('numberMin must be 0–9999');
    } else {
      numberMin = Math.floor(n);
    }
  }
  if (input.numberMax != null && input.numberMax !== '') {
    const n = Number(input.numberMax);
    if (!Number.isFinite(n) || n < 0 || n > 9999) {
      errors.push('numberMax must be 0–9999');
    } else {
      numberMax = Math.floor(n);
    }
  }
  if (numberMin != null && numberMax != null && numberMin > numberMax) {
    errors.push('numberMin cannot exceed numberMax');
  }

  const campus = isNonEmptyString(input.campus)
    ? input.campus.trim().toLowerCase()
    : 'any';
  if (!(CAMPUSES as readonly string[]).includes(campus)) {
    errors.push(`campus must be one of ${CAMPUSES.join(', ')}`);
  }

  const level = isNonEmptyString(input.level)
    ? input.level.trim().toLowerCase()
    : 'any';
  if (!(LEVELS as readonly string[]).includes(level)) {
    errors.push(`level must be one of ${LEVELS.join(', ')}`);
  }

  const enabled = input.enabled === true;

  const refreshRaw = (input.refresh ?? {}) as {
    mode?: unknown;
    everyHours?: unknown;
  };
  const mode = isNonEmptyString(refreshRaw.mode)
    ? refreshRaw.mode.trim()
    : 'manual';
  if (!(REFRESH_MODES as readonly string[]).includes(mode)) {
    errors.push(`refresh.mode must be one of ${REFRESH_MODES.join(', ')}`);
  }
  let everyHours: number | undefined;
  if (mode === 'everyNHours') {
    const n = Number(refreshRaw.everyHours);
    if (!Number.isFinite(n) || n < 1 || n > 168) {
      errors.push('refresh.everyHours must be 1–168 when mode is everyNHours');
    } else {
      everyHours = Math.floor(n);
    }
  }

  let concurrency = Number(input.concurrency);
  if (!Number.isFinite(concurrency)) concurrency = 4;
  concurrency = Math.max(1, Math.min(16, Math.floor(concurrency)));

  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    value: {
      label,
      provider: provider as 'UF',
      institution,
      term: term as SemesterTermLower,
      year,
      termCode,
      departments,
      codePrefixes,
      numberMin,
      numberMax,
      campus: campus as 'main' | 'online' | 'any',
      level: level as 'undergraduate' | 'graduate' | 'any',
      enabled,
      refresh: { mode: mode as ValidatedConfig['refresh']['mode'], everyHours },
      concurrency,
    },
  };
}

// Convert a validated config into the snapshot shape the pipeline needs.
export function toConfigSnapshot(
  id: string,
  v: ValidatedConfig
): ConfigSnapshot {
  return {
    id,
    provider: v.provider,
    institution: v.institution,
    term: v.term,
    year: v.year,
    termCode: v.termCode,
    filters: {
      departments: v.departments,
      codePrefixes: v.codePrefixes,
      numberMin: v.numberMin,
      numberMax: v.numberMax,
      campus: v.campus,
      level: v.level,
    },
    concurrency: v.concurrency,
  };
}

// Compute the next refresh time given a refresh mode. Returns null for
// 'manual' (no automatic scheduling). All other modes return a Date floored
// to the minute so the scheduler sees stable comparisons.
export function computeNextRefreshAt(
  refresh: ValidatedConfig['refresh'],
  now: Date
): Date | null {
  if (refresh.mode === 'manual') return null;
  const hours =
    refresh.mode === 'hourly'
      ? 1
      : refresh.mode === 'daily'
      ? 24
      : refresh.mode === 'weekly'
      ? 24 * 7
      : refresh.everyHours ?? 1;
  const next = new Date(now.getTime() + hours * 60 * 60 * 1000);
  next.setSeconds(0, 0);
  return next;
}
