'use client';
import * as React from 'react';
import { useState } from 'react';
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
import { alpha, styled } from '@mui/material/styles';
import { gridClasses } from '@mui/x-data-grid';


import { getDoc, getDocs, collection, query, where } from 'firebase/firestore';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  LinearProgress,
  TextField,
} from '@mui/material';
import UnderDevelopment from '@/components/UnderDevelopment';
import AssignView from './AssignView';



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
  const [loading, setLoading] = useState(false);
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
        <GridToolbarExport style={{ color: '#562EBA' }} />
        <GridToolbarFilterButton style={{ color: '#562EBA' }} />
        <GridToolbarColumnsButton style={{ color: '#562EBA' }} />
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
    setLoading(true);
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
    setLoading(false);
  };

  const handleEditClick = (id: GridRowId) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
  };

  const handleSaveClick = (id: GridRowId) => () => {
    setLoading(true);
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
          setLoading(false);
        })
        .catch((error) => {
          setLoading(false);
          console.error('Error updating document: ', error);
        });
    } else {
      setLoading(false);
      console.error('No matching user data found for id: ', id);
    }
  };

  const handleDeleteClick = (id: GridRowId) => () => {
    setLoading(true);
    firebase
      .firestore()
      .collection('assignments')
      .doc(id.toString())
      .delete()
      .then(() => {
        setAssignmentData(assignmentData.filter((row) => row.id !== id));
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
        console.error('Error removing document: ', error);
      });
  };

  const handleCancelClick = (id: GridRowId) => () => {
    setLoading(true);
    const editedRow = assignmentData.find((row) => row.id === id);
    if (editedRow!.isNew) {
      firebase
        .firestore()
        .collection('assignments')
        .doc(id.toString())
        .delete()
        .then(() => {
          setAssignmentData(assignmentData.filter((row) => row.id !== id));
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
            setLoading(false);
            return updatedRow;
          })
          .catch((error) => {
            console.error('Error adding document: ', error);
            setLoading(false);
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
      field: 'name',
      headerName: 'Name',
      width: 200,
      editable: true,
    },
    {
      field: 'class_codes',
      headerName: 'Class Codes',
      width: 250,
      editable: true,
    },
    { field: 'date', headerName: 'Date Approved', width: 120, editable: true },
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


      {loading ? <LinearProgress color='warning' /> : null}
      <StripedDataGrid
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
        getRowClassName={(params) =>
          params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
        }
        sx={{ borderRadius: '16px' }}
      />
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{'Approved Application'}</DialogTitle>
        <DialogContent>
          {/* Display the application data of the selected user */}
          {selectedUserGrid && (
            <div>
              {/* Display the user's application data in a different format */}
              <AssignView uid={selectedUserGrid as string} />
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
