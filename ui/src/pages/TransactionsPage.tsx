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
    width: 70,
    valueGetter: (value) => Number(value),
  },
  {
    field: 'first_name',
    headerName: 'Patron',
    width: 150,
    valueGetter: (value, row) => {
      if (!value) return '';
      return `${value} ${row.last_name}`;
    },
  },
  {
    field: 'copy_id',
    headerName: 'Copy ID',
    width: 90,
  },
  {
    field: 'copy_label',
    headerName: 'Copy',
    width: 120,
  },
  {
    field: 'title',
    headerName: 'Item',
    width: 200,
    flex: 1,
  },
  {
    field: 'transaction_type',
    headerName: 'Type',
    width: 120,
    renderCell: (params) => <TransactionTypeChip status={params.value} />,
  },
  {
    field: 'created_at',
    headerName: 'Checkout Date',
    width: 130,
    valueFormatter: (value) => {
      return value ? new Date(value).toLocaleDateString() : '-';
    },
  },
  {
    field: 'due_date',
    headerName: 'Due Date',
    width: 130,
    valueFormatter: (value) => {
      return value ? new Date(value).toLocaleDateString() : '-';
    },
  },
  {
    field: 'return_date',
    headerName: 'Return Date',
    width: 130,
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
