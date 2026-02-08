import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  IconButton,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

interface FormData {
  project_title: string;
  project_description: string;
  department: string;
  image_url: string;
  nature_of_job: string;
  compensation: string;
  faculty_contact: string;
  phd_student_contact: string;
  application_deadline: string;
  hours_per_week: string;
  prerequisites: string;
  terms_available: string;
  student_level: string;
  application_requirements: string;
  website: string;
}

const INITIAL_FORM_DATA: FormData = {
  project_title: '',
  project_description: '',
  department: '',
  image_url: '',
  nature_of_job: '',
  compensation: '',
  faculty_contact: '',
  phd_student_contact: '',
  application_deadline: '',
  hours_per_week: '',
  prerequisites: '',
  terms_available: '',
  student_level: '',
  application_requirements: '',
  website: '',
};

const NATURE_OF_JOB_OPTIONS = [
  'Research Assistant',
  'Lab Assistant',
  'Teaching Assistant',
  'Field Work',
  'Data Analysis',
  'Other',
];

interface ResearchModalProps {
  open: boolean;
  onClose: () => void;
  onSubmitSuccess: () => void;
  firebaseQuery: (formData: any) => Promise<void>;
  uid: string;
}

const ResearchModal: React.FC<ResearchModalProps> = ({
  open,
  onClose,
  onSubmitSuccess,
  firebaseQuery,
  uid,
}) => {
  const [formData, setFormData] = useState<FormData>({ ...INITIAL_FORM_DATA });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {}
  );
  const [uploading, setUploading] = useState(false);
  const [imageFileName, setImageFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const storage = getStorage();
      const storageRef = ref(
        storage,
        `research-images/${uuidv4()}_${file.name}`
      );
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      setFormData((prev) => ({ ...prev, image_url: downloadURL }));
      setImageFileName(file.name);
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.project_title.trim()) newErrors.project_title = 'Required';
    if (!formData.project_description.trim())
      newErrors.project_description = 'Required';
    if (!formData.department.trim()) newErrors.department = 'Required';
    if (!formData.nature_of_job) newErrors.nature_of_job = 'Required';
    if (!formData.compensation.trim()) newErrors.compensation = 'Required';
    if (!formData.faculty_contact.trim())
      newErrors.faculty_contact = 'Required';
    if (!formData.application_deadline.trim())
      newErrors.application_deadline = 'Required';
    if (!formData.hours_per_week.trim()) newErrors.hours_per_week = 'Required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDiscard = () => {
    setFormData({ ...INITIAL_FORM_DATA });
    setErrors({});
    setImageFileName('');
    onClose();
  };

  const handleSaveAndExit = () => {
    // Save draft in state (form data persists until discard)
    onClose();
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const finalFormData = {
      ...formData,
      creator_id: uid,
      faculty_members: [uid],
    };
    await firebaseQuery(finalFormData);
    onSubmitSuccess();
    setFormData({ ...INITIAL_FORM_DATA });
    setErrors({});
    setImageFileName('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: { borderRadius: '12px' },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontWeight: 'bold',
          fontSize: '1.25rem',
        }}
      >
        Create Position
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2}>
          {/* Row 1: Title + Position Description */}
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" fontWeight="bold" mb={0.5}>
              <span style={{ color: '#5A41D8' }}>*</span> Title
            </Typography>
            <TextField
              name="project_title"
              placeholder="Ex. Research Assistant"
              value={formData.project_title}
              onChange={handleChange}
              fullWidth
              size="small"
              error={!!errors.project_title}
              helperText={errors.project_title}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" fontWeight="bold" mb={0.5}>
              <span style={{ color: '#5A41D8' }}>*</span> Position Description
            </Typography>
            <TextField
              name="project_description"
              placeholder="Enter description"
              value={formData.project_description}
              onChange={handleChange}
              fullWidth
              size="small"
              multiline
              rows={4}
              error={!!errors.project_description}
              helperText={errors.project_description}
            />
          </Grid>

          {/* Row 2: Department */}
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" fontWeight="bold" mb={0.5}>
              <span style={{ color: '#5A41D8' }}>*</span> Department
            </Typography>
            <TextField
              name="department"
              placeholder="Ex. ECE"
              value={formData.department}
              onChange={handleChange}
              fullWidth
              size="small"
              error={!!errors.department}
              helperText={errors.department}
            />
          </Grid>

          {/* Image Upload */}
          <Grid item xs={12}>
            <Box
              onDrop={handleFileDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                border: '2px dashed #ccc',
                borderRadius: '12px',
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: '#fafafa',
                '&:hover': { borderColor: '#5A41D8' },
              }}
            >
              {uploading ? (
                <CircularProgress size={24} />
              ) : imageFileName ? (
                <Typography variant="body2" color="text.secondary">
                  {imageFileName}
                </Typography>
              ) : (
                <>
                  <ImageOutlinedIcon
                    sx={{ fontSize: 40, color: '#999', mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Drop your image here, or{' '}
                    <span style={{ color: '#5A41D8', fontWeight: 'bold' }}>
                      browse
                    </span>
                  </Typography>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleFileSelect}
              />
            </Box>
          </Grid>

          {/* Row 3: Nature of Job, Compensation, Faculty Contact, PhD Student Contact */}
          <Grid item xs={12} sm={3}>
            <Typography variant="body2" fontWeight="bold" mb={0.5}>
              <span style={{ color: '#5A41D8' }}>*</span> Nature of Job
            </Typography>
            <TextField
              name="nature_of_job"
              select
              value={formData.nature_of_job}
              onChange={handleChange}
              fullWidth
              size="small"
              error={!!errors.nature_of_job}
              helperText={errors.nature_of_job}
            >
              {NATURE_OF_JOB_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Typography variant="body2" fontWeight="bold" mb={0.5}>
              <span style={{ color: '#5A41D8' }}>*</span> Compensation
            </Typography>
            <TextField
              name="compensation"
              placeholder="Ex. $10/hr or 2 credits"
              value={formData.compensation}
              onChange={handleChange}
              fullWidth
              size="small"
              error={!!errors.compensation}
              helperText={errors.compensation}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Typography variant="body2" fontWeight="bold" mb={0.5}>
              <span style={{ color: '#5A41D8' }}>*</span> Faculty Contact
            </Typography>
            <TextField
              name="faculty_contact"
              placeholder="Ex. albertgator@ufl.edu"
              value={formData.faculty_contact}
              onChange={handleChange}
              fullWidth
              size="small"
              error={!!errors.faculty_contact}
              helperText={errors.faculty_contact}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Typography variant="body2" fontWeight="bold" mb={0.5}>
              PhD Student Contact
            </Typography>
            <TextField
              name="phd_student_contact"
              placeholder="Ex. alberta@ufl.edu"
              value={formData.phd_student_contact}
              onChange={handleChange}
              fullWidth
              size="small"
            />
          </Grid>

          {/* Row 4: Application Deadline, Hours per Week, Prerequisites */}
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" fontWeight="bold" mb={0.5}>
              <span style={{ color: '#5A41D8' }}>*</span> Application Deadline
            </Typography>
            <TextField
              name="application_deadline"
              type="date"
              placeholder="Ex. 01/31/2026"
              value={formData.application_deadline}
              onChange={handleChange}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              error={!!errors.application_deadline}
              helperText={errors.application_deadline}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" fontWeight="bold" mb={0.5}>
              <span style={{ color: '#5A41D8' }}>*</span> Hours per Week
            </Typography>
            <TextField
              name="hours_per_week"
              placeholder="Ex. 10"
              value={formData.hours_per_week}
              onChange={handleChange}
              fullWidth
              size="small"
              error={!!errors.hours_per_week}
              helperText={errors.hours_per_week}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" fontWeight="bold" mb={0.5}>
              Prerequisites
            </Typography>
            <TextField
              name="prerequisites"
              placeholder="Enter description"
              value={formData.prerequisites}
              onChange={handleChange}
              fullWidth
              size="small"
              multiline
              rows={2}
            />
          </Grid>

          {/* Row 5: Terms Available, Student Level, Website, Application Requirements */}
          <Grid item xs={12} sm={3}>
            <Typography variant="body2" fontWeight="bold" mb={0.5}>
              Terms Available
            </Typography>
            <TextField
              name="terms_available"
              placeholder="Ex. Fall, Spring"
              value={formData.terms_available}
              onChange={handleChange}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Typography variant="body2" fontWeight="bold" mb={0.5}>
              Student Level
            </Typography>
            <TextField
              name="student_level"
              placeholder="Ex. Junior, Senior"
              value={formData.student_level}
              onChange={handleChange}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Typography variant="body2" fontWeight="bold" mb={0.5}>
              Website
            </Typography>
            <TextField
              name="website"
              placeholder="Ex. https://lab.ufl.edu"
              value={formData.website}
              onChange={handleChange}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Typography variant="body2" fontWeight="bold" mb={0.5}>
              Application Requirements
            </Typography>
            <TextField
              name="application_requirements"
              placeholder="Ex. Resume, Transcript"
              value={formData.application_requirements}
              onChange={handleChange}
              fullWidth
              size="small"
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        <Button
          onClick={handleDiscard}
          sx={{
            textTransform: 'none',
            color: '#5A41D8',
            fontWeight: 500,
          }}
        >
          Discard
        </Button>
        <Box display="flex" gap={1}>
          <Button
            onClick={handleSaveAndExit}
            sx={{
              textTransform: 'none',
              color: '#5A41D8',
              fontWeight: 500,
            }}
          >
            Save & Exit
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            sx={{
              backgroundColor: '#5A41D8',
              color: '#FFFFFF',
              textTransform: 'none',
              fontWeight: 500,
              borderRadius: '8px',
              '&:hover': {
                backgroundColor: '#4A35B8',
              },
            }}
          >
            Create & Post
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default ResearchModal;
