'use client';

import { useCallback } from 'react';
import { callFunction } from '@/firebase/functions/callFunction';
import type { CourseFetchConfig, CourseFetchRun } from '@/types/courseFetch';

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
      id: string
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
      return callFunction('triggerCourseFetch', { id });
    },
    []
  );

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

  return { list, create, update, remove, trigger, listRuns };
}
