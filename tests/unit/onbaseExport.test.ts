import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ONBASE_COLUMNS,
  buildOnBaseRow,
  buildOnBaseRows,
  collectSemesterWarnings,
  parseSemesterField,
  toOnBaseCsv,
  type OnBaseAssignment,
} from '../../src/utils/onbaseExport';

/**
 * The exact field list OnBase expects, transcribed from the OnBase admin's
 * 7/29/26 message. Written out literally rather than derived from
 * ONBASE_COLUMNS — this is the contract, so the test has to fail if the
 * constant drifts.
 */
const EXPECTED_HEADER = [
  'Student UFID',
  'First Name',
  'Last Name',
  'Email',
  'Supervisor UFID',
  'Supervisor First',
  'Supervisor Last',
  'Supervisor Email',
  'Proxy UFID',
  'Proxy First',
  'Proxy Last',
  'Proxy Email',
  'Requested Action',
  'Position Type',
  'Degree Type',
  'Semester',
  'Year',
  'Starting Date',
  'End Date',
  'Project ID',
  'Project Name',
  'Percentage',
  'Hours',
  'Annual Rate',
  'Biweekly Rate',
  'Hourly Rate',
  'Target Amount',
  'Working Title',
  'Duties',
  'FTE',
  'Imported',
  'Remote',
  'ECE - Special Instructions',
];

const sample: OnBaseAssignment = {
  ufid: '12345678',
  name: 'Ada Lovelace',
  email: 'ada@ufl.edu',
  supervisor_ufid: '87654321',
  supervisorFirst: 'Grace',
  supervisorLast: 'Hopper',
  supervisorEmail: 'ghopper@ufl.edu',
  proxyUfid: '11112222',
  requested_action: 'REAPPOINT',
  degree: 'PhD',
  semesters: ['Fall 2026'],
  start_date: '08-16-2026',
  end_date: '12-18-2026',
  pid: '000108927',
  percentage: '50',
  hours: [20],
  annual_rate: '40000',
  biweekly_rate: '1538.46',
  hr: 25,
  target_amount: '10000',
  title: 'Teaching Assistant',
  class_codes: 'EEL3135 : Wong,Tan Foon',
  remote: 'No',
  ece_special_instructions: 'Split appointment',
};

test('header row matches the 33 OnBase fields in order', () => {
  assert.deepEqual([...ONBASE_COLUMNS], EXPECTED_HEADER);
  assert.equal(ONBASE_COLUMNS.length, 33);
});

test('CSV header row matches the OnBase field list', () => {
  const csv = toOnBaseCsv(buildOnBaseRows([sample]));
  assert.equal(csv.split('\n')[0], EXPECTED_HEADER.join(','));
});

test('dropped fields are absent from every row', () => {
  const row = buildOnBaseRow(sample) as Record<string, unknown>;
  assert.equal('Course' in row, false);
  assert.equal('ECE - Payroll Notes' in row, false);
  assert.deepEqual(Object.keys(row).sort(), [...EXPECTED_HEADER].sort());
});

test('renamed fields carry the old values', () => {
  const row = buildOnBaseRow(sample);
  assert.equal(row['Position Type'], 'TA');
  assert.equal(row['Degree Type'], 'PhD');
  assert.equal(row['Starting Date'], '08-16-2026');
});

test('ECE - Special Instructions is last, not 19th', () => {
  assert.equal(ONBASE_COLUMNS[ONBASE_COLUMNS.length - 1], 'ECE - Special Instructions');
});

// ─── semester split ─────────────────────────────────────────────────────────

test('splits a well-formed semester', () => {
  const r = parseSemesterField('Fall 2026');
  assert.equal(r.semester, 'Fall');
  assert.equal(r.year, '2026');
  assert.equal(r.ok, true);
});

test('splits with no space between term and year', () => {
  const r = parseSemesterField('Fall2026');
  assert.equal(r.semester, 'Fall');
  assert.equal(r.year, '2026');
  assert.equal(r.ok, true);
});

test('splits with irregular spacing', () => {
  const r = parseSemesterField('   Spring    2027  ');
  assert.equal(r.semester, 'Spring');
  assert.equal(r.year, '2027');
  assert.equal(r.ok, true);
});

test('keeps the session letter on summer terms', () => {
  const r = parseSemesterField('Summer C 2026');
  assert.equal(r.semester, 'Summer C');
  assert.equal(r.year, '2026');
  assert.equal(r.ok, true);
});

test('handles a lowercase summer session with no space', () => {
  const r = parseSemesterField('summerb2026');
  assert.equal(r.semester, 'Summer B');
  assert.equal(r.year, '2026');
});

test('handles year-first ordering', () => {
  const r = parseSemesterField('2026 Fall');
  assert.equal(r.semester, 'Fall');
  assert.equal(r.year, '2026');
});

