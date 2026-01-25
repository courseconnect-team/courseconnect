import { useEffect, useMemo, useState } from 'react';
import firebase from '@/firebase/firebase_config';
import { useDocument } from 'react-firebase-hooks/firestore';
import { isE2EMode, getE2ERole } from '@/utils/featureFlags';

const normalizeRole = (value) => {
  const raw = (value ?? '').toString().trim();
  if (!raw) return '';

  const lower = raw.toLowerCase();
  if (lower === 'student') return 'Student';
  if (lower === 'student_applying') return 'student_applying';
  if (lower === 'student_applied') return 'student_applied';
  if (lower === 'student_accepted') return 'student_accepted';
  if (lower === 'student_denied') return 'student_denied';
  if (lower === 'faculty') return 'faculty';
  if (lower === 'admin') return 'admin';
  return raw;
};

const GetUserRole = (userId) => {
  const [role, setRole] = useState('');

  //Testing Code Start
  const stubRole = normalizeRole(getE2ERole());
  const STUB = [stubRole || role || 'admin', false, null];

  const e2e = isE2EMode();
  //Testing Code End

  const docRef = useMemo(() => {
    if (e2e || !userId) return null;
    return firebase.firestore().collection('users').doc(userId);
  }, [e2e, userId]);

  const [snapshot, loading, error] = useDocument(docRef);

  useEffect(() => {
    if (e2e) return;
    const data = snapshot?.data();
    if (data?.role) setRole(data.role);
  }, [e2e, snapshot]);

  if (e2e) return STUB;
  return [role, loading, error];
};

export default GetUserRole;
