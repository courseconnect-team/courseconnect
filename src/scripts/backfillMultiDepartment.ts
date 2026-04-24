/**
 * Backfill migration for multi-department support (Unit 7).
 *
 * Idempotent. Safe to re-run. Always prints a plan; writes only when
 * --execute is passed. Preserves all legacy fields — only ADDS new fields
 * (users.roles[] / adminOfDepartmentIds[] / facultyOfDepartmentIds[] /
 * departmentIds[]; applications.departmentIds[]; research-listings.departmentId).
 *
 * Usage:
 *   npm run backfill:multidept:dry          # default; prints intended writes
 *   npm run backfill:multidept              # applies writes
 *   npm run backfill:multidept -- --users   # scope to just users
 *   npm run backfill:multidept -- --applications
 *   npm run backfill:multidept -- --research
 *
 * Requires GOOGLE_APPLICATION_CREDENTIALS to point at a service-account key.
 *
 * What the script does NOT do:
 *   - Write `superAdmin` on anyone. Bootstrap remains via
 *     `npm run bootstrap:super-admin` + explicit email.
 *   - Touch `pendingMemberships/` — that collection is always current.
 *   - Drop any legacy field. The cleanup PR (one release after this lands)
 *     removes `users/{uid}.department` and related legacy strings.
 */

const admin = require('firebase-admin');
// CommonJS require (not an ES import) so the tsconfig "module": "esnext"
// setting doesn't force Node to treat this file as ESM. Matches the pattern
// used by src/scripts/migrateApplications.ts.
const { resolveDepartmentCode } = require('../constants/research') as {
  resolveDepartmentCode: (raw: string | undefined | null) => string | null;
};

type AnyMap = Record<string, any>;

const DRY = !process.argv.includes('--execute');
const ONLY_USERS = process.argv.includes('--users');
const ONLY_APPS = process.argv.includes('--applications');
const ONLY_RESEARCH = process.argv.includes('--research');
const RUN_ALL = !ONLY_USERS && !ONLY_APPS && !ONLY_RESEARCH;

function init() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: 'courseconnect-c6a7b',
    });
  }
  return admin.firestore();
}

function deptIdOf(dept: string | null | undefined): string | null {
  const code = resolveDepartmentCode(dept);
  return code ? code.toLowerCase() : null;
}

interface Stats {
  scanned: number;
  skipped_no_change: number;
  updated: number;
  flagged_no_signal: number;
  errors: number;
}

function newStats(): Stats {
  return {
    scanned: 0,
    skipped_no_change: 0,
    updated: 0,
    flagged_no_signal: 0,
    errors: 0,
  };
}

// --- users ---

