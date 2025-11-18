import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  Alert,
  CircularProgress,
  Divider,
  Stack,
  Chip,
} from '@mui/material';
import { useState, type FC } from 'react';
import { Autorenew, Warning, CheckCircle } from '@mui/icons-material';
import { format_date } from '../utils/dateUtils';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

interface TransactionDetails {
  id: number;
  renewal_status: string;
  due_date: string;
  checkout_date: string;
  item_copy: {
    id: number;
    status: string;
    condition: string;
  };
  library_item: {
    title: string;
    item_type: string;
    author?: string;
    director?: string;
  };
  patron: {
    id: number;
    first_name: string;
    last_name: string;
    card_expiration_date: string;
    balance: number;
    active_checkouts: number;
  };
  has_reservations: boolean;
}

export const RenewItem: FC = () => {
  const [copy_id_input, set_copy_id_input] = useState('');
  const [transaction_details, set_transaction_details] = useState<TransactionDetails | null>(null);
  const [loading_details, set_loading_details] = useState(false);
  const [renewing, set_renewing] = useState(false);
  const [error_message, set_error_message] = useState<string | null>(null);
  const [success_message, set_success_message] = useState<string | null>(null);

  const fetch_transaction_details = async () => {
    if (!copy_id_input.trim()) {
      set_error_message('Please enter an item ID');
      return;
    }

    const copy_id = parseInt(copy_id_input);
    if (isNaN(copy_id)) {
      set_error_message('Item ID must be a number');
      return;
    }

    set_loading_details(true);
    set_error_message(null);
    set_success_message(null);
    set_transaction_details(null);

    try {
      const response = await fetch(`${API_BASE_URL}/transactions/by-copy/${copy_id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch transaction details');
      }

      set_transaction_details(data.data.transaction);
    } catch (error: any) {
      set_error_message(error.message || 'Failed to fetch transaction details');
    } finally {
      set_loading_details(false);
    }
  };

  const handle_renew = async () => {
    if (!transaction_details) return;

    set_renewing(true);
    set_error_message(null);
    set_success_message(null);

    try {
      const response = await fetch(`${API_BASE_URL}/transactions/${transaction_details.id}/renew`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to renew item');
      }

      set_success_message('Item renewed successfully!');

      // Refresh transaction details
      await fetch_transaction_details();
    } catch (error: any) {
      set_error_message(error.message || 'Failed to renew item');
    } finally {
      set_renewing(false);
    }
  };

  const get_renewal_status_color = (status: string) => {
    if (status === 'Checked Out') return 'default';
    if (status === 'Renewed Once') return 'warning';
    if (status === 'Renewed Twice') return 'error';
    return 'default';
  };

  const can_renew = () => {
    if (!transaction_details) return false;

    // Check renewal status
    if (transaction_details.renewal_status === 'Renewed Twice') {
      return false;
    }

    // Check if item is reserved
    if (transaction_details.has_reservations) {
      return false;
    }

    // Check if patron's card is expired
    const current_date = new Date().toISOString().split('T')[0];
    if (transaction_details.patron.card_expiration_date < current_date) {
      return false;
    }

    // Check if patron has fines
    if (transaction_details.patron.balance > 0) {
      return false;
    }

    // Check if patron has too many books checked out
    if (transaction_details.patron.active_checkouts >= 20) {
      return false;
    }

    return true;
  };

  const get_cannot_renew_reason = () => {
    if (!transaction_details) return null;

    if (transaction_details.renewal_status === 'Renewed Twice') {
      return 'Item has already been renewed twice';
    }

    if (transaction_details.has_reservations) {
      return 'Item is reserved';
    }

    const current_date = new Date().toISOString().split('T')[0];
    if (transaction_details.patron.card_expiration_date < current_date) {
      return "Patron's card is expired";
    }

    if (transaction_details.patron.balance > 0) {
      return 'Patron has fines';
    }

    if (transaction_details.patron.active_checkouts >= 20) {
      return 'Patron has too many books checked out';
    }

    return null;
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        Renew Item
      </Typography>

      <Paper elevation={3} sx={{ p: 4, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Enter Item ID
        </Typography>

        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Item ID"
            type="number"
            value={copy_id_input}
            onChange={(e) => set_copy_id_input(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                fetch_transaction_details();
              }
            }}
            disabled={loading_details}
          />
          <Button
            variant="contained"
            onClick={fetch_transaction_details}
            disabled={loading_details || !copy_id_input.trim()}
            sx={{ minWidth: 120 }}
          >
            {loading_details ? <CircularProgress size={24} /> : 'Search'}
          </Button>
        </Stack>

        {error_message && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => set_error_message(null)}>
            {error_message}
          </Alert>
        )}

        {success_message && (
          <Alert severity="success" sx={{ mt: 2 }} icon={<CheckCircle />} onClose={() => set_success_message(null)}>
            {success_message}
          </Alert>
        )}

        {transaction_details && (
          <Box sx={{ mt: 4 }}>
            <Divider sx={{ mb: 3 }} />

            <Typography variant="h6" gutterBottom>
              Item Information
            </Typography>

            <Stack spacing={1} sx={{ mt: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Title
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {transaction_details.library_item.title}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Type
                </Typography>
                <Typography variant="body1">{transaction_details.library_item.item_type}</Typography>
              </Box>

              {transaction_details.library_item.author && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Author
                  </Typography>
                  <Typography variant="body1">{transaction_details.library_item.author}</Typography>
                </Box>
              )}

              {transaction_details.library_item.director && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Director
                  </Typography>
                  <Typography variant="body1">{transaction_details.library_item.director}</Typography>
                </Box>
              )}

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Condition
                </Typography>
                <Typography variant="body1">{transaction_details.item_copy.condition}</Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Due Date
                </Typography>
                <Typography variant="body1">{format_date(transaction_details.due_date)}</Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Renewal Status
                </Typography>
                <Chip
                  label={transaction_details.renewal_status}
                  color={get_renewal_status_color(transaction_details.renewal_status)}
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              </Box>
            </Stack>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Patron Information
            </Typography>

            <Stack spacing={1} sx={{ mt: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Name
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {transaction_details.patron.first_name} {transaction_details.patron.last_name}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Patron ID
                </Typography>
                <Typography variant="body1">{transaction_details.patron.id}</Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Card Expiration Date
                </Typography>
                <Typography variant="body1">
                  {format_date(transaction_details.patron.card_expiration_date)}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Balance
                </Typography>
                <Typography variant="body1">${transaction_details.patron.balance.toFixed(2)}</Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Active Checkouts
                </Typography>
                <Typography variant="body1">
                  {transaction_details.patron.active_checkouts} / 20
                </Typography>
              </Box>
            </Stack>

            <Divider sx={{ my: 3 }} />

            {!can_renew() && (
              <Alert severity="warning" icon={<Warning />} sx={{ mb: 2 }}>
                {get_cannot_renew_reason()}
              </Alert>
            )}

            <Button
              variant="contained"
              size="large"
              startIcon={<Autorenew />}
              onClick={handle_renew}
              disabled={!can_renew() || renewing}
              fullWidth
            >
              {renewing ? <CircularProgress size={24} /> : 'Renew'}
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};
