'use client';
import * as React from 'react';
import { useState } from 'react';
import Box from '@mui/material/Box';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import CreateCourseDialog from './Create_Course';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
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
import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';
import { useAuth } from '@/firebase/auth/auth_context';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  LinearProgress,
} from '@mui/material';
import UnderDevelopment from '@/component/UnderDevelopment';
import { alpha, styled } from '@mui/material/styles';

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
  semester: string;
  processing: boolean;
}

export default function CourseGrid(props: CourseGridProps) {
  const { userRole, semester, processing } = props;
  const { user } = useAuth();
  const [success, setSuccess] = React.useState(false);

  const [loading, setLoading] = useState(false);
  const [courseData, setCourseData] = React.useState<Course[]>([]);
  const userEmail = user?.email;

  React.useEffect(() => {
    console.log('SEM ' + semester);
    const coursesRef = firebase
      .firestore()
      .collection('courses')
      .where('semester', '==', semester);
    if (userRole === 'admin') {
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
    } else if (userRole === 'student_assigned') {
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
  }, [userRole, userEmail, semester, processing]);

  const [open, setOpen] = React.useState(false);
  const [selectedCourseGrid, setSelectedCourseGrid] =
    React.useState<GridRowId | null>(null);

  const handleClickOpenGrid = (id: GridRowId) => {
    setSelectedCourseGrid(id);
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  interface EditToolbarProps {
    setCourseData: (newRows: (oldRows: GridRowsProp) => GridRowsProp) => void;
    setRowModesModel: (
      newModel: (oldModel: GridRowModesModel) => GridRowModesModel
    ) => void;
  }

  function EditToolbar(props: EditToolbarProps) {
    const { setCourseData, setRowModesModel } = props;
    const [open, setOpen] = React.useState(false);
    if (userRole === 'faculty' || userRole === 'student_assigned') {
      return (
        <GridToolbarContainer>
          <GridToolbarExport />
          <GridToolbarFilterButton />
          <GridToolbarColumnsButton />
        </GridToolbarContainer>
      );
    }
    return (
      <GridToolbarContainer>
        <GridToolbarExport />
        <GridToolbarFilterButton />
        <GridToolbarColumnsButton />
      </GridToolbarContainer>
    );
  }

  const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>(
    {}
  );

  const handleRowEditStop: GridEventListener<'rowEditStop'> = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut)
      event.defaultMuiPrevented = true;
  };

  const handleEditClick = (id: GridRowId) => () => {
    setLoading(true);
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
    setLoading(false);
  };
  const handleSaveClick = (id: GridRowId) => () => {
    setLoading(true);
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
          setLoading(false);
        })
        .catch((error) => {
          setLoading(false);
          console.error('Error updating document: ', error);
        });
    } else {
      setLoading(false);
      console.error('No matching course data found for id: ', id);
    }
  };
  const handleDeleteClick = (id: GridRowId) => () => {
    setLoading(true);
    firebase
      .firestore()
      .collection('courses')
      .doc(id.toString())
      .delete()
      .then(() => {
        setCourseData(courseData.filter((row) => row.id !== id));
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
        console.error('Error removing document: ', error);
      });
  };
  const handleCancelClick = (id: GridRowId) => () => {
    setLoading(true);
    const editedRow = courseData.find((row) => row.id === id);
    if (editedRow!.isNew) {
      firebase
        .firestore()
        .collection('courses')
        .doc(id.toString())
        .delete()
        .then(() => {
          setCourseData(courseData.filter((row) => row.id !== id));
          setLoading(false);
        })
        .catch((error) => {
          setLoading(false);
          console.error('Error removing document: ', error);
        });
    } else {
      setRowModesModel({
        ...rowModesModel,
        [id]: { mode: GridRowModes.View, ignoreModifications: true },
      });
      setLoading(false);
    }
  };

  const processRowUpdate = (newRow: GridRowModel, oldRow: GridRowModel) => {
    setLoading(true);
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
          .collection('courses')
          .doc(updatedRow.id)
          .update(updatedRow)
          .then(() => {
            setCourseData(
              courseData.map((row) => (row.id === newRow.id ? updatedRow : row))
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
        new Error('No matching course data found for id: ' + newRow.id)
      );
    }
  };
  const handleRowModesModelChange = (newRowModesModel: GridRowModesModel) =>
    setRowModesModel(newRowModesModel);

  let columns: GridColDef[] = [
    { field: 'code', headerName: 'Course Code', width: 130, editable: true },
    { field: 'title', headerName: 'Course Title', width: 200, editable: true },
    { field: 'credits', headerName: 'Credits', width: 100, editable: true },
    { field: 'enrolled', headerName: 'Enrolled', width: 100, editable: true },
    {
      field: 'enrollment_cap',
      headerName: 'Capacity',
      width: 100,
      editable: true,
    },
    {
      field: 'professor_names',
      headerName: 'Professor Name',
      width: 190,
      editable: true,
    },
    {
      field: 'professor_emails',
      headerName: 'Professor Email',
      width: 170,
      editable: true,
    },
    { field: 'semester', headerName: 'Semester', width: 130, editable: true },
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
              key="1"
              icon={<SaveIcon />}
              label="Save"
              sx={{ color: 'primary.main' }}
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
    }
  ];

  // ✅ UI-Only Styling Changes
  const StripedDataGrid = styled(DataGrid)(({ theme }) => ({
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
      paddingLeft: '20px', // ✅ adds spacing before first column header
    },
    '& .MuiDataGrid-cell:first-of-type': {
      paddingLeft: '25px', // ✅ adds spacing before first column cell
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

  const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
    props,
    ref
  ) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
  });

  const handleSuccess = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === 'clickaway') return;
    setSuccess(false);
  };

  return (
    <>
      <Snackbar open={success} autoHideDuration={3000} onClose={handleSuccess}>
        <Alert severity="success" sx={{ width: '100%' }}>
          Created course successfully!
        </Alert>
      </Snackbar>

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
          slots={{ toolbar: EditToolbar }}
          slotProps={{ toolbar: { setCourseData, setRowModesModel } }}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
          }}
          getRowClassName={(params) =>
            params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
          }
        />

        <Dialog open={open} onClose={handleClose}>
          <DialogTitle>{'Course Data'}</DialogTitle>
          <DialogContent>
            {selectedCourseGrid && (
              <div>
                <p>Class Number: {selectedCourseGrid}</p>
                <UnderDevelopment />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </Box>
    </>
  );
}

