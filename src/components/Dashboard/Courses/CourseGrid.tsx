'use client';
import * as React from 'react';
import Box from '@mui/material/Box';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import CreateCourseDialog from './Create_Course';
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
import { useAuth } from '@/firebase/auth/auth_context';
import { Dialog, DialogContent, DialogTitle } from '@mui/material';

interface Course {
  id: string;
  code: string;
  title: string;
  credits: string;
  num_enrolled: string;
  enrollment_cap: string;
  professor_names: string[];
  professor_emails: string[];
  helper_names: string[];
  helper_emails: string[];
  isNew?: boolean;
  mode?: 'edit' | 'view' | undefined;
}

interface CourseGridProps {
  userRole: string;
}

export default function CourseGrid(props: CourseGridProps) {
  const { userRole } = props;
  const { user } = useAuth();
  const [courseData, setCourseData] = React.useState<Course[]>([]);
  // fetching course data from firestore.
  const userEmail = user?.email;

  React.useEffect(() => {
    const coursesRef = firebase.firestore().collection('courses');
    if (userRole === 'admin') {
      // IF USER IS ADMIN, THEN FETCH ALL COURSES.
      coursesRef.get().then((querySnapshot) => {
        const data = querySnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Course)
        );
        setCourseData(data);
      });
    } else if (userRole === 'faculty') {
      // IF USER IS FACULTY, THEN ONLY FETCH COURSES WHICH CORRESPOND TO PROFESSOR EMAIL

      // Assume 'professor_emails' is an array in Firestore.
      coursesRef
        .where('professor_emails', 'array-contains', userEmail)
        .get()
        .then((querySnapshot) => {
          const data = querySnapshot.docs.map(
            (doc) =>
              ({
                id: doc.id,
                ...doc.data(),
              } as Course)
          );
          setCourseData(data);
        });
    } else if (userRole === 'student_accepted') {
      // IF USER IS ACCEPTED STUDENT, THEN ONLY FETCH COURSES WHICH CORRESPOND TO STUDENT EMAIL

      // Assume 'helper_emails' is an array in Firestore.
      coursesRef
        .where('helper_emails', 'array-contains', userEmail)
        .get()
        .then((querySnapshot) => {
          const data = querySnapshot.docs.map(
            (doc) =>
              ({
                id: doc.id,
                ...doc.data(),
              } as Course)
          );
          setCourseData(data);
        });
    }
  }, [userRole, userEmail]);

  // dialog
  // pop-up view setup
  const [open, setOpen] = React.useState(false);
  const [selectedCourseGrid, setSelectedCourseGrid] =
    React.useState<GridRowId | null>(null);

  const handleClickOpenGrid = (id: GridRowId) => {
    setSelectedCourseGrid(id);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  // toolbar
  interface EditToolbarProps {
    setCourseData: (newRows: (oldRows: GridRowsProp) => GridRowsProp) => void;
    setRowModesModel: (
      newModel: (oldModel: GridRowModesModel) => GridRowModesModel
    ) => void;
  }

  function EditToolbar(props: EditToolbarProps) {
    const { setCourseData, setRowModesModel } = props;

    // Add state to control the dialog open status
    const [open, setOpen] = React.useState(false);

    if (userRole === 'faculty' || userRole === 'student_accepted') {
      return (
        <GridToolbarContainer>
          {/* Include your Dialog component here and pass the open state and setOpen function as props */}
          <GridToolbarExport />
          <GridToolbarFilterButton />
          <GridToolbarColumnsButton />
        </GridToolbarContainer>
      );
    }

    return (
      <GridToolbarContainer>
        {/* Include your Dialog component here and pass the open state and setOpen function as props */}
        <CreateCourseDialog
          open={open}
          setOpen={setOpen}
          setCourseData={setCourseData}
        />
        <GridToolbarExport />
        <GridToolbarFilterButton />
        <GridToolbarColumnsButton />
      </GridToolbarContainer>
    );
  }

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
    const updatedRow = courseData.find((row) => row.id === id);
    if (updatedRow) {
      firebase
        .firestore()
        .collection('courses')
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
      console.error('No matching course data found for id: ', id);
    }
  };

  const handleDeleteClick = (id: GridRowId) => () => {
    firebase
      .firestore()
      .collection('courses')
      .doc(id.toString())
      .delete()
      .then(() => {
        setCourseData(courseData.filter((row) => row.id !== id));
      })
      .catch((error) => {
        console.error('Error removing document: ', error);
      });
  };

  const handleCancelClick = (id: GridRowId) => () => {
    const editedRow = courseData.find((row) => row.id === id);
    if (editedRow!.isNew) {
      firebase
        .firestore()
        .collection('courses')
        .doc(id.toString())
        .delete()
        .then(() => {
          setCourseData(courseData.filter((row) => row.id !== id));
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
    const professorEmailsArray =
      typeof newRow.professor_emails === 'string' && newRow.professor_emails
        ? newRow.professor_emails.split(',').map((p_email) => p_email.trim())
        : oldRow.professor_emails;

    const professorNamesArray =
      typeof newRow.professor_names === 'string' && newRow.professor_names
        ? newRow.professor_names.split(',').map((p_name) => p_name.trim())
        : oldRow.professor_names;

    const helperEmailsArray =
      typeof newRow.helper_emails === 'string' && newRow.helper_emails
        ? newRow.helper_emails.split(',').map((h_email) => h_email.trim())
        : oldRow.helper_emails;

    const helperNamesArray =
      typeof newRow.helper_names === 'string' && newRow.helper_names
        ? newRow.helper_names.split(',').map((h_name) => h_name.trim())
        : oldRow.helper_names;

    const updatedRow = {
      ...(newRow as Course),
      professor_emails: professorEmailsArray,
      professor_names: professorNamesArray,
      helper_emails: helperEmailsArray,
      helper_names: helperNamesArray,
      isNew: false,
    };
    if (updatedRow) {
      if (updatedRow.isNew) {
        return firebase
          .firestore()
          .collection('courses')
          .add(updatedRow)
          .then(() => {
            setCourseData(
              courseData.map((row) => (row.id === newRow.id ? updatedRow : row))
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
          .collection('courses')
          .doc(updatedRow.id)
          .update(updatedRow)
          .then(() => {
            setCourseData(
              courseData.map((row) => (row.id === newRow.id ? updatedRow : row))
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
        new Error('No matching course data found for id: ' + newRow.id)
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
      width: 120,
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
            icon={<ZoomInIcon />}
            label="View"
            onClick={(event) => handleClickOpenGrid(id)}
            color="primary"
          />,
          <GridActionsCellItem
            key="4"
            icon={<EditIcon />}
            label="Edit"
            className="textPrimary"
            onClick={handleEditClick(id)}
            color="inherit"
          />,
          <GridActionsCellItem
            key="5"
            icon={<DeleteIcon />}
            label="Delete"
            onClick={handleDeleteClick(id)}
            color="inherit"
          />,
        ];
      },
    },
    { field: 'id', headerName: 'Class Number', width: 120, editable: true },
    {
      field: 'code',
      headerName: 'Course Code',
      width: 130,
      editable: true,
    },
    { field: 'title', headerName: 'Course Title', width: 130, editable: true },
    { field: 'credits', headerName: 'Credits', width: 70, editable: true },
    {
      field: 'num_enrolled',
      headerName: '# Enrolled',
      width: 80,
      editable: true,
    },
    {
      field: 'enrollment_cap',
      headerName: 'Capacity',
      width: 80,
      editable: true,
    },
    {
      field: 'professor_names',
      headerName: 'Professor Name(s)',
      width: 150,
      editable: true,
    },
    {
      field: 'professor_emails',
      headerName: 'Professor Email(s)',
      width: 150,
      editable: true,
    },
    {
      field: 'helper_names',
      headerName: 'Assistant Name(s)',
      width: 130,
      editable: true,
    },
    {
      field: 'helper_emails',
      headerName: 'Assistant Email(s)',
      width: 130,
      editable: true,
    },
  ];

  if (userRole === 'faculty' || userRole === 'student_accepted') {
    columns = [
      {
        field: 'actions',
        type: 'actions',
        headerName: 'Actions',
        width: 70,
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
          ];
        },
      },
      { field: 'id', headerName: 'Class Number', width: 120, editable: false },
      {
        field: 'code',
        headerName: 'Course Code',
        width: 130,
        editable: false,
      },
      {
        field: 'title',
        headerName: 'Course Title',
        width: 130,
        editable: false,
      },
      { field: 'credits', headerName: 'Credits', width: 70, editable: false },
      {
        field: 'num_enrolled',
        headerName: '# Enrolled',
        width: 80,
        editable: false,
      },
      {
        field: 'enrollment_cap',
        headerName: 'Capacity',
        width: 80,
        editable: false,
      },
      {
        field: 'professor_names',
        headerName: 'Professor Name(s)',
        width: 150,
        editable: false,
      },
      {
        field: 'professor_emails',
        headerName: 'Professor Email(s)',
        width: 150,
        editable: false,
      },
      {
        field: 'helper_names',
        headerName: 'Assistant Name(s)',
        width: 130,
        editable: false,
      },
      {
        field: 'helper_emails',
        headerName: 'Assistant Email(s)',
        width: 130,
        editable: false,
      },
    ];
  }

  return (
    <>
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
          rows={courseData}
          columns={columns}
          editMode="row"
          rowModesModel={rowModesModel}
          onRowModesModelChange={handleRowModesModelChange}
          onRowEditStop={handleRowEditStop}
          processRowUpdate={processRowUpdate}
          onProcessRowUpdateError={(error) =>
            console.error('Error processing row update: ', error)
          }
          slots={{
            toolbar: EditToolbar,
          }}
          slotProps={{
            toolbar: { setCourseData, setRowModesModel },
          }}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
          }}
        />
        <Dialog open={open} onClose={handleClose}>
          <DialogTitle>{'Course Pop-up'}</DialogTitle>
          <DialogContent>
            {/* Display the application data of the selected user */}
            {selectedCourseGrid && (
              <div>
                {selectedCourseGrid}
                {/* Display the user's application data in a different format */}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </Box>
    </>
  );
}
