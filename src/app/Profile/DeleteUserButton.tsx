import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import PersonRemoveOutlinedIcon from '@mui/icons-material/PersonRemoveOutlined';
import ConfirmDialog from '@/components/ConfirmDialog/ConfirmDialog';
import { HandleDeleteUser } from '@/firebase/auth/auth_delete_prompt';

interface DeleteUserDialogProps {
  open: boolean;
  setOpen: (value: boolean) => void;
}

const DeleteUserDialog: React.FC<DeleteUserDialogProps> = ({
  open,
  setOpen,
}) => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => {
    if (!loading) setOpen(false);
  };

  const handleConfirm = async () => {
    setErr(null);
    setLoading(true);
    try {
      await HandleDeleteUser(email.trim(), password);
      setOpen(false); // close on success
    } catch (e: any) {
      setErr(e?.message ?? 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const confirmDisabled = !email.trim() || !password || loading;

  return (
    <div>
      <Button
        size="large"
        variant="contained"
        startIcon={<PersonRemoveOutlinedIcon />}
        onClick={handleClickOpen}
        style={{
          backgroundColor: '#5736ac',
          color: '#ffffff',
          borderRadius: '10px',
          height: '53px',
          width: '180px',
          textTransform: 'none',
        }}
      >
        Delete User
      </Button>

      <ConfirmDialog
        open={open}
        title="Delete Account?"
        description="Are you sure you want to delete your account?"
        onClose={handleClose}
        onConfirm={handleConfirm} // <-- pass a callback, don't invoke
        confirmLabel="Delete"
        confirmColor="error"
        loading={loading}
        // optional: prevent closing via backdrop/ESC while loading
        disableBackdropClose={loading}
      >
        {/* Custom content inside the dialog */}
        <div className="mt-3 space-y-3">
          <TextField
            fullWidth
            required
            name="email-reverify"
            label="UF Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <TextField
            fullWidth
            required
            name="password-reverify"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          {err && <p className="text-sm text-red-600">{err}</p>}
        </div>
      </ConfirmDialog>
    </div>
  );
};

export default DeleteUserDialog;
