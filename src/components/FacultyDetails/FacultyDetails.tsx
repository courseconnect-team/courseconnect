'use client';

import React, { Component, ReactNode } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  Button,
  Container,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import Link from 'next/link';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import CourseUnitInfo from '../CourseUnitInfo/CourseUnit';
import { FacultyStats } from '@/types/User';

interface FacultyDetailsProps extends FacultyStats {
  children?: ReactNode; // Optional children prop
}

const FacultyDetails: React.FC<FacultyDetailsProps> = ({
  id, // Firestore document ID
  accumulatedUnits,
  assignedUnits,
  averageUnits,
  creditDeficit,
  creditExcess,
  email,
  firstname,
  labCourse,
  lastname,
  researchActivity,
  classesTaught,
  ufid,
  children,
}) => {
  const cardStyle = {
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    height: '85%', // Ensure cards stretch to fill height
  };

  // Helper function to format instructor name safely
  const formatInstructorName = (name: string) => {
    const parts = name.split(',');
    if (parts.length === 2) {
      return `${parts[1].trim()} ${parts[0].trim()}`;
    }
    return name; // Return as is if format is unexpected
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
      <Grid container spacing={3} alignItems="center">
        <Grid item xs={12} md={4}>
          <Box display="flex" flexDirection="column" alignItems="center">
            <PersonOutlineOutlinedIcon sx={{ fontSize: 80 }} />
            <Typography variant="h6">{`${firstname} ${lastname}`}</Typography>
            <Typography variant="subtitle1">{email}</Typography>
            <Typography variant="body2">UFID: {ufid}</Typography>
          </Box>
        </Grid>
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <CourseUnitInfo
                current={accumulatedUnits}
                total={assignedUnits}
              />
            </Grid>
            <Grid item xs={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2">Credit Deficit</Typography>
                  <Typography variant="h6" color="error">
                    {creditDeficit} CU
                  </Typography>
                </CardContent>
              </Card>
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2">Credit Excess</Typography>
                  <Typography variant="h6" color="success">
                    {creditExcess} CU
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2">
                    Total Classes Taught
                  </Typography>
                  <Typography variant="h6">{classesTaught} Classes</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2">
                    Average Credit Units
                  </Typography>
                  <Typography variant="h6">{averageUnits} CU</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2">
                Research Activity Level
              </Typography>
              <Button
                variant="contained"
                color={researchActivity === 'high' ? 'success' : 'error'}
              >
                {researchActivity}
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2">Lab Course</Typography>
              <Button variant="contained" color="success">
                {labCourse}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ mt: 3 }}>
        Classes Taught (last 3 years)
      </Typography>
      <Grid container spacing={2}>
        {classes.map((classInfo, index) => (
          <Grid item xs={4} key={index}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1">{classInfo}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box display="flex" justifyContent="flex-end" mt={3}>
        <Button variant="contained" color="primary">
          Close
        </Button>
      </Box>
    </Paper>
  );
};

export default FacultyDetails;
