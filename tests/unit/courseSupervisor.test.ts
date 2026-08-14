import assert from 'node:assert/strict';
import test from 'node:test';

import {
  UNKNOWN,
  isResolved,
  normalizeCourseKey,
  resolveByCodeAlone,
  resolveSupervisor,
  splitCourseKey,
  supervisorFromCourseDoc,
  type CourseCandidate,
  type SupervisorInfo,
} from '../../src/utils/courseSupervisor';

const WONG: SupervisorInfo = {
  supervisorFirst: 'Tan Foon',
  supervisorLast: 'Wong',
  supervisorEmail: 'twong@ufl.edu',
};

const BOBDA: SupervisorInfo = {
  supervisorFirst: 'Christophe',
  supervisorLast: 'Bobda',
  supervisorEmail: 'cbobda@ufl.edu',
};

// ─── key handling ───────────────────────────────────────────────────────────

test('normalizes spacing and case around the separator', () => {
  const canonical = normalizeCourseKey('EEL3135 : Wong,Tan Foon');
  assert.equal(normalizeCourseKey('eel3135:Wong,Tan Foon'), canonical);
  assert.equal(normalizeCourseKey('  EEL3135   :   Wong,Tan Foon  '), canonical);
});

test('splits a course key into code and instructor', () => {
  assert.deepEqual(splitCourseKey('EEL3135 : Wong,Tan Foon'), {
    code: 'EEL3135',
    instructor: 'Wong,Tan Foon',
  });
});

test('a key with no instructor half still yields a code', () => {
  assert.deepEqual(splitCourseKey('EEL3135'), {
    code: 'EEL3135',
    instructor: '',
  });
});

// ─── reading a course doc ───────────────────────────────────────────────────

test('reads "Last,First" off a course doc', () => {
  const sup = supervisorFromCourseDoc({
    professor_names: 'Wong,Tan Foon',
    professor_emails: ['twong@ufl.edu'],
  });
  assert.deepEqual(sup, WONG);
});

test('takes the first entry when names and emails are arrays', () => {
  const sup = supervisorFromCourseDoc({
    professor_names: ['Bobda,Christophe', 'Wong,Tan Foon'],
    professor_emails: ['cbobda@ufl.edu', 'twong@ufl.edu'],
  });
  assert.deepEqual(sup, BOBDA);
});

test('a name with no comma is treated as a surname', () => {
  const sup = supervisorFromCourseDoc({ professor_names: 'TBA' });
  assert.deepEqual(sup, {
    supervisorFirst: '',
    supervisorLast: 'TBA',
    supervisorEmail: '',
  });
});

test('a doc with no professor fields resolves to nothing', () => {
  assert.equal(supervisorFromCourseDoc({ code: 'EEL3135' }), undefined);
  assert.equal(supervisorFromCourseDoc(undefined), undefined);
});

test('isResolved rejects the placeholder', () => {
  assert.equal(isResolved(WONG), true);
  assert.equal(
    isResolved({
      supervisorFirst: UNKNOWN,
      supervisorLast: UNKNOWN,
      supervisorEmail: UNKNOWN,
    }),
    false
  );
  assert.equal(
    isResolved({
      supervisorFirst: '',
      supervisorLast: '',
      supervisorEmail: '',
    }),
    false
  );
});

// ─── code-only fallback ─────────────────────────────────────────────────────

test('resolves by code when one supervisor teaches it', () => {
  const candidates: CourseCandidate[] = [
    { code: 'EEL3135', instructor: 'Wong,Tan Foon', supervisor: WONG },
  ];
  assert.deepEqual(resolveByCodeAlone(candidates, 'EEL3135'), WONG);
});

test('refuses to guess when a code has two supervisors', () => {
  const candidates: CourseCandidate[] = [
    { code: 'EEL3135', instructor: 'Wong,Tan Foon', supervisor: WONG },
    { code: 'EEL3135', instructor: 'Bobda,Christophe', supervisor: BOBDA },
  ];
  assert.equal(resolveByCodeAlone(candidates, 'EEL3135'), undefined);
});

