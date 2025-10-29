import {
  Card,
  CardContent,
  Typography,
  Chip,
  CardHeader,
  IconButton,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useTransactions } from '../../hooks/useTransactions';
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
    field: 'transaction_type',
    headerName: 'Action',
    valueFormatter: (value) => {
      if (!value) return '?';
      const str = String(value);
      return str.charAt(0).toUpperCase() + str.slice(1);
    },
    width: 100,
  },
  {
    field: 'created_at',
    headerName: 'Date',
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
      <Chip
        label={params.value}
        variant="outlined"
        color={params.value === 'Active' ? 'success' : 'info'}
        size="small"
      />
    ),
  },
];

export const RecentTransactionsList = () => {
  const { data, isLoading, refetch } = useTransactions();

  return (
    <Card sx={{ boxShadow: 3 }}>
      <CardHeader
        title={
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            📋 Recent Transactions
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
          disableRowSelectionOnClick
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
