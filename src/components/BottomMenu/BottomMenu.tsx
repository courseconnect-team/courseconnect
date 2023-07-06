import * as React from 'react';
import Box from '@mui/material/Box';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
// icons
import GroupIcon from '@mui/icons-material/Group'; // users
import MenuBookIcon from '@mui/icons-material/MenuBook'; // courses
import CollectionsBookmarkIcon from '@mui/icons-material/CollectionsBookmark'; // applications
import EditNoteIcon from '@mui/icons-material/EditNote'; // application
import AccountBoxIcon from '@mui/icons-material/AccountBox'; // profile

/* Depending on whether or not the signed-in user is a student, faculty, or admin,
  the bottom menu will be displaying different things.

  For a student:
  - application (if applying or applied) or courses (if accepted)

  For a faculty member:
  - applications
  - courses

  For an admin:
  - users
  - courses
  - applications

  For all:
  - profile, with some kind of embedded settings
  */

export type BottomMenuProps = {
  user_role: string;
  onComponentChange: (componentName: string) => void;
};

export default function BottomMenu(props: BottomMenuProps) {
  const { user_role, onComponentChange } = props;

  const [value, setValue] = React.useState('');
  const ref = React.useRef<HTMLDivElement>(null);

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
    onComponentChange(newValue);
  };

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
                onChange={handleChange}
              >
                <BottomNavigationAction
                  label="Users"
                  value="users"
                  icon={<GroupIcon />}
                />
                <BottomNavigationAction
                  label="Courses"
                  value="courses"
                  icon={<MenuBookIcon />}
                />
                <BottomNavigationAction
                  label="Applications"
                  value="applications"
                  icon={<CollectionsBookmarkIcon />}
                />
                <BottomNavigationAction
                  label="Profile"
                  value="profile"
                  icon={<AccountBoxIcon />}
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
                onChange={handleChange}
              >
                <BottomNavigationAction
                  label="Applications"
                  value="applications"
                  icon={<CollectionsBookmarkIcon />}
                />
                <BottomNavigationAction
                  label="Courses"
                  value="courses"
                  icon={<MenuBookIcon />}
                />
                <BottomNavigationAction
                  label="Profile"
                  value="profile"
                  icon={<AccountBoxIcon />}
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
                onChange={handleChange}
              >
                <BottomNavigationAction
                  label="Application"
                  value="application"
                  icon={<EditNoteIcon />}
                />
                <BottomNavigationAction
                  label="Profile"
                  value="profile"
                  icon={<AccountBoxIcon />}
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
                onChange={handleChange}
              >
                <BottomNavigationAction
                  label="Application Status"
                  value="application_status"
                  icon={<EditNoteIcon />}
                />
                <BottomNavigationAction
                  label="Profile"
                  value="profile"
                  icon={<AccountBoxIcon />}
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
                onChange={handleChange}
              >
                <BottomNavigationAction
                  label="Courses"
                  value="courses"
                  icon={<MenuBookIcon />}
                />
                <BottomNavigationAction
                  label="Profile"
                  value="profile"
                  icon={<AccountBoxIcon />}
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
                onChange={handleChange}
              >
                <BottomNavigationAction
                  label="Profile"
                  value="profile"
                  icon={<AccountBoxIcon />}
                />
              </BottomNavigation>
            </Paper>
          </Box>
        </>
      );
  }
}
