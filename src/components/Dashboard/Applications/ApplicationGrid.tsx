// incorporate clickable link to the application form as a pop-up.

'use client';
import * as React from 'react';
import Box from '@mui/material/Box';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import ThumbDownAltIcon from '@mui/icons-material/ThumbDownAlt';
import {
  GridRowModesModel,
  GridRowModes,
  DataGrid,
  GridColDef,
  GridActionsCellItem,
  GridEventListener,
  GridRowId,
  GridRowModel,
  GridRowEditStopReasons,
} from '@mui/x-data-grid';
import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';
import { Button, Dialog, DialogContent, DialogTitle } from '@mui/material';

interface Application {
  id: string;
  additionalprompt: string;
  available_hours: string;
  available_semesters: string;
  courses: string;
  date: string;
  degree: string;
  department: string;
  email: string;
  englishproficiency: string;
  firstname: string;
  gpa: string;
  lastname: string;
  nationality: string;
  phonenumber: string;
  position: string;
  qualifications: string;
  semesterstatus: string;
  ufid: string;
  isNew?: boolean;
  mode?: 'edit' | 'view' | undefined;
}

export default function ApplicationGrid() {
  const [applicationData, setApplicationData] = React.useState<Application[]>(
    []
  );

  // pop-up view setup
  const [open, setOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<Application | null>(
    null
  );

  const handleClickOpen = (user: Application) => {
    setSelectedUser(user);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  // application data from firestore
  React.useEffect(() => {
    const applicationsRef = firebase.firestore().collection('applications');
    applicationsRef.get().then((querySnapshot) => {
      const data = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Application)
      );
      setApplicationData(data);
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

  // approve/deny click handlers
  const handleDenyClick = (id: GridRowId) => {
    // Update the 'applications' collection
    firebase
      .firestore()
      .collection('applications')
      .doc(id.toString())
      .update({ status: 'Denied' })
      .then(() => {
        // Update the 'users' collection
        firebase
          .firestore()
          .collection('users')
          .doc(id.toString())
          .update({ role: 'student_denied' })
          .then(() => {
            // Update the local state
            const updatedData = applicationData.map((row) => {
              if (row.id === id) {
                return { ...row, status: 'Denied' };
              }
              return row;
            });
            setApplicationData(updatedData);
          })
          .catch((error) => {
            console.error('Error updating user document: ', error);
          });
      })
      .catch((error) => {
        console.error('Error updating application document: ', error);
      });
  };

  const handleApproveClick = (id: GridRowId) => {
    // Update the 'applications' collection
    firebase
      .firestore()
      .collection('applications')
      .doc(id.toString())
      .update({ status: 'Approved' })
      .then(() => {
        // Update the 'users' collection
        firebase
          .firestore()
          .collection('users')
          .doc(id.toString())
          .update({ role: 'student_accepted' })
          .then(() => {
            // Update the local state
            const updatedData = applicationData.map((row) => {
              if (row.id === id) {
                return { ...row, status: 'Approved' };
              }
              return row;
            });
            setApplicationData(updatedData);
          })
          .catch((error) => {
            console.error('Error updating user document: ', error);
          });
      })
      .catch((error) => {
        console.error('Error updating application document: ', error);
      });
  };

  const handleEditClick = (id: GridRowId) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
  };

  const handleSaveClick = (id: GridRowId) => () => {
    const updatedRow = applicationData.find((row) => row.id === id);
    if (updatedRow) {
      firebase
        .firestore()
        .collection('applications')
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
      .collection('applications')
      .doc(id.toString())
      .delete()
      .then(() => {
        setApplicationData(applicationData.filter((row) => row.id !== id));
      })
      .catch((error) => {
        console.error('Error removing document: ', error);
      });
  };

  const handleCancelClick = (id: GridRowId) => () => {
    const editedRow = applicationData.find((row) => row.id === id);
    if (editedRow!.isNew) {
      firebase
        .firestore()
        .collection('applications')
        .doc(id.toString())
        .delete()
        .then(() => {
          setApplicationData(applicationData.filter((row) => row.id !== id));
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
    const updatedRow = { ...(newRow as Application), isNew: false };
    if (updatedRow) {
      if (updatedRow.isNew) {
        return firebase
          .firestore()
          .collection('applications')
          .add(updatedRow)
          .then(() => {
            setApplicationData(
              applicationData.map((row) =>
                row.id === newRow.id ? updatedRow : row
              )
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
          .collection('applications')
          .doc(updatedRow.id)
          .update(updatedRow)
          .then(() => {
            setApplicationData(
              applicationData.map((row) =>
                row.id === newRow.id ? updatedRow : row
              )
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
      field: 'id',
      headerName: 'User ID',
      width: 70,
      editable: false,

      renderCell: (params) => (
        <Button color="primary" onClick={() => handleClickOpen(params.row)}>
          {params.value}
        </Button>
      ),
    },
    { field: 'position', headerName: 'Position', width: 70, editable: true },
    {
      field: 'available_semesters',
      headerName: 'Semester(s)',
      width: 130,
      editable: true,
    },
    {
      field: 'available_hours',
      headerName: 'Hours',
      width: 100,
      editable: true,
    },
    {
      field: 'firstname',
      headerName: 'First Name',
      width: 130,
      editable: true,
    },
    { field: 'lastname', headerName: 'Last Name', width: 130, editable: true },
    { field: 'email', headerName: 'Email', width: 200, editable: true },
    { field: 'courses', headerName: 'Courses', width: 200, editable: true },
    {
      field: 'semesterstatus',
      headerName: 'Academic Status',
      width: 130,
      editable: true,
    },
    { field: 'date', headerName: 'Date', width: 130, editable: true },
    { field: 'status', headerName: 'App Status', width: 130, editable: true },
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
            icon={<ThumbUpAltIcon />}
            label="Approve"
            onClick={(event) => handleApproveClick(id)}
            className="textPrimary"
            color="inherit"
          />,
          <GridActionsCellItem
            key="4"
            icon={<ThumbDownAltIcon />}
            label="Deny"
            onClick={(event) => handleDenyClick(id)}
            className="textPrimary"
            color="inherit"
          />,
          <GridActionsCellItem
            key="5"
            icon={<EditIcon />}
            label="Edit"
            className="textPrimary"
            onClick={handleEditClick(id)}
            color="inherit"
          />,
          <GridActionsCellItem
            key="6"
            icon={<DeleteIcon />}
            label="Delete"
            onClick={handleDeleteClick(id)}
            color="inherit"
          />,
        ];
      },
    },
  ];

  return (
    <Box
      sx={{
        height: 500,
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
        rows={applicationData}
        columns={columns}
        editMode="row"
        rowModesModel={rowModesModel}
        onRowModesModelChange={handleRowModesModelChange}
        onRowEditStop={handleRowEditStop}
        getRowHeight={() => 'auto'}
        processRowUpdate={processRowUpdate}
      />
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{'User Application'}</DialogTitle>
        <DialogContent>
          {/* Display the application data of the selected user */}
          {selectedUser && (
            <div>
              {selectedUser.firstname}
              {/* Display the user's application data in a different format */}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
