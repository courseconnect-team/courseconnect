// Unit tests for the pure pipeline helpers and the UF provider.
//
// Run via Node's built-in test runner — no new dep. From the functions/ dir:
//   npx tsc --noEmit
//   node --test --import ts-node/esm src/courseFetcher/__tests__/*.test.ts
// or compile to lib/ first and run `node --test lib/courseFetcher/__tests__`.
//
// (firebase-admin is never imported here, so these tests don't need
// credentials.)

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  addCodeSpace,
  departmentFromCode,
  to24h,
  filterCourse,
  dedupCourses,
  dedupSections,
  finalizeCourse,
  finalizeSection,
  courseKey,
} from '../normalize';
import { ufTermCode } from '../providers/uf';
import { fetchCoursesForConfig } from '../pipeline';
import { validateConfigInput, computeNextRefreshAt } from '../validation';
import type { Fetcher, NormalizedCourse } from '../types';

// --- normalize.addCodeSpace ---

test('addCodeSpace inserts a space between letters and digits', () => {
  assert.equal(addCodeSpace('COP3502'), 'COP 3502');
  assert.equal(addCodeSpace('EEL4924C'), 'EEL 4924C');
});

test('addCodeSpace leaves already-spaced or unknown codes alone', () => {
  assert.equal(addCodeSpace('COP 3502'), 'COP 3502');
  assert.equal(addCodeSpace(''), '');
  assert.equal(addCodeSpace('weird!'), 'weird!');
});

// --- normalize.departmentFromCode ---

test('departmentFromCode returns the leading alphabetic prefix', () => {
  assert.equal(departmentFromCode('COP3502'), 'COP');
  assert.equal(departmentFromCode('MAC2311'), 'MAC');
  assert.equal(departmentFromCode(''), '');
});

// --- normalize.to24h ---

test('to24h handles 24h, 12h, and military formats', () => {
  assert.equal(to24h('08:30'), '08:30');
  assert.equal(to24h('12:50 pm'), '12:50');
  assert.equal(to24h('1:00am'), '01:00');
  assert.equal(to24h('1250'), '12:50');
  assert.equal(to24h('0830'), '08:30');
});

test('to24h returns undefined on nonsense input', () => {
  assert.equal(to24h('period 3'), undefined);
  assert.equal(to24h(''), undefined);
  assert.equal(to24h(undefined), undefined);
});

// --- filter / dedup ---

function course(
  code: string,
  extra: Partial<NormalizedCourse> = {}
): NormalizedCourse {
  return {
    code,
    codeWithSpace: code,
    title: code,
    ...extra,
  };
}

test('filterCourse matches on code prefix', () => {
  const cop = course('COP3502');
  const cda = course('CDA3101');
  const mac = course('MAC2311');
  assert.equal(filterCourse(cop, { codePrefixes: ['COP'] }), true);
  assert.equal(filterCourse(cda, { codePrefixes: ['COP'] }), false);
  assert.equal(filterCourse(mac, { codePrefixes: ['COP', 'CDA'] }), false);
  assert.equal(filterCourse(cda, { codePrefixes: ['COP', 'CDA'] }), true);
});

test('filterCourse respects numberMin/numberMax', () => {
  const c3502 = course('COP3502');
  const c4930 = course('CAP4930');
  assert.equal(filterCourse(c3502, { numberMin: 4000 }), false);
  assert.equal(filterCourse(c4930, { numberMin: 4000 }), true);
  assert.equal(filterCourse(c4930, { numberMax: 4000 }), false);
});

test('dedupCourses keeps the last entry for a given key', () => {
  const out = dedupCourses('UF', '20261', [
    course('COP3502', { title: 'Old' }),
    course('COP3502', { title: 'New' }),
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0].title, 'New');
});

test('dedupSections keeps the last entry for a given classNumber', () => {
  const out = dedupSections('UF', '20261', [
    {
      classNumber: '12345',
      courseCode: 'COP3502',
      instructors: [],
      meetingTimes: [],
    },
    {
      classNumber: '12345',
      courseCode: 'COP3502',
      instructors: [{ name: 'Dr Updated' }],
      meetingTimes: [],
    },
    {
      classNumber: '22222',
      courseCode: 'COP3502',
      instructors: [],
      meetingTimes: [],
    },
  ]);
  assert.equal(out.length, 2);
  const updated = out.find((s) => s.classNumber === '12345');
  assert.equal(updated?.instructors[0]?.name, 'Dr Updated');
});

