'use client';

import React from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import HeaderCard from '@/components/HeaderCard/HeaderCard';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useDepartments } from '@/hooks/useDepartments';
import { Department } from '@/types/department';

function StatusChip({ status }: { status: Department['status'] }) {
  if (status === 'archived') {
    return (
      <Chip label="Archived" size="small" color="default" variant="outlined" />
    );
  }
  return (
    <Chip label="Active" size="small" color="success" variant="outlined" />
  );
}

function DepartmentCard({ dept }: { dept: Department }) {
  const dimmed = dept.status === 'archived';
  return (
    <Card variant="outlined" sx={{ opacity: dimmed ? 0.7 : 1 }}>
      <CardActionArea component={Link} href={`/admin/departments/${dept.id}`}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h6" component="div">
              {dept.code}
            </Typography>
            <StatusChip status={dept.status} />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {dept.name}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 1 }}
          >
            id: {dept.id}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export default function DepartmentsListPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const {
    departments,
    loading: deptsLoading,
    error,
  } = useDepartments({
    include: 'all',
  });

  if (userLoading) return <div>Loading…</div>;
  if (!user.superAdmin) {
    return (
      <HeaderCard title="Departments">
        <Typography>Forbidden — super admin only.</Typography>
      </HeaderCard>
    );
  }

  return (
    <HeaderCard title="Departments">
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button
          component={Link}
          href="/admin/departments/new"
          variant="contained"
          startIcon={<AddIcon />}
        >
          New department
        </Button>
      </Box>

      {deptsLoading && <Typography>Loading departments…</Typography>}
      {error && (
        <Typography color="error">
          Error loading departments: {error.message}
        </Typography>
      )}

      {!deptsLoading && departments.length === 0 && (
        <Card variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No departments yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Seed the initial ECE/CISE/MAE departments via the{' '}
            <code>seed:departments</code> script, or create one manually.
          </Typography>
          <Button
            component={Link}
            href="/admin/departments/new"
            variant="contained"
            startIcon={<AddIcon />}
          >
            Create the first department
          </Button>
        </Card>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 2,
        }}
      >
        {departments.map((dept) => (
          <DepartmentCard key={dept.id} dept={dept} />
        ))}
      </Box>
    </HeaderCard>
  );
}
