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
  gridClasses,
} from '@mui/x-data-grid';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from '@mui/material';
import { deleteUserHTTPRequest } from '@/firebase/auth/auth_delete_user';
import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';
import { LinearProgress, Button } from '@mui/material';
import { alpha, styled } from '@mui/material/styles';
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

function EditToolbar(props: EditToolbarProps) {
  const { setUserData, setRowModesModel } = props;

  // Add state to control the dialog open status
  const [open, setOpen] = React.useState(false);

  return (
    <GridToolbarContainer>
      {/* Include your Dialog component here and pass the open state and setOpen function as props */}
      <GridToolbarExport style={{ color: '#562EBA' }} />
      <GridToolbarFilterButton style={{ color: '#562EBA' }} />
      <GridToolbarColumnsButton style={{ color: '#562EBA' }} />
    </GridToolbarContainer>
  );
}

interface UserGridProps {
  userRole: string;
}

export default function UserGrid(props: UserGridProps) {
  const { userRole } = props;
  const e2e = isE2EMode();
  const [userData, setUserData] = React.useState<User[]>([]);
  const [open, setOpen] = React.useState(false);
  const [delDia, setDelDia] = React.useState(false);
  const [delId, setDelId] = React.useState();

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
            fullname: doc.data().firstname + ' ' + doc.data().lastname,
            ...doc.data(),
          } as unknown as User)
      );

      setUserData(data);
    });

    return () => unsubscribe();
  }, [e2e]);
  const handleDeleteDiagClose = () => {
    setDelDia(false);
  };
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
    console.log('Clicked Save for ID:', id);
    console.log('Current userData:', userData);

    const updatedRow = userData.find((row) => row.id === id);
    if (updatedRow) {
      firebase
        .firestore()
        .collection('users')
        .doc(id.toString())
        .update(updatedRow)
        .then(() => {
          console.log('Document successfully updated!');
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

  const handleDel = (id: GridRowId) => () => {
    setDelId(id);
    setDelDia(true);
  };

  const handleDeleteClick = (id: GridRowId) => {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(delId.toString());
    handleDeleteClick(delId);
    setDelDia(false);
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
      width: 200,
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
                color: '#562EBA',
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
          <Button
            key="8"
            variant="outlined"
            color="inherit"
            size="small"
            style={{ marginLeft: 0, height: '25px', textTransform: 'none' }}
            startIcon={<EditIcon />}
            onClick={handleEditClick(id)}
          >
            Edit
          </Button>,

          <Button
            key="7"
            variant="outlined"
            color="primary"
            size="small"
            style={{
              marginRight: '20px',
              height: '25px',
              textTransform: 'none',
            }}
            startIcon={<DeleteIcon />}
            onClick={handleDel(id)}
          >
            Delete
          </Button>,
        ];
      },
    },
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
  ];
  const ODD_OPACITY = 0.2;

  const StripedDataGrid = styled(DataGrid)(({ theme }) => ({
    [`& .${gridClasses.row}.even`]: {
      backgroundColor: '#562EBA1F',
      '&:hover, &.Mui-hovered': {
        backgroundColor: alpha(theme.palette.primary.main, ODD_OPACITY),
        '@media (hover: none)': {
          backgroundColor: 'transparent',
        },
      },
      '&.Mui-selected': {
        backgroundColor: alpha(
          theme.palette.primary.main,
          ODD_OPACITY + theme.palette.action.selectedOpacity
        ),
        '&:hover, &.Mui-hovered': {
          backgroundColor: alpha(
            theme.palette.primary.main,
            ODD_OPACITY +
              theme.palette.action.selectedOpacity +
              theme.palette.action.hoverOpacity
          ),
          // Reset on touch devices, it doesn't add specificity
          '@media (hover: none)': {
            backgroundColor: alpha(
              theme.palette.primary.main,
              ODD_OPACITY + theme.palette.action.selectedOpacity
            ),
          },
        },
      },
    },
  }));
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
      <Dialog
        style={{
          borderImage:
            'linear-gradient(to bottom, rgb(9, 251, 211), rgb(255, 111, 241)) 1',
          boxShadow: '0px 2px 20px 4px #00000040',
          borderRadius: '20px',
          border: '2px solid',
        }}
        PaperProps={{
          style: { borderRadius: 20 },
        }}
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
        <form onSubmit={(e) => handleSubmit(e)}>
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
      <StripedDataGrid
        rows={userData}
        columns={columns}
        slots={{
          toolbar: EditToolbar,
          loadingOverlay: LinearProgress,
        }}
        slotProps={{
          toolbar: { setUserData, setRowModesModel },
        }}
        editMode="row"
        rowModesModel={rowModesModel}
        onRowModesModelChange={handleRowModesModelChange}
        onRowEditStop={handleRowEditStop}
        processRowUpdate={processRowUpdate}
        initialState={{
          pagination: { paginationModel: { pageSize: 25 } },
        }}
        getRowClassName={(params) =>
          params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
        }
        sx={{ borderRadius: '16px' }}
      />
    </Box>
  );
}
