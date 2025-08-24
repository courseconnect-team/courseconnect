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
import styles from './style.module.css';
import 'firebase/firestore';

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
  HideSource,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import HeaderCard from '@/component/HeaderCard/HeaderCard';

export default function User() {
  const { user } = useAuth();
  const [role, loading, error] = GetUserRole(user?.uid);
  const [semester, setSemester] = useState<string>('Fall 2024');
  const [menu, setMenu] = useState<string[]>([]);
  const [semesterHidden, setSemesterHidden] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [newSem, setNewSem] = useState(false);
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
      if (doc.data()?.hidden) {
        setSemesterHidden(doc.data().hidden);
      } else {
        setSemesterHidden(false);
      }
    };

    updateMenu();
    setHidden();
    console.log(semesterHidden);
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
  const db = firebase.firestore();

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
        console.log(row);
        const mappedRow: any = {}
        mappedRow["Session Code"] = row["2258 -- Fall 2025"];
        mappedRow["Session Begin Date"] = row["__EMPTY"];
        mappedRow["Session End Date"] = row["__EMPTY_1"];
        mappedRow["Drop/Add End Date"] = row["__EMPTY_2"];
        mappedRow["Grading End Date"] = row["__EMPTY_3"];
        mappedRow["Acad Org"] = row["__EMPTY_4"];
        mappedRow["Course"] = row["__EMPTY_5"];
        mappedRow["Gord Rule"] = row["__EMPTY_6"];
        mappedRow["Gen ED"] = row["__EMPTY_7"];
        mappedRow["Hons List"] = row["__EMPTY_8"];
        mappedRow["Sect"] = row["__EMPTY_9"];
        mappedRow["Class Nbr"] = row["__EMPTY_10"];
        mappedRow["Assoc Class"] = row["__EMPTY_11"];
        mappedRow["Min - Max Cred"] = row["__EMPTY_12"];
        mappedRow["Day/s"] = row["__EMPTY_13"];
        mappedRow["Time"] = row["__EMPTY_14"];
        mappedRow["Meeting Pattern"] = row["__EMPTY_15"];
        mappedRow["Facility"] = row["__EMPTY_16"];
        mappedRow["Join"] = row["__EMPTY_17"];
        mappedRow["Site"] = row["__EMPTY_18"];
        mappedRow["County"] = row["__EMPTY_19"];
        mappedRow["Spec"] = row["__EMPTY_20"];
        mappedRow["Book"] = row["__EMPTY_21"];
        mappedRow["SOC"] = row["__EMPTY_22"];
        mappedRow["Exam"] = row["__EMPTY_23"];
        mappedRow["Course Title"] = row["__EMPTY_24"];
        mappedRow["Instructor"] = row["__EMPTY_25"];
        mappedRow["Instructor Emails"] = row["__EMPTY_26"];
        mappedRow["Enr Cap"] = row["__EMPTY_27"];
        mappedRow["Room Cap"] = row["__EMPTY_28"];
        mappedRow["Enrolled"] = row["__EMPTY_29"];
        mappedRow["Current as of 06/18/2025"] = row["__EMPTY_30"];
        mappedRow["Multi Meet Cap"] = row["__EMPTY_31"];
        mappedRow["Wait List Cap"] = row["__EMPTY_32"];
        mappedRow["Wait List Total"] = row["__EMPTY_33"];
        mappedRow["Sched Codes"] = row["__EMPTY_34"];
        mappedRow["Class Status"] = row["__EMPTY_35"];
        mappedRow["DL Fee Per Credit"] = row["__EMPTY_36"];
        mappedRow["Chartfield"] = row["__EMPTY_37"];
        mappedRow["DL Fee Status"] = row["__EMPTY_38"];

        if (!course.has(`${mappedRow['Class Nbr']} ${mappedRow['Instructor']}`)) {
          course.add(`${mappedRow['Class Nbr']} ${mappedRow['Instructor']}`);

          const rawEmails = mappedRow['Instructor Emails'] ?? 'undef';
          const emailArray =
            rawEmails === 'undef'
              ? []
              : rawEmails.split(';').map((email: string) => email.trim());

          await firebase
            .firestore()
            .collection('courses')
            .doc(`${mappedRow['Course']} (${semester}) : ${mappedRow['Instructor']}`)
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

  return (
    <>
      <Toaster />
      <div className={styles.studentlandingpage}>
        <Dialog
          style={{
            borderImage:
              'linear-gradient(to bottom, rgb(9, 251, 211), rgb(255, 111, 241)) 1',
            boxShadow: '0px 2px 20px 4px #00000040',
            borderRadius: '20px',
            border: '2px solid',
          }}
          PaperProps={{ style: { borderRadius: 20 } }}
          open={open}
          onClose={handleClose}
        >
          <DialogTitle
            style={{
              fontFamily: 'SF Pro Display-Medium, Helvetica',
              textAlign: 'center',
              fontSize: '40px',
              fontWeight: '540',
            }}
          >
            Create Semester
          </DialogTitle>
          <form onSubmit={handleSemesterCreate}>
            <DialogContent>
              <DialogContentText
                style={{
                  marginTop: '35px',
                  fontFamily: 'SF Pro Display-Medium, Helvetica',
                  textAlign: 'center',
                  fontSize: '20px',
                  color: 'black',
                }}
              >
                Please enter the new semester&apos;s name.
              </DialogContentText>
              <br />
              <br />
              <FormControl required>
                <TextField
                  style={{ left: '160px' }}
                  name="Semester"
                  variant="filled"
                  onChange={(e) => setNewSem(e.target.value)}
                  required
                  fullWidth
                  id="Semester"
                  label="Semester"
                  autoFocus
                />
              </FormControl>
            </DialogContent>
            <DialogActions
              style={{
                marginTop: '30px',
                marginBottom: '42px',
                display: 'flex',
                justifyContent: 'space-between',
                gap: '93px',
              }}
            >
              <Button
                variant="outlined"
                style={{
                  fontSize: '17px',
                  marginLeft: '110px',
                  borderRadius: '10px',
                  height: '43px',
                  width: '120px',
                  textTransform: 'none',
                  fontFamily: 'SF Pro Display-Bold , Helvetica',
                  borderColor: '#5736ac',
                  color: '#5736ac',
                  borderWidth: '3px',
                }}
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                style={{
                  fontSize: '17px',
                  marginRight: '110px',
                  borderRadius: '10px',
                  height: '43px',
                  width: '120px',
                  textTransform: 'none',
                  fontFamily: 'SF Pro Display-Bold , Helvetica',
                  backgroundColor: '#5736ac',
                  color: '#ffffff',
                }}
                type="submit"
              >
                Confirm
              </Button>
            </DialogActions>
          </form>
        </Dialog>
        <div className={styles.adminCoursesWrapper}>
          <HeaderCard text="Courses" />
          <CssBaseline />
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
                flexWrap: 'nowrap',        // prevent wrapping
                alignItems: 'center',      // vertical align
                justifyContent: 'center',
                gap: 5,                    // consistent spacing
              }}
            >
              <input
                id="raised-button-file"
                type="file"
                multiple
                onChange={readExcelFile}
                onClick={(e) => (e.currentTarget.value = '')}
                style={{ display: 'none' }}
              />
              <label htmlFor="raised-button-file">
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
        </div>
      </div>
    </>
  );
}
