'use client';
import * as React from 'react';
import Box from '@mui/material/Box';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
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
} from '@mui/x-data-grid';
import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';

interface Course {
  id: string;
  code: string;
  title: string;
  credits: string;
  num_enrolled: string;
  enrollment_cap: string;
  professor_names: string;
  professor_emails: string;
  helper_names: string;
  helper_emails: string;
  isNew?: boolean;
  mode?: 'edit' | 'view' | undefined;
}

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

  return (
    <GridToolbarContainer>
      {/* Include your Dialog component here and pass the open state and setOpen function as props */}
      <CreateCourseDialog
        open={open}
        setOpen={setOpen}
        setCourseData={setCourseData}
      />
    </GridToolbarContainer>
  );
}

export default function CourseGrid() {
  const [courseData, setCourseData] = React.useState<Course[]>([]);

  React.useEffect(() => {
    const coursesRef = firebase.firestore().collection('courses');
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
      console.error('No matching user data found for id: ', id);
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

  const processRowUpdate = (newRow: GridRowModel) => {
    const updatedRow = { ...(newRow as Course), isNew: false };
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
        new Error('No matching user data found for id: ' + newRow.id)
      );
    }
  };

  const handleRowModesModelChange = (newRowModesModel: GridRowModesModel) => {
    setRowModesModel(newRowModesModel);
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'Class Number', width: 70, editable: true },
    {
      field: 'code',
      headerName: 'Course Code',
      width: 130,
      editable: true,
    },
    { field: 'title', headerName: 'Course Title', width: 130, editable: true },
    { field: 'credits', headerName: 'Credits', width: 200, editable: true },
    {
      field: 'num_enrolled',
      headerName: 'Number Enrolled',
      width: 200,
      editable: true,
    },
    {
      field: 'enrollment_cap',
      headerName: 'Enrollment Cap',
      width: 130,
      editable: true,
    },
    {
      field: 'professor_names',
      headerName: 'Professor Name(s)',
      width: 130,
      editable: true,
    },
    {
      field: 'professor_emails',
      headerName: 'Professor Email(s)',
      width: 130,
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
        rows={courseData}
        columns={columns}
        editMode="row"
        rowModesModel={rowModesModel}
        onRowModesModelChange={handleRowModesModelChange}
        onRowEditStop={handleRowEditStop}
        processRowUpdate={processRowUpdate}
        getRowHeight={() => 'auto'}
        slots={{
          toolbar: EditToolbar,
        }}
        slotProps={{
          toolbar: { setCourseData, setRowModesModel },
        }}
      />
    </Box>
  );
}
