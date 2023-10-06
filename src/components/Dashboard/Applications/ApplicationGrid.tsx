'use client';
import * as React from 'react';
import { useState } from 'react';
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
  GridValueGetterParams,
} from '@mui/x-data-grid';
import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';
import { query, where, collection, getDocs } from 'firebase/firestore';
import { useAuth } from '@/firebase/auth/auth_context';
import GetUserName from '@/firebase/util/GetUserName';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogContentText,
  Button,
  TextField,
  DialogActions,
  LinearProgress
} from '@mui/material';
import UnderDevelopment from '@/components/UnderDevelopment';
import AppView from './AppView';

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

function getFullName(params: GridValueGetterParams) {
  return `${params.row.firstname || ''} ${params.row.lastname || ''}`;
}

export default function ApplicationGrid(props: ApplicationGridProps) {
  // current user
  const { user } = useAuth();
  const { userRole } = props;
  const userName = GetUserName(user?.uid);

  // application props
  const [applicationData, setApplicationData] = React.useState<Application[]>(
    []
  );

  // assignment dialog pop-up view setup
  const [openAssignmentDialog, setOpenAssignmentDialog] = React.useState(false);
  const handleOpenAssignmentDialog = (id: GridRowId) => {
    setSelectedUserGrid(id);
    setOpenAssignmentDialog(true);
  };
  const handleCloseAssignmentDialog = () => {
    setOpenAssignmentDialog(false);
  };

  const handleSubmitAssignment = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    // extract the form data from the current event
    setLoading(true)
    const formData = new FormData(event.currentTarget);

    // get student's user id
    const student_uid = selectedUserGrid as string;

    // update student's application to approved
    firebase
      .firestore()
      .collection('applications')
      .doc(student_uid.toString())
      .update({ status: 'Approved' })
      // .then(() => {
      //   // Update the 'users' collection
      //   firebase
      //     .firestore()
      //     .collection('users')
      //     .doc(id.toString())
      //     .update({ role: 'student_accepted' })
      //     .then(() => {
      //       // Update the local state
      //       const updatedData = applicationData.map((row) => {
      //         if (row.id === id) {
      //           return { ...row, status: 'Approved' };
      //         }
      //         return row;
      //       });
      //       setApplicationData(updatedData);
      //     })
      //     .catch((error) => {
      //       console.error('Error updating user document: ', error);
      //     });
      // })
      .catch((error) => {
        console.error('Error updating application document: ', error);
      });

    // get class codes as array
    const classCodeString = formData.get('class-codes') as string;
    const classCodeArray = classCodeString
      .split(',')
      .map((classCode) => classCode.trim());

    // get the current date in month/day/year format
    const current = new Date();
    const current_date = `${current.getMonth() + 1
      }-${current.getDate()}-${current.getFullYear()}`;

    const assignmentObject = {
      date: current_date as string,
      student_uid: student_uid as string,
      class_codes: classCodeArray,
    };

    // Create the document within the "assignments" collection
    firebase
      .firestore()
      .collection('assignments')
      .doc(assignmentObject.student_uid)
      .set(assignmentObject)
      .catch((error: any) => {
        console.error('Error writing assignment document: ', error);
      });

    handleCloseAssignmentDialog();
    setLoading(false);
  };

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

  // fetching application data from firestore
  const [loading, setLoading] = useState(false);
  React.useEffect(() => {
    const applicationsRef = firebase.firestore().collection('applications');

    if (userRole === 'admin') {

      const unsubscribe = applicationsRef.onSnapshot((querySnapshot) => {
        const data = querySnapshot.docs.map(
          (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Application)
        );
        setApplicationData(data);
      });
      // Clean up the subscription on unmount
      return () => unsubscribe();
    } else if (userRole === 'faculty') {
      // the faculty member can only see applications that specify the same class as they have
      // get the courses that the application specifies
      // find the courses that the faculty member teaches
      // if there is an intersection, then the faculty member can see the application

      // find courses that the faculty member teaches
      const facultyCourses = collection(firebase.firestore(), 'courses');
      const q = query(
        facultyCourses,
        where('professor_emails', 'array-contains', user?.email)
      );
      const facultyCoursesSnapshot = getDocs(q);

      // now we have every course that the faculty member teaches
      // we need the course code from each of them
      // then we can compare them to the courses that the application specifies
      // if there is an intersection, then the faculty member can see the application

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
    }
  }, [userRole, user?.email]);

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
    setLoading(true);
    // Update the 'applications' collection
    firebase
      .firestore()
      .collection('applications')
      .doc(id.toString())
      .update({ status: 'Denied' })
      .then(() => {
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
        console.error('Error updating application document: ', error);
      });

  };

  const handleApproveClick = (id: GridRowId) => {
    setLoading(true);
    // Update the 'applications' collection
    firebase
      .firestore()
      .collection('applications')
      .doc(id.toString())
      .update({ status: 'Approved' })

      .catch((error) => {
        setLoading(false);
        console.error('Error updating application document: ', error);
      });

    // eventually here an email would be sent to the student as a notification
    // however, for now there will just be an "assignment" object generated in the database
    /*
        the assignment object will have the following fields:
        - date
        - student's uid (same as grid row id here)
        - approver's uid (uid of the logged-in user)
        - approver's role
        --> EVENTUALLY THERE WILL BE SUGGESTED SECTIONS AND CLASSES. FOR NOW, NOTHING.
      */

    // get the current date in month/day/year format
    const current = new Date();
    const current_date = `${current.getMonth() + 1
      }-${current.getDate()}-${current.getFullYear()}`;

    const assignmentObject = {
      date: current_date as string,
      student_uid: id.toString() as string,
      approver_uid: user?.uid as string,
      approver_role: userRole as string,
      approver_name: userName as string,
    };

    // Create the document within the "assignments" collection
    firebase
      .firestore()
      .collection('assignments')
      .doc(assignmentObject.student_uid)
      .set(assignmentObject)
      .then(() => {
        setLoading(false);
      })
      .catch((error: any) => {
        setLoading(false);
        console.error('Error writing assignment document: ', error);
      });

  };

  const handleEditClick = (id: GridRowId) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
  };

  const handleSaveClick = (id: GridRowId) => () => {
    setLoading(true);
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
          setLoading(false);
        })
        .catch((error) => {
          setLoading(false);
          console.error('Error updating document: ', error);
        });
    } else {
      console.error('No matching user data found for id: ', id);
    }

  };

  const handleDeleteClick = (id: GridRowId) => () => {
    setLoading(true);
    firebase
      .firestore()
      .collection('applications')
      .doc(id.toString())
      .delete()
      .then(() => {
        setLoading(false);
        setApplicationData(applicationData.filter((row) => row.id !== id));
      })
      .catch((error) => {
        setLoading(false);
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
    setLoading(true);
    const availableHoursArray =
      typeof newRow.availability === 'string' && newRow.availability
        ? newRow.availability.split(',').map((hour) => hour.trim())
        : oldRow.availability;

    const availableSemestersArray =
      typeof newRow.semesters === 'string' && newRow.semesters
        ? newRow.semesters.split(',').map((semester) => semester.trim())
        : oldRow.semesters;

    const coursesArray =
      typeof newRow.courses === 'string' && newRow.courses
        ? newRow.courses.split(',').map((course) => course.trim())
        : oldRow.courses;

    const updatedRow = {
      ...(newRow as Application),
      availability: availableHoursArray,
      semesters: availableSemestersArray,
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
            setLoading(false);
            return updatedRow;
          })
          .catch((error) => {
            setLoading(false);
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
            setLoading(false);
            return updatedRow;
          })
          .catch((error) => {
            setLoading(false);
            console.error('Error updating document: ', error);
            throw error;
          });
      }
    } else {
      setLoading(false);
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
            onClick={(event) => handleOpenAssignmentDialog(id)}
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
      field: 'fullname',
      headerName: 'Full Name',
      width: 150,
      editable: false,
      valueGetter: getFullName,
    },
    { field: 'uf_email', headerName: 'Email', width: 180, editable: true },
    {
      field: 'id',
      headerName: 'UFID',
      width: 70,
      editable: true,
    },
    { field: 'courses', headerName: 'Courses', width: 200, editable: true },
    { field: 'position', headerName: 'Position', width: 70, editable: true },
    { field: 'timestamp', headerName: 'Date', width: 80, editable: true },
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
        headerName: 'UFID',
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
        field: 'fullname',
        headerName: 'Full Name',
        width: 150,
        editable: false,
        valueGetter: getFullName,
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
        height: 400,
        width: '100%',
        '& .actions': {
          color: 'text.secondary',
        },
        '& .textPrimary': {
          color: 'text.primary',
        },
      }}
    >
      {loading ? <LinearProgress color="warning" /> : null}
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
              <AppView uid={selectedUserGrid as string} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={openAssignmentDialog} onClose={handleCloseAssignmentDialog}>
        <DialogTitle>Course Assignment</DialogTitle>
        <form onSubmit={handleSubmitAssignment}>
          <DialogContent>
            <DialogContentText>
              Please enter one or more course codes to which the student shall
              be assigned.
            </DialogContentText>
            <TextField
              sx={{ paddingLeft: '25%', paddingRight: '25%' }}
              fullWidth
              defaultValue={selectedUserGrid?.valueOf()}
              InputProps={{ readOnly: true }}
              margin="normal"
              variant="filled"
              helperText="User ID of the student to be assigned."
            />
            <TextField
              autoFocus
              required
              margin="dense"
              id="class-codes"
              label="Class Code(s)"
              name="class-codes"
              type="text"
              fullWidth
              variant="standard"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAssignmentDialog}>Cancel</Button>
            <Button type="submit">Submit</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
