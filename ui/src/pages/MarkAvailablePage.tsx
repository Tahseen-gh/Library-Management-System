import React, { useState } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Alert,
  AlertTitle,
  Paper,
  TextField,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
} from '@mui/material';
import { CheckCircle, Warning } from '@mui/icons-material';
import { useBranchContext } from '../contexts/Branch_Context';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

interface ReturnedItem {
  id: number;
  library_item_id: number;
  title: string;
  item_type: string;
  branch_id: number;
  return_branch_id: number | null;
  status: string;
  needs_transfer: boolean;
  home_branch_name: string;
}

export const MarkAvailablePage: React.FC = () => {
  const { selected_branch } = useBranchContext();
  const [item_id_input, set_item_id_input] = useState<string>('');
  const [returned_items, set_returned_items] = useState<ReturnedItem[]>([]);
  const [loading, set_loading] = useState(false);
  const [processing, set_processing] = useState(false);
  const [error, set_error] = useState<string | null>(null);
  const [success, set_success] = useState<string | null>(null);

  // Fetch items with 'returned' or 'damaged' status at this branch
  const fetch_returned_items = async () => {
    if (!selected_branch) return;

    set_loading(true);
    set_error(null);

    try {
      // Get all returned items
      const returned_response = await fetch(
        `${API_BASE_URL}/item-copies?status=returned`
      );
      const damaged_response = await fetch(
        `${API_BASE_URL}/item-copies?status=damaged`
      );

      if (!returned_response.ok || !damaged_response.ok) {
        throw new Error('Failed to fetch items');
      }

      const returned_data = await returned_response.json();
      const damaged_data = await damaged_response.json();

      const returned_items = returned_data.data || returned_data;
      const damaged_items = damaged_data.data || damaged_data;

      // Combine both lists
      const all_items = [...returned_items, ...damaged_items];

      console.log('All returned/damaged items:', all_items);
      console.log('Selected branch ID:', selected_branch.id);

      set_returned_items(all_items);
    } catch (err) {
      set_error(
        err instanceof Error ? err.message : 'Failed to load returned items'
      );
    } finally {
      set_loading(false);
    }
  };

  // Mark single item as available
  const mark_available = async (copy_id: number) => {
    if (!selected_branch) return;

    set_processing(true);
    set_error(null);
    set_success(null);

    try {
      const response = await fetch(`${API_BASE_URL}/transactions/reshelve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          copy_id: copy_id,
          branch_id: selected_branch.id,
        }),
      });

      if (!response.ok) {
        const error_data = await response.json();
        throw new Error(
          error_data.message ||
            error_data.error ||
            'Failed to mark item as available'
        );
      }

      set_success(`Item ${copy_id} marked as available!`);

      // Refresh the list
      await fetch_returned_items();

      // Clear success message after 3 seconds
      setTimeout(() => set_success(null), 3000);
    } catch (err) {
      set_error(
        err instanceof Error ? err.message : 'Failed to mark item as available'
      );
    } finally {
      set_processing(false);
    }
  };

  // Mark item by manual ID entry
  const mark_available_by_id = async () => {
    if (!item_id_input.trim() || !selected_branch) return;

    set_processing(true);
    set_error(null);
    set_success(null);

    try {
      const response = await fetch(`${API_BASE_URL}/transactions/reshelve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          copy_id: parseInt(item_id_input),
          branch_id: selected_branch.id,
        }),
      });

      if (!response.ok) {
        const error_data = await response.json();
        throw new Error(
          error_data.message ||
            error_data.error ||
            'Failed to mark item as available'
        );
      }

      set_success(`Item ${item_id_input} marked as available!`);
      set_item_id_input('');

      // Refresh the list
      await fetch_returned_items();

      // Clear success message after 3 seconds
      setTimeout(() => set_success(null), 3000);
    } catch (err) {
      set_error(
        err instanceof Error ? err.message : 'Failed to mark item as available'
      );
    } finally {
      set_processing(false);
    }
  };

  React.useEffect(() => {
    if (selected_branch) {
      fetch_returned_items();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected_branch]);

  if (!selected_branch) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning">
          <AlertTitle>No Branch Selected</AlertTitle>
          Please select a branch to view items ready for reshelving.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Mark Items as Available
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Scan or select items from the reshelve bin to mark them as available
          for checkout.
        </Typography>
        <Chip
          label={`Current Branch: ${selected_branch.branch_name}`}
          color="primary"
          sx={{ mt: 2 }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => set_error(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 3 }}
          onClose={() => set_success(null)}
        >
          {success}
        </Alert>
      )}

      {/* Manual ID Entry */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Scan Item ID
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            label="Item Copy ID"
            value={item_id_input}
            onChange={(e) => set_item_id_input(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && item_id_input) {
                mark_available_by_id();
              }
            }}
            placeholder="Enter or scan item ID"
            disabled={processing}
          />
          <Button
            variant="contained"
            onClick={mark_available_by_id}
            disabled={!item_id_input || processing}
            startIcon={
              processing ? <CircularProgress size={20} /> : <CheckCircle />
            }
            sx={{ minWidth: 150 }}
          >
            Mark Available
          </Button>
        </Box>
      </Paper>

      {/* List of Returned Items */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            Items Ready for Reshelving ({returned_items.length})
          </Typography>
          <Button
            variant="outlined"
            onClick={fetch_returned_items}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </Box>

        {loading && returned_items.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : returned_items.length === 0 ? (
          <Alert severity="info">
            <AlertTitle>No Items to Reshelve</AlertTitle>
            All returned items at this branch have been reshelved. Great job!
          </Alert>
        ) : (
          <List>
            {returned_items.map((item, index) => (
              <React.Fragment key={item.id}>
                {index > 0 && <Divider />}
                <ListItem
                  secondaryAction={
                    <Button
                      variant="contained"
                      color="success"
                      onClick={() => mark_available(item.id)}
                      disabled={processing}
                      startIcon={<CheckCircle />}
                    >
                      Mark Available
                    </Button>
                  }
                >
                  <ListItemText
                    primary={
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Typography variant="body1" fontWeight="bold">
                          {item.title || `Item ${item.id}`}
                        </Typography>
                        <Chip label={item.item_type} size="small" />
                        {item.status === 'damaged' && (
                          <Chip
                            label="DAMAGED - REPAIRED"
                            color="error"
                            size="small"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Copy ID: {item.id}
                        </Typography>
                        {item.status === 'damaged' && (
                          <Typography
                            variant="body2"
                            color="error.main"
                            sx={{ mt: 0.5 }}
                          >
                            Damaged - Mark as available only after
                            repair/replacement
                          </Typography>
                        )}
                        {item.return_branch_id &&
                          item.return_branch_id !== item.branch_id && (
                            <Chip
                              icon={<Warning />}
                              label="Transferred from another branch"
                              color="warning"
                              size="small"
                              sx={{ mt: 1 }}
                            />
                          )}
                      </Box>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Container>
  );
};
