/**
 * Reusable image upload field component for Research modals
 */
import React, { useRef } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import { uploadResearchImage } from './researchModalUtils';
import { COLORS } from '@/constants/theme';

interface ImageUploadFieldProps {
  imageFileName: string;
  uploading: boolean;
  onImageUpload: (url: string, fileName: string) => void;
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
  onError?: (error: Error) => void;
}

const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  imageFileName,
  uploading,
  onImageUpload,
  onUploadStart,
  onUploadEnd,
  onError,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File) => {
    onUploadStart?.();
    try {
      const downloadURL = await uploadResearchImage(file);
      onImageUpload(downloadURL, file.name);
    } catch (error) {
      console.error('Error uploading image:', error);
      onError?.(error as Error);
    } finally {
      onUploadEnd?.();
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

  return (
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
        '&:hover': { borderColor: COLORS.primary },
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
          <ImageOutlinedIcon sx={{ fontSize: 40, color: '#999', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Drop your image here, or{' '}
            <span style={{ color: COLORS.primary, fontWeight: 'bold' }}>
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
  );
};

export default ImageUploadField;
