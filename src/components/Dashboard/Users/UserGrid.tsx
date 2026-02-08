'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
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
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  LinearProgress,
  Button,
} from '@mui/material';
import { styled } from '@mui/material/styles';

import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';
import { deleteUserHTTPRequest } from '@/firebase/auth/auth_delete_user';
import { isE2EMode } from '@/utils/featureFlags';

interface User {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  department: string;
  role: string;
  ufid: string;
  isNew?: boolean;
  mode?: 'edit' | 'view' | undefined;
}

interface EditToolbarProps {
  setUserData: (newRows: (oldRows: GridRowsProp) => GridRowsProp) => void;
  setRowModesModel: (
    newModel: (oldModel: GridRowModesModel) => GridRowModesModel
  ) => void;
}

function EditToolbar(_props: EditToolbarProps) {
  // match CourseGrid toolbar look (default MUI icons/colors)
  return (
    <GridToolbarContainer>
      <GridToolbarExport />
      <GridToolbarFilterButton />
      <GridToolbarColumnsButton />
    </GridToolbarContainer>
  );
}

interface UserGridProps {
  userRole: string;
}

export default function UserGrid(props: UserGridProps) {
  const { userRole } = props;
  const e2e = isE2EMode();

  const [loading, setLoading] = React.useState(false);
  const [userData, setUserData] = React.useState<User[]>([]);

  const [delDia, setDelDia] = React.useState(false);
  const [delId, setDelId] = React.useState<GridRowId | null>(null);

  React.useEffect(() => {
    if (e2e) {
      setUserData([]);
      return;
    }

    const usersRef = firebase.firestore().collection('users');
    const unsubscribe = usersRef.onSnapshot((querySnapshot) => {
      const data = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            fullname: `${doc.data().firstname ?? ''} ${
              doc.data().lastname ?? ''
            }`,
            ...doc.data(),
          } as unknown as User)
      );
      setUserData(data);
    });

    return () => unsubscribe();
  }, [e2e]);

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
      if (!updatedRow) throw new Error(`No matching user data for id: ${id}`);

      await firebase
        .firestore()
        .collection('users')
        .doc(id.toString())
        .update(updatedRow);

      setRowModesModel({
        ...rowModesModel,
        [id]: { mode: GridRowModes.View },
      });
    } catch (err) {
      console.error('Error updating document: ', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDel = (id: GridRowId) => () => {
    setDelId(id);
    setDelDia(true);
  };

  const handleDeleteDiagClose = () => {
    setDelDia(false);
    setDelId(null);
  };

  const handleDeleteClick = async (id: GridRowId) => {
    setLoading(true);
    try {
      await firebase
        .firestore()
        .collection('users')
        .doc(id.toString())
        .delete();
      deleteUserHTTPRequest(id.toString());
      setUserData((prev) => prev.filter((row) => row.id !== id));
    } catch (err) {
      console.error('Error removing document: ', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (delId == null) return;
    await handleDeleteClick(delId);
    setDelDia(false);
    setDelId(null);
  };

  const handleCancelClick = (id: GridRowId) => async () => {
    setLoading(true);
    try {
      const editedRow = userData.find((row) => row.id === id);
      if (editedRow?.isNew) {
        await firebase
          .firestore()
          .collection('users')
          .doc(id.toString())
          .delete();
        setUserData((prev) => prev.filter((row) => row.id !== id));
      } else {
        setRowModesModel({
          ...rowModesModel,
          [id]: { mode: GridRowModes.View, ignoreModifications: true },
        });
      }
    } catch (err) {
      console.error('Error canceling edit: ', err);
    } finally {
      setLoading(false);
    }
  };

  const processRowUpdate = async (newRow: GridRowModel) => {
    setLoading(true);
    try {
      const updatedRow = { ...(newRow as User), isNew: false };

      // new rows not really used in your flow, but keep parity with CourseGrid
      if ((updatedRow as any).isNew) {
        await firebase.firestore().collection('users').add(updatedRow);
      } else {
        await firebase
          .firestore()
          .collection('users')
          .doc(updatedRow.id)
          .update(updatedRow);
      }

      setUserData((prev) =>
        prev.map((row) => (row.id === newRow.id ? (updatedRow as User) : row))
      );

      return updatedRow;
    } catch (err) {
      console.error('Error processing row update: ', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'firstname',
      headerName: 'First Name',
      width: 150,
      editable: true,
    },
    { field: 'lastname', headerName: 'Last Name', width: 150, editable: true },
    { field: 'email', headerName: 'Email', width: 250, editable: true },
    {
      field: 'department',
      headerName: 'Department',
      width: 130,
      editable: true,
    },
    { field: 'role', headerName: 'Role', width: 150, editable: true },
    { field: 'id', headerName: 'User ID', width: 290, editable: true },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 130,
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
            onClick={handleDel(id)}
            color="inherit"
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
    <>
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
          slots={{
            toolbar: EditToolbar,
          }}
          slotProps={{
            toolbar: { setUserData, setRowModesModel },
          }}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
          }}
          getRowClassName={(params) =>
            params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
          }
        />
      </Box>

      {/* keep your confirm-delete dialog (CourseGrid doesn't have it, but UI matches your app style) */}
      <Dialog
        style={{
          borderImage:
            'linear-gradient(to bottom, rgb(9, 251, 211), rgb(255, 111, 241)) 1',
          boxShadow: '0px 2px 20px 4px #00000040',
          borderRadius: '20px',
          border: '2px solid',
        }}
        PaperProps={{ style: { borderRadius: 20 } }}
        open={delDia}
        onClose={handleDeleteDiagClose}
      >
        <DialogTitle
          style={{
            fontFamily: 'SF Pro Display-Medium, Helvetica',
            textAlign: 'center',
            fontSize: '35px',
            fontWeight: '540',
          }}
        >
          Delete User
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <DialogContentText
              style={{
                marginTop: '35px',
                fontFamily: 'SF Pro Display-Medium, Helvetica',
                textAlign: 'center',
                fontSize: '24px',
                color: 'black',
              }}
            >
              Are you sure you want to delete this user?
            </DialogContentText>
          </DialogContent>
          <DialogActions
            style={{
              marginTop: '30px',
              marginBottom: '42px',
              display: 'flex',
              justifyContent: 'space-between',
              gap: '93px',
            }}
          >
            <Button
              variant="outlined"
              style={{
                fontSize: '17px',
                marginLeft: '110px',
                borderRadius: '10px',
                height: '43px',
                width: '120px',
                textTransform: 'none',
                fontFamily: 'SF Pro Display-Bold , Helvetica',
                borderColor: '#5736ac',
                color: '#5736ac',
                borderWidth: '3px',
              }}
              onClick={handleDeleteDiagClose}
            >
              Cancel
            </Button>

            <Button
              variant="contained"
              style={{
                fontSize: '17px',
                marginRight: '110px',
                borderRadius: '10px',
                height: '43px',
                width: '120px',
                textTransform: 'none',
                fontFamily: 'SF Pro Display-Bold , Helvetica',
                backgroundColor: '#5736ac',
                color: '#ffffff',
              }}
              type="submit"
            >
              Delete
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
