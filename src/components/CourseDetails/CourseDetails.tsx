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
import LocationOnIcon from '@mui/icons-material/LocationOn';
import './style.css';
import Link from 'next/link';
import EnrollmentInfo from '../Enrollment/Enrollment';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';

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
  title: string;
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
  title,
  schedule,
}) => {
  const cardStyle = {
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)', // Adjust the shadow as needed
    marginBottom: '16px',

    marginLeft: '10px',
  };

  return (
    <Paper square={false} elevation={9} className="course-details">
      <Grid
        container
        spacing={3}
        justifyContent="space-between"
        alignItems="center"
      >
        <Grid item xs={12} md={9}>
          <Typography
            variant="h4"
            style={{ fontWeight: 'bold', marginLeft: '10px' }}
            gutterBottom
          >
            {`${courseName} - ${title}`}
          </Typography>
          <Typography
            variant="h5"
            style={{
              color: '#000000',
              marginBottom: '30px',
              marginLeft: '10px',
            }}
            gutterBottom
          >
            {semester}
          </Typography>
        </Grid>
        <Grid item xs={12} md={2.7}>
          <Grid container spacing={3}>
            <Grid item xs={4}>
              <Card style={cardStyle}>
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
              <Card style={cardStyle}>
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
              <Card style={cardStyle}>
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
          <Grid container spacing={4}>
            <Grid item xs={12} sm={6} md={2.75}>
              <Card style={cardStyle}>
                <CardContent>
                  {' '}
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <PersonOutlineOutlinedIcon fontSize="small" />
                    <Typography variant="subtitle2" color="textSecondary">
                      Instructor
                    </Typography>
                  </div>
                  <Typography variant="h6" style={{ color: 'black' }}>
                    {instructor.split(',')[1] + ' ' + instructor.split(',')[0]}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2.75}>
              <Card style={cardStyle}>
                <CardContent>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <MailOutlineIcon fontSize="small" />
                    <Typography variant="subtitle2" color="textSecondary">
                      Emails
                    </Typography>
                  </div>
                  <Typography variant="h6">{email}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <EnrollmentInfo
                students={studentsEnrolled}
                capacity={maxStudents}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom style={{ marginLeft: '10px' }}>
            TAs:
          </Typography>
          <Grid container spacing={4}>
            {TAs.map((ta, index) => (
              <Grid item xs={12} sm={6} md={2} key={index}>
                <Card style={cardStyle}>
                  <CardContent>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <PersonOutlineOutlinedIcon fontSize="small" />

                      <Typography variant="subtitle2" color="textSecondary">
                        Instructor
                      </Typography>
                    </div>
                    <Box display="flex" alignItems="center">
                      <Typography variant="h6" className="text-highlight">
                        {ta.name}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
                <Card style={cardStyle}>
                  <CardContent>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <MailOutlineIcon fontSize="small" />
                      <Typography variant="subtitle2" color="textSecondary">
                        Emails
                      </Typography>
                    </div>
                    <Box display="flex" alignItems="center">
                      <Typography variant="h6" className="text-highlight">
                        {ta.email}
                      </Typography>
                    </Box>
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
