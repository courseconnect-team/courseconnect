/**
 * Write a sample OnBase import file so the header row can be eyeballed before
 * sending anything to the OnBase team.
 *
 * Usage:
 *   npm run onbase:sample              # fixture data, no credentials needed
 *   npm run onbase:sample -- --live    # real assignments from Firestore
 *
 * --live requires GOOGLE_APPLICATION_CREDENTIALS to point to a service account
 * key with Firestore read access (same as the migration scripts).
 *
 * Output: onbase-sample.csv in the repo root. Columns come from ONBASE_COLUMNS,
 * so this file and the in-app export can never disagree.
 */

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  ONBASE_COLUMNS,
  buildOnBaseRows,
  collectSemesterWarnings,
  toOnBaseCsv,
  type OnBaseAssignment,
} from '../utils/onbaseExport';

const LIVE = process.argv.includes('--live');
const OUT = resolve(process.cwd(), 'onbase-sample.csv');

/**
 * Fixture rows chosen to exercise the messy cases: the clean path, a Summer
 * session letter, a missing space, a term with no year, and a row with almost
 * nothing filled in.
 */
const FIXTURES: OnBaseAssignment[] = [
  {
    ufid: '12345678',
    name: 'Ada Lovelace',
    email: 'ada@ufl.edu',
    supervisor_ufid: '87654321',
    supervisorFirst: 'Grace',
    supervisorLast: 'Hopper',
    supervisorEmail: 'ghopper@ufl.edu',
    proxyUfid: '11112222',
    requested_action: 'NEW HIRE',
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
    ece_special_instructions: 'Split appointment, 50/50',
    date: '07-14-2026',
  },
  {
    ufid: '23456789',
    name: 'Alan Turing',
    email: 'aturing@ufl.edu',
    supervisor_ufid: '87654321',
    supervisorFirst: 'Grace',
    supervisorLast: 'Hopper',
    supervisorEmail: 'ghopper@ufl.edu',
    proxyUfid: '11112222',
    requested_action: 'REAPPOINT',
    degree: 'MS',
    semesters: ['Summer C 2026'],
    start_date: '05-11-2026',
    end_date: '08-07-2026',
    pid: '000108927',
    percentage: '25',
    hours: [10],
    hr: 22,
    title: 'Grader',
    class_codes: 'EEL4837 : Bobda,Christophe',
    remote: 'Yes',
    date: '03-02-2026',
  },
  {
    ufid: '34567890',
    name: 'Katherine Johnson',
    email: 'kjohnson@ufl.edu',
    supervisor_ufid: '87654321',
    supervisorFirst: 'Grace',
    supervisorLast: 'Hopper',
    supervisorEmail: 'ghopper@ufl.edu',
    requested_action: 'NEW HIRE',
    degree: 'PhD',
    semesters: ['Spring2027'], // no space — still splits cleanly
    start_date: '01-05-2027',
    end_date: '05-07-2027',
    pid: '000108927',
    hours: [20],
    title: 'Teaching Assistant',
    class_codes: 'EEL3701 : Wong,Tan Foon',
  },
  {
    ufid: '45678901',
    name: 'Jean Bartik',
    email: 'jbartik@ufl.edu',
    requested_action: 'TERMINATE',
    semesters: ['Fall'], // no year — Semester/Year both reported, year blank
    hours: [15],
    class_codes: 'EEL4744 : Bobda,Christophe',
  },
  {
    ufid: '56789012',
    name: 'Radia Perlman',
    email: 'rperlman@ufl.edu',
    // no semester at all
  },
];

async function loadLive(): Promise<OnBaseAssignment[]> {
  // Required lazily so the fixture path needs no credentials.
  const admin = require('firebase-admin');
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  }
  const snap = await admin.firestore().collection('assignments').get();
  return snap.docs.map((doc: { data: () => Record<string, unknown> }) => {
    const d = doc.data();
    return d as OnBaseAssignment;
  });
}

async function main() {
  const assignments = LIVE ? await loadLive() : FIXTURES;
  const rows = buildOnBaseRows(assignments);
  const csv = toOnBaseCsv(rows);
  writeFileSync(OUT, `${csv}\n`, 'utf8');

  console.log(`${LIVE ? 'Live' : 'Fixture'} data: ${rows.length} row(s)`);
  console.log(`Wrote ${OUT}`);
  console.log(`\nHeader (${ONBASE_COLUMNS.length} columns):`);
  ONBASE_COLUMNS.forEach((c, i) => console.log(`  ${i + 1}. ${c}`));

  const warnings = collectSemesterWarnings(assignments);
  if (warnings.length) {
    console.log(`\n${warnings.length} row(s) with an unparseable semester:`);
    warnings.forEach((w) =>
      console.log(
        `  ${w.name || w.ufid || 'unknown'}: "${w.raw}" → ${w.reason}`
      )
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
