import * as React from 'react';
import Box from '@mui/material/Box';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import RestoreIcon from '@mui/icons-material/Restore';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ArchiveIcon from '@mui/icons-material/Archive';
import Paper from '@mui/material/Paper';

/* Depending on whether or not the signed-in user is a student, faculty, or admin,
  the bottom menu will be displaying different things.

  For a student:
  - apply (if applying or applied) or courses (if accepted)

  For a faculty member:
  - applications
  - courses

  For an admin:
  - users
  - courses
  - applications

  For all:
  - settings
  - profile
  */

function generateOptions(role: string) {
  switch (role) {
    case 'admin':
      return (
        <>
          <BottomNavigationAction label="Users" icon={<RestoreIcon />} />
          <BottomNavigationAction label="Courses" icon={<FavoriteIcon />} />
          <BottomNavigationAction label="Applications" icon={<ArchiveIcon />} />
          <BottomNavigationAction label="Profile" icon={<RestoreIcon />} />
          <BottomNavigationAction label="Settings" icon={<FavoriteIcon />} />
        </>
      );
    case 'faculty':
      return (
        <>
          <BottomNavigationAction label="Applications" icon={<RestoreIcon />} />
          <BottomNavigationAction label="Courses" icon={<FavoriteIcon />} />
          <BottomNavigationAction label="Profile" icon={<RestoreIcon />} />
          <BottomNavigationAction label="Settings" icon={<FavoriteIcon />} />
        </>
      );
    case 'student_applying':
      return (
        <>
          <BottomNavigationAction label="Application" icon={<RestoreIcon />} />
          <BottomNavigationAction label="Profile" icon={<RestoreIcon />} />
          <BottomNavigationAction label="Settings" icon={<FavoriteIcon />} />
        </>
      );
    case 'student_applied':
      return (
        <>
          <BottomNavigationAction label="Status" icon={<RestoreIcon />} />
          <BottomNavigationAction label="Courses" icon={<FavoriteIcon />} />
          <BottomNavigationAction label="Profile" icon={<RestoreIcon />} />
          <BottomNavigationAction label="Settings" icon={<FavoriteIcon />} />
        </>
      );
    case 'student_accepted':
      return (
        <>
          <BottomNavigationAction label="Application" icon={<RestoreIcon />} />
          <BottomNavigationAction label="Profile" icon={<RestoreIcon />} />
          <BottomNavigationAction
            label="Settings"
            icon={<FavoriteIcon />}
          />{' '}
        </>
      );
    default:
      return (
        <>
          <BottomNavigationAction label="Profile" icon={<RestoreIcon />} />
          <BottomNavigationAction label="Settings" icon={<FavoriteIcon />} />
        </>
      );
  }
}

export type BottomMenuProps = {
  user_role: string;
};

export default function BottomMenu(props: BottomMenuProps) {
  const { user_role } = props;

  const [value, setValue] = React.useState(0);
  const ref = React.useRef<HTMLDivElement>(null);

  switch (user_role) {
    case 'admin':
      return (
        <>
          <Box sx={{ pb: 7 }} ref={ref}>
            <Paper
              sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}
              elevation={3}
            >
              <BottomNavigation
                showLabels
                value={value}
                onChange={(event, newValue) => {
                  setValue(newValue);
                }}
              >
                <BottomNavigationAction label="Users" icon={<RestoreIcon />} />
                <BottomNavigationAction
                  label="Courses"
                  icon={<FavoriteIcon />}
                />
                <BottomNavigationAction
                  label="Applications"
                  icon={<ArchiveIcon />}
                />
                <BottomNavigationAction
                  label="Profile"
                  icon={<RestoreIcon />}
                />
                <BottomNavigationAction
                  label="Settings"
                  icon={<FavoriteIcon />}
                />
              </BottomNavigation>
            </Paper>
          </Box>
        </>
      );
    case 'faculty':
      return (
        <>
          <Box sx={{ pb: 7 }} ref={ref}>
            <Paper
              sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}
              elevation={3}
            >
              <BottomNavigation
                showLabels
                value={value}
                onChange={(event, newValue) => {
                  setValue(newValue);
                }}
              >
                <BottomNavigationAction
                  label="Applications"
                  icon={<RestoreIcon />}
                />
                <BottomNavigationAction
                  label="Courses"
                  icon={<FavoriteIcon />}
                />
                <BottomNavigationAction
                  label="Profile"
                  icon={<RestoreIcon />}
                />
                <BottomNavigationAction
                  label="Settings"
                  icon={<FavoriteIcon />}
                />
              </BottomNavigation>
            </Paper>
          </Box>
        </>
      );
    case 'student_applying':
      return (
        <>
          <Box sx={{ pb: 7 }} ref={ref}>
            <Paper
              sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}
              elevation={3}
            >
              <BottomNavigation
                showLabels
                value={value}
                onChange={(event, newValue) => {
                  setValue(newValue);
                }}
              >
                <BottomNavigationAction
                  label="Application"
                  icon={<RestoreIcon />}
                />
                <BottomNavigationAction
                  label="Profile"
                  icon={<RestoreIcon />}
                />
                <BottomNavigationAction
                  label="Settings"
                  icon={<FavoriteIcon />}
                />
              </BottomNavigation>
            </Paper>
          </Box>
        </>
      );
    case 'student_applied':
      return (
        <>
          <Box sx={{ pb: 7 }} ref={ref}>
            <Paper
              sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}
              elevation={3}
            >
              <BottomNavigation
                showLabels
                value={value}
                onChange={(event, newValue) => {
                  setValue(newValue);
                }}
              >
                <BottomNavigationAction
                  label="Application"
                  icon={<RestoreIcon />}
                />
                <BottomNavigationAction
                  label="Profile"
                  icon={<RestoreIcon />}
                />
                <BottomNavigationAction
                  label="Settings"
                  icon={<FavoriteIcon />}
                />
              </BottomNavigation>
            </Paper>
          </Box>
        </>
      );
    case 'student_accepted':
      return (
        <>
          <Box sx={{ pb: 7 }} ref={ref}>
            <Paper
              sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}
              elevation={3}
            >
              <BottomNavigation
                showLabels
                value={value}
                onChange={(event, newValue) => {
                  setValue(newValue);
                }}
              >
                <BottomNavigationAction
                  label="Courses"
                  icon={<RestoreIcon />}
                />
                <BottomNavigationAction
                  label="Profile"
                  icon={<RestoreIcon />}
                />
                <BottomNavigationAction
                  label="Settings"
                  icon={<FavoriteIcon />}
                />
              </BottomNavigation>
            </Paper>
          </Box>
        </>
      );
    default:
      return (
        <>
          <Box sx={{ pb: 7 }} ref={ref}>
            <Paper
              sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}
              elevation={3}
            >
              <BottomNavigation
                showLabels
                value={value}
                onChange={(event, newValue) => {
                  setValue(newValue);
                }}
              >
                <BottomNavigationAction
                  label="Profile"
                  icon={<RestoreIcon />}
                />
                <BottomNavigationAction
                  label="Settings"
                  icon={<FavoriteIcon />}
                />
              </BottomNavigation>
            </Paper>
          </Box>
        </>
      );
  }
}
