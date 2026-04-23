'use client';

import { useEffect, useMemo, useState } from 'react';
import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';
import { useAuth } from '@/firebase/auth/auth_context';

// Unified identity hook — introduced in Unit 3 of multi-department support.
// Replaces the scattered `useAuth() + GetUserRole()` pattern with a single
// subscription that returns Firebase Auth user, legacy role/department (still
// dual-written), and the new per-dept roles model.
//
// During the transition window, consumers should prefer:
//   - `superAdmin` for the super-admin-only gate
//   - `adminOfDepartmentIds` / `facultyOfDepartmentIds` / `departmentIds` for
//     department-scoped decisions
//   - `legacyRole` only where migration has not yet touched a call site; this
//     field is dropped in the cleanup PR after Unit 7.

export type PerDeptRole = 'admin' | 'faculty';

export interface CurrentUserRoleEntry {
  deptId: string;
  role: PerDeptRole;
}

export interface CurrentUser {
  firebaseUser: firebase.User | null;
  superAdmin: boolean;
  roles: CurrentUserRoleEntry[];
  adminOfDepartmentIds: string[];
  facultyOfDepartmentIds: string[];
  departmentIds: string[];
  activeDeptId: string | null; // the single admin dept if any; null for faculty-only / super-only
  // Legacy fields — read during transition; dropped in cleanup PR.
  legacyRole: string;
  legacyDepartment: string;
}

export interface UseCurrentUserResult {
  user: CurrentUser;
  loading: boolean;
  error: Error | null;
}

const EMPTY: CurrentUser = {
  firebaseUser: null,
  superAdmin: false,
  roles: [],
  adminOfDepartmentIds: [],
  facultyOfDepartmentIds: [],
  departmentIds: [],
  activeDeptId: null,
  legacyRole: '',
  legacyDepartment: '',
};

function sanitizeStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string');
}

function sanitizeRoles(v: unknown): CurrentUserRoleEntry[] {
  if (!Array.isArray(v)) return [];
  const out: CurrentUserRoleEntry[] = [];
  for (const entry of v) {
    if (!entry || typeof entry !== 'object') continue;
    const rec = entry as Record<string, unknown>;
    const deptId = typeof rec.deptId === 'string' ? rec.deptId : null;
    const role =
      rec.role === 'admin' || rec.role === 'faculty'
        ? (rec.role as PerDeptRole)
        : null;
    if (deptId && role) out.push({ deptId, role });
  }
  return out;
}

export function useCurrentUser(): UseCurrentUserResult {
  const { user: firebaseUser } = useAuth();
  const [docData, setDocData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!firebaseUser?.uid) {
      setDocData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const unsub = firebase
      .firestore()
      .collection('users')
      .doc(firebaseUser.uid)
      .onSnapshot(
        (snap) => {
          setDocData((snap.data() as Record<string, unknown>) ?? null);
          setLoading(false);
        },
        (err) => {
          console.error('useCurrentUser listener error:', err);
          setError(err);
          setLoading(false);
        }
      );
    return () => unsub();
  }, [firebaseUser?.uid]);

  const current = useMemo<CurrentUser>(() => {
    if (!firebaseUser || !docData) {
      return { ...EMPTY, firebaseUser };
    }

    const roles = sanitizeRoles(docData.roles);
    const adminOfDepartmentIds = sanitizeStringArray(
      docData.adminOfDepartmentIds
    );
    const facultyOfDepartmentIds = sanitizeStringArray(
      docData.facultyOfDepartmentIds
    );
    const departmentIds = sanitizeStringArray(docData.departmentIds);

    return {
      firebaseUser,
      superAdmin: docData.superAdmin === true,
      roles,
      adminOfDepartmentIds,
      facultyOfDepartmentIds,
      departmentIds:
        departmentIds.length > 0
          ? departmentIds
          : Array.from(
              new Set([...adminOfDepartmentIds, ...facultyOfDepartmentIds])
            ),
      activeDeptId: adminOfDepartmentIds[0] ?? null,
      legacyRole:
        typeof docData.role === 'string' ? (docData.role as string) : '',
      legacyDepartment:
        typeof docData.department === 'string'
          ? (docData.department as string)
          : '',
    };
  }, [firebaseUser, docData]);

  return { user: current, loading, error };
}
