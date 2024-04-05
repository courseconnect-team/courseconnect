'use client';
import * as React from 'react';
import Avatar from '@mui/material/Avatar';
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
import { Toaster, toast } from 'react-hot-toast';
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
import styles from "./style.module.css";
import 'firebase/firestore';

import firebase from '@/firebase/firebase_config';
import { read, utils, writeFile, readFile } from 'xlsx';

function timeout(delay: number) {
  return new Promise(res => setTimeout(res, delay));
}

const readExcelFile = async (e) => {
  // https://docs.sheetjs.com/docs/demos/local/file/
  console.log("ACTIVE");

  try {



    //const ref = firebase.firestore().collection('courses')
    //ref.onSnapshot((snapshot) => {
    // snapshot.docs.forEach((doc) => {
    //  ref.doc(doc.id).delete()
    // })
    // })


    const val = e.target.files[0];
    console.log(val);
    const ab = await val.arrayBuffer()
    let data = []
    var file = read(ab);

    const sheets = file.SheetNames
    console.log(sheets);

    for (let i = 0; i < sheets.length; i++) {
      const temp = utils.sheet_to_json(
        file.Sheets[file.SheetNames[i]])
      console.log(temp);

      temp.forEach((res) => {
        data.push(res)
      })
    }
    console.log(data);
    console.log(data.length);


    for (let i = 0; i < data.length; i++) {

      await firebase
        .firestore()
        .collection('courses')
        .doc(data[i]["__EMPTY_5"] + ": " + data[i]["__EMPTY_22"])
        .set({
          professor_emails: (data[i]["__EMPTY_23"] == undefined ? "undef" : data[i]["__EMPTY_23"]),
          professor_names: (data[i]["__EMPTY_22"] == undefined ? "undef" : data[i]["__EMPTY_22"]),
          code: (data[i]["__EMPTY_5"] == undefined ? "undef" : data[i]["__EMPTY_5"]),
          credits: (data[i]["__EMPTY_9"] == undefined ? "undef" : data[i]["__EMPTY_9"]),
          enrollment_cap: (data[i]["__EMPTY_24"] == undefined ? "undef" : data[i]["__EMPTY_24"]),
          enrolled: (data[i]["__EMPTY_26"] == undefined ? "undef" : data[i]["__EMPTY_26"]),
          title: (data[i]["__EMPTY_21"] == undefined ? "undef" : data[i]["__EMPTY_21"]),
        })

      console.log(data[i]["__EMPTY_5"]);


    }





  }
  catch (err) {
    console.log(err);
  }
}
export default function User() {
  const { user } = useAuth();
  const [role, loading, error] = GetUserRole(user?.uid);
  const [activeComponent, setActiveComponent] = React.useState('welcome');

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
                  <img className={styles.GRADIENTS} alt="Gradients" src="https://c.animaapp.com/vYQBTcnO/img/gradients.png" />
                  <div className={styles.glasscard} />
                </div>
              </div>
              <EceLogoPng className={styles.ecelogopng2} />
              <TopNavBarSigned className={styles.topnavbarsignedin} />
              <div className={styles.textwrapper8}>Users</div>
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

                <Users userRole={role as string} />
                <input type="file" id="input_dom_element" onChange={e => readExcelFile(e)} />


              </Box>
            </Box>

          </div>
        </div>
      </div>
    </>

  );
}
