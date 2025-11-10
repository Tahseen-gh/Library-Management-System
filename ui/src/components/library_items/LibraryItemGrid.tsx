import { useState } from 'react';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { type Library_Item } from '../../types';
import { Snackbar, Alert, Chip, AlertTitle, Box } from '@mui/material';
import { LibraryItemDetails } from './LibraryItemDetails';
import { get_color_for_item_type } from '../../utils/colors';
import { useLibraryItems } from '../../hooks/useLibraryItems';

const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 90 },
  { field: 'title', headerName: 'Title', width: 150, editable: false },
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
    field: 'description',
    headerName: 'Description',
    width: 200,
    editable: false,
    flex: 1,
  },
  {
    field: 'publication_year',
    headerName: 'Publication Year',
    width: 130,
    editable: false,
  },
];

export const LibraryItemDataGrid = () => {
  const [details_open, set_details_open] = useState(false);
  const [selected_item, set_selected_item] = useState<Library_Item | null>(
    null
  );

  const { data: rows, isLoading: loading, error } = useLibraryItems();

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
          slotProps={{
            toolbar: {
              printOptions: { disableToolbarButton: true },
              csvOptions: { disableToolbarButton: true },
            },
          }}
          showToolbar
          label="Library Items"
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
