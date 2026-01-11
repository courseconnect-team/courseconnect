// AnnouncementDialog.tsx
import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Box,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Chip,
  Autocomplete,
  Typography,
  Divider,
} from '@mui/material';
import MessageBody from '@/components/Messagebody/MessageBody';
import {
  Announcement,
  AudienceDepartment,
  AudienceRole,
  AudienceType,
} from '@/types/announcement';

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (draft: Announcement) => Promise<void> | void;
  loading?: boolean;
  // options for audience pickers
  roleOptions?: AudienceRole[];
  departmentOptions?: AudienceDepartment[];
};

const toPreview = (s: string, n = 140) =>
  s.replace(/\s+/g, ' ').trim().slice(0, n);

const generateTokens = (type: AudienceType, values: string[]) => {
  const norm = (s: string) => s.trim().toLowerCase();

  if (type === 'all') return ['all'];

  if (type === 'roles') {
    return values.map((r) => `role:${norm(r)}`);
  }

  if (type === 'departments') {
    return values.map((d) => `dept:${norm(d)}`);
  }

  // users
  return values.map((email) => `user:${norm(email)}`);
};

export default function AnnouncementDialog({
  open,
  onClose,
  onSubmit,
  loading = false,
  roleOptions = ['admin', 'faculty', 'student'],
  departmentOptions = ['ECE', 'CISE', 'MAE'],
}: Props) {
  const formatDateInputValue = (value: Date | null) => {
    if (!value) return '';
    const d = new Date(value);
    const pad = (n: number) => `${n}`.padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [title, setTitle] = React.useState('');
  const [bodyMd, setBodyMd] = React.useState('');
  const [pinned, setPinned] = React.useState(false);
  const [requireAck, setRequireAck] = React.useState(false);
  const [scheduledAt, setScheduledAt] = React.useState<Date | null>(null);
  const [expiresAt, setExpiresAt] = React.useState<Date | null>(null);
  const [email, setEmail] = React.useState<boolean>(false);

  const [audType, setAudType] = React.useState<AudienceType>('all');
  const [audValues, setAudValues] = React.useState<string[]>([]);

  const [touched, setTouched] = React.useState(false);

  const titleErr = touched && title.trim().length === 0;
  const bodyErr = touched && bodyMd.trim().length === 0;

  const badSchedule =
    scheduledAt && new Date(scheduledAt) < new Date(Date.now() - 60_000);
  const badExpiry =
    expiresAt && scheduledAt && new Date(expiresAt) < new Date(scheduledAt);

  const canSubmit =
    title.trim() && bodyMd.trim() && !badSchedule && !badExpiry && !loading;

  const resetAndClose = () => {
    setTouched(false);
    onClose();
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;

    const channelFlags = {
      inApp: true,
      email: email,
    };

    const draft: Announcement = {
      title: title.trim(),
      bodyMd: bodyMd.trim(),
      pinned,
      requireAck,
      scheduledAt: scheduledAt || null,
      expiresAt: expiresAt || null,
      channels: channelFlags,
      audience:
        audType === 'all'
          ? { type: 'all' }
          : audType === 'roles'
          ? { type: 'roles', roles: audValues as AudienceRole[] }
          : audType === 'departments'
          ? {
              type: 'departments',
              departments: audValues as AudienceDepartment[],
            }
          : { type: 'users', emails: audValues },
      audienceTokens: generateTokens(audType, audValues),
    };

    await onSubmit(draft);
  }

  return (
    <Dialog
      open={open}
      onClose={resetAndClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
    >
      <DialogTitle sx={{ textAlign: 'center', fontWeight: 600, fontSize: 28 }}>
        Send Announcement
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent dividers sx={{ display: 'grid', gap: 2 }}>
          {/* Subject & body */}
          <TextField
            autoFocus
            label="Subject"
            placeholder="Short, descriptive title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={!!titleErr}
            helperText={titleErr ? 'Subject is required' : ' '}
            inputProps={{ maxLength: 140 }}
          />
          <MessageBody value={bodyMd} onChange={setBodyMd} />

          {/* Preview chip */}
          <Typography variant="body2" sx={{ opacity: 0.75 }}>
            Preview snippet (stored in inbox): <em>{toPreview(bodyMd)}</em>
          </Typography>

          <Divider sx={{ my: 1 }} />

          {/* Audience */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              select
              label="Audience Type"
              SelectProps={{ native: true }}
              value={audType}
              onChange={(e) => setAudType(e.target.value as AudienceType)}
              sx={{ minWidth: 220 }}
            >
              <option value="all">All users</option>
              <option value="roles">By roles</option>
              <option value="departments">By departments</option>
              <option value="users">Specific users (email)</option>
            </TextField>

            {audType === 'roles' && (
              <Autocomplete
                multiple
                options={roleOptions}
                value={audValues}
                onChange={(_, v) => setAudValues(v)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option}
                      {...getTagProps({ index })}
                      key={option}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField {...params} label="Roles" />
                )}
                sx={{ flex: 1 }}
              />
            )}

            {audType === 'departments' && (
              <Autocomplete
                multiple
                options={departmentOptions}
                value={audValues}
                onChange={(_, v) => setAudValues(v)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option}
                      {...getTagProps({ index })}
                      key={option}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField {...params} label="Departments" />
                )}
                sx={{ flex: 1 }}
              />
            )}

            {audType === 'users' && (
              <Autocomplete
                multiple
                freeSolo
                options={[]}
                value={audValues}
                onChange={(_, v) => setAudValues(v)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="User IDs (ufl.edu)"
                    placeholder="Add email and press Enter"
                  />
                )}
                sx={{ flex: 1 }}
              />
            )}
          </Stack>

          {/* Scheduling / flags */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Schedule (optional)"
              type="datetime-local"
              value={formatDateInputValue(scheduledAt)}
              onChange={(e) =>
                setScheduledAt(e.target.value ? new Date(e.target.value) : null)
              }
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 260 }}
              error={!!badSchedule}
              helperText={badSchedule ? 'Cannot schedule in the past' : ' '}
            />
            <TextField
              label="Expires (optional)"
              type="datetime-local"
              value={formatDateInputValue(expiresAt)}
              onChange={(e) =>
                setExpiresAt(e.target.value ? new Date(e.target.value) : null)
              }
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 260 }}
              error={!!badExpiry}
              helperText={badExpiry ? 'Expiry must be after schedule' : ' '}
            />
          </Stack>

          <FormGroup row sx={{ gap: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={pinned}
                  onChange={(e) => setPinned(e.target.checked)}
                />
              }
              label="Pin to top"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={requireAck}
                  onChange={(e) => setRequireAck(e.target.checked)}
                />
              }
              label="Require acknowledgment"
            />
            <Divider flexItem orientation="vertical" sx={{ mx: 1 }} />
            <FormControlLabel
              control={
                <Checkbox checked={email} onChange={() => setEmail(!email)} />
              }
              label="Email Notification"
            />
          </FormGroup>
        </DialogContent>

        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button variant="outlined" onClick={resetAndClose} disabled={loading}>
            Cancel
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={() => setTouched(true)}
              disabled={loading}
            >
              Review
            </Button>
            <Button variant="contained" type="submit" disabled={!canSubmit}>
              {loading ? 'Sending…' : 'Send'}
            </Button>
          </Box>
        </DialogActions>
      </form>
    </Dialog>
  );
}
