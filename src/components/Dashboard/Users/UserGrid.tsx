import * as React from 'react';
import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import { Box } from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridActionsCellItem,
  GridRowId,
  GridEventListener,
  GridRowEditStopReasons,
  GridRowsProp,
  GridRowModes,
  GridRowModesModel,
  GridToolbarContainer,
} from '@mui/x-data-grid';
import { Button } from '@mui/material';
import { randomId } from '@mui/x-data-grid-generator';

interface UserGridProps {
  data: User[];
  setData: React.Dispatch<React.SetStateAction<User[]>>;
}

interface User {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  department: string;
  role: string;
  ufid: string;
  isNew?: boolean;
  mode?: 'edit' | 'view' | undefined;
}

interface EditToolbarProps {
  setRows: (newRows: (oldRows: GridRowsProp) => GridRowsProp) => void;
  setRowModesModel: (
    newModel: (oldModel: GridRowModesModel) => GridRowModesModel
  ) => void;
}

function EditToolbar(props: EditToolbarProps) {
  const { setRows, setRowModesModel } = props;

  const handleClick = () => {
    const id = randomId();
    setRows((oldRows) => [...oldRows, { id, name: '', age: '', isNew: true }]);
    setRowModesModel((oldModel) => ({
      ...oldModel,
      [id]: { mode: GridRowModes.Edit, fieldToFocus: 'name' },
    }));
  };

  return (
    <GridToolbarContainer>
      <Button color="primary" startIcon={<AddIcon />} onClick={handleClick}>
        Add record
      </Button>
    </GridToolbarContainer>
  );
}

const UserGrid: React.FC<UserGridProps> = ({ data, setData }) => {
  const [rows, setRows] = React.useState(data);
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
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
  };

  const handleDeleteClick = (id: GridRowId) => () => {
    const docRef = firebase
      .firestore()
      .collection('users')
      .doc(id as string);
    const doc = docRef.get();
    docRef.delete();
    setRows(rows.filter((row) => row.id !== id));
  };

  const handleCancelClick = (id: GridRowId) => () => {
    setRowModesModel({
      ...rowModesModel,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    });

    const editedRow = rows.find((row) => row.id === id);
    if (editedRow!.isNew) {
      setRows(rows.filter((row) => row.id !== id));
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'Firestore UID', width: 70, editable: true },
    {
      field: 'firstname',
      headerName: 'First Name',
      width: 130,
      editable: true,
    },
    { field: 'lastname', headerName: 'Last Name', width: 130, editable: true },
    { field: 'email', headerName: 'Email', width: 200, editable: true },
    { field: 'password', headerName: 'Password', width: 200, editable: true },
    {
      field: 'department',
      headerName: 'Department',
      width: 130,
      editable: true,
    },
    { field: 'role', headerName: 'Role', width: 130, editable: true },
    { field: 'ufid', headerName: 'UFID', width: 130, editable: true },
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

  const saveRow = async (id: string) => {
    const docRef = firebase.firestore().collection('users').doc(id);
    const doc = await docRef.get();
    if (doc.exists) {
      // find the user within the local 'data' array
      const localUser = data.find((item: User) => item.id === id);
      if (localUser) {
        // update the firestore document with the local user data
        await docRef.set(localUser, { merge: true });
        // update the local data to move the user out of edit mode
        setData((prevData) =>
          prevData.map((item) =>
            item.id === id ? { ...localUser, mode: undefined } : item
          )
        );
      }
    }
  };

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
        rows={data}
        columns={columns}
        slots={{ toolbar: EditToolbar }}
        slotProps={{ toolbar: { setRows, setRowModesModel } }}
        onRowEditStop={handleRowEditStop}
      />
    </Box>
  );
};

export default UserGrid;
