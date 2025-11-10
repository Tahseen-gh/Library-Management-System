import {
  Card,
  CardContent,
  Typography,
  Chip,
  CardHeader,
  IconButton,
  Stack,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useActiveTransactions } from '../../hooks/useTransactions';
import { Loop } from '@mui/icons-material';

const columns: GridColDef[] = [
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
    width: 150,
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
];

export const CheckedOutItemsGrid = ({
  select_item_copy,
}: {
  select_item_copy: (copy_id: number) => void;
}) => {
  const { data, isLoading, refetch } = useActiveTransactions();

  return (
    <Card onClick={() => console.log(data)} sx={{ boxShadow: 3 }}>
      <CardHeader
        title={
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            📋 Currently Checked Out
          </Typography>
        }
        action={
          <IconButton onClick={() => refetch()}>
            <Loop sx={{ cursor: 'pointer', color: 'text.secondary' }} />
          </IconButton>
        }
      />
      <CardContent
        sx={{ p: 0, maxHeight: 'calc(100vh - 200px)', width: '100%' }}
      >
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
        />
      </CardContent>
    </Card>
  );
};
