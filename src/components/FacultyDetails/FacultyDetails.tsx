'use client';

import React, { Component, ReactNode, useState } from 'react';
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
import useFetchTempPastCourses from '@/hooks/old/useFetchTempPastCourses';
import { Timeline } from '../Timeline/Timeline';
import SmallClassCard from '../SmallClassCard/SmallClassCard';

interface FacultyDetailsProps {
  instructor: string;
  research_level: string;
}

const getColors = (research_level: string) => {
  if (research_level === 'Low') {
    return {
      color: '#D32727',
      background: '#d327271f', // 8-digit hex (the "1f" part is alpha)
    };
  } else if (research_level === 'Mid') {
    return {
      color: '#f2a900',
      background: 'rgba(242, 169, 0, 0.12)',
    };
  } else if (research_level === 'High') {
    // defaults to 'High' or anything else
    return {
      color: '#22884C',
      background: 'rgba(34, 136, 76, 0.12)',
    };
  } else {
    return;
  }
};

const FacultyDetails: React.FC<FacultyDetailsProps> = ({
  // id, // Firestore document ID
  // accumulatedUnits,
  // assignedUnits,
  // averageUnits,
  // creditDeficit,
  // creditExcess,
  // email,
  // firstname,
  // labCourse,
  // lastname,
  // researchActivity,
  // classesTaught,
  // ufid,
  instructor,
  research_level,
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(0);

  const currentYear = new Date().getFullYear();
  const year = currentYear - selectedYear;

  const semesterArray = [`Spring ${year}`, `Summer ${year}`, `Fall ${year}`];
  const researchColors = getColors(research_level);

  const cardStyle = {
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    height: '85%',
  };

  const { pastCourses, loadingPast, error } = useFetchTempPastCourses(
    semesterArray,
    instructor
  );
  // // Helper function to format instructor name safely
  // const formatInstructorName = (name: string) => {
  //   const parts = name.split(',');
  //   if (parts.length === 2) {
  //     return `${parts[1].trim()} ${parts[0].trim()}`;
  //   }
  //   return name; // Return as is if format is unexpected
  // };

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
      <Grid container spacing={3} alignItems="center">
        <Grid item xs={12} md={4}>
          <Box display="flex" flexDirection="column" alignItems="center">
            <PersonOutlineOutlinedIcon sx={{ fontSize: 80 }} />
            <Typography variant="h6">{`${instructor.split(',')[1]} ${
              instructor.split(',')[0]
            }`}</Typography>
            {/* <Typography variant="subtitle1">{email}</Typography>
            <Typography variant="body2">UFID: {ufid}</Typography> */}
          </Box>
        </Grid>
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              {/* <CourseUnitInfo
                current={accumulatedUnits}
                total={assignedUnits}
              /> */}
            </Grid>
            <Grid item xs={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2">Credit Deficit</Typography>
                  {/* <Typography variant="h6" color="error">
                    {creditDeficit} CU
                  </Typography> */}
                </CardContent>
              </Card>
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2">Credit Excess</Typography>
                  {/* <Typography variant="h6" color="success">
                    {creditExcess} CU
                  </Typography> */}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2">
                    Total Classes Taught
                  </Typography>
                  {/* <Typography variant="h6">{classesTaught} Classes</Typography> */}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2">
                    Average Credit Units
                  </Typography>
                  {/* <Typography variant="h6">{averageUnits} CU</Typography> */}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={6}>
          <Card
            sx={{
              ...cardStyle,
              bgcolor: researchColors?.background,
              color: researchColors?.color,
            }}
          >
            <CardContent>
              <Typography variant="subtitle2">
                Research Activity Level
              </Typography>
              {research_level}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6}>
          <Card sx={cardStyle}>
            <CardContent>
              <Typography variant="subtitle2">Lab Course</Typography>
              {/* {lab} */}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ mt: 3 }}>
        Classes Taught (last 3 years)
      </Typography>
      <Timeline selectedYear={selectedYear} setSelectedYear={setSelectedYear} />
      {loadingPast ? (
        <div>Loading past courses...</div>
      ) : pastCourses.length !== 0 ? (
        <div
          className="class-cards-container"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            minWidth: '630px',
            maxWidth: '100px',
          }}
        >
          {pastCourses.map((course, index) => (
            <div
              key={index}
              style={{
                flex: '1 1 calc(33.33% - 10px)', // Adjusts for three cards per row
                maxWidth: 'calc(33.33% - 10px)',
              }}
            >
              <SmallClassCard
                courseName={course.code}
                courseId={course.id}
                className="class"
                onGoing={false}
              />
            </div>
          ))}
        </div>
      ) : (
        <div>No past courses available.</div>
      )}
      <Box display="flex" justifyContent="flex-end" mt={3}>
        <Button variant="contained" color="primary">
          Close
        </Button>
      </Box>
    </Paper>
  );
};

export default FacultyDetails;
