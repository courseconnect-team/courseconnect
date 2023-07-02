import * as React from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

interface User {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  department: string;
  role: string;
  ufid: string;
}

interface UserGridProps {
  data: User[];
}

const UserGrid: React.FC<UserGridProps> = ({ data }) => {
  const columns: GridColDef[] = [
    { field: 'id', headerName: 'Firestore UID', width: 70 },
    { field: 'firstname', headerName: 'First Name', width: 130 },
    { field: 'lastname', headerName: 'Last Name', width: 130 },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'password', headerName: 'Password', width: 200 },
    { field: 'department', headerName: 'Department', width: 130 },
    { field: 'role', headerName: 'Role', width: 130 },
    { field: 'ufid', headerName: 'UFID', width: 130 },
  ];

  return (
    <div style={{ height: 400, width: '100%' }}>
      <DataGrid rows={data} columns={columns} />
    </div>
  );
};

export default UserGrid;
