import {
  DataGrid,
  type GridColDef,
  type GridRowParams,
} from '@mui/x-data-grid';
import { Alert, Chip, Snackbar } from '@mui/material';
import {
  get_condition_color,
  get_status_color,
  get_color_for_item_type,
} from '../../utils/colors';
import { useAllCopies } from '../../hooks/useCopies';
import type { Branch } from '../../types';
import { useBranches } from '../../hooks/useBranches';
import { useState } from 'react';

export const CopiesDataGrid = ({
  on_copy_selected,
}: {
  on_copy_selected: (copy_id: string) => void;
}) => {
  const { data: copies, isLoading: loading } = useAllCopies();
  const { data: branches } = useBranches();

  const [snack, set_snack] = useState<boolean>(false);

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'title', headerName: 'Title', width: 150, editable: false },
    {
      field: 'description',
      headerName: 'Description',
      width: 120,
      editable: false,
    },
    {
      field: 'item_type',
      headerName: 'Type',
      width: 110,
      editable: false,
      renderCell: (params) => {
        return (
          <Chip
            label={params.value}
            sx={{ backgroundColor: get_color_for_item_type(params.value) }}
          />
        );
      },
    },
    {
      field: 'publication_year',
      headerName: 'Pub. Year',
      width: 100,
      editable: false,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      editable: false,
      renderCell: (params) => {
        return (
          <Chip label={params.value} color={get_status_color(params.value)} />
        );
      },
    },
    {
      field: 'condition',
      headerName: 'Condition',
      width: 150,
      editable: false,
      renderCell: (params) => {
        return (
          <Chip
            label={params.value}
            color={get_condition_color(params.value)}
          />
        );
      },
    },
    {
      field: 'branch_id',
      headerName: 'Belongs To',
      width: 150,
      editable: false,
      valueGetter: (value) => {
        if (!value || !branches) return 'N/A';
        return (
          branches.find((branch: Branch) => branch.id === value)?.branch_name ||
          'Unknown'
        );
      },
    },
    {
      field: 'location',
      headerName: 'Location',
      width: 150,
      editable: false,
      valueGetter: (value) => {
        if (!value || !branches) return 'N/A';
        return (
          branches.find((branch: Branch) => branch.id === value)?.branch_name ||
          'Unknown'
        );
      },
    },
  ];
  return (
    <>
      <DataGrid
        onRowDoubleClick={(params) =>
          params.row.status !== 'Available' && set_snack(true)
        }
        rows={copies}
        columns={columns}
        loading={loading}
        pageSizeOptions={[10, 25, 50]}
        initialState={{
          pagination: { paginationModel: { pageSize: 25 } },
        }}
        showToolbar
        slotProps={{
          toolbar: {
            printOptions: { disableToolbarButton: true },
            csvOptions: { disableToolbarButton: true },
          },
        }}
        label="Copies"
        isRowSelectable={(params: GridRowParams) =>
          params.row.status === 'Available'
        }
        onRowSelectionModelChange={(newSelection) => {
          const selected_copy =
            Array.from(newSelection.ids)[0]?.toString() || '';
          if (selected_copy) {
            on_copy_selected(selected_copy);
          }
        }}
      />
      <Snackbar
        open={snack}
        autoHideDuration={6000}
        onClose={() => set_snack(false)}
        anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
      >
        <Alert severity="info">
          {'Only copies of status "Available" can be selected.'}
        </Alert>
      </Snackbar>
    </>
  );
};
