import { useState, useEffect } from 'react';
import { DataGrid, type GridColDef, type GridDensity } from '@mui/x-data-grid';
import { type Library_Item } from '../../types';
import { Snackbar, Alert, AlertTitle, Box, Chip, Stack, Tooltip } from '@mui/material';
import { LibraryItemDetails } from './LibraryItemDetails';
import { useLibraryItems } from '../../hooks/useLibraryItems';
import ItemTypeChip from './ItemTypeChip';
import { CustomToolbar } from '../common/CustomDataGridToolbar';
import { data_service } from '../../services/dataService';

interface EnrichedLibraryItem extends Library_Item {
  copy_ids?: number[];
  copy_count?: number;
}

const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 60 },
  { field: 'title', headerName: 'Title', width: 200, editable: false },
  {
    field: 'item_type',
    headerName: 'Type',
    width: 100,
    editable: false,
    renderCell: (params) => {
      return <ItemTypeChip item_type={params.value} />;
    },
  },
  {
    field: 'copy_ids',
    headerName: 'Copies',
    width: 250,
    editable: false,
    renderCell: (params) => {
      const copyIds = params.value as number[] | undefined;
      if (!copyIds || copyIds.length === 0) {
        return (
          <Chip label="No copies" size="small" color="default" variant="outlined" />
        );
      }

      return (
        <Tooltip
          title={
            <Box>
              <div>Copy IDs: {copyIds.join(', ')}</div>
              <div>Total: {copyIds.length}</div>
            </Box>
          }
          arrow
        >
          <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
            <Chip
              label={`${copyIds.length} ${copyIds.length === 1 ? 'copy' : 'copies'}`}
              size="small"
              color="primary"
              variant="outlined"
            />
            {copyIds.slice(0, 3).map((id) => (
              <Chip
                key={id}
                label={`#${id}`}
                size="small"
                color="default"
              />
            ))}
            {copyIds.length > 3 && (
              <Chip
                label={`+${copyIds.length - 3} more`}
                size="small"
                color="default"
                variant="outlined"
              />
            )}
          </Stack>
        </Tooltip>
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
  const [density, set_density] = useState<GridDensity>('standard');
  const [enriched_items, set_enriched_items] = useState<EnrichedLibraryItem[]>([]);

  const { data: rows, isLoading: loading, error } = useLibraryItems();

  // Fetch copy IDs for each library item
  useEffect(() => {
    if (rows && rows.length > 0) {
      const fetchCopies = async () => {
        const items_with_copies = await Promise.all(
          rows.map(async (item) => {
            try {
              const copies = await data_service.get_all_copies_by_item_id(item.id);
              return {
                ...item,
                copy_ids: copies.map((copy) => copy.id),
                copy_count: copies.length,
              };
            } catch (error) {
              console.error(`Failed to fetch copies for item ${item.id}:`, error);
              return {
                ...item,
                copy_ids: [],
                copy_count: 0,
              };
            }
          })
        );
        set_enriched_items(items_with_copies);
      };

      fetchCopies();
    } else {
      set_enriched_items([]);
    }
  }, [rows]);

  const handle_item_selected = (item: Library_Item) => {
    set_selected_item(item);
    set_details_open(true);
  };

  return (
    <>
      <Box sx={{ overflow: 'hidden', maxHeight: 1 }}>
        <DataGrid
          sx={{ height: 1 }}
          rows={enriched_items}
          columns={columns}
          loading={loading || (rows && rows.length > 0 && enriched_items.length === 0)}
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
