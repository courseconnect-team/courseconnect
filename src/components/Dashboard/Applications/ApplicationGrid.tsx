'use client';
import * as React from 'react';
import Box from '@mui/material/Box';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
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
  GridRowsProp,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarFilterButton,
  GridToolbarColumnsButton,
} from '@mui/x-data-grid';
import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';
import { Dialog, DialogContent, DialogTitle } from '@mui/material';

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

interface ApplicationGridProps {
  userRole: string;
}

export default function ApplicationGrid(props: ApplicationGridProps) {
  const { userRole } = props;
  const [applicationData, setApplicationData] = React.useState<Application[]>(
    []
  );

  // toolbar
  interface EditToolbarProps {
    setApplicationData: (
      newRows: (oldRows: GridRowsProp) => GridRowsProp
    ) => void;
    setRowModesModel: (
      newModel: (oldModel: GridRowModesModel) => GridRowModesModel
    ) => void;
  }

  function EditToolbar(props: EditToolbarProps) {
    const { setApplicationData, setRowModesModel } = props;

    // Add state to control the dialog open status
    const [open, setOpen] = React.useState(false);

    return (
      <GridToolbarContainer>
        <GridToolbarExport />
        <GridToolbarFilterButton />
        <GridToolbarColumnsButton />
      </GridToolbarContainer>
    );
  }

  // pop-up view setup
  const [open, setOpen] = React.useState(false);
  const [selectedUserGrid, setSelectedUserGrid] =
    React.useState<GridRowId | null>(null);

  const handleClickOpenGrid = (id: GridRowId) => {
    setSelectedUserGrid(id);
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

  const processRowUpdate = (newRow: GridRowModel, oldRow: GridRowModel) => {
    const availableHoursArray =
      typeof newRow.available_hours === 'string' && newRow.available_hours
        ? newRow.available_hours.split(',').map((hour) => hour.trim())
        : oldRow.available_hours;

    const availableSemestersArray =
      typeof newRow.available_semesters === 'string' &&
      newRow.available_semesters
        ? newRow.available_semesters
            .split(',')
            .map((semester) => semester.trim())
        : oldRow.available_semesters;

    const coursesArray =
      typeof newRow.courses === 'string' && newRow.courses
        ? newRow.courses.split(',').map((course) => course.trim())
        : oldRow.courses;

    const updatedRow = {
      ...(newRow as Application),
      available_hours: availableHoursArray,
      available_semesters: availableSemestersArray,
      courses: coursesArray,
      isNew: false,
    };

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

  let columns: GridColDef[] = [
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
              onClick={handleCancelClick(id)}
              color="inherit"
            />,
          ];
        }

        return [
          <GridActionsCellItem
            key="3"
            icon={<ZoomInIcon />}
            label="View"
            onClick={(event) => handleClickOpenGrid(id)}
            color="primary"
          />,
          <GridActionsCellItem
            key="4"
            icon={<ThumbUpAltIcon />}
            label="Approve"
            onClick={(event) => handleApproveClick(id)}
            color="success"
          />,
          <GridActionsCellItem
            key="5"
            icon={<ThumbDownAltIcon />}
            label="Deny"
            onClick={(event) => handleDenyClick(id)}
            color="error"
          />,
          <GridActionsCellItem
            key="6"
            icon={<EditIcon />}
            label="Edit"
            onClick={handleEditClick(id)}
            color="inherit"
          />,
          <GridActionsCellItem
            key="7"
            icon={<DeleteIcon />}
            label="Delete"
            onClick={handleDeleteClick(id)}
            color="inherit"
          />,
        ];
      },
    },
    {
      field: 'id',
      headerName: 'User ID',
      width: 70,
      editable: true,
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
    { field: 'date', headerName: 'Date', width: 80, editable: true },
    { field: 'status', headerName: 'App Status', width: 100, editable: true },
  ];

  if (userRole === 'faculty') {
    columns = [
      {
        field: 'actions',
        type: 'actions',
        headerName: 'Actions',
        width: 130,
        cellClassName: 'actions',
        getActions: ({ id }) => {
          return [
            <GridActionsCellItem
              key="3"
              icon={<ZoomInIcon />}
              label="View"
              onClick={(event) => handleClickOpenGrid(id)}
              color="primary"
            />,
            <GridActionsCellItem
              key="4"
              icon={<ThumbUpAltIcon />}
              label="Approve"
              onClick={(event) => handleApproveClick(id)}
              color="success"
            />,
            <GridActionsCellItem
              key="5"
              icon={<ThumbDownAltIcon />}
              label="Deny"
              onClick={(event) => handleDenyClick(id)}
              color="error"
            />,
          ];
        },
      },
      {
        field: 'id',
        headerName: 'User ID',
        width: 70,
        editable: false,
      },
      { field: 'position', headerName: 'Position', width: 70, editable: false },
      {
        field: 'available_semesters',
        headerName: 'Semester(s)',
        width: 130,
        editable: false,
      },
      {
        field: 'available_hours',
        headerName: 'Hours',
        width: 100,
        editable: false,
      },
      {
        field: 'firstname',
        headerName: 'First Name',
        width: 130,
        editable: false,
      },
      {
        field: 'lastname',
        headerName: 'Last Name',
        width: 130,
        editable: false,
      },
      { field: 'email', headerName: 'Email', width: 200, editable: false },
      { field: 'courses', headerName: 'Courses', width: 200, editable: false },
      {
        field: 'semesterstatus',
        headerName: 'Academic Status',
        width: 130,
        editable: false,
      },
      { field: 'date', headerName: 'Date', width: 80, editable: false },
      {
        field: 'status',
        headerName: 'App Status',
        width: 100,
        editable: false,
      },
    ];
  }

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
        rows={applicationData}
        columns={columns}
        editMode="row"
        rowModesModel={rowModesModel}
        onRowModesModelChange={handleRowModesModelChange}
        onRowEditStop={handleRowEditStop}
        processRowUpdate={processRowUpdate}
        slots={{
          toolbar: EditToolbar,
        }}
        slotProps={{
          toolbar: { setApplicationData, setRowModesModel },
        }}
        initialState={{
          pagination: { paginationModel: { pageSize: 25 } },
        }}
      />
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{'User Application'}</DialogTitle>
        <DialogContent>
          {/* Display the application data of the selected user */}
          {selectedUserGrid && (
            <div>
              {selectedUserGrid}
              {/* Display the user's application data in a different format */}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
