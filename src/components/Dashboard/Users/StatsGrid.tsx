// components/StatsGrid.tsx
'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import ZoomIn from '@mui/icons-material/ZoomIn';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import {
  GridRowModesModel,
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
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  LinearProgress,
  Button,
} from '@mui/material';
import Link from 'next/link';
import {
  useFacultyStats,
  useDeleteFacultyStat,
  useUpdateFacultyStat,
} from '@/hooks/useFacultyStats';
import { User } from '@/types/User';
import { alpha, styled } from '@mui/material/styles';

interface EditToolbarProps {
  setRowModesModel: (
    newModel: (oldModel: GridRowModesModel) => GridRowModesModel
  ) => void;
}

function EditToolbar(props: EditToolbarProps) {
  const { setRowModesModel } = props;

  return (
    <GridToolbarContainer>
      <GridToolbarExport />
      <GridToolbarFilterButton />
      <GridToolbarColumnsButton />
    </GridToolbarContainer>
  );
}

interface UserGridProps {
  userRole: string;
}

export default function StatsGrid(props: UserGridProps) {
  const { userRole } = props;
  const { data, isLoading, error } = useFacultyStats();
  const deleteMutation = useDeleteFacultyStat();
  const updateMutation = useUpdateFacultyStat();

  const [delDia, setDelDia] = React.useState(false);
  const [delId, setDelId] = React.useState<string | undefined>();

  const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>(
    {}
  );

  const handleDeleteDiagClose = () => {
    setDelDia(false);
  };

  const handleRowEditStop: GridEventListener<'rowEditStop'> = (
    params,
    event
  ) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

  const handleSaveClick = (id: GridRowId) => () => {
    const updatedRow = data?.find((row) => row.id === id);
    if (updatedRow) {
      updateMutation.mutate(updatedRow);
      setRowModesModel({
        ...rowModesModel,
        [id]: { mode: GridRowModes.View },
      });
    } else {
      console.error('No matching user data found for id: ', id);
    }
  };

  const handleDel = (id: GridRowId) => () => {
    setDelId(id.toString());
    setDelDia(true);
  };

  const handleDeleteClick = (id: string) => {
    deleteMutation.mutate(id);
    // deleteUserHTTPRequest(id); // Remove if redundant, as React Query handles refetching
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (delId) {
      handleDeleteClick(delId);
    }
    setDelDia(false);
  };

  function CustomToolbar() {
    const apiRef = useGridApiContext();

    return (
      <GridToolbarContainer>
        <GridToolbarExport />
      </GridToolbarContainer>
    );
  }

  const handleCancelClick = (id: GridRowId) => () => {
    const editedRow = data?.find((row) => row.id === id);
    if (editedRow && editedRow.isNew) {
      deleteMutation.mutate(id.toString());
    } else {
      setRowModesModel({
        ...rowModesModel,
        [id]: { mode: GridRowModes.View, ignoreModifications: true },
      });
    }
  };

  const processRowUpdate = async (newRow: GridRowModel) => {
    const updatedRow = { ...(newRow as User), isNew: false };
    try {
      await updateMutation.mutateAsync(updatedRow as any);
      return updatedRow;
    } catch (error) {
      console.error('Error updating row:', error);
      throw error;
    }
  };

  const handleRowModesModelChange = (newRowModesModel: GridRowModesModel) => {
    setRowModesModel(newRowModesModel);
  };

  const columns: GridColDef[] = [
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 200,
      cellClassName: 'actions',
      getActions: ({ id }) => {
        return [
          <Button
            key={`view-${id}`}
            variant="outlined"
            color="inherit"
            size="small"
            style={{ marginLeft: 0, height: '25px', textTransform: 'none' }}
            startIcon={<ZoomIn />}
            component={Link}
            href={`/faculty/${id}`} // Fixed template literal
          >
            View
          </Button>,
          <GridActionsCellItem
            key={`delete-${id}`}
            icon={<DeleteIcon />}
            label="Delete"
            onClick={handleDel(id)}
            color="inherit"
          />,
        ];
      },
    },
    {
      field: 'instructor',
      headerName: 'Instructor',
      width: 150,
      editable: false,
    },
    {
      field: 'research_level',
      headerName: 'Research Activity Level',
      width: 200,
      editable: false,
    },
    {
      field: 'teaching_load',
      headerName: 'Teaching Load',
      width: 200,
      editable: false,
    },
    // {
    //   field: 'teaching_load',
    //   headerName: 'Teaching Load',
    //   width: 200,
    //   editable: false,
    // },
    // {
    //   field: 'acu2',
    //   headerName: 'Accumulated Course Credits',
    //   width: 220,
    //   editable: true,
    // },
    // { field: 'cd', headerName: 'Credit Deficit', width: 150, editable: true },
    // { field: 'ce', headerName: 'Credit Excess', width: 150, editable: true },
    // {
    //   field: 'tot',
    //   headerName: 'Total Classes Taught (3yrs)',
    //   width: 200,
    //   editable: true,
    // },
    // {
    //   field: 'acu3',
    //   headerName: 'Average Course Units',
    //   width: 170,
    //   editable: true,
    // },
    // { field: 'lc', headerName: 'Lab Courses', width: 150, editable: true },
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

  if (isLoading) {
    return <LinearProgress />;
  }

  if (error) {
    return <div>Error loading data</div>;
  }

  return (
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
          Delete Instructor
        </DialogTitle>
        <form onSubmit={handleSubmit}>
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
              Are you sure you want to delete this instructor?
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
      <StripedDataGrid
        rows={data || []}
        columns={columns}
        slots={{
          toolbar: EditToolbar as any,
        }}
        slotProps={{
          toolbar: { setRowModesModel } as any,
        }}
        editMode="row"
        getRowId={(row) => row.instructor}
        rowModesModel={rowModesModel}
        onRowModesModelChange={handleRowModesModelChange}
        onRowEditStop={handleRowEditStop}
        processRowUpdate={processRowUpdate}
        initialState={{
          pagination: { paginationModel: { pageSize: 25 } },
        }}
        getRowClassName={(params) =>
          params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
        }
        sx={{ borderRadius: '16px' }}
      />
    </Box>
  );
}
