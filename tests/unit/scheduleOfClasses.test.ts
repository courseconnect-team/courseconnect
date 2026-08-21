import assert from 'node:assert/strict';
import test from 'node:test';

import {
  addCodeSpace,
  findHeaderRowIndex,
  instructorKey,
  normalizeCode,
  parseScheduleOfClasses,
  resolveColumns,
  semesterCourseDocId,
} from '../../src/utils/scheduleOfClasses';

/**
 * Header transcribed from the Fall 2026 export
 * ("Department View Schedule of Classes_Fall_2026_UPI_TA_07_30_2026.xlsx").
 * Written out literally rather than derived — this is the contract with the
 * registrar's report, so the test has to fail if the parser drifts from it.
 */
const FALL_2026_HEADER = [
  'Session Code',
  'Session Begin Date',
  'Session End Date',
  'Drop/Add End Date',
  'Grading End Date',
  'Acad Org',
  'Course',
  'Gord Rule',
  'Gen ED',
  'Hons List',
  'Sect',
  'Class Nbr',
  'Assoc Class',
  'Requirement Group',
  'Use Catalog Requirements',
  'Requirement Group Description',
  'Min - Max Cred',
  'Day/s',
  'Time',
  'Meeting Pattern',
  'Facility',
  'Join',
  'Site',
  'County',
  'Spec',
  'Book',
  'SOC',
  'Exam',
  'Course Title',
  'Instructor',
  'Instructor Emails',
  'Enr Cap',
  'Room Cap',
  'Enrolled',
  'Total Enrollment',
  'Multi Meet Cap',
  'Wait List Cap',
  'Wait List Total',
  'Sched Codes',
  'Class Status',
  'DL Fee Per Credit',
  'Chartfield',
  'DL Fee Status',
];

/** The five preamble rows the report emits above the header. */
const PREAMBLE: unknown[][] = [
  ['2268 -- Fall 2026'],
  ['Department View Schedule of Classes'],
  ['Valid as of: Jul 30, 2026 1:15:36 PM'],
  [],
  ['Class Status Key: A = Active, X = Cancelled, T = Tentative, S = Stop Enrl'],
];

const FOOTER: unknown[][] = [['Report Run Time: Jul 30, 2026 1:15:36 PM']];

interface RowOverrides {
  course?: string;
  sect?: string;
  classNbr?: string;
  cred?: string;
  days?: string;
  time?: string;
  facility?: string;
  title?: string;
  instructor?: string;
  emails?: string;
  enrCap?: string;
  enrolled?: string;
  status?: string;
}

/** Build one Fall-2026-shaped data row. */
function row(o: RowOverrides): unknown[] {
  const r: unknown[] = new Array(FALL_2026_HEADER.length).fill(null);
  r[6] = o.course ?? 'EEL4657C';
  r[10] = o.sect ?? '0001';
  r[11] = o.classNbr ?? '17941';
  r[16] = o.cred ?? '4.00 - 4.00';
  r[17] = o.days ?? ' T     ';
  r[18] = o.time ?? '08:30 AM - 10:25 AM';
  r[20] = o.facility ?? 'Larsen Hall 0330';
  r[28] = o.title ?? 'Linear Control System';
  r[29] = o.instructor ?? 'Abdollahi Biron,Zoleikha';
  r[30] = o.emails ?? 'z.biron@ece.ufl.edu';
  r[31] = o.enrCap ?? '10';
  r[33] = o.enrolled ?? '10';
  r[39] = o.status ?? 'A';
  return r;
}

function sheet(...dataRows: unknown[][]): unknown[][] {
  return [...PREAMBLE, FALL_2026_HEADER, ...dataRows, ...FOOTER];
}

test('finds the header row beneath the report preamble', () => {
  assert.equal(findHeaderRowIndex(sheet(row({}))), PREAMBLE.length);
});

test('resolves columns by name in the Fall 2026 layout', () => {
  const cols = resolveColumns(FALL_2026_HEADER);
  assert.equal(cols.code, 6);
  assert.equal(cols.section, 10);
  assert.equal(cols.classNumber, 11);
  assert.equal(cols.credits, 16);
  assert.equal(cols.days, 17);
  assert.equal(cols.time, 18);
  assert.equal(cols.facility, 20);
  assert.equal(cols.title, 28);
  assert.equal(cols.instructor, 29);
  assert.equal(cols.emails, 30);
  assert.equal(cols.enrollmentCap, 31);
  assert.equal(cols.enrolled, 33);
  assert.equal(cols.status, 39);
});

test('resolves the same fields when leading columns are absent', () => {
  // The pre-Fall-2026 export lacked the four session-date columns, which
  // shifted everything after `Session Code` left by four. Name lookup has
  // to track that without any positional constant.
  const shifted = FALL_2026_HEADER.filter(
    (h) =>
      ![
        'Session Begin Date',
        'Session End Date',
        'Drop/Add End Date',
        'Grading End Date',
      ].includes(h)
  );
  const cols = resolveColumns(shifted);
  assert.equal(cols.code, 2);
  assert.equal(cols.classNumber, 7);
  assert.equal(cols.instructor, 25);
});

test('merges sections of one course taught by the same instructor', () => {
  const parsed = parseScheduleOfClasses(
    sheet(
      row({ classNbr: '17941', sect: '0001' }),
      row({ classNbr: '19948', sect: '0002' }),
      row({ classNbr: '19949', sect: '0003' })
    )
  );
  assert.equal(parsed.groups.length, 1);
  const g = parsed.groups[0];
  assert.equal(g.docId, 'EEL4657C : Abdollahi Biron,Zoleikha');
  assert.deepEqual(g.classNumbers, ['17941', '19948', '19949']);
  assert.deepEqual(g.sectionNumbers, ['0001', '0002', '0003']);
  assert.equal(g.codeWithSpace, 'EEL 4657C');
  assert.equal(g.title, 'Linear Control System');
  assert.equal(g.credits, '4.00 - 4.00');
});

