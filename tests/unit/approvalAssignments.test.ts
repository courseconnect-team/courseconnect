import assert from 'node:assert/strict';
import test from 'node:test';

import {
  approvingInstructors,
  assignedEntry,
  buildApprovalEntries,
  flattenCourseStatuses,
  formatCourseCode,
  resolveCourseFieldPath,
} from '../../src/utils/approvalAssignments';

const courses = {
  'Fall 2026': {
    'EEL3111C : Doe, John': 'approved',
    'EEL3135 : Doe, Jane': 'approved',
    'EEL4744 : Smith, David': 'applied',
  },
  'Spring 2027': {
    'EEL3111C : Doe, John': 'approved',
  },
};

test('flattens the nested shape into per-(semester, course) entries', () => {
  const flat = flattenCourseStatuses(courses);
  assert.equal(flat.length, 4);
  assert.deepEqual(
    flat
      .filter((e) => e.courseId === 'EEL3111C : Doe, John')
      .map((e) => e.semester),
    ['Fall 2026', 'Spring 2027']
  );
});

test('flattens the legacy flat key shape', () => {
  const flat = flattenCourseStatuses({
    'Fall 2026|||EEL3111C : Doe, John': 'approved',
    'EEL3135 : Doe, Jane': 'applied',
  });
  assert.deepEqual(flat, [
    {
      semester: 'Fall 2026',
      courseId: 'EEL3111C : Doe, John',
      status: 'approved',
    },
    { semester: '', courseId: 'EEL3135 : Doe, Jane', status: 'applied' },
  ]);
});

test('lists every approval and leaves un-approved courses out', () => {
  const entries = buildApprovalEntries(courses, []);
  assert.equal(entries.length, 3);
  assert.ok(!entries.some((e) => e.code === 'EEL4744'));
  assert.deepEqual(approvingInstructors(entries), ['Doe, John', 'Doe, Jane']);
});

test('marks only the assigned semester of a course repeated across terms', () => {
  const entries = buildApprovalEntries(courses, [
    {
      id: 'uid-1',
      class_codes: 'EEL3111C : Doe, John',
      semesters: ['Spring 2027'],
    },
  ]);
  const assigned = entries.filter((e) => e.assignmentId);
  assert.equal(assigned.length, 1);
  assert.equal(assigned[0].semester, 'Spring 2027');
  assert.equal(assignedEntry(entries)?.assignmentId, 'uid-1');
});

test('the assigned entry sorts first', () => {
  const entries = buildApprovalEntries(courses, [
    {
      id: 'uid-1',
      class_codes: 'EEL3135 : Doe, Jane',
      semesters: ['Fall 2026'],
    },
  ]);
  assert.equal(entries[0].code, 'EEL3135');
});

test('sloppy spacing and case still pair an assignment with its approval', () => {
  const entries = buildApprovalEntries(courses, [
    { id: 'uid-1', class_codes: 'eel3135:Doe, Jane', semesters: ['Fall2026'] },
  ]);
  assert.equal(assignedEntry(entries)?.courseId, 'EEL3135 : Doe, Jane');
});

test('an assignment whose semester drifted still pairs on the course key', () => {
  const entries = buildApprovalEntries(
    { 'Fall 2026': { 'EEL3135 : Doe, Jane': 'accepted' } },
    [
      {
        id: 'uid-1',
        class_codes: 'EEL3135 : Doe, Jane',
        semesters: ['Summer 2026'],
      },
    ]
  );
  assert.equal(entries.length, 1);
  assert.equal(entries[0].assignmentId, 'uid-1');
});

test('an admin-assigned course no professor approved is still shown', () => {
  const entries = buildApprovalEntries(courses, [
    {
      id: 'uid-1',
      class_codes: 'EEL4744 : Smith, David',
      semesters: ['Fall 2026'],
    },
  ]);
  const smith = entries.find((e) => e.code === 'EEL4744');
  assert.ok(smith, 'assigned-but-unapproved course must stay visible');
  assert.equal(smith?.approved, false);
  assert.equal(smith?.assignmentId, 'uid-1');
});

