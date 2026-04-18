'use client';

import { useEffect, useMemo, useState } from 'react';
import firebase from '@/firebase/firebase_config';

export type RawApplication = {
  id: string;
  status?: string;
  date?: string;
  position?: string;
  department?: string;
  degree?: string;
  available_semesters?: string | string[];
  email?: string;
  firstname?: string;
  lastname?: string;
  ufid?: string;
  courses?: any;
};

export type RawUser = {
  id: string;
  role?: string;
  department?: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  lastLogin?: { toDate?: () => Date } | null;
};

export type RawLogin = {
  id: string;
  uid?: string;
  email?: string;
  timestamp?: { toDate?: () => Date } | null;
};

export type RawBug = {
  id: string;
  summary?: string;
  severity?: 'low' | 'medium' | 'high';
  email?: string;
  role?: string;
  timestamp?: { toDate?: () => Date } | null;
};

export type RawAssignment = {
  id: string;
  student_uid?: string;
  email?: string;
  name?: string;
  department?: string;
  semesters?: string[];
  hours?: number[];
  position?: string;
  class_codes?: string;
  date?: string;
};

export type RawCourse = {
  id: string;
  code?: string;
  department?: string;
  semester?: string;
  professor_emails?: string[] | string;
};

function toDate(ts: any): Date | null {
  if (!ts) return null;
  if (ts?.toDate) {
    try {
      return ts.toDate();
    } catch {
      return null;
    }
  }
  if (typeof ts === 'string') {
    // app date format: M-D-YYYY (e.g. "4-18-2026")
    const parts = ts.split('-').map((n) => Number(n));
    if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
      const [m, d, y] = parts;
      return new Date(y, m - 1, d);
    }
    const parsed = new Date(ts);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

export function useAdminStatsData() {
  const [applications, setApplications] = useState<RawApplication[]>([]);
  const [users, setUsers] = useState<RawUser[]>([]);
  const [logins, setLogins] = useState<RawLogin[]>([]);
  const [bugs, setBugs] = useState<RawBug[]>([]);
  const [assignments, setAssignments] = useState<RawAssignment[]>([]);
  const [courses, setCourses] = useState<RawCourse[]>([]);
  const [semesters, setSemesters] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = firebase.firestore();
    let loaded = 0;
    const EXPECTED = 7;
    const markLoaded = () => {
      loaded += 1;
      if (loaded >= EXPECTED) setLoading(false);
    };

    const unsubApps = db
      .collection('applications')
      .doc('course_assistant')
      .collection('uid')
      .onSnapshot(
        (snap) => {
          setApplications(
            snap.docs.map(
              (d) => ({ id: d.id, ...(d.data() as any) } as RawApplication)
            )
          );
          markLoaded();
        },
        () => markLoaded()
      );

    const unsubUsers = db.collection('users').onSnapshot(
      (snap) => {
        setUsers(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as RawUser))
        );
        markLoaded();
      },
      () => markLoaded()
    );

    const unsubLogins = db
      .collection('login_events')
      .orderBy('timestamp', 'desc')
      .limit(2000)
      .onSnapshot(
        (snap) => {
          setLogins(
            snap.docs.map(
              (d) => ({ id: d.id, ...(d.data() as any) } as RawLogin)
            )
          );
          markLoaded();
        },
        () => markLoaded()
      );

    const unsubBugs = db
      .collection('bug_reports')
      .orderBy('timestamp', 'desc')
      .limit(1000)
      .onSnapshot(
        (snap) => {
          setBugs(
            snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as RawBug))
          );
          markLoaded();
        },
        () => markLoaded()
      );

    const unsubAssignments = db.collection('assignments').onSnapshot(
      (snap) => {
        setAssignments(
          snap.docs.map(
            (d) => ({ id: d.id, ...(d.data() as any) } as RawAssignment)
          )
        );
        markLoaded();
      },
      () => markLoaded()
    );

    const unsubCourses = db.collection('courses').onSnapshot(
      (snap) => {
        setCourses(
          snap.docs.map(
            (d) => ({ id: d.id, ...(d.data() as any) } as RawCourse)
          )
        );
        // Also try the newer nested path; merge into same state if found.
        db.collectionGroup('courses')
          .get()
          .then((groupSnap) => {
            const extras = groupSnap.docs
              .filter((d) => d.ref.parent.parent?.parent.id === 'semesters')
              .map((d) => ({ id: d.id, ...(d.data() as any) } as RawCourse));
            if (extras.length > 0) {
              setCourses((prev) => {
                const seen = new Set(prev.map((c) => c.id));
                const merged = [...prev];
                for (const c of extras) if (!seen.has(c.id)) merged.push(c);
                return merged;
              });
            }
          })
          .catch(() => undefined);
        markLoaded();
      },
      () => markLoaded()
    );

    const unsubSemesters = db.collection('semesters').onSnapshot(
      (snap) => {
        setSemesters(snap.docs.map((d) => d.id));
        markLoaded();
      },
      () => markLoaded()
    );

    return () => {
      unsubApps();
      unsubUsers();
      unsubLogins();
      unsubBugs();
      unsubAssignments();
      unsubCourses();
      unsubSemesters();
    };
  }, []);

  return {
    applications,
    users,
    logins,
    bugs,
    assignments,
    courses,
    semesters,
    loading,
  };
}

