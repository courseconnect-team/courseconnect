'use client';
import * as React from 'react';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import { useAuth } from '@/firebase/auth/auth_context';
import { Toaster, toast } from 'react-hot-toast';

import { useState, useEffect } from 'react';
import { TopNavBarSigned } from '@/components/TopNavBarSigned/TopNavBarSigned';
import { EceLogoPng } from '@/components/EceLogoPng/EceLogoPng';
import GetUserRole from '@/firebase/util/GetUserRole';
import styles from './style.module.css';
import 'firebase/firestore';

import firebase from '@/firebase/firebase_config';
import { read, utils } from 'xlsx';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Courses from '@/components/Dashboard/AdminCourses/Courses';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { DeleteOutline, FileUploadOutlined, HideSource, Visibility, VisibilityOff } from '@mui/icons-material';

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
  }
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

      for (const row of data) {
        console.log(row);

        await firebase
          .firestore()
          .collection('courses')
          .doc(`${row['__EMPTY_5']} (${semester}) : ${row['__EMPTY_22']}`)
          .set({
            professor_emails: row['__EMPTY_23'] ?? 'undef',
            professor_names: row['__EMPTY_22'] ?? 'undef',
            code: row['__EMPTY_5'] ?? 'undef',
            credits: row['__EMPTY_9'] ?? 'undef',
            enrollment_cap: row['__EMPTY_24'] ?? 'undef',
            enrolled: row['__EMPTY_26'] ?? 'undef',
            title: row['__EMPTY_21'] ?? 'undef',
            semester: semester,
          });
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
        <div className={styles.overlapwrapper}>
          <div className={styles.overlap}>
            <div className={styles.overlap2}>
              <div className={styles.colorblockframe}>
                <div className={styles.overlapgroup2}>
                  <div className={styles.colorblock} />
                  <img
                    className={styles.GRADIENTS}
                    alt="Gradients"
                    src="https://c.animaapp.com/vYQBTcnO/img/gradients.png"
                  />
                  <div className={styles.glasscard} />
                </div>
              </div>
              <EceLogoPng className={styles.ecelogopng2} />
              <TopNavBarSigned className={styles.topnavbarsignedin} />
              <div className={styles.textwrapper8}>Courses</div>
            </div>
            <CssBaseline />
            <Box
              sx={{
                marginTop: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
              }}
            >

              <Box sx={{ minWidth: 120 }} />
              <Box sx={{ mt: 50, mb: 2, width: '100%' }}>
                <input
                  style={{ display: 'none' }}
                  id="raised-button-file"
                  multiple
                  type="file"
                  onChange={readExcelFile}
                  onClick={(event) => (event.currentTarget.value = '')}
                />
                <label htmlFor="raised-button-file">
                  <Button
                    sx={{ ml: 40, mt: 1.5 }}
                    style={{ textTransform: 'none' }}
                    variant="contained"
                    component="span"
                    startIcon={<FileUploadOutlined />}
                  >
                    Upload Semester Data
                  </Button>
                </label>
                <Button
                  sx={{ ml: 10, mt: 1.5 }}
                  onClick={handleDeleteSem}
                  style={{ textTransform: 'none' }}
                  variant="contained"
                  component="span"
                  startIcon={<DeleteOutline />}
                >
                  Clear Semester Data
                </Button>
                <Button
                  sx={{ ml: 10, mt: 1.5 }}
                  onClick={handleSemesterHiddenToggle}
                  style={{ textTransform: 'none' }}
                  variant="contained"
                  component="span"
                  startIcon={semesterHidden ? <Visibility /> : <VisibilityOff />}
                >
                  {semesterHidden ? "Unhide" : "Hide"} Semester Data
                </Button>
                <FormControl sx={{ ml: 40, mb: 5, minWidth: 140 }}>
                  <InputLabel id="demo-simple-select-label">
                    Semester
                  </InputLabel>
                  <Select
                    labelId="demo-simple-select-label"
                    id="demo-simple-select"
                    value={semester}
                    label="Semester"
                    onChange={handleChange}
                  >
                    {menu.map((i) => (
                      <MenuItem key={i} value={i}>
                        {i}
                      </MenuItem>
                    ))}
                    <MenuItem value={'New Semester'}>
                      Create New Semester
                    </MenuItem>
                  </Select>
                </FormControl>
                <br />
                <Courses
                  userRole={role as string}
                  semester={semester}
                  processing={processing}
                />
              </Box>
            </Box>
          </div>
        </div>
      </div>
    </>
  );
}
