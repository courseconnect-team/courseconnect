'use client';
import * as React from 'react';
import { FC } from 'react';

import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';

import { Toaster } from 'react-hot-toast';

import PageLayout from '@/components/PageLayout/PageLayout';
import { getNavItems } from '@/hooks/useGetItems';

import { useAuth } from '@/firebase/auth/auth_context';
import GetUserRole from '@/firebase/util/GetUserRole';
import UserGrid from '@/component/Dashboard/Users/UserGrid';
import ApprovalGrid from '@/component/Dashboard/Users/ApprovalGrid';

interface PageProps { }

const User: FC<PageProps> = () => {
  const { user } = useAuth();
  const [role, loading, error] = GetUserRole(user?.uid);

  // 0 = All Users, 1 = Unapproved Users
  const [tab, setTab] = React.useState(0);

  if (loading) return <div>Loading…</div>;
  if (error) return <div>Error loading role</div>;
  if (role !== 'admin') return <div>Forbidden</div>;

  return (
    <PageLayout mainTitle="Users" navItems={getNavItems(role)}>
      <CssBaseline />
      <Toaster />

      {/* Tabs Container */}
      <Box sx={{ marginLeft: 10, mb: 3 }}>
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
            aria-label="users view switch"
            TabIndicatorProps={{
              style: {
                height: 3,
                borderRadius: 2,
              },
            }}
          >
            <Tab
              label="All"
              sx={{
                textTransform: 'none',
                fontWeight: tab === 0 ? 600 : 400,
              }}
            />
            <Tab
              label="Unapproved Faculty"
              sx={{
                textTransform: 'none',
                fontWeight: tab === 1 ? 600 : 400,
              }}
            />
          </Tabs>
        </Paper>
      </Box>

      {/* Content */}
      {tab === 0 ? (
        <Box sx={{ mb: 10 }}>
          <UserGrid userRole={role} />
        </Box>
      ) : (
        <Box>
          <ApprovalGrid userRole={role} />
        </Box>
      )}
    </PageLayout>
  );
};

export default User;