test('counts enrollment once per section, not once per meeting row', () => {
  // The report emits one row per meeting pattern, repeating the section's
  // Enr Cap / Enrolled on each. Summing rows blindly triples the totals.
  const parsed = parseScheduleOfClasses(
    sheet(
      row({ classNbr: '17941', enrCap: '10', enrolled: '9', days: ' T     ' }),
      row({ classNbr: '17941', enrCap: '10', enrolled: '9', days: '   R   ' }),
      row({ classNbr: '17941', enrCap: '10', enrolled: '9', days: '    F  ' }),
      row({ classNbr: '19948', enrCap: '10', enrolled: '8', days: ' T     ' })
    )
  );
  assert.equal(parsed.groups.length, 1);
  assert.equal(parsed.groups[0].enrollmentCap, '20');
  assert.equal(parsed.groups[0].enrolled, '17');
});

test('collects distinct meeting times and strips the day padding', () => {
  const parsed = parseScheduleOfClasses(
    sheet(
      row({ classNbr: '17941', days: 'M W F  ', time: '09:35 AM - 10:25 AM' }),
      row({ classNbr: '17941', days: ' T R   ', time: '04:05 PM - 06:00 PM' }),
      // Sections often share one lecture — it should be listed once.
      row({ classNbr: '19948', days: 'M W F  ', time: '09:35 AM - 10:25 AM' })
    )
  );
  assert.deepEqual(parsed.groups[0].meetingTimes, [
    { day: 'MWF', time: '09:35 AM - 10:25 AM', location: 'Larsen Hall 0330' },
    { day: 'TR', time: '04:05 PM - 06:00 PM', location: 'Larsen Hall 0330' },
  ]);
});

test('keeps a meeting row that has only some of day/time/location', () => {
  const parsed = parseScheduleOfClasses(
    sheet(row({ days: '       ', time: '', facility: 'MAEA 0327' }))
  );
  assert.deepEqual(parsed.groups[0].meetingTimes, [
    { day: 'undef', time: 'undef', location: 'MAEA 0327' },
  ]);
});

test('splits multiple instructor emails and keys the doc on the joined name', () => {
  const parsed = parseScheduleOfClasses(
    sheet(
      row({
        course: 'EEL4924C',
        instructor: 'Eisenstadt,William R; Liebner,Eric A',
        emails: 'wre@ece.ufl.edu; ericl@ece.ufl.edu',
      })
    )
  );
  const g = parsed.groups[0];
  assert.deepEqual(g.instructorEmails, [
    'wre@ece.ufl.edu',
    'ericl@ece.ufl.edu',
  ]);
  assert.equal(g.docId, 'EEL4924C : Eisenstadt,William R; Liebner,Eric A');
});

test('groups instructor-less sections under TBA', () => {
  const parsed = parseScheduleOfClasses(
    sheet(
      row({ classNbr: '11111', instructor: '', emails: '' }),
      row({ classNbr: '22222', instructor: '   ', emails: '' })
    )
  );
  assert.equal(parsed.groups.length, 1);
  assert.equal(parsed.groups[0].docId, 'EEL4657C : TBA');
  assert.deepEqual(parsed.groups[0].instructorEmails, []);
  assert.equal(parsed.groups[0].enrollmentCap, '20');
});

test('skips cancelled sections and reports the count', () => {
  const parsed = parseScheduleOfClasses(
    sheet(
      row({ classNbr: '17941', status: 'A' }),
      row({ classNbr: '19948', status: 'X' })
    )
  );
  assert.equal(parsed.skippedCancelled, 1);
  assert.deepEqual(parsed.groups[0].classNumbers, ['17941']);
});

test('ignores the trailing footer instead of counting it as a bad row', () => {
  const parsed = parseScheduleOfClasses(sheet(row({}), []));
  assert.equal(parsed.dataRowCount, 1);
  assert.equal(parsed.skippedMissingId, 0);
});

test('counts rows that carry one identifier but not the other', () => {
  const parsed = parseScheduleOfClasses(
    sheet(row({}), row({ course: '', classNbr: '99999' }))
  );
  assert.equal(parsed.dataRowCount, 2);
  assert.equal(parsed.skippedMissingId, 1);
  assert.equal(parsed.groups.length, 1);
});

test('reports missing required columns instead of writing garbage', () => {
  const parsed = parseScheduleOfClasses([
    ['Session Code', 'Acad Org', 'Instructor'],
    ['1', '19050000', 'Someone,A'],
  ]);
  assert.equal(parsed.headerRowIndex, -1);
  assert.deepEqual(parsed.missingColumns, ['Course', 'Class Nbr']);
  assert.deepEqual(parsed.groups, []);
});

test('doc id helpers match the auto-fetch writer', () => {
  assert.equal(normalizeCode(' eel 4657c '), 'EEL4657C');
  assert.equal(addCodeSpace('EEL4657C'), 'EEL 4657C');
  assert.equal(addCodeSpace('NOTACODE'), 'NOTACODE');
  assert.equal(instructorKey('  Smith,   John  '), 'Smith, John');
  assert.equal(instructorKey('undef'), 'TBA');
  assert.equal(instructorKey(''), 'TBA');
  // '/' is the one character a Firestore doc id cannot hold.
  assert.equal(semesterCourseDocId('EEL1234', 'A/B'), 'EEL1234 : A-B');
});