test('finalizeCourse fills codeWithSpace and department', () => {
  const c = finalizeCourse(course('cop3502'));
  assert.equal(c.code, 'COP3502');
  assert.equal(c.codeWithSpace, 'COP 3502');
  assert.equal(c.department, 'COP');
});

test('finalizeSection normalizes meeting times to 24h when possible', () => {
  const s = finalizeSection({
    classNumber: ' 123 ',
    courseCode: 'cop3502',
    instructors: [{ name: ' Alice ', email: 'a@b.c' }],
    meetingTimes: [
      {
        day: 'M',
        startTime: '12:50 pm',
        endTime: '1:40 pm',
        building: 'LIT',
        room: '109',
      },
      { day: 'T', startTime: 'period 3' }, // unnormalizable
    ],
  });
  assert.equal(s.classNumber, '123');
  assert.equal(s.courseCode, 'COP3502');
  assert.equal(s.instructors[0]?.name, 'Alice');
  assert.equal(s.meetingTimes[0]?.startTime, '12:50');
  assert.equal(s.meetingTimes[0]?.endTime, '13:40');
  assert.equal(s.meetingTimes[0]?.location, 'LIT 109');
  assert.equal(s.meetingTimes[1]?.startTime, undefined);
});

test('courseKey is stable and uppercased', () => {
  assert.equal(courseKey('UF', '20261', 'cop3502'), 'UF:20261:COP3502');
});

// --- provider: UF term code ---

test('ufTermCode maps spring/summer/fall correctly', () => {
  assert.equal(ufTermCode({ term: 'spring', year: 2026 }), '2261');
  assert.equal(ufTermCode({ term: 'summer', year: 2026 }), '2265');
  assert.equal(ufTermCode({ term: 'fall', year: 2026 }), '2268');
});

// --- validation ---

test('validateConfigInput accepts a minimal valid config', () => {
  const res = validateConfigInput({
    label: 'UF Spring CISE',
    provider: 'UF',
    institution: 'UF',
    term: 'spring',
    year: 2026,
    enabled: true,
    refresh: { mode: 'manual' },
  });
  assert.equal(res.ok, true);
});

test('validateConfigInput rejects bad term / provider / prefixes', () => {
  const res = validateConfigInput({
    label: '',
    provider: 'MIT',
    term: 'winter',
    year: 1800,
    codePrefixes: ['x'],
    refresh: { mode: 'monthly' },
  });
  assert.equal(res.ok, false);
  assert.ok(!res.ok && res.errors.length >= 4);
});

test('validateConfigInput folds legacy departments into codePrefixes', () => {
  const res = validateConfigInput({
    label: 'legacy',
    provider: 'UF',
    term: 'fall',
    year: 2026,
    // Old configs may still have `departments` set; valid 2–4 letter codes
    // get folded into codePrefixes. Entries that don't match the UF prefix
    // shape (e.g. 'ECE3') are dropped silently so the config still loads.
    departments: ['EEL', 'CISE', 'ECE3'],
    codePrefixes: ['COP'],
    refresh: { mode: 'manual' },
  });
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.deepEqual([...res.value.codePrefixes].sort(), [
      'CISE',
      'COP',
      'EEL',
    ]);
  }
});

test('validateConfigInput enforces everyHours range for everyNHours', () => {
  const bad = validateConfigInput({
    label: 'x',
    provider: 'UF',
    term: 'fall',
    year: 2026,
    refresh: { mode: 'everyNHours', everyHours: 9999 },
  });
  assert.equal(bad.ok, false);
  const good = validateConfigInput({
    label: 'x',
    provider: 'UF',
    term: 'fall',
    year: 2026,
    refresh: { mode: 'everyNHours', everyHours: 6 },
  });
  assert.equal(good.ok, true);
});

test('computeNextRefreshAt is null for manual and future for interval modes', () => {
  const now = new Date('2026-04-23T12:00:00Z');
  assert.equal(computeNextRefreshAt({ mode: 'manual' }, now), null);
  const hourly = computeNextRefreshAt({ mode: 'hourly' }, now);
  assert.ok(hourly);
  assert.ok(hourly!.getTime() - now.getTime() === 60 * 60 * 1000);
  const every = computeNextRefreshAt(
    { mode: 'everyNHours', everyHours: 6 },
    now
  );
  assert.ok(every!.getTime() - now.getTime() === 6 * 60 * 60 * 1000);
});

// --- pipeline integration with a stub fetcher ---

