'use client';
import * as React from 'react';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import { useAuth } from '@/firebase/auth/auth_context';
import { Toaster, toast } from 'react-hot-toast';

import { useState, useEffect } from 'react';
import GetUserRole from '@/firebase/util/GetUserRole';
import 'firebase/firestore';
import { TERM_CODE } from '@/hooks/useSemesterOptions';
import firebase from '@/firebase/firebase_config';
import { read, utils } from 'xlsx';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Courses from '@/component/Dashboard/AdminCourses/Courses';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import {
  DeleteOutline,
  FileUploadOutlined,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import PageLayout from '@/components/PageLayout/PageLayout';
import { getNavItems } from '@/hooks/useGetItems';
import styles from './style.module.css';

export default function AdminCoursesPage() {
  const { user } = useAuth();
  const [role, loading, error] = GetUserRole(user?.uid);
  const [semester, setSemester] = useState<string>('Spring 2026');
  const [menu, setMenu] = useState<string[]>([]);
  const [semesterHidden, setSemesterHidden] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [newSem, setNewSem] = useState('');
  const [open, setOpen] = useState(false);

  const handleClose = () => {
    setSemester('');
    setOpen(false);
  };

  const handleSemesterCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await firebase
      .firestore()
      .collection('semesters')
      .doc(newSem)
      .set({ semester: newSem, hidden: false });
    setSemester(newSem);
    setOpen(false);
  };

  useEffect(() => {
    const updateMenu = async () => {
      const arr: string[] = [];
      const querySnapshot = await firebase
        .firestore()
        .collection('semesters')
        .get();
      querySnapshot.forEach((doc) => {
        arr.push(doc.id);
        if (semester === '') {
          setSemester(doc.id);
        }
      });
      setMenu(arr);
    };

    const setHidden = async () => {
      const doc = await firebase
        .firestore()
        .collection('semesters')
        .doc(semester)
        .get();
      setSemesterHidden(!!doc.data()?.hidden);
    };

    updateMenu();
    setHidden();
  }, [semester, processing]);

  const handleDeleteSem = async () => {
    setProcessing(true);
    const toastId = toast.loading(
      'Clearing semester data. This may take a couple minutes.',
      { duration: 30000000 }
    );

    const querySnapshot = await firebase
      .firestore()
      .collection('courses')
      .where('semester', '==', semester)
      .get();
    querySnapshot.forEach((doc) => doc.ref.delete());

    setProcessing(false);
    toast.success('Semester data cleared!');
    toast.dismiss(toastId);
  };

  const handleSemesterHiddenToggle = async () => {
    setProcessing(true);
    const toastId = toast.loading(
      'Toggling semester visibility. This may take a couple minutes.',
      { duration: 30000000 }
    );

    await firebase
      .firestore()
      .collection('semesters')
      .doc(semester)
      .set({ hidden: !semesterHidden }, { merge: true });

    setProcessing(false);
    toast.success('Semester visibility toggled!');
    toast.dismiss(toastId);
  };

  const readActionsExcelFile = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setProcessing(true);
    const toastId = toast.loading(
      'Processing course data. This may take a couple minutes.',
      { duration: 300000000 }
    );
    try {
      const file = e.target.files?.[0];
      if (!file) {
        // User cancelled file picker
        setProcessing(false);
        toast.dismiss(toastId);
        toast.error('No file selected.', { duration: 2000 });
        return;
      }

      const arrayBuffer = await file.arrayBuffer();
      const workbook = read(arrayBuffer);
      const data: any[] = [];

      workbook.SheetNames.forEach((sheetName) => {
        const sheetData = utils.sheet_to_json(workbook.Sheets[sheetName]);
        sheetData.forEach((row: any) => data.push(row));
      });

      const actionByUFID = new Map<string, string>();
      const CURRENT_SEMESTER = 'Spring 2026';
      for (const row of data) {
        const rawUFID = String(row['UFID'] ?? '') as string;
        const action = (row['ECE - Requested Action'] ?? '') as string;
        const ufid = rawUFID.trim();
        const cleanedAction = action.trim();

        if (!ufid || !cleanedAction) continue;

        actionByUFID.set(ufid, cleanedAction);
      }

      const updateActions = async () => {
        const db = firebase.firestore();
        const batch = db.batch();

        const appsSnap = await db.collection('applications').get();

        appsSnap.forEach((doc) => {
          const data = doc.data();
          const ufid = (data.ufid ?? data.UFID ?? '').toString().trim();
          const semesters = (data.available_semesters ?? []) as string[];

          if (
            !Array.isArray(semesters) ||
            !semesters.includes(CURRENT_SEMESTER)
          ) {
            return;
          }
          let action = 'NEW HIRE';
          if (ufid && actionByUFID.has(ufid)) {
            action = actionByUFID.get(ufid)!;
          }

          console.log(`Updating UFID ${ufid} with action ${action}`);
          batch.update(doc.ref, { employmentAction: action });
        });

        await batch.commit();
      };

      await updateActions();

      setProcessing(false);
      toast.dismiss(toastId);
      toast.success('Employment actions updated successfully!', {
        duration: 2000,
      });
    } catch (err) {
      console.error(err);
      setProcessing(false);
      toast.dismiss(toastId);
      toast.error('Data upload failed.', { duration: 2000 });
    }
  };

  const readExcelFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setProcessing(true);
    const toastId = toast.loading(
      'Processing course data. This may take a couple minutes.',
      { duration: 300000000 }
    );

    try {
      const file = e.target.files?.[0];
      if (!file) return;

      const arrayBuffer = await file.arrayBuffer();
      const workbook = read(arrayBuffer);
      const data: any[] = [];

      workbook.SheetNames.forEach((sheetName) => {
        const sheetData = utils.sheet_to_json(workbook.Sheets[sheetName]);
        sheetData.forEach((row: any) => data.push(row));
      });

      const course = new Set();

      for (const row of data) {
        const mappedRow: any = {};
        mappedRow['Course'] = row['__EMPTY_5'];
        mappedRow['Course Title'] = row['__EMPTY_24'];
        mappedRow['Instructor'] = row['__EMPTY_25'];
        mappedRow['Instructor Emails'] = row['__EMPTY_26'];
        mappedRow['Class Nbr'] = row['__EMPTY_10'];
        mappedRow['Min - Max Cred'] = row['__EMPTY_12'];
        mappedRow['Day/s'] = row['__EMPTY_13'];
        mappedRow['Time'] = row['__EMPTY_14'];
        mappedRow['Facility'] = row['__EMPTY_16'];
        mappedRow['Enr Cap'] = row['__EMPTY_27'];
        mappedRow['Enrolled'] = row['__EMPTY_29'];

        if (
          !course.has(`${mappedRow['Class Nbr']} ${mappedRow['Instructor']}`)
        ) {
          course.add(`${mappedRow['Class Nbr']} ${mappedRow['Instructor']}`);

          const rawEmails = mappedRow['Instructor Emails'] ?? 'undef';
          const emailArray =
            rawEmails === 'undef'
              ? []
              : rawEmails.split(';').map((email: string) => email.trim());

          await firebase
            .firestore()
            .collection('semesters')
            .doc(semester)
            .collection('courses')
            .doc(`${mappedRow['Course']} : ${mappedRow['Instructor']}`)
            .set({
              class_number: mappedRow['Class Nbr'] ?? 'undef',
              professor_emails: emailArray,
              professor_names: mappedRow['Instructor'] ?? 'undef',
              code: mappedRow['Course'] ?? 'undef',
              credits: mappedRow['Min - Max Cred'] ?? 'undef',
              department: 'ECE',
              enrollment_cap: mappedRow['Enr Cap'] ?? 'undef',
              enrolled: mappedRow['Enrolled'] ?? 'undef',
              title: mappedRow['Course Title'] ?? 'undef',
              semester: semester,
              meeting_times: [
                {
                  day: mappedRow['Day/s']?.replaceAll(' ', '') ?? 'undef',
                  time: mappedRow['Time'] ?? 'undef',
                  location: mappedRow['Facility'] ?? 'undef',
                },
              ],
            });
        }
      }

      setProcessing(false);
      toast.dismiss(toastId);
      toast.success('Data upload complete!', { duration: 2000 });
    } catch (err) {
      console.log(err);
      setProcessing(false);
      toast.dismiss(toastId);
      toast.error('Data upload failed.', { duration: 2000 });
    }
  };

  const handleChange = (event: SelectChangeEvent) => {
    const value = event.target.value;
    if (value === 'New Semester') {
      setOpen(true);
    } else {
      setSemester(value);
    }
  };

  if (loading) return <div>Loading…</div>;
  if (error) return <div>Error loading role</div>;
  if (role !== 'admin') return <div> Forbidden </div>;

  return (
    <PageLayout mainTitle="Admin Courses" navItems={getNavItems(role)}>
      <Toaster />
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Create Semester</DialogTitle>
        <form onSubmit={handleSemesterCreate}>
          <DialogContent>
            <DialogContentText>
              Please enter the new semester&apos;s name.
            </DialogContentText>
            <FormControl required fullWidth>
              <TextField
                name="Semester"
                variant="filled"
                onChange={(e) => setNewSem(e.target.value)}
                required
                label="Semester"
                autoFocus
              />
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              Confirm
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Box
        sx={{
          mt: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <Box
          sx={{
            mb: 2,
            width: '100%',
            display: 'flex',
            flexWrap: 'nowrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
          }}
        >
          <input
            id="employment-actions-file"
            type="file"
            multiple
            onChange={readActionsExcelFile}
            onClick={(e) => (e.currentTarget.value = '')}
            style={{ display: 'none' }}
          />
          <label htmlFor="employment-actions-file">
            <Button
              component="span"
              variant="contained"
              startIcon={<FileUploadOutlined />}
              sx={{ textTransform: 'none' }}
            >
              Upload Employment Actions Data
            </Button>
          </label>

          {/* Semester Data upload */}
          <input
            id="semester-data-file"
            type="file"
            multiple
            onChange={readExcelFile}
            onClick={(e) => (e.currentTarget.value = '')}
            style={{ display: 'none' }}
          />
          <label htmlFor="semester-data-file">
            <Button
              component="span"
              variant="contained"
              startIcon={<FileUploadOutlined />}
              sx={{ textTransform: 'none' }}
            >
              Upload Semester Data
            </Button>
          </label>

          <Button
            variant="contained"
            onClick={handleDeleteSem}
            startIcon={<DeleteOutline />}
            sx={{ textTransform: 'none' }}
          >
            Clear Semester Data
          </Button>

          <Button
            variant="contained"
            onClick={handleSemesterHiddenToggle}
            startIcon={semesterHidden ? <Visibility /> : <VisibilityOff />}
            sx={{ textTransform: 'none' }}
          >
            {semesterHidden ? 'Unhide' : 'Hide'} Semester Data
          </Button>

          <FormControl sx={{ minWidth: 140 }}>
            <InputLabel id="semester-select-label">Semester</InputLabel>
            <Select
              labelId="semester-select-label"
              id="semester-select"
              value={semester}
              label="Semester"
              onChange={handleChange}
            >
              {menu.map((sem) => (
                <MenuItem key={sem} value={sem}>
                  {sem}
                </MenuItem>
              ))}
              <MenuItem value="New Semester">Create New Semester</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Courses
          userRole={role as string}
          semester={semester}
          processing={processing}
        />
      </Box>
    </PageLayout>
  );
}
