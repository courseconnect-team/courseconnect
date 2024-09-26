'use client';
import * as React from 'react';
import { Toaster, toast } from 'react-hot-toast';
import Avatar from '@mui/material/Avatar';
import { DeleteOutline, FileUploadOutlined } from '@mui/icons-material';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import EditNoteIcon from '@mui/icons-material/EditNote';
import DepartmentSelect from '@/components/FormUtil/DepartmentSelect';
import GPA_Select from '@/components/FormUtil/GPASelect';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import DegreeSelect from '@/components/FormUtil/DegreeSelect';
import SemesterStatusSelect from '@/components/FormUtil/SemesterStatusSelect';
import NationalitySelect from '@/components/FormUtil/NationalitySelect';
import ProficiencySelect from '@/components/FormUtil/ProficiencySelect';
import PositionSelect from '@/components/FormUtil/PositionSelect';
import AvailabilityCheckbox from '@/components/FormUtil/AvailabilityCheckbox';
import SemesterCheckbox from '@/components/FormUtil/SemesterCheckbox';
import AdditionalSemesterPrompt from '@/components/FormUtil/AddtlSemesterPrompt';
import UpdateRole from '@/firebase/util/UpdateUserRole';
import { useAuth } from '@/firebase/auth/auth_context';
import { LinearProgress } from '@mui/material';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import { ApplicationStatusCard } from '@/components/ApplicationStatusCard/ApplicationStatusCard';
import { useState } from 'react';
import { TopNavBarSigned } from '@/components/TopNavBarSigned/TopNavBarSigned';
import { EceLogoPng } from '@/components/EceLogoPng/EceLogoPng';
import Users from '@/components/Dashboard/Users/Users';

import GetUserRole from '@/firebase/util/GetUserRole';
import GetUserUfid from '@/firebase/util/GetUserUfid';
import { ApplicationStatusCardDenied } from '@/components/ApplicationStatusCardDenied/ApplicationStatusCardDenied';

import { ApplicationStatusCardAccepted } from '@/components/ApplicationStatusCardAccepted/ApplicationStatusCardAccepted';
import styles from './style.module.css';
import 'firebase/firestore';

import firebase from '@/firebase/firebase_config';
import { read, utils, writeFile, readFile } from 'xlsx';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import FacultyStats from '@/components/Dashboard/Users/FacultyStats';

export default function User() {
  const { user } = useAuth();
  const [role, loading, error] = GetUserRole(user?.uid);
  const [activeComponent, setActiveComponent] = React.useState('welcome');
  const [semester, setSemester] = React.useState('Fall 2024');

  const [processing, setProcessing] = useState(false);
  const handleChange = (event: SelectChangeEvent) => {
    setSemester(event.target.value as string);
  };

  const readExcelFile = async (e) => {
    // https://docs.sheetjs.com/docs/demos/local/file/
    console.log('ACTIVE');
    setProcessing(true);
    const toastId = toast.loading(
      'Processing course data. This may take a couple minutes.',
      { duration: 300000000 }
    );


    try {
      const val = e.target.files[0];
      console.log(val);
      const ab = await val.arrayBuffer();
      let data = [];
      var file = read(ab);

      const sheets = file.SheetNames;
      console.log(sheets);

      for (let i = 0; i < sheets.length; i++) {
        const temp = utils.sheet_to_json(file.Sheets[file.SheetNames[i]]);
        console.log(temp);

        temp.forEach((res) => {
          data.push(res);
        });
      }
      console.log(data);
      console.log(data.length);

      for (let i = 0; i < data.length; i++) {
        await firebase
          .firestore()
          .collection('faculty-stats')
          .doc(
            data[i]['__EMPTY_5'] +
            ' (' +
            semester +
            ') ' +
            ': ' +
            data[i]['__EMPTY_22']
          )
          .set({
            professor_emails:
              data[i]['__EMPTY_23'] == undefined
                ? 'undef'
                : data[i]['__EMPTY_23'],
            professor_names:
              data[i]['__EMPTY_22'] == undefined
                ? 'undef'
                : data[i]['__EMPTY_22'],
            code:
              data[i]['__EMPTY_5'] == undefined
                ? 'undef'
                : data[i]['__EMPTY_5'],
            credits:
              data[i]['__EMPTY_9'] == undefined
                ? 'undef'
                : data[i]['__EMPTY_9'],
            enrollment_cap:
              data[i]['__EMPTY_24'] == undefined
                ? 'undef'
                : data[i]['__EMPTY_24'],
            enrolled:
              data[i]['__EMPTY_26'] == undefined
                ? 'undef'
                : data[i]['__EMPTY_26'],
            title:
              data[i]['__EMPTY_21'] == undefined
                ? 'undef'
                : data[i]['__EMPTY_21'],
            semester: semester,
          });

        console.log(data[i]['__EMPTY_5']);
      }
      setProcessing(false);
      toast.dismiss(toastId);
      toast.success('Data upload complete!', { duration: 2000 });
    } catch (err) {
      console.log(err);
      toast.dismiss(toastId);
      toast.error('Data upload failed.', { duration: 2000 });
    }
  };
  const handleClear = async () => {
    setProcessing(true);
    const toastId = toast.loading(
      'Clearing semester data. This may take a couple minutes.',
      { duration: 30000000 }
    );

    const querySnapshot = await firebase
      .firestore()
      .collection('faculty-stats')
      .get();
    querySnapshot.forEach((doc) => doc.ref.delete());

    setProcessing(false);
    toast.success('Semester data cleared!');
    toast.dismiss(toastId);
  };

  return (
    <>
      <Toaster />
      <div className={styles.studentlandingpage}>
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
              <div className={styles.textwrapper8}>Statistics</div>
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
                    sx={{ ml: 15, mt: 1.5 }}
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
                  onClick={handleClear}
                  style={{ textTransform: 'none' }}
                  variant="contained"
                  component="span"
                  startIcon={<DeleteOutline />}
                >
                  Clear Semester Data
                </Button>
                <br />
                <br />

                <FacultyStats userRole={role as string} />
              </Box>
            </Box>
          </div>
        </div>
      </div >
    </>
  );
}
