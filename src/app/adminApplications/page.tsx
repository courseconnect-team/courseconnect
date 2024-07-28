'use client';
import * as React from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import { useAuth } from '@/firebase/auth/auth_context';
import { Toaster, toast } from 'react-hot-toast';
import { TopNavBarSigned } from '@/components/TopNavBarSigned/TopNavBarSigned';
import { EceLogoPng } from '@/components/EceLogoPng/EceLogoPng';
import GetUserRole from '@/firebase/util/GetUserRole';
import styles from './style.module.css';
import 'firebase/firestore';
import Applications from '@/components/Dashboard/Applications/Applications';

export default function AdminApplications() {
  let { user } = useAuth();
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
              <div className={styles.textwrapper8}>
                Applications & Assignments
              </div>
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
              <Box sx={{ mt: 50, mb: 2, width: '120%' }}>
                <Applications userRole={role as string} />
              </Box>
            </Box>
          </div>
        </div>
      </div>
    </>
  );
}
