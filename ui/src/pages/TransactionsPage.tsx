import { Container, Typography, Chip } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useTransactions } from '../hooks/useTransactions';

// Columns for patron's transaction history
const transaction_cols: GridColDef[] = [
  {
    field: 'title',
    headerName: 'Item',
    width: 250,
    flex: 1,
  },
  {
    field: 'transaction_type',
    headerName: 'Type',
    width: 120,
    valueFormatter: (value) => {
      const str = String(value);
      return str.charAt(0).toUpperCase() + str.slice(1);
    },
  },
  {
    field: 'checkout_date',
    headerName: 'Checkout Date',
    width: 180,
    valueFormatter: (value) => {
      return value ? new Date(value).toLocaleDateString() : '-';
    },
  },
  {
    field: 'due_date',
    headerName: 'Due Date',
    width: 180,
    valueFormatter: (value) => {
      return value ? new Date(value).toLocaleDateString() : '-';
    },
  },
  {
    field: 'return_date',
    headerName: 'Return Date',
    width: 180,
    valueFormatter: (value) => {
      return value ? new Date(value).toLocaleDateString() : '-';
    },
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 120,
    renderCell: (params) => (
      <Chip
        label={params.value}
        color={
          params.value === 'Active'
            ? 'primary'
            : params.value === 'Overdue'
            ? 'warning'
            : params.value === 'Returned'
            ? 'success'
            : 'error'
        }
        size="small"
        variant="outlined"
      />
    ),
  },
  {
    field: 'fine_amount',
    headerName: 'Fine',
    width: 100,
    valueFormatter: (value) => {
      return value ? `$${Number(value).toFixed(2)}` : '$0.00';
    },
  },
];

export const TransactionsPage = () => {
  const { data: transactions } = useTransactions();
  return (
    <Container maxWidth="xl" sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Transaction
      </Typography>
      <DataGrid rows={transactions || []} columns={transaction_cols} />
    </Container>
  );
};
