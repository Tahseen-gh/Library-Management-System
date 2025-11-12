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
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { CheckCircle, Warning, ErrorOutline } from '@mui/icons-material';
import { useBranchContext } from '../contexts/Branch_Context';
import { get_condition_color } from '../utils/colors';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

interface ReturnedItem {
  id: number;
  library_item_id: number;
  title: string;
  item_type: string;
  owning_branch_id: number;
  return_branch_id: number | null;
  status: string;
  needs_transfer: boolean;
  branch_name: string;
  condition: string;
}

interface ItemDetails {
  id: number;
  title: string;
  item_type: string;
  status: string;
  condition: string;
  owning_branch_id: number;
  branch_name: string;
}

type MarkMethod = 'manual' | 'list';

export const MarkAvailablePage: React.FC = () => {
  const { selected_branch } = useBranchContext();
  const [item_id_input, set_item_id_input] = useState<string>('');
  const [returned_items, set_returned_items] = useState<ReturnedItem[]>([]);
  const [loading, set_loading] = useState(false);
  const [processing, set_processing] = useState(false);
  const [error, set_error] = useState<string | null>(null);
  const [success, set_success] = useState<string | null>(null);
  const [last_reshelved_item, set_last_reshelved_item] = useState<number | null>(null);

  // Dialog states
  const [show_repair_dialog, set_show_repair_dialog] = useState(false);
  const [show_damaged_warning, set_show_damaged_warning] = useState(false);
  const [pending_item, set_pending_item] = useState<{ id: number; method: MarkMethod } | null>(null);
  const [current_item_details, set_current_item_details] = useState<ItemDetails | null>(null);

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

      set_returned_items(all_items);
    } catch (err) {
      set_error(
        err instanceof Error ? err.message : 'Failed to load returned items'
      );
    } finally {
      set_loading(false);
    }
  };

  // Validate item before processing
  const validate_and_check_item = async (copy_id: number, method: MarkMethod) => {
    if (!selected_branch) return;

    set_processing(true);
    set_error(null);
    set_success(null);

    try {
      // Step 1: Validate Item ID - Check if item exists
      const item_response = await fetch(`${API_BASE_URL}/item-copies/${copy_id}`);

      if (!item_response.ok) {
        if (item_response.status === 404) {
          throw new Error('item not found or not ready for reshelving');
        }
        throw new Error('Failed to validate item');
      }

      const item_data = await item_response.json();
      const item = item_data.data || item_data;

      // Fetch library item details for title and type
      let item_title = `Item ${item.library_item_id}`;
      let item_type = 'Unknown';
      try {
        const library_item_response = await fetch(`${API_BASE_URL}/library-items/${item.library_item_id}`);
        if (library_item_response.ok) {
          const library_item_data = await library_item_response.json();
          const library_item = library_item_data.data || library_item_data;
          item_title = library_item.title;
          item_type = library_item.item_type;
        }
      } catch (e) {
        // Continue with default values
      }

      // Store item details for display in dialogs
      set_current_item_details({
        id: item.id,
        title: item_title,
        item_type: item_type,
        status: item.status,
        condition: item.condition || 'Unknown',
        owning_branch_id: item.owning_branch_id,
        branch_name: item.branch_name || selected_branch.branch_name,
      });

      // Step 2: Check Item Status
      if (item.status !== 'returned' && item.status !== 'damaged') {
        throw new Error('item not found or not ready for reshelving');
      }

      // Step 2.5: Read Transaction to verify item was properly returned
      try {
        const transactions_response = await fetch(`${API_BASE_URL}/transactions?status=Returned`);
        if (transactions_response.ok) {
          const transactions_data = await transactions_response.json();
          const transactions = transactions_data.data || transactions_data;

          // Check if there's a returned transaction for this copy
          const return_transaction = transactions.find((t: any) => t.copy_id === copy_id);

          if (!return_transaction && item.status === 'returned') {
            console.warn('[Reshelve] No return transaction found for copy', copy_id, 'but proceeding');
            // Log warning but allow reshelving as item may have been manually marked as returned
          }
        }
      } catch (e) {
        // Don't block reshelving if transaction fetch fails
        console.error('[Reshelve] Failed to verify transaction:', e);
      }

      // Step 3: Validate Item belongs to selected branch (home_branch_id = branch_id)
      if (item.owning_branch_id !== selected_branch.id) {
        throw new Error('item can only be reshelved at its home branch');
      }

      // Step 4: Check if item is damaged
      if (item.status === 'damaged') {
        // Show damaged warning dialog
        set_pending_item({ id: copy_id, method });
        set_show_damaged_warning(true);
        set_processing(false);
        return;
      }

      // Step 5: If status is returned, ask for confirmation
      if (item.status === 'returned') {
        // Show repair confirmation dialog
        set_pending_item({ id: copy_id, method });
        set_show_repair_dialog(true);
        set_processing(false);
        return;
      }

    } catch (err) {
      set_error(
        err instanceof Error ? err.message : 'Failed to validate item'
      );
      set_processing(false);
    }
  };

  // Proceed to reshelve after confirmation
  const proceed_to_reshelve = async () => {
    if (!pending_item || !selected_branch) return;

    // Close dialogs
    set_show_repair_dialog(false);
    set_show_damaged_warning(false);

    set_processing(true);
    set_error(null);
    set_success(null);

    try {
      // Call Reshelve API: POST /transactions/reshelve
      const response = await fetch(`${API_BASE_URL}/transactions/reshelve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          copy_id: pending_item.id,
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

      // Success!
      set_success(`item marked as available`);
      set_last_reshelved_item(pending_item.id);

      // Clear input if it was manual entry
      if (pending_item.method === 'manual') {
        set_item_id_input('');
      }

      // Clear pending item and details
      set_pending_item(null);
      set_current_item_details(null);

      // Refresh the list
      await fetch_returned_items();

      // Clear success message and undo option after 10 seconds
      setTimeout(() => {
        set_success(null);
        set_last_reshelved_item(null);
      }, 10000);
    } catch (err) {
      set_error(
        err instanceof Error ? err.message : 'Failed to mark item as available'
      );
    } finally {
      set_processing(false);
    }
  };

  // Undo last reshelve operation
  const handle_undo = async () => {
    if (!last_reshelved_item) return;

    set_processing(true);
    set_error(null);

    try {
      // Revert item back to "returned" status
      const response = await fetch(`${API_BASE_URL}/item-copies/${last_reshelved_item}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'returned',
        }),
      });

      if (!response.ok) {
        const error_data = await response.json();
        throw new Error(error_data.message || 'Failed to undo reshelve');
      }

      // Clear success message and last reshelved item
      set_success(null);
      set_last_reshelved_item(null);

      // Show undo confirmation
      set_success(`Undo successful - item returned to reshelve list`);
      setTimeout(() => set_success(null), 3000);

      // Refresh the list to show the item again
      await fetch_returned_items();
    } catch (err) {
      set_error(
        err instanceof Error ? err.message : 'Failed to undo reshelve operation'
      );
    } finally {
      set_processing(false);
    }
  };

  // Cancel operation
  const cancel_operation = () => {
    set_show_repair_dialog(false);
    set_show_damaged_warning(false);
    set_pending_item(null);
    set_current_item_details(null);
    set_processing(false);
  };

  // Mark item by manual ID entry
  const mark_available_by_id = async () => {
    if (!item_id_input.trim() || !selected_branch) return;

    const copy_id = parseInt(item_id_input);
    if (isNaN(copy_id)) {
      set_error('Invalid Item ID: Please enter a valid numeric ID');
      return;
    }

    await validate_and_check_item(copy_id, 'manual');
  };

  // Mark single item from list
  const mark_available_from_list = async (copy_id: number) => {
    if (!selected_branch) return;
    await validate_and_check_item(copy_id, 'list');
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
        <Alert severity="warning" icon={<Warning />}>
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
          Mark Items as Available (Reshelve Process)
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
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => set_error(null)} icon={<ErrorOutline />}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 3 }}
          onClose={() => {
            set_success(null);
            set_last_reshelved_item(null);
          }}
          icon={<CheckCircle />}
          action={
            last_reshelved_item && (
              <Button color="inherit" size="small" onClick={handle_undo} disabled={processing}>
                Undo
              </Button>
            )
          }
        >
          {success}
        </Alert>
      )}

      {/* Manual ID Entry */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Option 1: Manual Entry - Scan Item ID
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Enter or scan the item copy ID to mark it as available
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
            {processing ? 'Processing...' : 'Mark Available'}
          </Button>
        </Box>
      </Paper>

      <Divider sx={{ my: 3 }}>OR</Divider>

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
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Option 2: Select from List
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Items with status "returned" or "damaged" ready for reshelving ({returned_items.length})
            </Typography>
          </Box>
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
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Copy ID</strong></TableCell>
                  <TableCell><strong>Title</strong></TableCell>
                  <TableCell><strong>Type</strong></TableCell>
                  <TableCell><strong>Condition</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell align="right"><strong>Action</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {returned_items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.id}</TableCell>
                    <TableCell>{item.title || `Item ${item.id}`}</TableCell>
                    <TableCell>
                      <Chip label={item.item_type} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.condition || 'Unknown'}
                        size="small"
                        color={get_condition_color(item.condition)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {item.status === 'damaged' ? (
                        <Chip
                          label="DAMAGED - REPAIRED"
                          color="error"
                          size="small"
                          icon={<Warning />}
                        />
                      ) : (
                        <Chip
                          label="Returned"
                          color="warning"
                          size="small"
                        />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant="contained"
                        color="success"
                        onClick={() => mark_available_from_list(item.id)}
                        disabled={processing}
                        startIcon={<CheckCircle />}
                        size="small"
                      >
                        Mark Available
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Repair Confirmation Dialog (for returned items) */}
      <Dialog
        open={show_repair_dialog}
        onClose={cancel_operation}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircle color="primary" />
          Confirm Item Repaired?
        </DialogTitle>
        <DialogContent>
          {current_item_details && (
            <Paper elevation={0} sx={{ bgcolor: 'background.default', p: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                ITEM DESCRIPTION
              </Typography>
              <Typography variant="h6" fontWeight="600" gutterBottom>
                {current_item_details.title}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Copy ID: <strong>{current_item_details.id}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Type: <strong>{current_item_details.item_type}</strong>
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Condition: <Chip label={current_item_details.condition} size="small" color={get_condition_color(current_item_details.condition)} variant="outlined" />
              </Typography>
            </Paper>
          )}
          <DialogContentText>
            Has this item been inspected and confirmed to be in good condition?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancel_operation} color="inherit">
            No
          </Button>
          <Button onClick={proceed_to_reshelve} variant="contained" color="success" autoFocus>
            Yes, Proceed to Reshelve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Damaged Warning Dialog */}
      <Dialog
        open={show_damaged_warning}
        onClose={cancel_operation}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="warning" />
          DAMAGED - REPAIRED
        </DialogTitle>
        <DialogContent>
          {current_item_details && (
            <Paper elevation={0} sx={{ bgcolor: 'background.default', p: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                ITEM DESCRIPTION
              </Typography>
              <Typography variant="h6" fontWeight="600" gutterBottom>
                {current_item_details.title}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Copy ID: <strong>{current_item_details.id}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Type: <strong>{current_item_details.item_type}</strong>
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Condition: <Chip label={current_item_details.condition} size="small" color={get_condition_color(current_item_details.condition)} variant="outlined" />
              </Typography>
              <Chip label="DAMAGED" color="error" size="small" icon={<Warning />} sx={{ mt: 1 }} />
            </Paper>
          )}
          <Alert severity="warning" sx={{ mb: 2 }}>
            <AlertTitle>Warning</AlertTitle>
            Only mark available after repair
          </Alert>
          <DialogContentText sx={{ fontWeight: 'bold', mb: 2 }}>
            Confirm item Repaired?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancel_operation} color="inherit">
            No
          </Button>
          <Button onClick={proceed_to_reshelve} variant="contained" color="warning">
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
