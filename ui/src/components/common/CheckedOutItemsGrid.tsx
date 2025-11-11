import { Chip, Stack } from '@mui/material';
import { DataGrid, type GridColDef, type GridDensity } from '@mui/x-data-grid';
import { useActiveTransactions } from '../../hooks/useTransactions';
import { useState } from 'react';
import { CustomToolbar } from './CustomDataGridToolbar';
import ItemTypeChip from '../library_items/ItemTypeChip';

const columns: GridColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 90,
    valueGetter: (value) => Number(value),
  },
  {
    field: 'copy_id',
    headerName: 'Copy ID',
    width: 120,
    valueGetter: (value) => Number(value),
  },
  {
    field: 'patron_id',
    headerName: 'Patron ID',
    width: 120,
    valueGetter: (value) => Number(value),
  },
  {
    field: 'member',
    headerName: 'Patron',
    width: 180,
    valueGetter: (_value, row) => `${row.first_name} ${row.last_name}`,
  },
  {
    field: 'title',
    headerName: 'Library Item',
    width: 200,
    flex: 1,
  },
  {
    field: 'due_date',
    headerName: 'Due Date',
    width: 200,
    valueFormatter: (value) => {
      if (!value) return '?';
      return new Date(value).toLocaleString();
    },
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 120,
    renderCell: (params) => (
      <Stack sx={{ height: 1 }} direction={'row'} gap={1} alignItems={'center'}>
        <Chip
          label={params.value}
          variant="outlined"
          color={params.value === 'Active' ? 'success' : 'info'}
          size="small"
        />
        {params.row && params.row.due_date < new Date() && (
          <Chip
            label="Overdue"
            variant="outlined"
            color="warning"
            size="small"
          />
        )}
      </Stack>
    ),
  },
  {
    field: 'item_type',
    headerName: 'Type',
    width: 100,
    renderCell: (params) => <ItemTypeChip item_type={params.value} />,
  },
  { field: 'branch_name', headerName: 'Branch', width: 200 },
];

export const CheckedOutItemsGrid = ({
  select_item_copy,
}: {
  select_item_copy: (copy_id: number) => void;
}) => {
  const { data, isLoading } = useActiveTransactions();
  const [density, set_density] = useState<GridDensity>('standard');

  return (
    <DataGrid
      rows={data || []}
      columns={columns}
      loading={isLoading}
      pageSizeOptions={[15, 30, 50]}
      initialState={{
        pagination: { paginationModel: { pageSize: 15 } },
      }}
      onRowClick={(params) => select_item_copy(params.row.copy_id)}
      sx={{
        border: 'none',
        '& .MuiDataGrid-columnHeaders': {
          fontWeight: 600,
        },
      }}
      slots={{ toolbar: CustomToolbar }}
      slotProps={{
        toolbar: {
          density: density,
          onDensityChange: set_density,
          label: 'Checked Out Items',
          printOptions: { disableToolbarButton: true },
          csvOptions: { disableToolbarButton: true },
        },
      }}
      showToolbar
    />
  );
};