async function backfillUsers(db: any): Promise<Stats> {
  const stats = newStats();
  const noSignal: Array<{ uid: string; email: string; role: string }> = [];

  const snap = await db.collection('users').get();
  for (const doc of snap.docs) {
    stats.scanned += 1;
    const data = doc.data() as AnyMap;
    const role = typeof data.role === 'string' ? (data.role as string) : '';
    const department =
      typeof data.department === 'string' ? (data.department as string) : '';

    // Only promote real staff roles to the per-dept model. Student and
    // unapproved users stay as they are; student status is per-application
    // not per-user.
    if (role !== 'admin' && role !== 'faculty') {
      stats.skipped_no_change += 1;
      continue;
    }

    const deptId = deptIdOf(department);
    if (!deptId) {
      stats.flagged_no_signal += 1;
      noSignal.push({
        uid: doc.id,
        email: typeof data.email === 'string' ? data.email : '',
        role,
      });
      continue;
    }

    // Check whether the new fields already carry this mapping.
    const existingRoles = Array.isArray(data.roles)
      ? (data.roles as AnyMap[])
      : [];
    const alreadyPresent = existingRoles.some(
      (r) =>
        r && typeof r === 'object' && r.deptId === deptId && r.role === role
    );
    const existingDeptIds = Array.isArray(data.departmentIds)
      ? (data.departmentIds as string[])
      : [];
    const existingAdminIds = Array.isArray(data.adminOfDepartmentIds)
      ? (data.adminOfDepartmentIds as string[])
      : [];
    const existingFacultyIds = Array.isArray(data.facultyOfDepartmentIds)
      ? (data.facultyOfDepartmentIds as string[])
      : [];

    const deptIdsNext = Array.from(
      new Set([...existingDeptIds, deptId])
    ).sort();
    const adminIdsNext =
      role === 'admin'
        ? Array.from(new Set([...existingAdminIds, deptId])).sort()
        : existingAdminIds.slice().sort();
    const facultyIdsNext =
      role === 'faculty'
        ? Array.from(new Set([...existingFacultyIds, deptId])).sort()
        : existingFacultyIds.slice().sort();

    if (
      alreadyPresent &&
      deptIdsNext.length === existingDeptIds.length &&
      adminIdsNext.length === existingAdminIds.length &&
      facultyIdsNext.length === existingFacultyIds.length
    ) {
      stats.skipped_no_change += 1;
      continue;
    }

    const rolesNext = alreadyPresent
      ? existingRoles
      : [...existingRoles, { deptId, role }];

    console.log(
      `  user  ${doc.id}  ${role}@${deptId}  (email=${data.email ?? '?'})`
    );
    stats.updated += 1;

    if (!DRY) {
      try {
        await doc.ref.set(
          {
            roles: rolesNext,
            departmentIds: deptIdsNext,
            adminOfDepartmentIds: adminIdsNext,
            facultyOfDepartmentIds: facultyIdsNext,
          },
          { merge: true }
        );
      } catch (err) {
        console.error(`  ERROR writing users/${doc.id}:`, err);
        stats.errors += 1;
        stats.updated -= 1;
      }
    }
  }

  if (noSignal.length > 0) {
    console.log('');
    console.log(`Users with no resolvable department (${noSignal.length}):`);
    for (const row of noSignal) {
      console.log(`  ${row.uid}  role=${row.role}  email=${row.email}`);
    }
    console.log(
      'Resolve these via the super admin Users + Departments UI before cutover.'
    );
  }

  return stats;
}

// --- applications ---

async function backfillApplications(db: any): Promise<Stats> {
  const stats = newStats();

  // Walk applications/{type}/uid/{uid}. The known types are
  // course_assistant and supervised_teaching; we iterate dynamically in
  // case more are added later.
  const typesSnap = await db.collection('applications').listDocuments();
  for (const typeRef of typesSnap) {
    const uidsSnap = await typeRef.collection('uid').get();
    for (const appDoc of uidsSnap.docs) {
      stats.scanned += 1;
      const data = appDoc.data() as AnyMap;
      const existingIds = Array.isArray(data.departmentIds)
        ? (data.departmentIds as string[])
        : null;

      // Resolve from the courses map.
      const coursesMap =
        data.courses && typeof data.courses === 'object' ? data.courses : {};
      const resolved = new Set<string>();
      for (const [sem, bucket] of Object.entries(coursesMap)) {
        if (!bucket || typeof bucket !== 'object') continue;
        for (const courseId of Object.keys(bucket as AnyMap)) {
          try {
            const courseSnap = await db
              .collection('semesters')
              .doc(sem)
              .collection('courses')
              .doc(courseId)
              .get();
            const raw = courseSnap.data()?.department;
            const code = deptIdOf(typeof raw === 'string' ? raw : '');
            if (code) resolved.add(code);
          } catch (err) {
            // Tolerate per-course lookup failures; log and continue.
            console.warn(
              `    lookup failed: ${sem}/${courseId} on ${appDoc.ref.path}`
            );
          }
        }
      }

      const resolvedSorted = Array.from(resolved).sort();
      const union = Array.from(
        new Set([...(existingIds ?? []), ...resolvedSorted])
      ).sort();

      const changed =
        !existingIds ||
        union.length !== existingIds.length ||
        union.some((d, i) => d !== existingIds[i]);

      if (!changed) {
        stats.skipped_no_change += 1;
        continue;
      }

      console.log(
        `  application  ${appDoc.ref.path}  departmentIds=[${
          union.join(',') || '<none>'
        }]`
      );
      stats.updated += 1;

      if (!DRY) {
        try {
          await appDoc.ref.set({ departmentIds: union }, { merge: true });
        } catch (err) {
          console.error(`  ERROR writing ${appDoc.ref.path}:`, err);
          stats.errors += 1;
          stats.updated -= 1;
        }
      }
    }
  }

  return stats;
}