test('reads the first entry of a semesters array', () => {
  const r = parseSemesterField(['Fall 2026', 'Spring 2027']);
  assert.equal(r.semester, 'Fall');
  assert.equal(r.year, '2026');
});

test('skips blank leading array entries', () => {
  const r = parseSemesterField(['', '  ', 'Spring 2027']);
  assert.equal(r.semester, 'Spring');
  assert.equal(r.year, '2027');
});

test('missing semester yields two blanks, not a guess', () => {
  for (const input of [undefined, null, '', '   ', []] as const) {
    const r = parseSemesterField(input as string | string[] | undefined);
    assert.equal(r.semester, '', `semester for ${JSON.stringify(input)}`);
    assert.equal(r.year, '', `year for ${JSON.stringify(input)}`);
    assert.equal(r.ok, false);
    assert.equal(r.reason, 'missing');
  }
});

test('a two-digit year is refused rather than expanded', () => {
  const r = parseSemesterField('Fall 26');
  assert.equal(r.semester, 'Fall');
  assert.equal(r.year, '');
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'missing-year');
});

test('term with no year keeps the term and blanks the year', () => {
  const r = parseSemesterField('Fall');
  assert.equal(r.semester, 'Fall');
  assert.equal(r.year, '');
  assert.equal(r.reason, 'missing-year');
});

test('unrecognized term does not invent a semester', () => {
  const r = parseSemesterField('Winter 2026');
  assert.equal(r.semester, '');
  assert.equal(r.year, '2026');
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'unrecognized-term');
});

test('unparseable semesters are reported, not silently blanked', () => {
  const warnings = collectSemesterWarnings([
    sample,
    { ...sample, ufid: '99999999', name: 'Alan Turing', semesters: ['Fall 26'] },
    { ...sample, ufid: '88888888', name: 'Katherine Johnson', semesters: [] },
  ]);
  assert.equal(warnings.length, 2);
  assert.deepEqual(
    warnings.map((w) => w.reason),
    ['missing-year', 'missing']
  );
  assert.equal(warnings[0].raw, 'Fall 26');
});

// ─── row values ─────────────────────────────────────────────────────────────

test('row splits the semester into the two columns', () => {
  const row = buildOnBaseRow(sample);
  assert.equal(row.Semester, 'Fall');
  assert.equal(row.Year, '2026');
});

test('row carries computed and constant fields', () => {
  const row = buildOnBaseRow(sample);
  assert.equal(row['First Name'], 'Ada');
  assert.equal(row['Last Name'], 'Lovelace');
  assert.equal(row.Hours, 20);
  assert.equal(row.FTE, 0.48);
  assert.equal(row.Duties, 'UPI in EEL3135 : Wong Tan Foon');
  assert.equal(row['Proxy First'], 'Christophe');
  assert.equal(row['Proxy Last'], 'Bobda');
  assert.equal(row['Proxy Email'], 'cbobda@ufl.edu');
  assert.equal(row['Project Name'], 'DEPARTMENT TA / UPIS');
  assert.equal(row.Imported, 'YES');
});

test('multi-word last names stay intact', () => {
  const row = buildOnBaseRow({ ...sample, name: 'Ada Van Der Berg' });
  assert.equal(row['First Name'], 'Ada');
  assert.equal(row['Last Name'], 'Van Der Berg');
});

test('explicit first/last fields win over the combined name', () => {
  const row = buildOnBaseRow({
    ...sample,
    firstName: 'Augusta',
    lastName: 'Byron',
  });
  assert.equal(row['First Name'], 'Augusta');
  assert.equal(row['Last Name'], 'Byron');
});

test('a sparse assignment still writes all 33 fields', () => {
  const row = buildOnBaseRow({}) as Record<string, unknown>;
  assert.deepEqual(Object.keys(row).sort(), [...EXPECTED_HEADER].sort());
  assert.equal(row['Requested Action'], 'NEW HIRE');
  assert.equal(row['Position Type'], 'TA');
  assert.equal(row.Remote, 'No');
  assert.equal(row.FTE, '');
});

test('commas in values are quoted in the CSV', () => {
  const csv = toOnBaseCsv(
    buildOnBaseRows([{ ...sample, title: 'TA, Grader' }])
  );
  assert.ok(csv.includes('"TA, Grader"'));
});

test('every data row has the same field count as the header', () => {
  const csv = toOnBaseCsv(buildOnBaseRows([sample, {}]));
  const lines = csv.split('\n');
  assert.equal(lines.length, 3);
  for (const line of lines) {
    // naive count is safe here: the fixture's quoted fields contain no commas
    assert.equal(line.split(',').length, 33);
  }
});
