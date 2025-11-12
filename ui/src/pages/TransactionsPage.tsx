import { Container } from '@mui/material';
import { DataGrid, type GridColDef, type GridDensity } from '@mui/x-data-grid';
import { useTransactions } from '../hooks/useTransactions';
import { TransactionStatusChip } from '../components/transactions/TransactionStatusChip';
import { TransactionTypeChip } from '../components/transactions/TransactionTypeChip';
import { useState } from 'react';
import { CustomToolbar } from '../components/common/CustomDataGridToolbar';

const transaction_cols: GridColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 90,
    valueGetter: (value) => Number(value),
  },
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
    renderCell: (params) => <TransactionTypeChip status={params.value} />,
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
    renderCell: (params) => <TransactionStatusChip status={params.value} />,
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
  const [density, set_density] = useState<GridDensity>('standard');

  return (
    <Container maxWidth="xl" sx={{ p: 3 }}>
      <DataGrid
        showToolbar
        rows={transactions || []}
        columns={transaction_cols}
        density={density}
        slots={{ toolbar: CustomToolbar }}
        slotProps={{
          toolbar: {
            density: density,
            onDensityChange: set_density,
            label: 'Transactions',
          },
        }}
      />
    </Container>
  );
};
