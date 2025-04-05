import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  SxProps,
} from '@mui/material';
import firebase from '@/firebase/firebase_config';
import { collection, addDoc } from 'firebase/firestore';
import { Theme } from '@emotion/react';
import {v4 as uuidv4} from 'uuid';

/** Define an interface that matches your JSON keys (without using any values). */
interface FormData {
  id: string;
  project_title: string;
  department: string;
  faculty_mentor: string;
  phd_student_mentor: string;
  terms_available: string;
  student_level: string;
  prerequisites: string;
  credit: string;
  stipend: string;
  application_requirements: string;
  application_deadline: string;
  website: string;
  project_description: string;
}

/** Initialize all fields to empty strings. */
interface ResearchModal {
  onSubmitSuccess: () => void;
  currentFormData: FormData;
  buttonStyle?: SxProps<Theme>;
  buttonText: string;
  firebaseQuery: (formData: any) => Promise<void>;
  uid: string
}
const ResearchModal: React.FC<ResearchModal> = ({
  onSubmitSuccess,
  currentFormData,
  buttonStyle,
  buttonText,
  firebaseQuery,
  uid
}) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>(currentFormData);

  /** Opens the dialog (modal). */
  const handleOpen = () => {
    setOpen(true);
  };

  /** Closes the dialog (modal).
   *  Note that we do NOT reset the form data here,
   *  so the draft remains if the user reopens the modal.
   */
  const handleClose = () => {
    setOpen(false);
  };

  /** Updates the corresponding form field in state. */
  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /** Submits the form and clears it, then closes the dialog. */
  async function handleSubmit() {
    // Do something with the form data, e.g., console.log or send to a server

    // Reset form data only on submit
    const finalFormData = {
        ...formData,
        id: uuidv4(),
        creator_id: uid, 
        faculty_members: [uid],
        applications: [],
    }
    firebaseQuery(finalFormData);
    // Close the modal
    onSubmitSuccess();
    setFormData(currentFormData);
    handleClose();
  }

  return (
    <div>
      {/* Button to open the modal */}
      <Button onClick={handleOpen} sx={buttonStyle}>
        {buttonText}
      </Button>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle>{buttonText}</DialogTitle>
        <DialogContent>
          {/* Render each field as a TextField, using the JSON keys as "name" */}
          <TextField
            margin="dense"
            label="Project Title"
            name="project_title"
            value={formData.project_title}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            margin="dense"
            label="Department"
            name="department"
            value={formData.department}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            margin="dense"
            label="Faculty Mentor"
            name="faculty_mentor"
            value={formData.faculty_mentor}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            margin="dense"
            label="PhD Student Mentor"
            name="phd_student_mentor"
            value={formData.phd_student_mentor}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            margin="dense"
            label="Terms Available"
            name="terms_available"
            value={formData.terms_available}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            margin="dense"
            label="Student Level"
            name="student_level"
            value={formData.student_level}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            margin="dense"
            label="Prerequisites"
            name="prerequisites"
            value={formData.prerequisites}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            margin="dense"
            label="Credit"
            name="credit"
            value={formData.credit}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            margin="dense"
            label="Stipend"
            name="stipend"
            value={formData.stipend}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            margin="dense"
            label="Application Requirements"
            name="application_requirements"
            value={formData.application_requirements}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            margin="dense"
            label="Application Deadline"
            name="application_deadline"
            value={formData.application_deadline}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            margin="dense"
            label="Website"
            name="website"
            value={formData.website}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            margin="dense"
            label="Project Description"
            name="project_description"
            value={formData.project_description}
            onChange={handleChange}
            fullWidth
            multiline
            rows={4}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
          <Button variant="contained" onClick={handleSubmit}>
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ResearchModal;
