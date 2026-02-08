'use client';

import * as React from 'react';

import ApplicationGrid from './ApplicationGrid';
import AssignmentGrid from './AssignmentGrid';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';

// for admin and faculty views
interface ApplicationsProps {
  userRole: string;
}

export default function Applications(props: ApplicationsProps) {
  const { userRole } = props;

  // 0 = Applications, 1 = Assignments
  const [tab, setTab] = React.useState(0);

  // Faculty only has ApplicationGrid, so no tabs needed
  if (userRole === 'faculty') {
    return <ApplicationGrid userRole={userRole} />;
  }

  // Default: return nothing
  if (userRole !== 'admin') return <></>;

  // Admin: tabs to switch between grids
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Paper
          variant="outlined"
          sx={{
            display: 'inline-block',
            borderRadius: 2,
            px: 1,
          }}
        >
          <Tabs
            value={tab}
            onChange={(_e, newValue) => setTab(newValue)}
            aria-label="applications view switch"
            TabIndicatorProps={{
              style: {
                height: 3,
                borderRadius: 2,
              },
            }}
          >
            <Tab
              label="Applications"
              sx={{
                textTransform: 'none',
                fontWeight: tab === 0 ? 600 : 400,
              }}
            />
            <Tab
              label="Assignments"
              sx={{
                textTransform: 'none',
                fontWeight: tab === 1 ? 600 : 400,
              }}
            />
          </Tabs>
        </Paper>
      </Box>

      {tab === 0 ? (
        <Box>
          <ApplicationGrid userRole={userRole} />
        </Box>
      ) : (
        <Box>
          <AssignmentGrid userRole={userRole} />
        </Box>
      )}
    </Box>
  );
}
