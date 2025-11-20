import { useState } from 'react';
import { DataGrid, type GridColDef, type GridDensity } from '@mui/x-data-grid';
import { type Library_Item } from '../../types';
import { Snackbar, Alert, AlertTitle, Box } from '@mui/material';
import { LibraryItemDetails } from './LibraryItemDetails';
import { useItemCopies } from '../../hooks/useLibraryItems';
import ItemTypeChip from './ItemTypeChip';
import { CustomToolbar } from '../common/CustomDataGridToolbar';

const columns: GridColDef[] = [
  { field: 'library_item_id', headerName: 'ID', width: 60, sortable: false },
  { field: 'id', headerName: 'Copy ID', width: 80, sortable: false },
  { field: 'copy_label', headerName: 'Copy', width: 120, sortable: false },
  { field: 'title', headerName: 'Title', width: 150, sortable: false },
  {
    field: 'item_type',
    headerName: 'Type',
    width: 100,
    sortable: false,
    renderCell: (params) => {
      return <ItemTypeChip item_type={params.value} />;
    },
  },
  {
    field: 'description',
    headerName: 'Description',
    width: 200,
    sortable: false,
    flex: 1,
  },
  {
    field: 'publication_year',
    headerName: 'Publication Year',
    width: 130,
    sortable: false,
  },
];

export const LibraryItemDataGrid = () => {
  const [details_open, set_details_open] = useState(false);
  const [selected_item, set_selected_item] = useState<Library_Item | null>(
    null
  );
  const [density, set_density] = useState<GridDensity>('standard');

  const { data: rawRows, isLoading: loading, error } = useItemCopies();

  // Sort rows by ID (library_item_id) ascending, then by Copy ID (id) ascending
  const rows = rawRows ? [...rawRows].sort((a, b) => {
    if (a.library_item_id !== b.library_item_id) {
      return a.library_item_id - b.library_item_id;
    }
    return a.id - b.id;
  }) : [];

  const handle_item_selected = (item: Library_Item) => {
    set_selected_item(item);
    set_details_open(true);
  };

  return (
    <>
      <Box sx={{ overflow: 'hidden', maxHeight: 1 }}>
        <DataGrid
          sx={{ height: 1 }}
          rows={rows}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50, 100]}
          onRowDoubleClick={(params) =>
            handle_item_selected(params.row as Library_Item)
          }
          slots={{ toolbar: CustomToolbar }}
          slotProps={{
            toolbar: {
              density: density,
              onDensityChange: set_density,
              label: 'Library Items',
              printOptions: { disableToolbarButton: true },
              csvOptions: { disableToolbarButton: true },
            },
          }}
          disableColumnMenu
          disableColumnFilter
          disableColumnSelector
          showToolbar
        />
      </Box>
      <LibraryItemDetails
        is_open={details_open}
        item={selected_item}
        onClose={() => set_details_open(false)}
      />
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