// --- research listings ---

async function backfillResearch(db: any): Promise<Stats> {
  const stats = newStats();

  const snap = await db.collection('research-listings').get();
  for (const doc of snap.docs) {
    stats.scanned += 1;
    const data = doc.data() as AnyMap;
    const existing =
      typeof data.departmentId === 'string'
        ? (data.departmentId as string)
        : '';
    const resolved = deptIdOf(
      typeof data.department === 'string' ? data.department : ''
    );

    if (!resolved) {
      stats.flagged_no_signal += 1;
      console.log(
        `  research  ${doc.id}  <no resolvable dept>  raw="${data.department}"`
      );
      continue;
    }
    if (existing === resolved) {
      stats.skipped_no_change += 1;
      continue;
    }

    console.log(`  research  ${doc.id}  departmentId=${resolved}`);
    stats.updated += 1;

    if (!DRY) {
      try {
        await doc.ref.set({ departmentId: resolved }, { merge: true });
      } catch (err) {
        console.error(`  ERROR writing research-listings/${doc.id}:`, err);
        stats.errors += 1;
        stats.updated -= 1;
      }
    }
  }

  return stats;
}

// --- entry point ---

async function main() {
  const db = init();

  console.log(
    `${DRY ? '[DRY RUN]' : '[EXECUTE]'} Multi-department backfill  (scope: ${[
      ONLY_USERS && 'users',
      ONLY_APPS && 'applications',
      ONLY_RESEARCH && 'research',
      RUN_ALL && 'all',
    ]
      .filter(Boolean)
      .join(',')})`
  );
  console.log('');

  let total: Stats = newStats();

  const runs: Array<[string, () => Promise<Stats>]> = [];
  if (RUN_ALL || ONLY_USERS) runs.push(['users', () => backfillUsers(db)]);
  if (RUN_ALL || ONLY_APPS)
    runs.push(['applications', () => backfillApplications(db)]);
  if (RUN_ALL || ONLY_RESEARCH)
    runs.push(['research', () => backfillResearch(db)]);

  for (const [label, run] of runs) {
    console.log(`--- ${label} ---`);
    const stats = await run();
    console.log(
      `  ${label}: scanned=${stats.scanned}  ` +
        `updated=${stats.updated}  ` +
        `skipped=${stats.skipped_no_change}  ` +
        `flagged=${stats.flagged_no_signal}  ` +
        `errors=${stats.errors}`
    );
    console.log('');
    for (const key of Object.keys(stats) as Array<keyof Stats>) {
      total[key] += stats[key];
    }
  }

  console.log('--- total ---');
  console.log(
    `  scanned=${total.scanned}  updated=${total.updated}  ` +
      `skipped=${total.skipped_no_change}  flagged=${total.flagged_no_signal}  ` +
      `errors=${total.errors}`
  );
  if (DRY) {
    console.log(
      '\nDry run only — re-run with --execute to apply the writes above.'
    );
  }
  if (total.errors > 0) {
    process.exit(2);
  }
}

main().catch((err) => {
  console.error('backfillMultiDepartment failed:', err);
  process.exit(1);
});