export type StatsRange = {
  label: string;
  start: Date | null; // null = all time
};

export function useStatsRanges(): Record<string, StatsRange> {
  return useMemo(() => {
    const now = new Date();
    const startOfDay = (d: Date) =>
      new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const shift = (days: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() - days);
      return startOfDay(d);
    };
    return {
      '24h': {
        label: 'Last 24h',
        start: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      },
      '7d': { label: 'Last 7 days', start: shift(7) },
      '30d': { label: 'Last 30 days', start: shift(30) },
      '90d': { label: 'Last 90 days', start: shift(90) },
      all: { label: 'All time', start: null },
    };
  }, []);
}

function inRange(d: Date | null, start: Date | null): boolean {
  if (!d) return false;
  if (!start) return true;
  return d.getTime() >= start.getTime();
}

function matchesSemester(
  semesterFilter: string | null,
  appSemesters: string | string[] | undefined
): boolean {
  if (!semesterFilter) return true;
  if (!appSemesters) return false;
  const arr = Array.isArray(appSemesters) ? appSemesters : [appSemesters];
  return arr.some((s) => (s || '').trim() === semesterFilter);
}

function matchesDepartment(
  deptFilter: string | null,
  dept: string | undefined
): boolean {
  if (!deptFilter) return true;
  return (dept || '').trim() === deptFilter;
}

const status = (s?: string) => (s || 'pending').toLowerCase();
const isApproved = (s?: string) =>
  status(s).includes('approved') && !status(s).includes('denied');
const isDenied = (s?: string) => status(s).includes('denied');
const isPending = (s?: string) => !isApproved(s) && !isDenied(s);

