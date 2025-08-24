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
  Container,
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
    <Paper
      square
      elevation={9}
      className="course-details"
      sx={{ p: 3, mt: 3 }} // Use sx for padding and margin
    >
      {/* Header Section */}
      <Grid
        container
        spacing={3}
        justifyContent="space-between"
        alignItems="stretch" // Ensure equal height
      >
        <Grid item xs={12} md={8}>
          <Typography
            variant="h4"
            sx={{ fontWeight: 'bold', ml: 1 }}
            gutterBottom
          >
            {`${courseName} - ${title}`}
          </Typography>
          <Typography
            variant="h5"
            sx={{ color: '#000000', mb: 4, ml: 1 }}
            gutterBottom
          >
            {semester}
          </Typography>
        </Grid>
        <Grid item xs={12} md={4}>
          <Grid container spacing={3} alignItems="stretch">
            <Grid item xs={12} sm={4}>
              <Card sx={cardStyle}>
                <CardContent>
                  <Typography
                    variant="subtitle2"
                    color="textSecondary"
                    align="center"
                  >
                    Min-Max Credits
                  </Typography>
                  <Typography variant="h6" align="center">
                    {credits}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={cardStyle}>
                <CardContent>
                  <Typography
                    variant="subtitle2"
                    color="textSecondary"
                    align="center"
                  >
                    Course Code
                  </Typography>

                  <Typography variant="h6" align="center">
                    {courseCode}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={cardStyle}>
                <CardContent>
                  <Typography
                    variant="subtitle2"
                    color="textSecondary"
                    align="center"
                  >
                    Department
                  </Typography>
                  <Typography variant="h6" align="center">
                    {department}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <Box style={{ display: 'flex', flexDirection: 'row' }}>
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={9}>
            {/* Instructor and Email Cards */}
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={6}>
                <Card sx={cardStyle}>
                  <CardContent>
                    <Box display="flex" alignItems="center">
                      <PersonOutlineOutlinedIcon fontSize="small" />
                      <Typography variant="overline" color="textSecondary">
                        Instructor
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'black' }}>
                      {formatInstructorName(instructor)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={6}>
                <Card sx={cardStyle}>
                  <CardContent>
                    <Box display="flex" alignItems="center">
                      <MailOutlineIcon fontSize="small" />
                      <Typography variant="overline" color="textSecondary">
                        Email
                      </Typography>
                    </Box>
                    <Typography variant="body2">{email}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            {/* Enrollment Info */}
            <Grid container spacing={4} sx={{ mt: 2 }}>
              <Grid item xs={12}>
                <EnrollmentInfo
                  students={studentsEnrolled}
                  capacity={maxStudents}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        {/* TAs and Schedule */}
        <Grid container spacing={3} sx={{ mt: 10 }}>
          {/* TAs Section */}
          <Grid item xs={12} md={9}>
            <Typography variant="h6" gutterBottom>
              {TAs.length > 0 ? 'TAs:' : 'No TAs assigned'}
            </Typography>
            <Grid>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  marginTop: '30px',
                }}
              >
                {TAs.map((ta, index) => (
                  <Grid item xs={12} sm={12} md={12} key={index}>
                    <Box display="flex" flexDirection="row" gap={2}>
                      <Grid item xs={12} sm={6} md={6}>
                        <Card sx={cardStyle}>
                          <CardContent>
                            <Box display="flex" alignItems="center" gap={1}>
                              <PersonOutlineOutlinedIcon fontSize="small" />
                              <Typography
                                variant="overline"
                                color="textSecondary"
                              >
                                TA Name
                              </Typography>
                            </Box>
                            <Typography
                              variant="body2"
                              className="text-highlight"
                            >
                              {ta.name}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>

                      <Grid item xs={12} sm={6} md={6}>
                        <Card sx={cardStyle}>
                          <CardContent>
                            <Box display="flex" alignItems="center" gap={1}>
                              <MailOutlineIcon fontSize="small" />
                              <Typography
                                variant="overline"
                                color="textSecondary"
                              >
                                Email
                              </Typography>
                            </Box>
                            <Typography
                              variant="body2"
                              className="text-highlight"
                            >
                              {ta.email != 'undef' ? ta.email : 'Missing'}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Box>
                  </Grid>
                ))}
              </div>
            </Grid>
          </Grid>
        </Grid>
        <Grid container spacing={3} sx={{ mt: 25, mr: -20 }}>
          {/* Schedule Section */}
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom>
              Time and Location:
            </Typography>
            {Array.isArray(schedule) ? (
              schedule.map((item, index) => (
                <Box
                  key={index}
                  className="schedule-item"
                  display="flex"
                  flexDirection="column" // Stacks items vertically
                  alignItems="flex-start" // Aligns items to the left
                  mb={2} // Adds margin bottom for spacing between schedule items
                >
                  <Typography variant="h6">
                    {item.day} | {item.time}
                  </Typography>
                  <Box display="flex" alignItems="center">
                    <LocationOnIcon fontSize="small" />
                    <Typography
                      variant="h6"
                      sx={{
                        ml: 1,
                        fontWeight: 'bold',
                        textDecoration: 'underline',
                      }}
                    >
                      {item.location}
                    </Typography>
                  </Box>
                </Box>
              ))
            ) : (
              <Typography variant="h6" gutterBottom>
                None Listed{' '}
              </Typography>
            )}
            {}
          </Grid>
        </Grid>
      </Box>
      {/* Close Button */}
      <Box display="flex" justifyContent="flex-end" mt={4}>
        <Link href="/Courses" passHref>
          <Button variant="contained" color="primary">
            Close
          </Button>
        </Link>
      </Box>
    </Paper>
  );
};

export default CourseDetails;
