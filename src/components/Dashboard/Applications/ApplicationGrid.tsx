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
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
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
import { query, where, collection, getDocs, getDoc } from 'firebase/firestore';
import { useAuth } from '@/firebase/auth/auth_context';
import GetUserName from '@/firebase/util/GetUserName';
import { alpha, styled } from '@mui/material/styles';
import { gridClasses } from '@mui/x-data-grid';

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
import { purple } from '@mui/material/colors';

import UnderDevelopment from '@/components/UnderDevelopment';
import AppView from './AppView';

interface Application {
  id: string;
  additionalprompt: string;
  available_hours: string;
  available_semesters: string;
  courses: string[];
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
  const [valueRadio, setValueRadio] = React.useState('');

  const handleChangeRadio = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValueRadio((event.target as HTMLInputElement).value);
  };
  // assignment dialog pop-up view setup
  const [openAssignmentDialog, setOpenAssignmentDialog] = React.useState(false);
  const handleOpenAssignmentDialog = async (id: GridRowId) => {
    const statusRef = firebase.firestore().collection('applications').doc(id.toString());
    const doc = await getDoc(statusRef);
    setCodes(Object.entries(doc.data().courses).filter(([key, value]) => (value == "accepted")).map(([key, value]) => (key)))
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
    const statusRef = firebase.firestore().collection('applications').doc(student_uid.toString());
    const doc = await getDoc(statusRef);
    // update student's application to approved
    firebase
      .firestore()
      .collection('applications')
      .doc(student_uid.toString())
      .update({ status: 'Admin_approved' })
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



    // get the current date in month/day/year format
    const current = new Date();
    const current_date = `${current.getMonth() + 1
      }-${current.getDate()}-${current.getFullYear()}`;

    const assignmentObject = {
      date: current_date as string,
      student_uid: student_uid as string,
      class_codes: valueRadio,
      email: doc.data().email,
      name: (doc.data().firstname + " " + doc.data().lastname),
      semesters: doc.data().available_semesters,
      department: doc.data().department,
      hours: doc.data().available_hours,
      position: doc.data().position

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
        <GridToolbarExport style={{ color: '#562EBA' }} />
        <GridToolbarFilterButton style={{ color: '#562EBA' }} />
        <GridToolbarColumnsButton style={{ color: '#562EBA' }} />
      </GridToolbarContainer>
    );
  }

  // pop-up view setup
  const [open, setOpen] = React.useState(false);

  const [codes, setCodes] = React.useState([]);
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
        const data = querySnapshot.docs.filter(function(doc) {

          if (doc.data().status != "Admin_approved" && doc.data().status != "Admin_denied") {
            return true;
          } else {
            return false;
          }
        }).map(
          (doc) =>

          ({
            id: doc.id,
            ...doc.data(),
            courses: Object.entries(doc.data().courses).filter(([key, value]) => (value == "accepted")).map(([key, value]) => (key))
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
      .update({ status: 'Admin_denied' })
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
      width: 370,
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
          <Button
            key="3"
            variant="outlined"
            color='inherit'
            size="small"
            style={{ marginLeft: 0, height: "25px", textTransform: "none" }}
            startIcon={
              <ZoomInIcon />
            }
            onClick={(event) => handleClickOpenGrid(id)}
          >
            View
          </Button>,
          <Button
            key="8"
            variant="outlined"
            color='inherit'
            size="small"
            style={{ marginLeft: 0, height: "25px", textTransform: "none" }}
            startIcon={
              <EditIcon />
            }
            onClick={handleEditClick(id)}
          >
            Edit
          </Button>,

          <Button
            key="7"
            variant="outlined"
            color='primary'
            size="small"
            style={{ marginRight: "20px", height: "25px", textTransform: "none" }}
            startIcon={
              <DeleteIcon />
            }
            onClick={handleDeleteClick(id)}
          >
            Delete
          </Button>,
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
        ];
      },
    },
    {
      field: 'fullname',
      headerName: 'Full Name',
      width: 200,
      editable: false,
      valueGetter: getFullName,
    },
    { field: 'email', headerName: 'Email', width: 250, editable: true },
    {
      field: 'degree',
      headerName: 'Degree',
      width: 100,
      editable: true,
    },
    { field: 'courses', headerName: 'Approved Courses', width: 220, editable: false },
    { field: 'position', headerName: 'Position', width: 150, editable: true },
    { field: 'date', headerName: 'Date', width: 180, editable: true },
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
        width: 100,
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
          ODD_OPACITY + theme.palette.action.selectedOpacity,
        ),
        '&:hover, &.Mui-hovered': {
          backgroundColor: alpha(
            theme.palette.primary.main,
            ODD_OPACITY +
            theme.palette.action.selectedOpacity +
            theme.palette.action.hoverOpacity,
          ),
          // Reset on touch devices, it doesn't add specificity
          '@media (hover: none)': {
            backgroundColor: alpha(
              theme.palette.primary.main,
              ODD_OPACITY + theme.palette.action.selectedOpacity,
            ),
          },
        },
      },
    },
  }));

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
      <StripedDataGrid
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
        getRowClassName={(params) =>
          params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
        }
        sx={{ borderRadius: '16px' }}
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
              Please select the course code to which the student shall
              be assigned.
            </DialogContentText>
            <br />

            <FormControl required>
              <RadioGroup
                name="positions-radio-group"
                value={valueRadio}
                onChange={handleChangeRadio}
                aria-required="true"
              >
                {codes.map((code) => {
                  return (
                    <FormControlLabel
                      value={code}
                      control={<Radio />}
                      label={code}
                    />

                  )
                })

                }

              </RadioGroup>
            </FormControl>

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
