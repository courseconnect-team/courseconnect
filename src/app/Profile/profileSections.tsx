import React, { useEffect, useMemo, useState } from 'react';
import { Role } from '@/types/User';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Button from '@mui/material/Button';
import { updateProfile } from 'firebase/auth';
/* ---------- helpers ---------- */

const display = (v: unknown, fallback = 'Not listed'): string => {
  if (v == null) return fallback;
  if (typeof v === 'string') {
    const t = v.trim();
    return t ? t : fallback;
  }
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : fallback;
  return String(v);
};

const roleLabel = (role?: Role | null): string => {
  switch (role) {
    case 'Student':
      return 'Student';
    case 'student_applying':
      return 'Student (Applying)';
    case 'student_applied':
      return 'Student (Applied)';
    case 'student_accepted':
      return 'Student (Accepted)';
    case 'student_denied':
      return 'Student (Denied)';
    case 'faculty':
      return 'Faculty';
    case 'admin':
      return 'Admin';
    case 'unapproved':
      return 'Unapproved';
    default:
      return 'Not listed';
  }
};

const splitName = (full: unknown) => {
  const s =
    typeof full === 'string'
      ? full
      : typeof full === 'number'
      ? String(full)
      : '';

  const safe = s.trim();
  if (!safe) return { first: '', last: '' };
  const parts = safe.split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
};

/* ---------- shared button styles ---------- */

const BTN_W = 138;
const BTN_H = 40;
const RADIUS = 2;

const primaryBtnSx = {
  textTransform: 'none' as const,
  backgroundColor: '#6739B7',
  color: '#fff',
  width: BTN_W,
  height: BTN_H,
  borderRadius: RADIUS,
  '&:hover': { backgroundColor: '#522DA8' },
};

const textBtnSx = {
  textTransform: 'none' as const,
  color: '#6739B7',
  width: BTN_W,
  height: BTN_H,
  borderRadius: RADIUS,
  '&:hover': { backgroundColor: 'rgba(103,57,183,0.08)' },
};

const PrimaryButton: React.FC<React.ComponentProps<typeof Button>> = (
  props
) => <Button variant="contained" sx={primaryBtnSx} {...props} />;

const GhostButton: React.FC<React.ComponentProps<typeof Button>> = (props) => (
  <Button variant="text" sx={textBtnSx} {...props} />
);

/* ---------- main component ---------- */

type ProfileProps = {
  name?: string | null;
  user?: any;
  role?: Role | null;
  email?: string | null;
  avatarUrl?: string | null;
  /** optional save handler if you want to persist the change */
  onSaveName?: (fullName: string) => Promise<void> | void;
};

export default function ProfileSection({
  name,
  user,
  role,
  email,
  avatarUrl,
  onSaveName,
}: ProfileProps) {
  const [editing, setEditing] = useState(false);
  const [updatedFirst, setUpdatedFirst] = useState<string>('');
  const [updatedLast, setUpdatedLast] = useState<string>('');
  const initial = useMemo(() => splitName(name), [name]);

  // seed inputs from prop name
  useEffect(() => {
    setUpdatedFirst(initial.first);
    setUpdatedLast(initial.last);
  }, [initial.first, initial.last]);

  const displayName = React.useMemo(() => {
    if (typeof name === 'string') {
      const t = name.trim();
      return t || 'Not listed';
    }
    return 'Not listed';
  }, [name]);

  const handleSave = async (e: any) => {
    e.preventDefault(); // Prevent the form from submitting in the traditional way
    if (updatedFirst.trim() !== '' && updatedLast.trim() !== '') {
      if (updatedLast !== initial.last || updatedFirst !== initial.first) {
        try {
          await updateProfile(user, {
            displayName: `${updatedFirst} ${updatedLast}`,
          });
          window.location.reload();
          alert('Profile updated successfully');
        } catch (error) {
          console.error('Error updating profile: ', error);
          alert('Failed to update profile');
        }
      } else {
        setEditing(false);
      }
    } else {
      alert('First name and last name cannot be empty.');
    }
  };

  return (
    <div className="mt-6 flex justify-between">
      {/* Left: avatar + info */}
      <section
        className="flex flex-col sm:flex-row items-start gap-8 sm:gap-14"
        aria-label="User profile summary"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={`${display(name, 'User')} avatar`}
            className="w-36 h-36 sm:w-40 sm:h-40 rounded-full object-cover"
          />
        ) : (
          <div
            className="w-36 h-36 sm:w-40 sm:h-40 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#522DA8' }}
          >
            <AccountCircleIcon
              sx={{ fontSize: 200 }}
              className="text-primary-light"
              aria-hidden
            />
          </div>
        )}

        <div className="grid gap-5">
          {/* Name */}
          <div>
            <h2 className="text-h4">Name</h2>
            {editing ? (
              <div className="mt-2 flex gap-3">
                <input
                  className="h-10 w-48 border border-gray-900 px-4 text-sm rounded-none focus:outline-none focus:ring-2 focus:ring-primary"
                  type="text"
                  placeholder="First name"
                  value={updatedFirst}
                  onChange={(e) => setUpdatedFirst(e.target.value)}
                />
                <input
                  className="h-10 w-56 border border-gray-900 px-4 text-sm rounded-none focus:outline-none focus:ring-2 focus:ring-primary"
                  type="text"
                  placeholder="Last name"
                  value={updatedLast}
                  onChange={(e) => setUpdatedLast(e.target.value)}
                />
              </div>
            ) : (
              <p className="mt-2 text-body1">{displayName}</p>
            )}
          </div>

          {/* Position */}
          <InfoRow title="Position" value={roleLabel(role)} />

          {/* Email */}
          <InfoRow title="Email" value={display(email)} />
        </div>
      </section>

      {/* Right: actions */}
      {editing ? (
        <div className="flex flex-col gap-3 mr-12">
          <PrimaryButton onClick={handleSave}>Save Changes</PrimaryButton>
          <GhostButton>Delete Profile</GhostButton>
        </div>
      ) : (
        <div className="mr-12 self-start">
          <PrimaryButton onClick={() => setEditing(true)}>
            Edit Profile
          </PrimaryButton>
        </div>
      )}
    </div>
  );
}

/* ---------- small presentational piece ---------- */

function InfoRow({ title, value }: { title: string; value: string }) {
  return (
    <div>
      <h2 className="text-h4">{title}</h2>
      <p className="mt-2 text-body1">{value}</p>
    </div>
  );
}
