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
              </Box>
            </Box>

          </div>
        </div>
      </div>
    </>

  );
}
