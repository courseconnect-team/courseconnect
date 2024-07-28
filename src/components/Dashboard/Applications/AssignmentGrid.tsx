'use client';
import * as React from 'react';
import { useState } from 'react';
import Box from '@mui/material/Box';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
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
  firstName: string;
  lastName: string;
  year: string;
  fte: number;
  pname: string;
  pid: string;
  hr: number;
  bwr: number;
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
  const [delDia, setDelDia] = React.useState(false);
  const [delId, setDelId] = React.useState<GridRowId>();
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
            firstName:
              doc.data().name != undefined
                ? doc.data().name.split(' ')[0]
                : ' ',
            lastName:
              doc.data().name != undefined
                ? doc.data().name.split(' ')[1]
                : ' ',
            year:
              doc.data().semesters != undefined
                ? doc.data().semesters[0].split(' ')[1]
                : ' ',
            fte: 15,
            pname: 'DEPARTMENT TA/UPIS',
            pid: '000108927',
            hr: 15,
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

  const handleDeleteClick = (id: GridRowId) => {
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
  const handleDel = (id: GridRowId) => () => {
    setDelId(id);
    setDelDia(true);
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
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(delId!.toString());
    handleDeleteClick(delId!);
    setDelDia(false);
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
      width: 290,

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
            color="inherit"
            size="small"
            style={{ marginLeft: '0px', height: '25px', textTransform: 'none' }}
            startIcon={<ZoomInIcon />}
            onClick={(event) => handleClickOpenGrid(id)}
          >
            View
          </Button>,

          <Button
            key="5"
            variant="outlined"
            color="primary"
            size="small"
            style={{
              marginRight: '10px',
              height: '25px',
              textTransform: 'none',
            }}
            startIcon={<DeleteIcon />}
            onClick={handleDel(id)}
          >
            Delete
          </Button>,
        ];
      },
    },
    {
      field: 'ufid',
      headerName: 'Student UFID',
      width: 190,
      editable: false,
    },

    {
      field: 'firstName',
      headerName: 'Student First Name',
      width: 190,
      editable: true,
    },
    {
      field: 'lastName',
      headerName: 'Student Last Name',
      width: 190,
      editable: true,
    },
    {
      field: 'email',
      headerName: 'Student Email',
      width: 210,
      editable: true,
    },
    {
      field: 'supervisorUfid',
      headerName: 'Supervisor UFID',
      width: 190,
      editable: true,
    },

    {
      field: 'sf',
      headerName: 'Supervisor First Name',
      width: 190,
      editable: true,

      valueGetter: (params) =>
        params.row.class_codes.split(' ')[4].split(',')[1],
    },
    {
      field: 'supervisorLastName',
      headerName: 'Supervisor Last Name',
      width: 190,
      editable: true,

      valueGetter: (params) =>
        params.row.class_codes.split(' ')[4].split(',')[0],
    },

    {
      field: 'supervisorEmail',
      headerName: 'Supervisor Email',
      width: 190,
      editable: true,
    },

    {
      field: 'proxyUfid',
      headerName: 'Proxy UFID',
      width: 190,
      editable: true,
    },

    {
      field: 'proxyFirstName',
      headerName: 'Proxy First Name',
      width: 190,
      editable: true,
    },
    {
      field: 'proxyLastName',
      headerName: 'Proxy Last Name',
      width: 190,
      editable: true,
    },

    {
      field: 'proxyEmail',
      headerName: 'Proxy Email',
      width: 190,
      editable: true,
    },
    {
      field: 'action',
      headerName: 'Requested Action',
      width: 140,
      editable: false,
      valueFormatter: (value) => {
        return 'NEW HIRE';
      },
    },

    {
      field: 'position',
      headerName: 'Position Type',
      width: 110,
      editable: true,
      valueFormatter: (value) => {
        return 'TA';
      },
    },
    {
      field: 'degree',
      headerName: 'Degree Type',
      width: 110,
      editable: true,
    },
    {
      field: 'semesters',
      headerName: 'Semester',
      width: 110,
      editable: true,
      valueFormatter: (value) => {
        const val = value.value;
        try {
          if (val[0].includes('Fall')) {
            return 'FALL';
          }
          if (val[0].includes('Spring')) {
            return 'SPRING';
          }
          if (val[0].includes('Summer')) {
            return 'SUMMER';
          }
        } catch {
          return 'FALL';
        }
      },
    },

    {
      field: 'year',
      headerName: 'Year',
      width: 110,
      editable: true,
    },
    {
      field: 'none',
      headerName: 'Starting Date',
      width: 100,
      editable: true,
    },
    {
      field: 'ed',
      headerName: 'End Date',
      width: 110,
      editable: true,
    },

    {
      field: 'pid',
      headerName: 'Project Id',
      width: 110,
      editable: true,
    },
    {
      field: 'pname',
      headerName: 'Project Name',
      width: 240,
      editable: true,
    },

    {
      field: 'percentage',
      headerName: 'Percentage',
      width: 110,
      editable: true,
    },
    {
      field: 'hours',
      headerName: 'Hours',
      width: 140,
      editable: true,
    },

    {
      field: 'ar',
      headerName: 'Annual Rate',
      width: 110,
      editable: true,
    },

    {
      field: 'bwr',
      headerName: 'Biweekly Rate',
      width: 110,
      editable: true,
    },
    {
      field: 'hr',
      headerName: 'Hourly Rate',
      width: 110,
      editable: true,
    },

    {
      field: 'ta',
      headerName: 'Target Amount',
      width: 110,
      editable: true,
    },

    {
      field: 'wt',
      headerName: 'Working Title',
      width: 110,
      editable: true,
    },

    {
      field: 'class_codes',
      headerName: 'Duties',
      width: 140,
      editable: true,
      valueFormatter: (value) => {
        return 'UPI in ' + value.value;
      },
    },

    {
      field: 'fte',
      headerName: 'FTE',
      width: 110,
      editable: true,
    },

    {
      field: 'Imported',
      headerName: 'Imported',
      width: 140,
      editable: false,
      valueFormatter: (value) => {
        return 'YES';
      },
    },
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
      {loading ? <LinearProgress color="warning" /> : null}
      <StripedDataGrid
        rows={assignmentData}
        columns={columns}
        editMode="row"
        rowModesModel={rowModesModel}
        checkboxSelection
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
      <Dialog
        PaperProps={{ sx: { borderRadius: 4 } }}
        maxWidth={'lg'}
        open={open}
        onClose={handleClose}
      >
        <DialogTitle
          style={{ fontWeight: 'bold', fontSize: '25px', marginBottom: '10px' }}
        >
          {'View Assignment Details'}
        </DialogTitle>

        <DialogContent sx={{ minWidth: '100%' }}>
          {/* Display the application data of the selected user */}
          {selectedUserGrid && (
            <div>
              {/* Display the user's application data in a different format */}
              <AssignView uid={selectedUserGrid as string} />
            </div>
          )}
        </DialogContent>
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
