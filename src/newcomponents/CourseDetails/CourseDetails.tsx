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
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import Link from 'next/link';
import EnrollmentDisplay from '../EnrollmentDisplay/EnrollmentDisplay';
interface CourseDetailsProps {
  courseName: string;
  semester: string;
  instructor: string;
  email: string;
  studentsEnrolled: number;
  maxStudents: number;
  credits: number; // if you have min/max, swap to a string like "0–4"
  courseCode: string;
  department: string;
  TAs: { name: string; email: string }[];
  title: string;
  schedule: { day: string; time: string; location: string }[];
}

const cardBaseSx = {
  boxShadow: '0px 2px 12px rgba(0,0,0,0.08)',
  borderRadius: 2,
  height: '100%',
};

const StatCard = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <Card sx={cardBaseSx}>
    <CardContent>
      <Typography className="text-body1 !font-bold text-center">
        {label}
      </Typography>
      <Typography variant="body2" align="center">
        {value}
      </Typography>
    </CardContent>
  </Card>
);

const LabeledLine = ({
  label,
  value,
  value2,
}: {
  label: string;
  value: React.ReactNode;
  value2: React.ReactNode;
}) => (
  <Box>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography className="text-body1 !font-bold text-center">
        {label}
      </Typography>
    </Box>
    <Typography
      component="div"
      variant="body2"
      className="flex items-center justify-between w-full"
    >
      <span>{value}</span>
      <span className="ml-4">{value2}</span>
    </Typography>
  </Box>
);

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
  const formatInstructorName = (name: string) => {
    const parts = name.split(',');
    return parts.length === 2 ? `${parts[1].trim()} ${parts[0].trim()}` : name;
  };

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        <Typography className="text-subtitle1">{semester}</Typography>
      </Box>

      {/* Main row */}
      <Grid container spacing={3} alignItems="stretch">
        {/* Left stack: Instructor / TA */}
        <Grid item xs={12} md={3}>
          <Grid container spacing={2} alignItems="stretch">
            <Grid item xs={12}>
              <Card sx={cardBaseSx}>
                <CardContent sx={{ display: 'grid', gap: 1 }}>
                  <LabeledLine
                    label="Instructor"
                    value={formatInstructorName(instructor)}
                    value2={email}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card sx={cardBaseSx}>
                <CardContent>
                  <Typography className="text-body1 !font-bold">TA</Typography>
                  <Box sx={{ mt: 1, display: 'grid', gap: 1.5 }}>
                    {TAs.length === 0 && (
                      <Typography variant="body2" color="text.secondary">
                        No TAs assigned
                      </Typography>
                    )}
                    {TAs.map((ta, i) => (
                      <Box
                        key={i}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Typography variant="body2">{ta.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {ta.email || 'Missing'}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Middle: Students Enrolled */}
        <Grid item xs={12} md={4}>
          <Card sx={cardBaseSx}>
            <CardContent>
              <Typography className="text-body1 !font-bold">
                Students Enrolled
              </Typography>
              {/* Your donut/percentage component */}
              <EnrollmentDisplay
                students={studentsEnrolled}
                capacity={maxStudents}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Right column: three stat cards on top, schedule below */}
        <Grid item xs={12} md={5}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <StatCard label="Min-Max Credits" value={credits} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard label="Course Code" value={`#${courseCode}`} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard label="Department" value={department} />
            </Grid>

            <Grid item xs={12}>
              <Card sx={cardBaseSx}>
                <CardContent>
                  <Typography className="text-body1 !font-bold">
                    Schedule
                  </Typography>

                  {Array.isArray(schedule) && schedule.length > 0 ? (
                    <Box sx={{ display: 'grid', gap: 1.25, mt: 1 }}>
                      {schedule.map((item, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <Typography variant="body2">
                            {item.day} | {item.time}
                          </Typography>

                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <LocationOnIcon fontSize="small" />
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                textDecoration: 'underline',
                              }}
                            >
                              {item.location}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      None listed
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};

export default CourseDetails;
