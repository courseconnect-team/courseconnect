// Pipeline: orchestrates provider fetch -> filter -> dedup -> finalize.
// Persistence is the caller's responsibility (see runAndPersist in runner.ts).

import {
  dedupCourses,
  dedupSections,
  filterCourse,
  finalizeCourse,
  finalizeSection,
} from './normalize';
import { ufProvider } from './providers/uf';
import type {
  CancelCheck,
  ConfigSnapshot,
  Fetcher,
  FetchResult,
  Provider,
  ProviderId,
} from './types';

const PROVIDERS: Record<ProviderId, Provider> = {
  UF: ufProvider,
};

export function getProvider(id: ProviderId): Provider {
  const p = PROVIDERS[id];
  if (!p) throw new Error(`Unknown provider: ${id}`);
  return p;
}

export async function fetchCoursesForConfig(
  config: ConfigSnapshot,
  options: { fetcher?: Fetcher; checkCancel?: CancelCheck } = {}
): Promise<FetchResult> {
  const provider = getProvider(config.provider);
  const termCode =
    (config.termCode && config.termCode.trim()) ||
    provider.resolveTermCode({ term: config.term, year: config.year });

  let providerResult;
  try {
    providerResult = await provider.fetch({
      config,
      termCode,
      fetcher: options.fetcher,
      checkCancel: options.checkCancel,
    });
  } catch (err) {
    return {
      status: 'failed',
      rawCount: 0,
      courses: [],
      sections: [],
      errors: [err instanceof Error ? err.message : String(err)],
      warnings: [],
    };
  }

  const cancelled = providerResult.cancelled === true;
  const rawCount = providerResult.rawCount;

  const filtered = providerResult.courses
    .map(finalizeCourse)
    .filter((c) => filterCourse(c, config.filters));
  const allowedCodes = new Set(filtered.map((c) => c.code));

  const filteredSections = providerResult.sections
    .map(finalizeSection)
    .filter((s) => allowedCodes.has(s.courseCode));

  const dedupedCourses = dedupCourses(config.provider, termCode, filtered);
  const dedupedSections = dedupSections(
    config.provider,
    termCode,
    filteredSections
  );

  const errors = providerResult.errors ?? [];
  const warnings = providerResult.warnings ?? [];

  const status: FetchResult['status'] = cancelled
    ? 'cancelled'
    : errors.length === 0
    ? 'success'
    : dedupedCourses.length > 0
    ? 'partial_success'
    : 'failed';

  return {
    status,
    rawCount,
    courses: dedupedCourses,
    sections: dedupedSections,
    errors,
    warnings,
    providerMeta: { termCode },
    ...(cancelled ? { cancelled: true } : {}),
  };
}
