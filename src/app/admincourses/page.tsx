'use client';

import * as React from 'react';
import { Box, Paper, Tab, Tabs } from '@mui/material';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '@/firebase/auth/auth_context';
import GetUserRole from '@/firebase/util/GetUserRole';
import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';
import Courses from '@/component/Dashboard/AdminCourses/Courses';
import PageLayout from '@/components/PageLayout/PageLayout';
import { getNavItems } from '@/hooks/useGetItems';
import { isE2EMode } from '@/utils/featureFlags';
import { useSemesters } from '@/hooks/useSemesterOptions';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { resolveDepartmentCode } from '@/constants/research';
import SemesterStatus from './SemesterStatus';
import AutoFetchPanel from './AutoFetchPanel';
import UploadPanel from './UploadPanel';

type AdminCoursesTab = 'fetch' | 'upload' | 'manage';

export default function AdminCoursesPage() {
  const { currentSemester } = useSemesters();
  const { user } = useAuth();
  const [role, loading] = GetUserRole(user?.uid);
  const { user: currentUser } = useCurrentUser();
  const uploadDeptCode =
    (currentUser.activeDeptId ?? '').toUpperCase() ||
    resolveDepartmentCode(currentUser.legacyDepartment) ||
    '';

  const isE2E = isE2EMode();
  const [semester, setSemester] = React.useState<string>(currentSemester);
  const [semesters, setSemesters] = React.useState<string[]>([]);
  const [semesterHidden, setSemesterHidden] = React.useState(false);
  const [processing, setProcessing] = React.useState(false);
  const [tab, setTab] = React.useState<AdminCoursesTab>('fetch');

  React.useEffect(() => {
    if (isE2E) {
      setSemesters([]);
      setSemesterHidden(false);
      return;
    }
    const db = firebase.firestore();
    const unsub = db.collection('semesters').onSnapshot(
      (snap) => {
        const ids: string[] = [];
        snap.forEach((doc) => ids.push(doc.id));
        ids.sort((a, b) => b.localeCompare(a));
        setSemesters(ids);
        if (!semester && ids.length > 0) setSemester(ids[0]);
      },
      (err) => {
        console.error('semesters listener error:', err);
      }
    );
    return () => unsub();
  }, [isE2E, semester]);

  React.useEffect(() => {
    if (isE2E || !semester) {
      setSemesterHidden(false);
      return;
    }
    const unsub = firebase
      .firestore()
      .collection('semesters')
      .doc(semester)
      .onSnapshot(
        (snap) => setSemesterHidden(!!snap.data()?.hidden),
        () => setSemesterHidden(false)
      );
    return () => unsub();
  }, [isE2E, semester]);

  const handleToggleHidden = async () => {
    if (!semester) return;
    await firebase
      .firestore()
      .collection('semesters')
      .doc(semester)
      .set({ hidden: !semesterHidden }, { merge: true });
  };

  if (loading) return <div>Loading…</div>;
  if (role !== 'admin') return <div>Forbidden</div>;

  return (
    <PageLayout mainTitle="Courses" navItems={getNavItems(role)}>
      <Toaster />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pb: 4 }}>
        <SemesterStatus
          semester={semester}
          semesters={semesters}
          semesterHidden={semesterHidden}
          onSemesterChange={setSemester}
          onSemesterCreated={setSemester}
          onToggleHidden={handleToggleHidden}
        />

        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
          }}
        >
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{
              borderBottom: '1px solid',
              borderColor: 'divider',
              px: 1.5,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                minHeight: 52,
              },
              '& .Mui-selected': { color: '#562EBA !important' },
              '& .MuiTabs-indicator': { backgroundColor: '#562EBA' },
            }}
          >
            <Tab
              value="fetch"
              icon={<AutoAwesomeOutlinedIcon fontSize="small" />}
              iconPosition="start"
              label="Auto-fetch"
            />
            <Tab
              value="upload"
              icon={<FileUploadOutlinedIcon fontSize="small" />}
              iconPosition="start"
              label="Upload & maintain"
            />
            <Tab
              value="manage"
              icon={<ListAltOutlinedIcon fontSize="small" />}
              iconPosition="start"
              label="Manage courses"
            />
          </Tabs>

          <Box sx={{ p: 2.5 }}>
            {tab === 'fetch' && <AutoFetchPanel currentSemester={semester} />}
            {tab === 'upload' && (
              <UploadPanel
                semester={semester}
                uploadDeptCode={uploadDeptCode}
                currentSemesterForActions="Spring 2026"
                processing={processing}
                setProcessing={setProcessing}
              />
            )}
            {tab === 'manage' && (
              <Courses
                userRole={role as string}
                semester={semester}
                processing={processing}
              />
            )}
          </Box>
        </Paper>
      </Box>
    </PageLayout>
  );
}
