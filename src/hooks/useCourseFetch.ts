'use client';

import { useCallback, useMemo } from 'react';
import { callFunction } from '@/firebase/functions/callFunction';
import type {
  CourseFetchConfig,
  CourseFetchRun,
  CoursePreview,
} from '@/types/courseFetch';

type ConfigPayload = Partial<CourseFetchConfig> & {
  label: string;
  provider: 'UF';
  term: 'spring' | 'summer' | 'fall';
  year: number;
};

export function useCourseFetchApi() {
  const list = useCallback(async (): Promise<CourseFetchConfig[]> => {
    const res = await callFunction<{ configs: CourseFetchConfig[] }>(
      'listCourseFetchConfigs',
      {}
    );
    return res.configs ?? [];
  }, []);

  const create = useCallback(
    async (payload: ConfigPayload): Promise<{ id: string }> => {
      return callFunction<{ id: string }>('createCourseFetchConfig', payload);
    },
    []
  );

  const update = useCallback(
    async (
      payload: ConfigPayload & { id: string }
    ): Promise<{ id: string }> => {
      return callFunction<{ id: string }>('updateCourseFetchConfig', payload);
    },
    []
  );

  const remove = useCallback(async (id: string): Promise<void> => {
    await callFunction('deleteCourseFetchConfig', { id });
  }, []);

  const trigger = useCallback(
    async (
      id: string,
      includeCourses?: string[]
    ): Promise<{
      runId: string;
      status: string;
      rawCount: number;
      courseCount: number;
      sectionCount: number;
      durationMs: number;
      errors: string[];
      warnings: string[];
    }> => {
      return callFunction('triggerCourseFetch', {
        id,
        ...(includeCourses ? { includeCourses } : {}),
      });
    },
    []
  );

  const preview = useCallback(async (id: string): Promise<CoursePreview> => {
    return callFunction<CoursePreview>('previewCourseFetch', { id });
  }, []);

  const listRuns = useCallback(
    async (id: string, limit = 20): Promise<CourseFetchRun[]> => {
      const res = await callFunction<{ runs: CourseFetchRun[] }>(
        'listCourseFetchRuns',
        { id, limit }
      );
      return res.runs ?? [];
    },
    []
  );

  // `force` asks the server to write the terminal status itself instead of
  // waiting for the run to acknowledge. The server honours it only for a run
  // past its time limit, so a live run can never be killed out from under its
  // own writes — see cancelCourseFetchRun.
  const cancelRun = useCallback(
    async (
      configId: string,
      runId: string,
      force = false
    ): Promise<{
      cancelled: boolean;
      alreadyTerminal?: boolean;
      reaped?: boolean;
    }> => {
      return callFunction('cancelCourseFetchRun', { configId, runId, force });
    },
    []
  );

  // Memoize the returned object so callers can depend on its identity
  // (e.g. inside useEffect deps) without triggering re-render loops.
  return useMemo(
    () => ({
      list,
      create,
      update,
      remove,
      trigger,
      preview,
      listRuns,
      cancelRun,
    }),
    [list, create, update, remove, trigger, preview, listRuns, cancelRun]
  );
}
