import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import { History } from '@mui/icons-material';
import type { SelectChangeEvent } from '@mui/material/Select';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

interface Transaction {
  id: string;
  patron_id: string;
  copy_id: string;
  transaction_type: string;
  checkout_date: string;
  due_date: string;
  return_date: string | null;
  fine_amount: number;
  status: string;
  first_name: string;
  last_name: string;
  title: string;
  item_type: string;
  branch_name: string;
}

const get_status_color = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active':
      return 'primary';
    case 'returned':
      return 'success';
    case 'overdue':
      return 'error';
    default:
      return 'default';
  }
};

const get_transaction_type_color = (type: string) => {
  switch (type.toLowerCase()) {
    case 'checkout':
      return 'info';
    case 'checkin':
      return 'success';
    case 'renewal':
      return 'warning';
    default:
      return 'default';
  }
};

export const Transactions = () => {
  const [transactions, set_transactions] = useState<Transaction[]>([]);
  const [loading, set_loading] = useState(true);
  const [error, set_error] = useState<string | null>(null);
  const [patron_filter, set_patron_filter] = useState('');
  const [status_filter, set_status_filter] = useState('');
  const [type_filter, set_type_filter] = useState('');

  useEffect(() => {
    fetch_transactions();
  }, []);

  const fetch_transactions = async () => {
    set_loading(true);
    set_error(null);

    try {
      const response = await fetch(`${API_BASE_URL}/transactions`);

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      set_transactions(data.data || []);
    } catch (err) {
      set_error(err instanceof Error ? err.message : 'Failed to load transactions');
    } finally {
      set_loading(false);
    }
  };

  const filtered_transactions = transactions.filter((trans) => {
    if (patron_filter && !trans.first_name.toLowerCase().includes(patron_filter.toLowerCase()) &&
        !trans.last_name.toLowerCase().includes(patron_filter.toLowerCase()) &&
        !trans.patron_id.includes(patron_filter)) {
      return false;
    }
    if (status_filter && trans.status !== status_filter) {
      return false;
    }
    if (type_filter && trans.transaction_type !== type_filter) {
      return false;
    }
    return true;
  });

  const format_date = (date_string: string | null) => {
    if (!date_string) return '-';
    return new Date(date_string).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const format_time = (date_string: string | null) => {
    if (!date_string) return '';
    return new Date(date_string).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <History color="primary" fontSize="large" />
        <Typography variant="h4" component="h1" fontWeight="bold">
          Transaction History
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => set_error(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 2 }}>
          <TextField
            label="Search Patron"
            placeholder="Name or ID"
            value={patron_filter}
            onChange={(e) => set_patron_filter(e.target.value)}
            size="small"
            fullWidth
          />

          <FormControl size="small" fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={status_filter}
              label="Status"
              onChange={(e: SelectChangeEvent) => set_status_filter(e.target.value)}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="returned">Returned</MenuItem>
              <MenuItem value="overdue">Overdue</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth>
            <InputLabel>Type</InputLabel>
            <Select
              value={type_filter}
              label="Type"
              onChange={(e: SelectChangeEvent) => set_type_filter(e.target.value)}
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="checkout">Checkout</MenuItem>
              <MenuItem value="checkin">Check-in</MenuItem>
              <MenuItem value="renewal">Renewal</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            onClick={fetch_transactions}
            fullWidth
          >
            Refresh
          </Button>
        </Box>

        <Box sx={{ color: 'text.secondary' }}>
          <Typography variant="body2">
            Showing {filtered_transactions.length} of {transactions.length} transactions
          </Typography>
        </Box>
      </Paper>

      {/* Transactions Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : filtered_transactions.length === 0 ? (
        <Alert severity="info">
          {patron_filter || status_filter || type_filter
            ? 'No transactions match your filters'
            : 'No transactions found'}
        </Alert>
      ) : (
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead sx={{ bgcolor: 'primary.main' }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Transaction ID</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Patron</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Item</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Type</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Checkout Date</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Due Date</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Return Date</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Fine</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Branch</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered_transactions.map((transaction) => (
                <TableRow key={transaction.id} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {transaction.id.substring(0, 8)}...
                  </TableCell>
                  <TableCell>
                    {transaction.first_name} {transaction.last_name}
                    <Typography variant="caption" display="block" color="text.secondary">
                      {transaction.patron_id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {transaction.title}
                    <Typography variant="caption" display="block" color="text.secondary">
                      {transaction.item_type}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={transaction.transaction_type.charAt(0).toUpperCase() + transaction.transaction_type.slice(1)}
                      color={get_transaction_type_color(transaction.transaction_type) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      color={get_status_color(transaction.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">{format_date(transaction.checkout_date)}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format_time(transaction.checkout_date)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2"
                      sx={{
                        color: new Date(transaction.due_date) < new Date() && !transaction.return_date ? 'error.main' : 'inherit',
                        fontWeight: new Date(transaction.due_date) < new Date() && !transaction.return_date ? 'bold' : 'normal'
                      }}
                    >
                      {format_date(transaction.due_date)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {transaction.return_date ? (
                      <Box>
                        <Typography variant="body2">{format_date(transaction.return_date)}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format_time(transaction.return_date)}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {transaction.fine_amount > 0 ? (
                      <Chip
                        label={`$${transaction.fine_amount.toFixed(2)}`}
                        color="error"
                        size="small"
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{transaction.branch_name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};
