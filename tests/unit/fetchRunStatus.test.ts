import assert from 'node:assert/strict';
import test from 'node:test';

import {
  RUN_STALE_AFTER_MS,
  describeIdleStatus,
  describeRun,
  formatElapsed,
  isStale,
} from '../../src/utils/fetchRunStatus';

const NOW = new Date('2026-08-14T12:00:00Z');
const minutesAgo = (n: number) => new Date(NOW.getTime() - n * 60_000);

test('elapsed time is spelled out, not abbreviated', () => {
  assert.equal(formatElapsed(0), 'less than a minute');
  assert.equal(formatElapsed(30_000), 'less than a minute');
  assert.equal(formatElapsed(60_000), '1 minute');
  assert.equal(formatElapsed(4 * 60_000), '4 minutes');
  assert.equal(formatElapsed(60 * 60_000), '1 hour');
  assert.equal(formatElapsed(65 * 60_000), '1 hour 5 minutes');
  assert.equal(formatElapsed(-5), 'less than a minute');
});

test('a run is stale only past the time limit plus grace', () => {
  assert.equal(isStale(minutesAgo(5), NOW), false);
  assert.equal(isStale(minutesAgo(9), NOW), false);
  assert.equal(
    isStale(new Date(NOW.getTime() - RUN_STALE_AFTER_MS + 1_000), NOW),
    false
  );
  assert.equal(
    isStale(new Date(NOW.getTime() - RUN_STALE_AFTER_MS - 1_000), NOW),
    true
  );
});

test('an unknown start time is never called stale', () => {
  assert.equal(isStale(null, NOW), false);
  assert.equal(isStale(undefined, NOW), false);
  assert.equal(describeRun({ startedAt: null }, NOW).tone, 'running');
});

test('a fresh run reads as working, not stuck', () => {
  const d = describeRun({ phase: 'fetching', startedAt: minutesAgo(3) }, NOW);
  assert.equal(d.tone, 'running');
  assert.equal(d.label, 'Running — collecting courses');
  assert.match(d.help, /takes a few minutes/);
  assert.match(d.help, /3 minutes/);
});

test('the wording says the job survives leaving the page', () => {
  const d = describeRun({ phase: 'fetching', startedAt: minutesAgo(1) }, NOW);
  assert.match(d.help, /keeps going if you leave this page/);
});

test('the writing phase is described by what it does to the data', () => {
  const d = describeRun({ phase: 'writing', startedAt: minutesAgo(2) }, NOW);
  assert.equal(d.label, 'Running — saving courses');
  assert.match(d.help, /being saved/);
});

test('no internal phase vocabulary leaks into the copy', () => {
  for (const phase of ['fetching', 'writing'] as const) {
    const d = describeRun({ phase, startedAt: minutesAgo(2) }, NOW);
    assert.doesNotMatch(d.label, /fetching|writing/i);
  }
});

test('past the limit it stops reassuring and says it stopped', () => {
  const d = describeRun({ phase: 'fetching', startedAt: minutesAgo(30) }, NOW);
  assert.equal(d.tone, 'stale');
  assert.equal(d.label, 'No response');
  assert.match(d.help, /most likely stopped/);
  assert.match(d.help, /30 minutes/);
  assert.doesNotMatch(d.help, /takes a few minutes/);
});

test('cancelling wins over the phase and explains the wait', () => {
  const d = describeRun(
    { phase: 'writing', startedAt: minutesAgo(2), cancelling: true },
    NOW
  );
  assert.equal(d.label, 'Stopping…');
  assert.match(d.help, /Nothing half-written is saved/);
});

// Stopping is cooperative, so a dead job never acknowledges the request and
// the Cancel button stays disabled. If this reported "Stopping…" the card
// would be a dead end with nothing telling the admin to intervene.
test('a stop request on a dead run reports no response, not stopping', () => {
  const d = describeRun(
    { phase: 'fetching', startedAt: minutesAgo(45), cancelling: true },
    NOW
  );
  assert.equal(d.label, 'No response');
  assert.equal(d.tone, 'stale');
  assert.match(d.help, /asked to stop but has not responded/);
  assert.match(d.help, /45 minutes/);
});

test('a stop request on a live run still reads as stopping', () => {
  const d = describeRun(
    { phase: 'fetching', startedAt: minutesAgo(2), cancelling: true },
    NOW
  );
  assert.equal(d.label, 'Stopping…');
  assert.equal(d.tone, 'running');
});

// The Force stop button is shown exactly when describeRun reports 'stale', and
// the server reaps on the same threshold. If these two drifted apart the button
// would appear while the server still refused to act on it.
test('force stop appears exactly when the server would reap', () => {
  const justInside = new Date(NOW.getTime() - RUN_STALE_AFTER_MS + 1_000);
  const justPast = new Date(NOW.getTime() - RUN_STALE_AFTER_MS - 1_000);

  assert.equal(describeRun({ startedAt: justInside }, NOW).tone, 'running');
  assert.equal(isStale(justInside, NOW), false);

  assert.equal(describeRun({ startedAt: justPast }, NOW).tone, 'stale');
  assert.equal(isStale(justPast, NOW), true);
});

test('a run with no start time never offers force stop', () => {
  // Without startedAt the server cannot prove the run is dead, so it will
  // refuse to reap; the card must not offer a button that will be declined.
  assert.equal(describeRun({ startedAt: null }, NOW).tone, 'running');
  assert.equal(describeRun({ startedAt: undefined }, NOW).tone, 'running');
});

test('idle wording avoids jargon', () => {
  assert.equal(describeIdleStatus('success').label, 'Up to date');
  assert.equal(
    describeIdleStatus('partial_success').label,
    'Finished with problems'
  );
  assert.equal(describeIdleStatus('failed').label, 'Did not finish');
  assert.equal(describeIdleStatus('cancelled').label, 'Stopped');
  assert.equal(describeIdleStatus(undefined).label, 'Not run yet');
});

test('every idle state carries an explanation', () => {
  for (const s of [
    'success',
    'partial_success',
    'failed',
    'cancelled',
    'running',
    undefined,
  ]) {
    const d = describeIdleStatus(s);
    assert.ok(d.help.length > 10, `missing help for ${s}`);
    assert.ok(d.label.length > 0, `missing label for ${s}`);
  }
});
