'use client';

import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  Button,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import './style.css';
import Link from 'next/link';

interface CourseDetailsProps {
  courseName: string;
  semester: string;
  instructor: string;
  email: string;
  studentsEnrolled: number;
  maxStudents: number;
  credits: number;
  courseCode: string;
  department: string;
  TAs: { name: string; email: string }[];
  schedule: { day: string; time: string; location: string }[];
}

const CourseDetails: React.FC<CourseDetailsProps> = ({
  courseName,
  semester,
  instructor,
  email,
  studentsEnrolled,
  maxStudents,
  credits,
  courseCode,
  department,
  TAs,
  schedule,
}) => {
  const enrollmentPercentage = (studentsEnrolled / maxStudents) * 100;

  return (
    <Paper square={false} elevation={9} className="course-details">
      <Grid
        container
        spacing={3}
        justifyContent="space-between"
        alignItems="center"
      >
        <Grid item xs={12} md={9}>
          <Typography variant="h4" style={{ fontWeight: 'bold' }} gutterBottom>
            {courseName}
          </Typography>
          <Typography variant="h5" style={{ color: '#000000' }} gutterBottom>
            {semester}
          </Typography>
        </Grid>
        <Grid item xs={12} md={2.7}>
          <Grid container spacing={3}>
            <Grid item xs={4}>
              <Card>
                <CardContent>
                  <Typography
                    variant="subtitle2"
                    style={{ textAlign: 'center' }}
                    color="textSecondary"
                  >
                    Credits
                  </Typography>
                  <Typography variant="h6" style={{ textAlign: 'center' }}>
                    {credits}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card>
                <CardContent>
                  <Typography
                    variant="subtitle2"
                    color="textSecondary"
                    style={{ textAlign: 'center' }}
                  >
                    Course Code
                  </Typography>
                  <Typography variant="h6" style={{ textAlign: 'center' }}>
                    {courseCode}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card>
                <CardContent>
                  <Typography
                    variant="subtitle2"
                    color="textSecondary"
                    style={{ textAlign: 'center' }}
                  >
                    Department
                  </Typography>
                  <Typography variant="h6" style={{ textAlign: 'center' }}>
                    {department}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <Grid container spacing={3}>
        <Grid item xs={12} md={9}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={2}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="textSecondary">
                    Instructor
                  </Typography>
                  <Typography variant="h6">{instructor}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="textSecondary">
                    Emails
                  </Typography>
                  <Typography variant="h6">{email}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="textSecondary">
                    Students Enrolled
                  </Typography>
                  <Typography variant="h3">{studentsEnrolled}</Typography>
                  <Typography variant="subtitle1">
                    of {maxStudents} cap
                  </Typography>
                  <Box mt={2}>
                    <Box className="enrollment-bar">
                      <Box
                        className="enrollment-percentage"
                        style={{
                          width: `${enrollmentPercentage}%`,
                          backgroundColor: 'primary.main',
                        }}
                      />
                    </Box>
                  </Box>
                  <Typography variant="subtitle1" mt={1}>
                    {enrollmentPercentage.toFixed(0)}% Students Enrolled
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            TAs:
          </Typography>
          <Grid container spacing={3}>
            {TAs.map((ta, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" color="textSecondary">
                      Instructor
                    </Typography>
                    <Typography variant="h6">{ta.name}</Typography>
                    <Typography variant="body1">
                      <EmailIcon fontSize="small" /> {ta.email}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Time and Location:
          </Typography>
          {schedule.map((item, index) => (
            <Box key={index} className="schedule-item">
              <LocationOnIcon />
              <Typography variant="body1" ml={1}>
                {item.day} | {item.time} | {item.location}
              </Typography>
            </Box>
          ))}
        </Grid>
      </Grid>
      <Box display="flex" justifyContent="flex-end" mt={2}>
        <Link href="/Courses">
          <Button variant="contained" color="primary">
            Close
          </Button>
        </Link>
      </Box>
    </Paper>
  );
};

export default CourseDetails;
