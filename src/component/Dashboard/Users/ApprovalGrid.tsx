
'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import CancelIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import { ThumbDownOffAlt, ThumbUpOffAlt } from '@mui/icons-material';

import {
  GridRowModesModel,
  GridRowsProp,
  GridRowModes,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarFilterButton,
  GridToolbarColumnsButton,
  DataGrid,
  GridColDef,
  GridActionsCellItem,
  GridEventListener,
  GridRowId,
  GridRowModel,
  GridRowEditStopReasons,
  gridClasses,
} from '@mui/x-data-grid';

import { LinearProgress } from '@mui/material';
import { styled } from '@mui/material/styles';

import { deleteUserHTTPRequest } from '@/firebase/auth/auth_delete_user';
import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';

interface User {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  department: string;
  role: string;
  isNew?: boolean;
  fullname: string;
  mode?: 'edit' | 'view' | undefined;
}

interface EditToolbarProps {
  setApplicationData: (
    newRows: (oldRows: GridRowsProp) => GridRowsProp
  ) => void;
  setRowModesModel: (
    newModel: (oldModel: GridRowModesModel) => GridRowModesModel
  ) => void;
}

function EditToolbar(_props: EditToolbarProps) {
  // ✅ match CourseGrid toolbar (default styling)
  return (
    <GridToolbarContainer>
      <GridToolbarExport />
      <GridToolbarFilterButton />
      <GridToolbarColumnsButton />
    </GridToolbarContainer>
  );
}

interface ApprovalGridProps {
  userRole: string;
}