test('duplicate rows for the same supervisor are not ambiguous', () => {
  const candidates: CourseCandidate[] = [
    { code: 'EEL3135', instructor: 'Wong,Tan Foon', supervisor: WONG },
    { code: 'EEL3135', instructor: 'Wong,Tan Foon', supervisor: { ...WONG } },
  ];
  assert.deepEqual(resolveByCodeAlone(candidates, 'EEL3135'), WONG);
});

// ─── the resolution chain ───────────────────────────────────────────────────

const semesterMap = { [normalizeCourseKey('EEL3135 : Wong,Tan Foon')]: WONG };

test('prefers the canonical semester map', () => {
  const r = resolveSupervisor('EEL3135 : Wong,Tan Foon', semesterMap);
  assert.deepEqual(r.supervisor, WONG);
  assert.equal(r.source, 'semesters');
});

test('falls back to the top-level courses collection on a miss', () => {
  const fallback = { [normalizeCourseKey('EEL4744 : Bobda,Christophe')]: BOBDA };
  const r = resolveSupervisor(
    'EEL4744 : Bobda,Christophe',
    semesterMap,
    fallback
  );
  assert.deepEqual(r.supervisor, BOBDA);
  assert.equal(r.source, 'courses');
});

test('falls back again to a unique code match', () => {
  const candidates: CourseCandidate[] = [
    { code: 'EEL4744', instructor: 'Bobda,Christophe', supervisor: BOBDA },
  ];
  const r = resolveSupervisor(
    'EEL4744 : Bobda, Christophe PhD', // instructor spelled differently
    semesterMap,
    {},
    candidates
  );
  assert.deepEqual(r.supervisor, BOBDA);
  assert.equal(r.source, 'courses');
});

test('only marks unknown once every route misses', () => {
  const r = resolveSupervisor('EEL9999 : Nobody,At All', semesterMap, {}, []);
  assert.equal(r.source, 'none');
  assert.equal(r.supervisor.supervisorFirst, UNKNOWN);
  assert.equal(r.supervisor.supervisorLast, UNKNOWN);
  assert.equal(r.supervisor.supervisorEmail, UNKNOWN);
});

test('an ambiguous code stays unknown rather than picking one', () => {
  const candidates: CourseCandidate[] = [
    { code: 'EEL3135', instructor: 'Wong,Tan Foon', supervisor: WONG },
    { code: 'EEL3135', instructor: 'Bobda,Christophe', supervisor: BOBDA },
  ];
  const r = resolveSupervisor(
    'EEL3135 : Someone,Else',
    {},
    {},
    candidates
  );
  assert.equal(r.source, 'none');
  assert.equal(r.supervisor.supervisorLast, UNKNOWN);
});

test('a missing course key is unknown without touching the maps', () => {
  const r = resolveSupervisor(undefined, semesterMap);
  assert.equal(r.source, 'none');
  assert.equal(r.supervisor.supervisorLast, UNKNOWN);
});

test('resolution survives sloppy spacing in the assignment key', () => {
  const r = resolveSupervisor('  eel3135:Wong,Tan Foon ', semesterMap);
  assert.deepEqual(r.supervisor, WONG);
  assert.equal(r.source, 'semesters');
});

test('a blank canonical entry does not block the fallback', () => {
  const blank = {
    [normalizeCourseKey('EEL3135 : Wong,Tan Foon')]: {
      supervisorFirst: '',
      supervisorLast: '',
      supervisorEmail: '',
    },
  };
  const fallback = { [normalizeCourseKey('EEL3135 : Wong,Tan Foon')]: WONG };
  const r = resolveSupervisor('EEL3135 : Wong,Tan Foon', blank, fallback);
  assert.deepEqual(r.supervisor, WONG);
  assert.equal(r.source, 'courses');
});
