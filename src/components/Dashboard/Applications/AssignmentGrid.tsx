'use client';
import * as React from 'react';
import Box from '@mui/material/Box';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
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
import { getDoc, getDocs, collection, query, where } from 'firebase/firestore';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from '@mui/material';
import UnderDevelopment from '@/components/UnderDevelopment';

interface Assignment {
  id: string;
  approver_name: string;
  approver_role: string;
  approver_uid: string;
  date: string;
  isNew?: boolean;
  mode?: 'edit' | 'view' | undefined;
}

interface AssignmentGridProps {
  userRole: string;
}

export default function AssignmentGrid(props: AssignmentGridProps) {
  const { userRole } = props;
  const [assignmentData, setAssignmentData] = React.useState<Assignment[]>([]);

  // toolbar
  interface EditToolbarProps {
    setAssignmentData: (
      newRows: (oldRows: GridRowsProp) => GridRowsProp
    ) => void;
    setRowModesModel: (
      newModel: (oldModel: GridRowModesModel) => GridRowModesModel
    ) => void;
  }

  function EditToolbar(props: EditToolbarProps) {
    const { setAssignmentData, setRowModesModel } = props;

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

  // assignment dialog pop-up view setup
  const [openAssignmentDialog, setOpenAssignmentDialog] = React.useState(false);
  const handleOpenAssignmentDialog = (id: GridRowId) => {
    setSelectedUserGrid(id);
    setOpenAssignmentDialog(true);
  };
  const handleCloseAssignmentDialog = () => {
    setOpenAssignmentDialog(false);
  };

  // application data from firestore
  React.useEffect(() => {
    const assignmentsRef = firebase.firestore().collection('assignments');

    const unsubscribe = assignmentsRef.onSnapshot((querySnapshot) => {
      const data = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Assignment)
      );
      setAssignmentData(data);
    });

    // Clean up the subscription on unmount
    return () => unsubscribe();
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

  const handleSubmitAssignment = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    // extract the form data from the current event
    const formData = new FormData(event.currentTarget);

    // get student's user id
    const student_uid = selectedUserGrid as string;

    // get class numbers as array
    const classNumberString = formData.get('class-numbers') as string;
    const classNumberArray = classNumberString
      .split(',')
      .map((classNumber) => classNumber.trim());

    // get the courses collection
    const coursesRef = collection(firebase.firestore(), 'courses');
    const q = query(coursesRef, where('id', 'in', classNumberArray));
    const snapshot = await getDocs(q);

    // the snapshot will contain all the courses that match the class numbers in the array
    // therefore, if the length of the array is greater than the length of the snapshot,
    // it means that there is a class number in the array that does not exist in the database
    // therefore, display an error
    if (classNumberArray.length > snapshot.size) {
      alert(
        'One or more of the class numbers you entered does not exist in the database. Please check your input and try again.'
      );
      return;
    }

    // now, get the users collection
    const userRef = firebase.firestore().collection('users').doc(student_uid);
    const userData = (await userRef.get()).data();
    //const userData = (await firebase.firestore().collection('users').doc(student_uid).get()).data();
    const userFullName = userData?.firstname + ' ' + userData?.lastname;
    const userEmail = userData?.email;

    // for every class number, update the course with the student's information
    classNumberArray.forEach(async (classNumber) => {
      const courseRef = firebase
        .firestore()
        .collection('courses')
        .doc(classNumber);
      await courseRef.update({
        // the student's full name needs to be added to the course's helper_names array
        helper_names: firebase.firestore.FieldValue.arrayUnion(userFullName),
        // the student's email needs to be added to the course's helper_emails array
        helper_emails: firebase.firestore.FieldValue.arrayUnion(userEmail),
      });
    });

    // then, update the student's role to 'student_assigned'
    await userRef.update({ role: 'student_assigned' });

    handleCloseAssignmentDialog();
  };

  const handleEditClick = (id: GridRowId) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
  };

  const handleSaveClick = (id: GridRowId) => () => {
    const updatedRow = assignmentData.find((row) => row.id === id);
    if (updatedRow) {
      firebase
        .firestore()
        .collection('assignments')
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
      .collection('assignments')
      .doc(id.toString())
      .delete()
      .then(() => {
        setAssignmentData(assignmentData.filter((row) => row.id !== id));
      })
      .catch((error) => {
        console.error('Error removing document: ', error);
      });
  };

  const handleCancelClick = (id: GridRowId) => () => {
    const editedRow = assignmentData.find((row) => row.id === id);
    if (editedRow!.isNew) {
      firebase
        .firestore()
        .collection('assignments')
        .doc(id.toString())
        .delete()
        .then(() => {
          setAssignmentData(assignmentData.filter((row) => row.id !== id));
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
    const updatedRow = {
      ...(newRow as Assignment),
      isNew: false,
    };

    if (updatedRow) {
      if (updatedRow.isNew) {
        return firebase
          .firestore()
          .collection('assignments')
          .add(updatedRow)
          .then(() => {
            setAssignmentData(
              assignmentData.map((row) =>
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
          .collection('assignments')
          .doc(updatedRow.id)
          .update(updatedRow)
          .then(() => {
            setAssignmentData(
              assignmentData.map((row) =>
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
      headerName: 'Approved UFID',
      width: 150,
      editable: true,
    },
    {
      field: 'class_codes',
      headerName: 'Class Codes',
      width: 150,
      editable: true,
    },
    {
      field: 'hours',
      headerName: 'Hours',
      width: 100,
      editable: true,
    },
    { field: 'date', headerName: 'Date Approved', width: 120, editable: true },
  ];

  return (
    <Box
      sx={{
        height: 300,
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
        rows={assignmentData}
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
          toolbar: { setAssignmentData, setRowModesModel },
        }}
        initialState={{
          pagination: { paginationModel: { pageSize: 25 } },
        }}
      />
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{'Approved Application'}</DialogTitle>
        <DialogContent>
          {/* Display the application data of the selected user */}
          {selectedUserGrid && (
            <div>
              <p>User ID: {selectedUserGrid}</p>
              {/* Display the user's application data in a different format */}
              <UnderDevelopment />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={openAssignmentDialog} onClose={handleCloseAssignmentDialog}>
        <DialogTitle>Course Assignment</DialogTitle>
        <form onSubmit={handleSubmitAssignment}>
          <DialogContent>
            <DialogContentText>
              Please enter one or more class numbers to which the student shall
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
              id="class-numbers"
              label="Class Number(s)"
              name="class-numbers"
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
