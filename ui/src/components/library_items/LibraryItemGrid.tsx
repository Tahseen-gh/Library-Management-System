import { useState } from 'react';
import { DataGrid, type GridColDef, type GridDensity } from '@mui/x-data-grid';
import { type Item_Copy } from '../../types';
import { Snackbar, Alert, AlertTitle, Box, Chip } from '@mui/material';
import { LibraryItemDetails } from './LibraryItemDetails';
import { useAllCopies } from '../../hooks/useCopies';
import ItemTypeChip from './ItemTypeChip';
import { CustomToolbar } from '../common/CustomDataGridToolbar';

const columns: GridColDef[] = [
  { field: 'id', headerName: 'Copy ID', width: 80 },
  { field: 'title', headerName: 'Title', width: 200, editable: false },
  {
    field: 'item_type',
    headerName: 'Type',
    width: 110,
    editable: false,
    renderCell: (params) => {
      return <ItemTypeChip item_type={params.value} />;
    },
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 130,
    editable: false,
    renderCell: (params) => {
      const statusColors: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
        'Available': 'success',
        'Checked Out': 'error',
        'Reserved': 'warning',
        'Processing': 'info',
        'Damaged': 'error',
        'Lost': 'error',
      };
      return (
        <Chip
          label={params.value}
          color={statusColors[params.value as string] || 'default'}
          size="small"
          variant="outlined"
        />
      );
    },
  },
  {
    field: 'condition',
    headerName: 'Condition',
    width: 100,
    editable: false,
  },
  {
    field: 'branch_name',
    headerName: 'Branch',
    width: 150,
    editable: false,
  },
  {
    field: 'description',
    headerName: 'Description',
    width: 200,
    editable: false,
    flex: 1,
  },
  {
    field: 'publication_year',
    headerName: 'Year',
    width: 80,
    editable: false,
  },
];

export const LibraryItemDataGrid = () => {
  const [details_open, set_details_open] = useState(false);
  const [selected_copy, set_selected_copy] = useState<Item_Copy | null>(null);
  const [density, set_density] = useState<GridDensity>('standard');

  const { data: rows, isLoading: loading, error } = useAllCopies();

  const handle_copy_selected = (copy: Item_Copy) => {
    set_selected_copy(copy);
    set_details_open(true);
  };

  return (
    <>
      <Box sx={{ overflow: 'hidden', maxHeight: 1 }}>
        <DataGrid
          sx={{ height: 1 }}
          rows={rows || []}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50, 100]}
          onRowDoubleClick={(params) =>
            handle_copy_selected(params.row as Item_Copy)
          }
          slots={{ toolbar: CustomToolbar }}
          slotProps={{
            toolbar: {
              density: density,
              onDensityChange: set_density,
              label: 'Library Item Copies',
              printOptions: { disableToolbarButton: true },
              csvOptions: { disableToolbarButton: true },
            },
          }}
          showToolbar
        />
      </Box>
      {selected_copy && (
        <LibraryItemDetails
          is_open={details_open}
          item={{
            id: selected_copy.library_item_id,
            title: selected_copy.title || '',
            item_type: selected_copy.item_type || 'BOOK',
            description: selected_copy.description,
            publication_year: selected_copy.publication_year,
            congress_code: '',
          }}
          onClose={() => set_details_open(false)}
        />
      )}
      <Snackbar
        anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
        open={Boolean(error)}
        autoHideDuration={6000}
      >
        <Alert severity="error">
          {error?.message}
          <AlertTitle>{error?.name}</AlertTitle>
        </Alert>
      </Snackbar>
    </>
  );
};
