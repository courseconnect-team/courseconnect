import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ALL_SEMESTERS,
  UNSPECIFIED_SEMESTER,
  buildSemesterOptions,
  filterBySemester,
  matchesSemester,
  semesterFilenameSlug,
  semesterKey,
} from '../../src/utils/semesterFilter';

const rows = [
  { id: 'a', semesters: ['Fall 2026'] },
  { id: 'b', semesters: ['Fall2026'] }, // same semester, sloppier spelling
  { id: 'c', semesters: ['Spring 2027'] },
  { id: 'd', semesters: ['Summer C 2026'] },
  { id: 'e', semesters: [] }, // no semester
  { id: 'f', semesters: ['Fall'] }, // no year — unparseable
];

test('canonicalizes the key so spellings group together', () => {
  assert.equal(semesterKey({ semesters: ['Fall 2026'] }), 'Fall 2026');
  assert.equal(semesterKey({ semesters: ['Fall2026'] }), 'Fall 2026');
  assert.equal(semesterKey({ semesters: ['  fall   2026 '] }), 'Fall 2026');
});

test('unparseable semesters get the unspecified key', () => {
  assert.equal(semesterKey({ semesters: [] }), UNSPECIFIED_SEMESTER);
  assert.equal(semesterKey({ semesters: ['Fall'] }), UNSPECIFIED_SEMESTER);
  assert.equal(semesterKey({}), UNSPECIFIED_SEMESTER);
});

test('options lead with All and count every row', () => {
  const opts = buildSemesterOptions(rows);
  assert.equal(opts[0].value, ALL_SEMESTERS);
  assert.equal(opts[0].count, 6);
});

test('options are newest first', () => {
  const opts = buildSemesterOptions(rows).slice(1, -1);
  assert.deepEqual(
    opts.map((o) => o.value),
    ['Spring 2027', 'Fall 2026', 'Summer C 2026']
  );
});

test('rows spelled differently land in one option', () => {
  const fall = buildSemesterOptions(rows).find((o) => o.value === 'Fall 2026');
  assert.equal(fall?.count, 2);
});

test('the unspecified bucket comes last and only when needed', () => {
  const opts = buildSemesterOptions(rows);
  const last = opts[opts.length - 1];
  assert.equal(last.value, UNSPECIFIED_SEMESTER);
  assert.equal(last.label, 'No semester set');
  assert.equal(last.count, 2);

  const clean = buildSemesterOptions([{ semesters: ['Fall 2026'] }]);
  assert.equal(
    clean.some((o) => o.value === UNSPECIFIED_SEMESTER),
    false
  );
});

test('no rows yields just the All option', () => {
  const opts = buildSemesterOptions([]);
  assert.equal(opts.length, 1);
  assert.equal(opts[0].value, ALL_SEMESTERS);
  assert.equal(opts[0].count, 0);
});

test('filtering keeps only the chosen semester', () => {
  const out = filterBySemester(rows, 'Fall 2026');
  assert.deepEqual(
    out.map((r) => r.id),
    ['a', 'b']
  );
});

test('filtering to All is a pass-through', () => {
  assert.equal(filterBySemester(rows, ALL_SEMESTERS).length, rows.length);
  assert.equal(filterBySemester(rows, '').length, rows.length);
});

test('the unspecified filter surfaces exactly the unparseable rows', () => {
  const out = filterBySemester(rows, UNSPECIFIED_SEMESTER);
  assert.deepEqual(
    out.map((r) => r.id),
    ['e', 'f']
  );
});

test('a semester filter excludes rows with no semester', () => {
  const out = filterBySemester(rows, 'Spring 2027');
  assert.deepEqual(
    out.map((r) => r.id),
    ['c']
  );
});

test('every row lands in exactly one option', () => {
  const opts = buildSemesterOptions(rows).filter(
    (o) => o.value !== ALL_SEMESTERS
  );
  const total = opts.reduce((n, o) => n + o.count, 0);
  assert.equal(total, rows.length);

  for (const row of rows) {
    const hits = opts.filter((o) => matchesSemester(row, o.value));
    assert.equal(hits.length, 1, `row ${row.id} matched ${hits.length} options`);
  }
});

test('summer sessions sort after the plain term within a year', () => {
  const opts = buildSemesterOptions([
    { semesters: ['Summer A 2026'] },
    { semesters: ['Summer C 2026'] },
    { semesters: ['Summer B 2026'] },
  ]).slice(1);
  assert.deepEqual(
    opts.map((o) => o.value),
    ['Summer C 2026', 'Summer B 2026', 'Summer A 2026']
  );
});

test('filename slugs are safe and identifiable', () => {
  assert.equal(semesterFilenameSlug('Fall 2026'), 'fall-2026');
  assert.equal(semesterFilenameSlug('Summer C 2026'), 'summer-c-2026');
  assert.equal(semesterFilenameSlug(ALL_SEMESTERS), 'all');
  assert.equal(semesterFilenameSlug(UNSPECIFIED_SEMESTER), 'no-semester');
});