function ufResponse(courses: unknown[], retrievedRows = courses.length) {
  return [
    {
      COURSES: courses,
      LASTCONTROLNUMBER: 0,
      TOTALROWS: courses.length,
      RETRIEVEDROWS: retrievedRows,
    },
  ];
}

test('fetchCoursesForConfig handles a single page and dedups', async () => {
  const calls: string[] = [];
  // First page has a course with duplicate sections; next page signals end.
  const firstPage = ufResponse([
    {
      code: 'COP3502',
      name: 'Programming Fundamentals 1',
      deptName: 'CISE',
      sections: [
        {
          classNumber: '11111',
          number: '001',
          instructors: [{ name: 'A. Alpha' }],
          meetTimes: [
            {
              meetDays: ['M', 'W', 'F'],
              meetTimeBegin: '12:50 PM',
              meetTimeEnd: '1:40 PM',
              meetBuilding: 'LIT',
              meetRoom: '109',
            },
          ],
        },
        {
          classNumber: '11111',
          number: '001',
          instructors: [{ name: 'B. Beta' }],
          meetTimes: [],
        },
      ],
    },
  ]);
  const emptyPage = ufResponse([], 0); // signals the worker to stop

  const stub: Fetcher = async (url: string) => {
    calls.push(url);
    // 1st request = start of walk (control=0) → data. 2nd = next stride → empty.
    const body = calls.length === 1 ? firstPage : emptyPage;
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  const result = await fetchCoursesForConfig(
    {
      id: 'cfg-1',
      provider: 'UF',
      institution: 'UF',
      term: 'fall',
      year: 2026,
      filters: { codePrefixes: ['COP'] },
      concurrency: 1,
    },
    { fetcher: stub }
  );

  assert.equal(result.status, 'success');
  assert.equal(result.courses.length, 1);
  assert.equal(result.courses[0].code, 'COP3502');
  assert.equal(result.sections.length, 1);
  assert.equal(result.sections[0].instructors[0]?.name, 'B. Beta');
  assert.equal(
    (result.providerMeta as Record<string, unknown>).termCode,
    '2268'
  );
  // Single worker: one data page + one empty page to terminate.
  assert.equal(calls.length, 2);
  // Category=RES and stride increments by PAGE_SIZE between calls.
  assert.match(calls[0], /[?&]category=RES(&|$)/);
  assert.match(calls[0], /[?&]last-control-number=0(&|$)/);
  assert.match(calls[1], /[?&]last-control-number=50(&|$)/);
});

test('stride-parallel walk: workers start at PAGE_SIZE*i with stride PAGE_SIZE*N', async () => {
  const seen = new Set<number>();
  const stub: Fetcher = async (url: string) => {
    const m = url.match(/last-control-number=(\d+)/);
    const n = m ? Number(m[1]) : -1;
    seen.add(n);
    return new Response(JSON.stringify(ufResponse([], 0)), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  await fetchCoursesForConfig(
    {
      id: 'cfg-stride',
      provider: 'UF',
      institution: 'UF',
      term: 'spring',
      year: 2026,
      filters: {},
      concurrency: 4,
    },
    { fetcher: stub }
  );

  // With N=4: workers start at 0, 50, 100, 150, each terminates on first
  // empty page. Seen set should include exactly those offsets.
  assert.deepEqual(
    Array.from(seen).sort((a, b) => a - b),
    [0, 50, 100, 150]
  );
});

test('fetchCoursesForConfig marks failed when every worker errors', async () => {
  const stub: Fetcher = async () => new Response('oops', { status: 500 });
  const result = await fetchCoursesForConfig(
    {
      id: 'cfg-2',
      provider: 'UF',
      institution: 'UF',
      term: 'spring',
      year: 2026,
      filters: { codePrefixes: ['COP'] },
      concurrency: 1,
    },
    { fetcher: stub }
  );
  assert.equal(result.status, 'failed');
  assert.ok(result.errors.length > 0);
});

test('fetchCoursesForConfig handles non-JSON gracefully', async () => {
  const stub: Fetcher = async () =>
    new Response('<html>oops</html>', {
      status: 200,
      headers: { 'content-type': 'text/html' },
    });
  const result = await fetchCoursesForConfig(
    {
      id: 'cfg-3',
      provider: 'UF',
      institution: 'UF',
      term: 'fall',
      year: 2026,
      filters: {},
      concurrency: 1,
    },
    { fetcher: stub }
  );
  assert.equal(result.status, 'failed');
  assert.ok(result.errors.some((e) => e.includes('non-JSON')));
});