test('an assignment matching no course entry becomes its own row', () => {
  const entries = buildApprovalEntries(courses, [
    {
      id: 'uid-1',
      class_codes: 'MAS3114 : Ghost, Casper',
      semesters: ['Fall 2026'],
    },
  ]);
  const ghost = entries.find((e) => e.instructor === 'Ghost, Casper');
  assert.equal(ghost?.assignmentId, 'uid-1');
  assert.equal(ghost?.approved, false);
  assert.equal(entries[0], ghost);
});

test('two assignments for the same course each keep a row', () => {
  const entries = buildApprovalEntries(courses, [
    {
      id: 'uid-1',
      class_codes: 'EEL3111C : Doe, John',
      semesters: ['Fall 2026'],
    },
    {
      id: 'uid-1-1',
      class_codes: 'EEL3111C : Doe, John',
      semesters: ['Fall 2026'],
    },
  ]);
  const ids = entries.filter((e) => e.assignmentId).map((e) => e.assignmentId);
  assert.deepEqual(ids.sort(), ['uid-1', 'uid-1-1']);
  assert.equal(new Set(entries.map((e) => e.key)).size, entries.length);
});

test('splits the course id into code and instructor', () => {
  const [entry] = buildApprovalEntries(
    { 'Fall 2026': { 'EEL3111C : Rambo, Keith Jeffrey': 'approved' } },
    []
  );
  assert.equal(entry.code, 'EEL3111C');
  assert.equal(entry.instructor, 'Rambo, Keith Jeffrey');
  assert.equal(formatCourseCode(entry.code), 'EEL 3111C');
});

test('an application with no courses yields nothing', () => {
  assert.deepEqual(buildApprovalEntries(undefined, []), []);
  assert.deepEqual(buildApprovalEntries({}, []), []);
});

test('resolves the status path inside the named semester bucket', () => {
  assert.deepEqual(
    resolveCourseFieldPath(courses, 'EEL3111C : Doe, John', 'Spring 2027'),
    ['courses', 'Spring 2027', 'EEL3111C : Doe, John']
  );
});

test('resolves a sloppily spelled course to the stored key', () => {
  assert.deepEqual(
    resolveCourseFieldPath(courses, 'eel3111c:Doe, John', 'Fall 2026'),
    ['courses', 'Fall 2026', 'EEL3111C : Doe, John']
  );
});

test('resolves the legacy flat key shape', () => {
  const legacy = { 'Fall 2026|||EEL3135 : Doe, Jane': 'approved' };
  assert.deepEqual(
    resolveCourseFieldPath(legacy, 'EEL3135 : Doe, Jane', 'Fall 2026'),
    ['courses', 'Fall 2026|||EEL3135 : Doe, Jane']
  );
});

test('resolves a bare top-level course key', () => {
  assert.deepEqual(
    resolveCourseFieldPath(
      { 'EEL3135 : Doe, Jane': 'approved' },
      'EEL3135 : Doe, Jane'
    ),
    ['courses', 'EEL3135 : Doe, Jane']
  );
});

test('falls back to another semester bucket holding the course', () => {
  assert.deepEqual(
    resolveCourseFieldPath(courses, 'EEL3135 : Doe, Jane', 'Summer 2026'),
    ['courses', 'Fall 2026', 'EEL3135 : Doe, Jane']
  );
});

test('falls back to the canonical nested path for a course not yet stored', () => {
  assert.deepEqual(
    resolveCourseFieldPath(courses, 'MAS3114 : New, Prof', 'Fall 2026'),
    ['courses', 'Fall 2026', 'MAS3114 : New, Prof']
  );
});

test('keeps a dotted instructor name in its own path segment', () => {
  const dotted = { 'Fall 2026': { 'EEL3111C : Smith, John A.': 'approved' } };
  assert.deepEqual(
    resolveCourseFieldPath(dotted, 'EEL3111C : Smith, John A.', 'Fall 2026'),
    ['courses', 'Fall 2026', 'EEL3111C : Smith, John A.']
  );
});
