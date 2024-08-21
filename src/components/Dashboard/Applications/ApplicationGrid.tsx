// @ts-nocheck

'use client';
import * as React from 'react';
import { useState, useEffect } from 'react';
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
  LinearProgress,
} from '@mui/material';
import { purple } from '@mui/material/colors';

import UnderDevelopment from '@/components/UnderDevelopment';
import AppView from './AppView';
import { ThumbDownOffAlt, ThumbUpOffAlt } from '@mui/icons-material';

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
  const [paginationModel, setPaginationModel] = React.useState({
    page: 0,
    pageSize: 25,
  });

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
  const [openDenyDialog, setOpenDenyDialog] = React.useState(false);

  const handleOpenAssignmentDialog = async (id: GridRowId) => {
    const statusRef = firebase
      .firestore()
      .collection('applications')
      .doc(id.toString());

    const doc = await getDoc(statusRef);
    setCodes(Object.entries(doc.data().courses).map(([key, value]) => key));
    setSelectedUserGrid(id);

    setOpenAssignmentDialog(true);
  };

  const handleDenyAssignmentDialog = async (id: GridRowId) => {
    const statusRef = firebase
      .firestore()
      .collection('applications')
      .doc(id.toString());

    const doc = await getDoc(statusRef);

    setCodes(
      Object.entries(doc.data().courses)
        .filter(([key, value]) => value == 'denied') // Change 'accepted' to 'denied'
        .map(([key, value]) => key)
    );

    setSelectedUserGrid(id);
    setOpenDenyDialog(true);
  };

  const handleCloseAssignmentDialog = () => {
    setOpenAssignmentDialog(false);
  };
  const handleCloseDenyDialog = () => {
    setOpenDenyDialog(false);
  };

  const handleSubmitAssignment = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault(); // Prevent the form from submitting the default way
    setLoading(true);

    try {
      const student_uid = selectedUserGrid as string;
      const statusRef = firebase
        .firestore()
        .collection('applications')
        .doc(student_uid.toString());
      const doc = await getDoc(statusRef);

      const courseDetails = firebase
        .firestore()
        .collection('courses')
        .doc(valueRadio);
      const courseDoc = await getDoc(courseDetails);

      // Update student's application to approved
      await firebase
        .firestore()
        .collection('applications')
        .doc(student_uid.toString())
        .update({ status: 'Admin_approved' });

      // Get the current date in month/day/year format
      const current = new Date();
      const current_date = `${
        current.getMonth() + 1
      }-${current.getDate()}-${current.getFullYear()}`;

      const assignmentObject = {
        date: current_date as string,
        student_uid: student_uid as string,
        class_codes: valueRadio,
        email: doc.data()?.email,
        name: doc.data()?.firstname + ' ' + doc.data()?.lastname,
        semesters: doc.data()?.available_semesters,
        department: doc.data()?.department,
        hours: doc.data()?.available_hours,
        position: doc.data()?.position,
        degree: doc.data()?.degree,
      };

      // Create the document within the "assignments" collection
      await firebase
        .firestore()
        .collection('assignments')
        .doc(assignmentObject.student_uid)
        .set(assignmentObject);

      // Extract and process the professor emails
      const emailArray = courseDoc
        .data()
        ?.professor_emails.split(';')
        .map((email) => email.trim());

      // Send emails after all documents have been fetched and updated
      if (emailArray) {
        for (const email of emailArray) {
          try {
            const response = await fetch(
              'https://us-central1-courseconnect-c6a7b.cloudfunctions.net/sendEmail',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  type: 'facultyAssignment',
                  data: {
                    userEmail: email,
                    position: doc.data()?.position,
                    classCode: courseDoc.data()?.code,
                    semester: courseDoc.data()?.semester,
                  },
                }),
              }
            );

            if (response.ok) {
              const data = await response.json();
              console.log('Email sent successfully:', data);
            } else {
              throw new Error('Failed to send email');
            }
          } catch (error) {
            console.error('Error sending email:', error);
          }
        }
      }

      handleSendEmail(assignmentObject);
      handleCloseAssignmentDialog();
    } catch (error) {
      console.error('Error in handleSubmitAssignment:', error);
    } finally {
      setLoading(false);
    }
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
  const [delDia, setDelDia] = React.useState(false);
  const [delId, setDelId] = React.useState();

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

  const handleDeleteDiagClose = () => {
    setDelDia(false);
  };

  // fetching application data from firestore
  const [loading, setLoading] = useState(false);
  React.useEffect(() => {
    const applicationsRef = firebase.firestore().collection('applications');

    if (userRole === 'admin') {
      const unsubscribe = applicationsRef.onSnapshot((querySnapshot) => {
        const data = querySnapshot.docs
          .filter(function (doc) {
            if (doc.data().status != 'Admin_denied') {
              return true;
            } else {
              return false;
            }
          })
          .map(
            (doc) =>
              ({
                id: doc.id,
                ...doc.data(),
                courses: Object.entries(doc.data().courses)
                  .filter(([key, value]) => value == 'accepted')
                  .map(([key, value]) => key),
                allcourses: Object.entries(doc.data().courses).map(
                  ([key, value]) => key
                ),
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

  const handleDenyEmail = async (id: GridRowId) => {
    try {
      const snapshot = await firebase
        .firestore()
        .collection('applications')
        .doc(id.student_uid.toString())
        .get();

      if (snapshot.exists) {
        const applicationData = snapshot.data() as Application;

        const response = await fetch(
          'https://us-central1-courseconnect-c6a7b.cloudfunctions.net/sendEmail',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'applicationStatusDenied',
              data: {
                user: {
                  name: `${applicationData.firstname ?? ''} ${
                    applicationData.lastname ?? ''
                  }`.trim(),
                  email: applicationData.email,
                },
                position: applicationData.position,
                classCode: applicationData.courses,
              },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log('Email sent successfully:', data);
        } else {
          throw new Error('Failed to send email');
        }
      } else {
        throw new Error('Application data not found');
      }
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };

  const handleSendEmail = async (id: GridRowId) => {
    try {
      // Retrieve application data from Firestore
      const snapshot = await firebase
        .firestore()
        .collection('applications')
        .doc(id.student_uid.toString())
        .get();
      const snapshot2 = await firebase
        .firestore()
        .collection('assignments')
        .doc(id.student_uid.toString())
        .get();

      if (snapshot.exists) {
        const applicationData = snapshot.data() as Application;
        const assignmentData = snapshot2.data();
        // Send email using fetched application data
        const response = await fetch(
          'https://us-central1-courseconnect-c6a7b.cloudfunctions.net/sendEmail',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'applicationStatusApproved',
              data: {
                user: {
                  name: `${applicationData.firstname ?? ''} ${
                    applicationData.lastname ?? ''
                  }`.trim(),
                  email: applicationData.email,
                },
                position: assignmentData.position,
                classCode: assignmentData.class_codes,
              },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log('Email sent successfully:', data);
        } else {
          throw new Error('Failed to send email');
        }
      } else {
        throw new Error('Application data not found');
      }
    } catch (error) {
      console.error('Error sending email:', error);
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
    handleDenyEmail(id);
  };

  const handleApproveClick = async (id: GridRowId) => {
    setLoading(true);
    try {
      // Update the 'applications' collection
      await firebase
        .firestore()
        .collection('applications')
        .doc(id.toString())
        .update({ status: 'Approved' });

      // Update the state locally to avoid reloading the entire data
      setApplicationData((prevData) =>
        prevData.map((row) =>
          row.id === id ? { ...row, status: 'Approved' } : row
        )
      );

      // Send email notification or any other side effects
      await handleSendEmail(id);
    } catch (error) {
      console.error('Error updating application document: ', error);
    } finally {
      setLoading(false);
    }
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

  const handleDel = (id: GridRowId) => () => {
    setDelId(id);
    setDelDia(true);
  };
  const handleDeleteClick = (id: GridRowId) => {
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleDeleteClick(delId);
    setDelDia(false);
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
      getActions: ({ id, row }) => {
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

        const actions = [
          <Button
            key="3"
            variant="outlined"
            color="inherit"
            size="small"
            style={{ marginLeft: 0, height: '25px', textTransform: 'none' }}
            startIcon={<ZoomInIcon />}
            onClick={(event) => handleClickOpenGrid(id)}
          >
            View
          </Button>,
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
          <GridActionsCellItem
            key="4"
            icon={<ThumbUpOffAlt />}
            label="Approve"
            onClick={(event) => handleOpenAssignmentDialog(id)}
            color="success"
          />,
        ];
        if (row.status === 'Submitted') {
          actions.push(
            <GridActionsCellItem
              key="5"
              icon={<ThumbDownOffAlt />}
              label="Deny"
              onClick={() => handleDenyAssignmentDialog(id)}
              color="error"
            />
          );
        }

        return actions;
      },
    },
    {
      field: 'fullname',
      headerName: 'Full Name',
      width: 200,
      editable: false,
      valueGetter: getFullName,
    },

    { field: 'email', headerName: 'Email', width: 230, editable: true },

    {
      field: 'degree',
      headerName: 'Degree',
      width: 100,
      editable: true,
    },

    {
      field: 'available_semesters',
      headerName: 'Semester(s)',
      width: 150,
      editable: false,
    },

    {
      field: 'allcourses',
      headerName: 'All Course(s)',
      width: 250,
      editable: true,
    },
    {
      field: 'courses',
      headerName: 'Faculty Approved Course(s)',
      width: 250,
      editable: true,
    },

    { field: 'position', headerName: 'Position', width: 70, editable: true },
    { field: 'date', headerName: 'Date', width: 100, editable: true },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      editable: true,
      renderCell: (params) => {
        let color = '#f2a900';
        let backgroundColor = '#fffdf0';

        if (params.value === 'Admin_approved') {
          color = '#4caf50';
          backgroundColor = '#e8f5e9';
        }

        return (
          <span
            style={{
              color: color,
              border: `1px solid ${color}`,
              padding: '2px 4px',
              borderRadius: '4px',
              backgroundColor: backgroundColor,
              display: 'inline-block',
            }}
          >
            {params.value}
          </span>
        );
      },
    },
    ,
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
              icon={<ThumbUpOffAlt />}
              label="Approve"
              onClick={(event) => handleApproveClick(id)}
              color="success"
            />,
            <GridActionsCellItem
              key="5"
              icon={<ThumbDownOffAlt />}
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
        field: 'semesters',
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
        checkboxSelection
        slots={{
          toolbar: EditToolbar,
        }}
        slotProps={{
          toolbar: { setApplicationData, setRowModesModel },
        }}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel} // Keep pagination state in sync
        getRowClassName={(params) =>
          params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
        }
        sx={{ borderRadius: '16px' }}
      />
      <Dialog
        open={open}
        onClose={handleClose}
        PaperProps={{
          style: {
            maxWidth: '2000px',
            maxHeight: 'none',
            display: 'flex',
            flexDirection: 'column',
            minWidth: '1000px',
            borderRadius: '16px',
          },
        }}
      >
        {/* Display the application data of the selected user */}
        {selectedUserGrid && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              height: '100%',

              overflow: 'hidden',
            }}
          >
            <AppView
              close={handleClose}
              handleDenyClick={handleDenyClick}
              handleOpenAssignmentDialog={handleOpenAssignmentDialog}
              uid={selectedUserGrid as string}
            />
          </Box>
        )}
      </Dialog>

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
          Delete Applicant
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
              Are you sure you want to delete this applicant?
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

      <Dialog open={openAssignmentDialog} onClose={handleCloseAssignmentDialog}>
        <DialogTitle>Course Assignment</DialogTitle>
        <form onSubmit={handleSubmitAssignment}>
          <DialogContent>
            {codes != [] ? (
              <>
                <DialogContentText>
                  Please select the course code to which the student shall be
                  assigned.
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
                          key={code}
                          value={code}
                          control={<Radio />}
                          label={code.replace(/,/g, ', ')}
                        />
                      );
                    })}
                  </RadioGroup>
                </FormControl>{' '}
              </>
            ) : (
              <DialogContentText>
                No faculty has accepted this student yet.
              </DialogContentText>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAssignmentDialog}>Cancel</Button>
            <Button type="submit">Submit</Button>
          </DialogActions>
        </form>
      </Dialog>

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
        open={openDenyDialog}
        onClose={handleCloseDenyDialog}
      >
        <DialogTitle
          style={{
            fontFamily: 'SF Pro Display-Medium, Helvetica',
            textAlign: 'center',
            fontSize: '35px',
            fontWeight: '540',
          }}
        >
          Deny Applicant
        </DialogTitle>
        <form onSubmit={handleDenyClick}>
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
              Are you sure you want to deny this applicant?
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
              onClick={handleCloseDenyDialog}
            >
              No
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
              onClick={() => handleDenyClick(deniedItemId)}
            >
              Yes
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
