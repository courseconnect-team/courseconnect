// replace shadcn imports:
// import { Dialog, DialogContent } from '@/components/ui/dialog';
import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { ApplicationPreview } from '@/components/ApplicationPreview/ApplicationPreview';
import { ApplicationData, ApplicationStatus } from '@/types/query';
import Box from '@mui/material/Box';

export interface ApplicationModalProps {
  courseId: string;
  open: boolean;
  onClose: () => void;
  id: string;
  parentPath: string;
  documentData?: ApplicationData;
  documentStatus?: ApplicationStatus;
}

export function ApplicationModal({
  courseId,
  open,
  onClose,
  id,
  parentPath,
  documentData,
  documentStatus,
}: ApplicationModalProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      // Take over sizing ourselves:
      maxWidth={false}
      fullScreen={fullScreen}
      keepMounted
      PaperProps={{
        sx: {
          width: { xs: '100vw', md: 'min(1200px, 96vw)' },
          maxHeight: { xs: '100vh', md: 'calc(100vh - 64px)' },
          m: 0,
          borderRadius: { xs: 0, md: 2 },
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="text-sm font-medium">{courseId}</div>
        <div className="flex items-center gap-2">
          <a
            className="text-xs underline"
            href={`${parentPath}/${id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open in new tab
          </a>
          <IconButton size="small" onClick={onClose} aria-label="Close">
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>
      </div>

      {/* Body fills the dialog and scrolls if needed */}
      <DialogContent
        sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}
      >
        <Box
          sx={{
            flex: 1,
            overflow: 'auto' /* scroll content, keep header fixed */,
          }}
        >
          {/* If your preview has its own max-width, you can center/expand it here */}
          <div className="mx-auto w-full max-w-[1200px]">
            <ApplicationPreview
              data={documentData}
              courseId={courseId}
              documentId={id}
              status={documentStatus}
            />
          </div>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