export function computeAdminStats(args: {
  applications: RawApplication[];
  users: RawUser[];
  logins: RawLogin[];
  bugs: RawBug[];
  assignments: RawAssignment[];
  courses: RawCourse[];
  rangeStart: Date | null;
  department: string | null;
  semester: string | null;
}) {
  const {
    applications,
    users,
    logins,
    bugs,
    assignments,
    courses,
    rangeStart,
    department,
    semester,
  } = args;

  const filteredApps = applications.filter(
    (a) =>
      matchesDepartment(department, a.department) &&
      matchesSemester(semester, a.available_semesters)
  );
  const filteredAssignments = assignments.filter(
    (a) =>
      matchesDepartment(department, a.department) &&
      matchesSemester(
        semester,
        Array.isArray(a.semesters) ? a.semesters : a.semesters
      )
  );
  const filteredCourses = courses.filter(
    (c) =>
      matchesDepartment(department, c.department) &&
      (!semester || (c.semester || '').trim() === semester)
  );

  const appsInRange = filteredApps.filter((a) =>
    inRange(toDate(a.date), rangeStart)
  );
  const loginsInRange = logins.filter((l) =>
    inRange(toDate(l.timestamp), rangeStart)
  );
  const bugsInRange = bugs.filter((b) =>
    inRange(toDate(b.timestamp), rangeStart)
  );
  const assignmentsInRange = filteredAssignments.filter((a) =>
    inRange(toDate(a.date), rangeStart)
  );

  const submitted = appsInRange.length;
  const approved = appsInRange.filter((a) => isApproved(a.status)).length;
  const denied = appsInRange.filter((a) => isDenied(a.status)).length;
  const pending = appsInRange.filter((a) => isPending(a.status)).length;

  const totalApproved = filteredApps.filter((a) => isApproved(a.status)).length;
  const totalPending = filteredApps.filter((a) => isPending(a.status)).length;
  const totalDenied = filteredApps.filter((a) => isDenied(a.status)).length;

  const approvalRate =
    approved + denied === 0
      ? 0
      : Math.round((approved / (approved + denied)) * 100);

  const uniqueLoginUids = new Set(
    loginsInRange.map((l) => l.uid).filter(Boolean)
  );

  const bugsBySeverity = {
    high: bugsInRange.filter((b) => b.severity === 'high').length,
    medium: bugsInRange.filter((b) => b.severity === 'medium').length,
    low: bugsInRange.filter((b) => b.severity === 'low').length,
  };

  const byDepartment = tally(appsInRange.map((a) => a.department || 'Unknown'));
  const byPosition = tally(appsInRange.map((a) => a.position || 'Unknown'));
  const byDegree = tally(appsInRange.map((a) => a.degree || 'Unknown'));
  const byRole = tally(users.map((u) => u.role || 'unknown'));

  // Funnel (filtered, all-time scope):
  const assignedStudentUids = new Set(
    filteredAssignments.map((a) => a.student_uid).filter(Boolean) as string[]
  );
  const approvedApplicantIds = filteredApps
    .filter((a) => isApproved(a.status))
    .map((a) => a.id);
  const assignedFromApproved = approvedApplicantIds.filter((id) =>
    assignedStudentUids.has(id)
  ).length;

  const funnel = {
    submitted: filteredApps.length,
    facultyApproved: filteredApps.filter((a) => {
      const s = status(a.status);
      return s.includes('approved');
    }).length,
    adminApproved: totalApproved,
    assigned: assignedFromApproved,
  };

  // Unassigned approved applicants (ready for admin to assign)
  const unassignedApproved = filteredApps
    .filter((a) => isApproved(a.status) && !assignedStudentUids.has(a.id))
    .sort(
      (a, b) =>
        (toDate(b.date)?.getTime() || 0) - (toDate(a.date)?.getTime() || 0)
    );

  // Staffing coverage: how many courses have at least one assignment
  const assignedCourseCodes = new Set<string>();
  for (const a of filteredAssignments) {
    if (a.class_codes)
      for (const c of String(a.class_codes).split(','))
        assignedCourseCodes.add(c.trim());
  }
  const coursesWithStaff = filteredCourses.filter((c) =>
    c.code ? assignedCourseCodes.has(c.code) : false
  ).length;
  const coursesWithoutStaff = filteredCourses.filter(
    (c) => !c.code || !assignedCourseCodes.has(c.code)
  );
  const totalCourses = filteredCourses.length;
  const staffingCoverage =
    totalCourses === 0
      ? 0
      : Math.round((coursesWithStaff / totalCourses) * 100);

  // Hours assigned
  const sumHours = (list: RawAssignment[]) =>
    list.reduce(
      (acc, a) =>
        acc +
        (Array.isArray(a.hours)
          ? a.hours.reduce((s, h) => s + (Number(h) || 0), 0)
          : Number(a.hours) || 0),
      0
    );
  const hoursTotal = sumHours(filteredAssignments);
  const hoursInRange = sumHours(assignmentsInRange);
  const hoursByDept = Array.from(
    filteredAssignments.reduce<Map<string, number>>((acc, a) => {
      const k = a.department || 'Unknown';
      const h = Array.isArray(a.hours)
        ? a.hours.reduce((s, hh) => s + (Number(hh) || 0), 0)
        : Number(a.hours) || 0;
      acc.set(k, (acc.get(k) || 0) + h);
      return acc;
    }, new Map())
  )
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);

  // 30-day daily submissions trend
  const daily = buildDailySeries(
    filteredApps.map((a) => toDate(a.date)).filter(Boolean) as Date[],
    30
  );

  // Unapproved faculty awaiting admin action
  const unapprovedFaculty = users.filter(
    (u) => (u.role || '').toLowerCase() === 'unapproved'
  ).length;

  // Avg hours per assignment
  const avgHoursPerAssignment =
    filteredAssignments.length === 0
      ? 0
      : Math.round((hoursTotal / filteredAssignments.length) * 10) / 10;

  return {
    submitted,
    approved,
    denied,
    pending,
    totalApplications: filteredApps.length,
    totalApproved,
    totalPending,
    totalDenied,
    approvalRate,
    totalUsers: users.length,
    totalLogins: loginsInRange.length,
    uniqueLogins: uniqueLoginUids.size,
    newUsersInRange: users.filter((u) =>
      inRange(toDate(u.lastLogin as any), rangeStart)
    ).length,
    bugsInRange: bugsInRange.length,
    bugsBySeverity,
    byDepartment,
    byPosition,
    byDegree,
    byRole,
    recentBugs: bugsInRange.slice(0, 10),
    funnel,
    unassignedApproved,
    coursesWithStaff,
    coursesWithoutStaffList: coursesWithoutStaff,
    totalCourses,
    staffingCoverage,
    hoursTotal,
    hoursInRange,
    hoursByDept,
    daily,
    unapprovedFaculty,
    avgHoursPerAssignment,
    totalAssignments: filteredAssignments.length,
    assignmentsInRange: assignmentsInRange.length,
  };
}

function tally(items: string[]): Array<{ key: string; count: number }> {
  const map = new Map<string, number>();
  for (const v of items) map.set(v, (map.get(v) || 0) + 1);
  return Array.from(map.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}

function buildDailySeries(
  dates: Date[],
  windowDays: number
): Array<{ label: string; count: number; iso: string }> {
  const now = new Date();
  const buckets = new Map<string, number>();
  for (let i = windowDays - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = isoDay(d);
    buckets.set(key, 0);
  }
  for (const d of dates) {
    const key = isoDay(d);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) || 0) + 1);
  }
  return Array.from(buckets.entries()).map(([iso, count]) => {
    const d = new Date(iso);
    return {
      iso,
      count,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
    };
  });
}

function isoDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