export default function ApprovalGrid(props: ApprovalGridProps) {
  const { userRole } = props;

  const [loading, setLoading] = React.useState(false);
  const [userData, setUserData] = React.useState<User[]>([]);

  React.useEffect(() => {
    const usersRef = firebase
      .firestore()
      .collection('users')
      .where('role', '==', 'unapproved');

    const unsubscribe = usersRef.onSnapshot((querySnapshot) => {
      const data = querySnapshot.docs.map(
        (doc) =>
        ({
          id: doc.id,
          fullname: `${doc.data().firstname ?? ''} ${doc.data().lastname ?? ''}`,
          ...doc.data(),
        } as User)
      );

      setUserData(data);
    });

    return () => unsubscribe();
  }, []);

  const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>(
    {}
  );

  const handleRowEditStop: GridEventListener<'rowEditStop'> = (
    params,
    event
  ) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

  const handleEditClick = (id: GridRowId) => () => {
    setLoading(true);
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
    setLoading(false);
  };

  const handleSaveClick = (id: GridRowId) => async () => {
    setLoading(true);
    try {
      const updatedRow = userData.find((row) => row.id === id);
      if (!updatedRow) throw new Error(`No matching user data found for id: ${id}`);

      await firebase.firestore().collection('users').doc(id.toString()).update(updatedRow);

      setRowModesModel({
        ...rowModesModel,
        [id]: { mode: GridRowModes.View },
      });
    } catch (error) {
      console.error('Error updating document: ', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClick = (id: GridRowId) => async () => {
    setLoading(true);
    try {
      await firebase.firestore().collection('users').doc(id.toString()).update({ role: 'faculty' });
      setRowModesModel({
        ...rowModesModel,
        [id]: { mode: GridRowModes.View },
      });
    } catch (error) {
      console.error('Error updating document: ', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDenyClick = (id: GridRowId) => async () => {
    setLoading(true);
    try {
      await firebase.firestore().collection('users').doc(id.toString()).update({ role: 'denied' });
      setRowModesModel({
        ...rowModesModel,
        [id]: { mode: GridRowModes.View },
      });
    } catch (error) {
      console.error('Error updating document: ', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: GridRowId) => async () => {
    setLoading(true);
    try {
      await firebase.firestore().collection('users').doc(id.toString()).delete();
      deleteUserHTTPRequest(id.toString());
      setUserData((prev) => prev.filter((row) => row.id !== id));
    } catch (error) {
      console.error('Error removing document: ', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = (id: GridRowId) => async () => {
    setLoading(true);
    try {
      const editedRow = userData.find((row) => row.id === id);
      if (editedRow?.isNew) {
        await firebase.firestore().collection('users').doc(id.toString()).delete();
        setUserData((prev) => prev.filter((row) => row.id !== id));
      } else {
        setRowModesModel({
          ...rowModesModel,
          [id]: { mode: GridRowModes.View, ignoreModifications: true },
        });
      }
    } catch (error) {
      console.error('Error removing document: ', error);
    } finally {
      setLoading(false);
    }
  };

  const processRowUpdate = async (newRow: GridRowModel) => {
    setLoading(true);
    try {
      const updatedRow = { ...(newRow as User), isNew: false };

      if ((updatedRow as any).isNew) {
        await firebase.firestore().collection('users').add(updatedRow);
      } else {
        await firebase.firestore().collection('users').doc(updatedRow.id).update(updatedRow);
      }

      setUserData((prev) =>
        prev.map((row) => (row.id === newRow.id ? (updatedRow as User) : row))
      );

      return updatedRow;
    } catch (error) {
      console.error('Error processing row update: ', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const columns: GridColDef[] = [
    { field: 'fullname', headerName: 'Full Name', width: 202, editable: true },
    { field: 'email', headerName: 'Email', width: 215, editable: true },
    { field: 'department', headerName: 'Department', width: 119, editable: true },
    { field: 'role', headerName: 'Role', width: 150, editable: true },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 180,
      cellClassName: 'actions',
      getActions: ({ id }) => {
        const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

        if (isInEditMode) {
          return [
            <GridActionsCellItem
              key="save"
              icon={<SaveIcon />}
              label="Save"
              sx={{ color: 'primary.main' }}
              onClick={handleSaveClick(id)}
            />,
            <GridActionsCellItem
              key="cancel"
              icon={<CancelIcon />}
              label="Cancel"
              className="textPrimary"
              onClick={handleCancelClick(id)}
              color="inherit"
            />,
          ];
        }

        return [
          <GridActionsCellItem
            key="edit"
            icon={<EditIcon />}
            label="Edit"
            className="textPrimary"
            onClick={handleEditClick(id)}
            color="inherit"
          />,
          <GridActionsCellItem
            key="delete"
            icon={<DeleteIcon />}
            label="Delete"
            onClick={handleDeleteClick(id)}
            color="inherit"
          />,
          <GridActionsCellItem
            key="approve"
            icon={<ThumbUpOffAlt />}
            label="Approve"
            onClick={handleApproveClick(id)}
            color="success"
          />,
          <GridActionsCellItem
            key="deny"
            icon={<ThumbDownOffAlt />}
            label="Deny"
            onClick={handleDenyClick(id)}
            color="error"
          />,
        ];
      },
    },
  ];

  // ✅ Copy CourseGrid UI styling
  const StripedDataGrid = styled(DataGrid)(() => ({
    border: 'none',
    borderRadius: '16px',
    fontFamily: 'Inter, sans-serif',
    fontSize: '0.95rem',

    '& .MuiDataGrid-columnHeaders': {
      backgroundColor: '#D8C6F8',
      color: '#1C003D',
      fontWeight: 700,
      borderBottom: 'none',
    },

    '& .MuiDataGrid-columnHeaderTitle': {
      fontWeight: 700,
    },

    '& .MuiDataGrid-columnHeader:first-of-type': {
      paddingLeft: '20px',
    },
    '& .MuiDataGrid-cell:first-of-type': {
      paddingLeft: '25px',
    },

    [`& .${gridClasses.row}.even`]: {
      backgroundColor: '#FFFFFF',
    },
    [`& .${gridClasses.row}.odd`]: {
      backgroundColor: '#EEEEEE',
    },

    '& .MuiDataGrid-row:hover': {
      backgroundColor: '#EFE6FF',
    },

    '& .MuiDataGrid-cell': {
      borderBottom: '1px solid #ECE4FA',
    },

    '& .MuiDataGrid-footerContainer': {
      borderTop: 'none',
    },

    '& .MuiTablePagination-root': {
      color: '#5D3FC4',
      fontWeight: 500,
    },
  }));

  return (
    <Box
      sx={{
        marginLeft: 10,
        height: 600,
        width: '90%',
        backgroundColor: '#FDFBFF',
        borderRadius: '16px',
        boxShadow: '0 2px 8px rgba(128, 90, 213, 0.1)',
        '& .actions': { color: 'text.secondary' },
        '& .textPrimary': { color: 'text.primary' },
      }}
    >
      {loading ? <LinearProgress color="warning" /> : null}

      <StripedDataGrid
        rows={userData}
        columns={columns}
        editMode="row"
        rowModesModel={rowModesModel}
        onRowModesModelChange={(m) => setRowModesModel(m)}
        onRowEditStop={handleRowEditStop}
        processRowUpdate={processRowUpdate}
        onProcessRowUpdateError={(error) =>
          console.error('Error processing row update: ', error)
        }
        slots={{ toolbar: EditToolbar as any }}
        slotProps={{ toolbar: { setApplicationData: setUserData, setRowModesModel } as any }}
        initialState={{
          pagination: { paginationModel: { pageSize: 25 } },
        }}
        getRowClassName={(params) =>
          params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
        }
      />
    </Box>
  );
}

