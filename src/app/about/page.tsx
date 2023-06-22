'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import Button from '@mui/material/Button';
import {
  Container,
  Box,
  Typography,
  Link,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const AboutPage: React.FC = () => {
  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          About Course Connect App
        </Typography>
        <Typography variant="body1" component="p" paragraph>
          Course Connect is a TA course management tool designed to streamline
          the process of hiring student assistants and effectively track course
          performances.
        </Typography>
        <Typography variant="body1" component="p" paragraph>
          Key features of Course Connect:
        </Typography>
        <ul>
          <li>
            Hiring Student Assistants: Easily manage the process of hiring and
            assigning student assistants to courses, helping to enhance the
            teaching and learning experience.
          </li>
          <li>
            Course Performance Tracking: Track and analyze course performances,
            enabling instructors to gain insights into student progress and
            identify areas for improvement.
          </li>
          <li>
            Seamless Collaboration: Facilitate collaboration between
            instructors, student assistants, and students, fostering an
            interactive and engaging learning environment.
          </li>
        </ul>
        <Typography variant="body1" component="p" paragraph>
          Course Connect is supervised by Professor Cristophe Bobda, an esteemed
          faculty member at the University of Florida (UF).
        </Typography>
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="help-content"
            id="help-header"
          >
            <Typography variant="body1">Issues/Help</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body1" component="p" paragraph>
              If you encounter any issues or require assistance while using
              Course Connect, our support team is available to help. Please
              reach out to us via the contact details provided in the app or
              visit our support section for FAQs and troubleshooting
              information.
            </Typography>
            <Typography variant="body1" component="p" paragraph>
              For immediate assistance, you can submit your issue using the form
              below:
            </Typography>
            <form>
              <TextField
                id="issue-description"
                label="Issue Description"
                multiline
                rows={4}
                fullWidth
                required
              />
              <Button variant="contained" type="submit">
                Submit Issue
              </Button>
            </form>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Container>
  );
};

export default AboutPage;
