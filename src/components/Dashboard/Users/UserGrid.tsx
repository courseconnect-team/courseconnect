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
  useGridApiContext,
} from '@mui/x-data-grid';
import { deleteUserHTTPRequest } from '@/firebase/auth/auth_delete_user';
import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';

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

function EditToolbar(props: EditToolbarProps) {
  const { setUserData, setRowModesModel } = props;

  // Add state to control the dialog open status
  const [open, setOpen] = React.useState(false);

  return (
    <GridToolbarContainer>
      {/* Include your Dialog component here and pass the open state and setOpen function as props */}
      <GridToolbarExport />
      <GridToolbarFilterButton />
      <GridToolbarColumnsButton />
    </GridToolbarContainer>
  );
}

export default function UserGrid() {
  const [userData, setUserData] = React.useState<User[]>([]);

  React.useEffect(() => {
    const usersRef = firebase.firestore().collection('users');
    usersRef.get().then((querySnapshot) => {
      const data = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as User)
      );
      setUserData(data);
    });
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
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
  };

  const handleSaveClick = (id: GridRowId) => () => {
    const updatedRow = userData.find((row) => row.id === id);
    if (updatedRow) {
      firebase
        .firestore()
        .collection('users')
        .doc(id.toString())
        .update(updatedRow)
        .then(() => {
          setRowModesModel({
            ...rowModesModel,
            [id]: { mode: GridRowModes.View },
          });
        })
        .catch((error) => {
          console.error('Error updating document: ', error);
        });
    } else {
      console.error('No matching user data found for id: ', id);
    }
  };

  const handleDeleteClick = (id: GridRowId) => () => {
    firebase
      .firestore()
      .collection('users')
      .doc(id.toString())
      .delete()
      .then(() => {
        deleteUserHTTPRequest(id.toString());
        setUserData(userData.filter((row) => row.id !== id));
      })
      .catch((error) => {
        console.error('Error removing document: ', error);
      });
  };

  function CustomToolbar() {
    const apiRef = useGridApiContext();

    return (
      <GridToolbarContainer>
        <GridToolbarExport />
      </GridToolbarContainer>
    );
  }

  const handleCancelClick = (id: GridRowId) => () => {
    const editedRow = userData.find((row) => row.id === id);
    if (editedRow!.isNew) {
      firebase
        .firestore()
        .collection('users')
        .doc(id.toString())
        .delete()
        .then(() => {
          setUserData(userData.filter((row) => row.id !== id));
        })
        .catch((error) => {
          console.error('Error removing document: ', error);
        });
    } else {
      setRowModesModel({
        ...rowModesModel,
        [id]: { mode: GridRowModes.View, ignoreModifications: true },
      });
    }
  };

  const processRowUpdate = (newRow: GridRowModel) => {
    const updatedRow = { ...(newRow as User), isNew: false };
    if (updatedRow) {
      if (updatedRow.isNew) {
        return firebase
          .firestore()
          .collection('users')
          .add(updatedRow)
          .then(() => {
            setUserData(
              userData.map((row) => (row.id === newRow.id ? updatedRow : row))
            );
            return updatedRow;
          })
          .catch((error) => {
            console.error('Error adding document: ', error);
            throw error;
          });
      } else {
        return firebase
          .firestore()
          .collection('users')
          .doc(updatedRow.id)
          .update(updatedRow)
          .then(() => {
            setUserData(
              userData.map((row) => (row.id === newRow.id ? updatedRow : row))
            );
            return updatedRow;
          })
          .catch((error) => {
            console.error('Error updating document: ', error);
            throw error;
          });
      }
    } else {
      return Promise.reject(
        new Error('No matching user data found for id: ' + newRow.id)
      );
    }
  };

  const handleRowModesModelChange = (newRowModesModel: GridRowModesModel) => {
    setRowModesModel(newRowModesModel);
  };

  const columns: GridColDef[] = [
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
      cellClassName: 'actions',
      getActions: ({ id }) => {
        const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

        if (isInEditMode) {
          return [
            <GridActionsCellItem
              key="1"
              icon={<SaveIcon />}
              label="Save"
              sx={{
                color: 'primary.main',
              }}
              onClick={handleSaveClick(id)}
            />,
            <GridActionsCellItem
              key="2"
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
            key="3"
            icon={<EditIcon />}
            label="Edit"
            className="textPrimary"
            onClick={handleEditClick(id)}
            color="inherit"
          />,
          <GridActionsCellItem
            key="4"
            icon={<DeleteIcon />}
            label="Delete"
            onClick={handleDeleteClick(id)}
            color="inherit"
          />,
        ];
      },
    },
    { field: 'id', headerName: 'User ID', width: 70, editable: true },
    {
      field: 'firstname',
      headerName: 'First Name',
      width: 100,
      editable: true,
    },
    { field: 'lastname', headerName: 'Last Name', width: 100, editable: true },
    { field: 'email', headerName: 'Email', width: 200, editable: true },
    { field: 'password', headerName: 'Password', width: 100, editable: true },
    {
      field: 'department',
      headerName: 'Department',
      width: 130,
      editable: true,
    },
    { field: 'role', headerName: 'Role', width: 130, editable: true },
    { field: 'ufid', headerName: 'UFID', width: 130, editable: true },
  ];

  return (
    <Box
      sx={{
        height: 600,
        width: '100%',
        '& .actions': {
          color: 'text.secondary',
        },
        '& .textPrimary': {
          color: 'text.primary',
        },
      }}
    >
      <DataGrid
        rows={userData}
        columns={columns}
        slots={{
          toolbar: EditToolbar,
        }}
        slotProps={{
          toolbar: { setUserData, setRowModesModel },
        }}
        editMode="row"
        rowModesModel={rowModesModel}
        onRowModesModelChange={handleRowModesModelChange}
        onRowEditStop={handleRowEditStop}
        processRowUpdate={processRowUpdate}
      />
    </Box>
  );
}
