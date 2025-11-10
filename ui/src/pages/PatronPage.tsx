import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  Divider,
  Button,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  CreditCard,
  AccountBalance,
  ArrowBack,
  Edit,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { data_service } from '../services/dataService';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { usePatronById } from '../hooks/usePatrons';

// Columns for patron's transaction history
const transactionColumns: GridColDef[] = [
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
        color={params.value === 'Active' ? 'success' : 'default'}
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

export const PatronPage = () => {
  const { patron_id } = useParams();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState<'active' | 'history'>(
    'active'
  );

  // Fetch patron details using the hook
  const {
    data: patron,
    isLoading: patronLoading,
    error: patronError,
  } = usePatronById(parseInt(patron_id || '0'));

  // Fetch patron's transactions
  const { data: allTransactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => data_service.getAllTransactions(),
  });

  if (!patron_id) {
    return (
      <Container sx={{ p: 3 }}>
        <Alert severity="error">No patron ID provided</Alert>
      </Container>
    );
  }

  const patronTransactions = allTransactions?.filter(
    (t) => t.patron_id === parseInt(patron_id)
  );
  const activeTransactions = patronTransactions?.filter(
    (t) => t.status.toLowerCase() === 'active'
  );
  const historyTransactions = patronTransactions?.filter(
    (t) => t.status.toLowerCase() !== 'active'
  );

  if (patronLoading) {
    return (
      <Container sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (patronError || !patron) {
    return (
      <Container sx={{ p: 3 }}>
        <Alert severity="error">
          {patronError ? 'Error loading patron data' : 'Patron not found'}
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/patrons')}
          sx={{ mt: 2 }}
        >
          Back to Patrons
        </Button>
      </Container>
    );
  }

  const isCardExpired = new Date(patron.card_expiration_date) < new Date();
  const totalFines =
    patronTransactions?.reduce((sum, t) => sum + (t.fine_amount || 0), 0) || 0;

  return (
    <Container maxWidth="xl" sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/patrons')}
          variant="outlined"
        >
          Back
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 600, flex: 1 }}>
          Patron Details
        </Typography>
        <Button startIcon={<Edit />} variant="contained" color="primary">
          Edit Patron
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Patron Info Card */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  mb: 3,
                }}
              >
                <Avatar
                  sx={{
                    width: 100,
                    height: 100,
                    bgcolor: 'primary.main',
                    fontSize: '2.5rem',
                    mb: 2,
                  }}
                  src={patron.image_url}
                >
                  {patron.first_name[0]}
                  {patron.last_name[0]}
                </Avatar>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 600, textAlign: 'center' }}
                >
                  {patron.first_name} {patron.last_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Patron ID: {patron.id}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <List dense>
                <ListItem>
                  <CreditCard sx={{ mr: 2, color: 'text.secondary' }} />
                  <ListItemText
                    primary="Card Expiration"
                    secondary={
                      <Typography
                        variant="body2"
                        sx={{ display: 'flex', alignItems: 'center' }}
                      >
                        {new Date(
                          patron.card_expiration_date
                        ).toLocaleDateString()}
                        {isCardExpired && (
                          <Chip
                            component={'span'}
                            label="Expired"
                            color="error"
                            size="small"
                            sx={{ ml: 1 }}
                            variant="outlined"
                          />
                        )}
                      </Typography>
                    }
                  />
                </ListItem>

                <ListItem>
                  <AccountBalance sx={{ mr: 2, color: 'text.secondary' }} />
                  <ListItemText
                    primary="Account Balance"
                    secondary={
                      <Typography
                        variant="body2"
                        sx={{
                          color:
                            patron.balance > 0 ? 'error.main' : 'success.main',
                          fontWeight: 600,
                        }}
                      >
                        ${patron.balance.toFixed(2)}
                      </Typography>
                    }
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* Quick Stats Card */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Statistics
              </Typography>
              <Grid container spacing={1}>
                <Grid size={{ xs: 6 }}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 12,
                      textAlign: 'center',
                      bgcolor: 'primary.main',
                    }}
                  >
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {activeTransactions?.length || 0}
                    </Typography>
                    <Typography variant="body2">Active Checkouts</Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 12,
                      textAlign: 'center',
                      bgcolor: 'secondary.main',
                    }}
                  >
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {historyTransactions?.length || 0}
                    </Typography>
                    <Typography variant="body2">Total Returns</Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 12,
                      textAlign: 'center',
                      bgcolor: totalFines > 0 ? 'error.main' : 'success.main',
                    }}
                  >
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      ${totalFines.toFixed(2)}
                    </Typography>
                    <Typography variant="body2">Total Fines</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Transactions Section */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
                <Button
                  variant={selectedTab === 'active' ? 'contained' : 'outlined'}
                  onClick={() => setSelectedTab('active')}
                >
                  Active Checkouts ({activeTransactions?.length || 0})
                </Button>
                <Button
                  variant={selectedTab === 'history' ? 'contained' : 'outlined'}
                  onClick={() => setSelectedTab('history')}
                >
                  Transaction History ({historyTransactions?.length || 0})
                </Button>
              </Box>

              <Box sx={{ height: 500, width: '100%' }}>
                {transactionsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <DataGrid
                    rows={
                      selectedTab === 'active'
                        ? activeTransactions || []
                        : historyTransactions || []
                    }
                    columns={transactionColumns}
                    pageSizeOptions={[5, 10, 25]}
                    initialState={{
                      pagination: { paginationModel: { pageSize: 10 } },
                    }}
                    disableRowSelectionOnClick
                    sx={{
                      border: 'none',
                      '& .MuiDataGrid-columnHeaders': {
                        fontWeight: 600,
                      },
                    }}
                  />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};
