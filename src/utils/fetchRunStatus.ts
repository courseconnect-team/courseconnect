/**
 * Plain-language status for a course-fetch run.
 *
 * A run is a continuous job: one click pulls every section for a semester from
 * UF, then writes them into Course Connect. That's thousands of records and it
 * legitimately takes minutes, so the UI has to say "this is still working"
 * clearly enough that an admin doesn't assume it's broken and start clicking
 * again.
 *
 * It also has to stay honest. The job runs inside a Cloud Function with a hard
 * time limit; if the platform kills it, nothing is left alive to write a
 * terminal status and the run doc sits at `status: 'running'` forever. Past
 * that limit we stop reassuring and say it looks stopped.
 */
import type { CourseFetchPhase } from '@/types/courseFetch';

/** Matches `runWith({ timeoutSeconds: 540 })` on the fetch functions. */
export const RUN_TIME_LIMIT_MS = 540_000;

/**
 * Grace period past the limit before calling a run stopped, covering clock skew
 * and the seconds between the last write and the process actually dying.
 */
export const RUN_STALE_GRACE_MS = 120_000;

export const RUN_STALE_AFTER_MS = RUN_TIME_LIMIT_MS + RUN_STALE_GRACE_MS;

export interface RunProgress {
  phase?: CourseFetchPhase;
  startedAt?: Date | null;
  cancelling?: boolean;
}

export interface RunDescription {
  /** Chip text. Short. */
  label: string;
  /** One sentence under the chip, written for a non-technical reader. */
  help: string;
  /** 'stale' means the job has outlived its time limit and looks stopped. */
  tone: 'running' | 'stale';
}

/** "4 minutes", "1 hour 5 minutes" — spelled out, no jargon. */
export function formatElapsed(ms: number): string {
  const totalMinutes = Math.floor(Math.max(0, ms) / 60_000);
  if (totalMinutes < 1) return 'less than a minute';

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const plural = (n: number, word: string) =>
    `${n} ${word}${n === 1 ? '' : 's'}`;

  if (!hours) return plural(minutes, 'minute');
  if (!minutes) return plural(hours, 'hour');
  return `${plural(hours, 'hour')} ${plural(minutes, 'minute')}`;
}

export function isStale(
  startedAt: Date | null | undefined,
  now: Date = new Date()
): boolean {
  if (!startedAt) return false;
  return now.getTime() - startedAt.getTime() > RUN_STALE_AFTER_MS;
}

/**
 * Describe a run in progress. Phase wording avoids the internal vocabulary
 * ("fetching", "writing") in favour of what's actually happening to the data.
 */
export function describeRun(
  run: RunProgress,
  now: Date = new Date()
): RunDescription {
  const startedAt = run.startedAt ?? null;
  const elapsed = startedAt ? now.getTime() - startedAt.getTime() : 0;

  // Staleness is checked before cancelling, not after. Stopping is cooperative
  // — the job itself has to notice the request and write its own ending — so a
  // job that has already died shows "Stopping…" forever while the Cancel button
  // sits disabled. That combination is the one dead end with no way out, so it
  // has to be the loudest thing on the card.
  if (isStale(startedAt, now)) {
    return {
      label: 'No response',
      help: run.cancelling
        ? `This was asked to stop but has not responded in ${formatElapsed(
            elapsed
          )}, longer than a run is allowed to take. It has most likely already stopped on its own. Check the run history.`
        : `This has been going for ${formatElapsed(
            elapsed
          )}, longer than a run is allowed to take, so it has most likely stopped. Check the run history, then start it again.`,
      tone: 'stale',
    };
  }

  if (run.cancelling) {
    return {
      label: 'Stopping…',
      help: 'Finishing the current batch, then it will stop. Nothing half-written is saved.',
      tone: 'running',
    };
  }

  const forHowLong = startedAt
    ? ` It has been running for ${formatElapsed(elapsed)}.`
    : '';

  if (run.phase === 'writing') {
    return {
      label: 'Running — saving courses',
      help: `Course data has been collected and is being saved to Course Connect.${forHowLong}`,
      tone: 'running',
    };
  }

  return {
    label: 'Running — collecting courses',
    help: `Pulling every section for this semester from UF. This normally takes a few minutes, and it keeps going if you leave this page.${forHowLong}`,
    tone: 'running',
  };
}

/**
 * Wording for a config that isn't running right now. Keeps the same casual
 * register as describeRun so the card doesn't switch voice between states.
 */
export function describeIdleStatus(lastStatus?: string): {
  label: string;
  help: string;
} {
  switch (lastStatus) {
    case 'success':
      return { label: 'Up to date', help: 'The last run finished with no problems.' };
    case 'partial_success':
      return {
        label: 'Finished with problems',
        help: 'Courses were saved, but some were skipped. Open the run history to see which.',
      };
    case 'failed':
      return {
        label: 'Did not finish',
        help: 'The last run stopped before saving anything. Open the run history for the reason.',
      };
    case 'cancelled':
      return {
        label: 'Stopped',
        help: 'Someone stopped the last run before it finished. Nothing was saved.',
      };
    case 'running':
      return { label: 'Running', help: 'A run is in progress.' };
    default:
      return { label: 'Not run yet', help: 'This has never been run.' };
  }
}
