import React from 'react';
import './style.css';
import { Paper } from '@mui/material';

interface JobProps {
  title: string;
  department: string;
  faculty: string;
  terms: string[];
  level: string[];
  occupancy: number;
  description: string;
  mentor: string;
  prereq: string;
  credits: string;
  stipend: string;
  requirements: string;
  deadline: string;
  website: string;
  contact: string;
}
export const JobCard = (props: JobProps) => {
  return (
    <Paper elevation={6} style={{ padding: '20px', margin: '20px' }}>
      <div style={{}}>{props.title}</div>
      <div>{props.department}</div>
      <br />
      <div>{props.department}</div>

      <div>{props.description}</div>
    </Paper>
  );
};
