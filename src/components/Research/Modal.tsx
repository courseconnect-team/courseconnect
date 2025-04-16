import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  SxProps,
  Grid,
  MenuItem,
  Checkbox,
  InputLabel,
  FormControlLabel,
  InputAdornment,
} from '@mui/material';
import firebase from '@/firebase/firebase_config';
import { collection, addDoc } from 'firebase/firestore';
import { Theme } from '@emotion/react';
import { v4 as uuidv4 } from 'uuid';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/** Define an interface that matches your JSON keys (without using any values). */
interface FormData {
  id: string;
  project_title: string;
  department: string;
  faculty_mentor: string;
  phd_student_mentor: string;
  terms_available: string[];
  student_level: string[];
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
  uid: string;
}
const ResearchModal: React.FC<ResearchModal> = ({
  onSubmitSuccess,
  currentFormData,
  buttonStyle,
  buttonText,
  firebaseQuery,
  uid,
}) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>(currentFormData);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUploading, setImageUploading] = useState(false);

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

  /** Handles image file selection. */
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setImageFile(event.target.files[0]);
    }
  };

  /** Uploads the image to Firebase Storage and returns the download URL. */
  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;

    const storage = getStorage();
    const storageRef = ref(
      storage,
      `research-images/${uuidv4()}-${imageFile.name}`
    );
    setImageUploading(true);

    try {
      await uploadBytes(storageRef, imageFile);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    } finally {
      setImageUploading(false);
    }
  };

  /** Submits the form and clears it, then closes the dialog. */
  const handleSubmit = async () => {
    const imageUrl = await uploadImage();

    const finalFormData = {
      ...formData,
      id: uuidv4(),
      creator_id: uid,
      faculty_members: [uid],
      applications: [],
      image_url: imageUrl || '', // Add the image URL to the form data
    };

    firebaseQuery(finalFormData);
    onSubmitSuccess();
    setFormData(currentFormData);
    handleClose();
  };

  return (
    <div>
      {/* Button to open the modal */}
      <Button onClick={handleOpen} sx={buttonStyle}>
        {buttonText}
      </Button>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle>{buttonText}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {/* Project Title */}
            <Grid item xs={12}>
              <TextField
                margin="dense"
                label="Project Title"
                name="project_title"
                value={formData.project_title}
                onChange={handleChange}
                fullWidth
              />
            </Grid>

            {/* Department */}
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                label="Department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                fullWidth
              />
            </Grid>

            {/* Faculty Mentor */}
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                label="Faculty Mentor"
                name="faculty_mentor"
                value={formData.faculty_mentor}
                onChange={handleChange}
                fullWidth
              />
            </Grid>

            {/* PhD Student Mentor */}
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                label="PhD Student Mentor"
                name="phd_student_mentor"
                value={formData.phd_student_mentor}
                onChange={handleChange}
                fullWidth
              />
            </Grid>

            {/* Terms Available */}
            <Grid item xs={12}>
              <TextField
                select
                label="Terms Available"
                name="terms_available_display" // Change the name to avoid submitting this field
                value={formData.terms_available.split(',')} // Convert the string to an array for the Select component
                onChange={(e) => {
                  const value = e.target.value as string[];
                  setFormData((prev) => ({
                    ...prev,
                    terms_available: value.join(','), // Convert the array back to a comma-separated string
                  }));
                }}
                SelectProps={{
                  multiple: true, // Enable multiple selection
                }}
                fullWidth
              >
                {['Fall', 'Spring', 'Summer'].map((term) => (
                  <MenuItem key={term} value={term}>
                    {term}
                  </MenuItem>
                ))}
              </TextField>
              {/* Hidden input for Terms Available */}
              <input
                type="hidden"
                name="terms_available"
                value={formData.terms_available}
              />
            </Grid>
            {/* Log Student Level */}
            <Grid item xs={12}>
              <Button
                onClick={() =>
                  console.log('Student Level:', formData.student_level)
                }
                sx={{
                  textTransform: 'none',
                  color: '#5A41D8',
                  fontWeight: 500,
                }}
              >
                Log Student Level
              </Button>
            </Grid>
            {/* Student Level */}
            <Grid item xs={12}>
              <TextField
                select
                label="Student Level"
                name="student_level_display" // Change the name to avoid submitting this field
                value={formData.student_level.split(',')} // Convert the string to an array for the Select component
                onChange={(e) => {
                  const value = e.target.value as string[];
                  setFormData((prev) => ({
                    ...prev,
                    student_level: value.join(','), // Convert the array back to a comma-separated string
                  }));
                }}
                SelectProps={{
                  multiple: true, // Enable multiple selection
                }}
                fullWidth
              >
                {['Freshman', 'Sophomore', 'Junior', 'Senior'].map((level) => (
                  <MenuItem key={level} value={level}>
                    {level}
                  </MenuItem>
                ))}
              </TextField>
              {/* Hidden input for Student Level */}
              <input
                type="hidden"
                name="student_level"
                value={formData.student_level}
              />
            </Grid>

            {/* Prerequisites */}
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                label="Prerequisites"
                name="prerequisites"
                value={formData.prerequisites}
                onChange={handleChange}
                fullWidth
              />
            </Grid>

            {/* Credit */}
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                label="Credit"
                name="credit"
                type="number"
                inputProps={{ min: 0, max: 9 }}
                value={formData.credit}
                onChange={handleChange}
                fullWidth
              />
            </Grid>

            {/* Stipend */}
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                label="Stipend"
                name="stipend"
                value={formData.stipend}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">$</InputAdornment>
                  ), // Add dollar sign
                }}
                fullWidth
              />
            </Grid>

            {/* Website */}
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                label="Website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                fullWidth
              />
            </Grid>

            {/* Application Requirements */}
            <Grid item xs={12}>
              <TextField
                margin="dense"
                label="Application Requirements"
                name="application_requirements"
                value={formData.application_requirements}
                onChange={handleChange}
                fullWidth
              />
            </Grid>

            {/* Application Deadline */}
            <Grid item xs={12} sm={6}>
              <InputLabel shrink>Application Deadline</InputLabel>
              <TextField
                name="application_deadline"
                type="date"
                value={
                  formData.application_deadline === 'rolling'
                    ? ''
                    : formData.application_deadline
                }
                onChange={handleChange}
                fullWidth
                disabled={formData.application_deadline === 'rolling'}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.application_deadline === 'rolling'}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        application_deadline: e.target.checked ? 'rolling' : '',
                      }));
                    }}
                  />
                }
                label="Rolling"
              />
            </Grid>

            {/* Project Description */}
            <Grid item xs={12}>
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
            </Grid>

            {/* Image Upload Field */}
            <Grid item xs={12}>
              <Button
                component="label"
                sx={{
                  backgroundColor: '#5A41D8',
                  color: '#FFFFFF',
                  textTransform: 'none',
                  borderRadius: '8px',
                  boxShadow: '0px 0px 8px #E5F0DC',
                  fontWeight: 500,
                  padding: '10px 24px',
                  marginTop: '16px',
                  '&:hover': {
                    backgroundColor: '#5A41D8',
                    boxShadow: '0px 0px 8px #E5F0DC',
                  },
                }}
              >
                Upload Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  hidden
                />
              </Button>
              {imageUploading && <p>Uploading image...</p>}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleClose}
            sx={{
              textTransform: 'none',
              color: '#5A41D8',
              fontWeight: 500,
            }}
          >
            Close
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={imageUploading}
            sx={{
              backgroundColor: '#5A41D8',
              color: '#FFFFFF',
              textTransform: 'none',
              fontWeight: 500,
              '&:hover': {
                backgroundColor: '#5A41D8',
              },
            }}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ResearchModal;
