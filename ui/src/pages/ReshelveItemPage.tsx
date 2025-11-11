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
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
} from '@mui/material';
import { LibraryBooks, Undo, CheckCircle } from '@mui/icons-material';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

interface ReturnedItem {
  id: number;
  title: string;
  item_type: string;
  branch_name: string;
  status: string;
  reshelved?: boolean;
}

export const ReshelveItemPage: React.FC = () => {
  const [item_id_input, set_item_id_input] = useState<string>('');
  const [returned_items, set_returned_items] = useState<ReturnedItem[]>([]);
  const [loading, set_loading] = useState(false);
  const [reshelving, set_reshelving] = useState<number | null>(null);
  const [undoing, set_undoing] = useState<number | null>(null);

  const [error, set_error] = useState<string | null>(null);
  const [success, set_success] = useState<string | null>(null);

  // Fetch all returned items
  const fetch_returned_items = async () => {
    set_loading(true);
    set_error(null);
    try {
      const response = await fetch(`${API_BASE_URL}/item-copies?status=returned`);
      if (!response.ok) {
        throw new Error('Failed to fetch returned items');
      }
      const data = await response.json();
      set_returned_items((data.data || data).map((item: any) => ({
        ...item,
        reshelved: false,
      })));
    } catch (err) {
      set_error(err instanceof Error ? err.message : 'Failed to load items');
    } finally {
      set_loading(false);
    }
  };

  // Reshelve a single item by ID
  const reshelve_by_id = async () => {
    if (!item_id_input.trim()) {
      set_error('Please enter an Item ID');
      return;
    }

    set_reshelving(parseInt(item_id_input));
    set_error(null);
    set_success(null);

    try {
      // Get item details first
      const item_response = await fetch(`${API_BASE_URL}/item-copies/${item_id_input}`);
      if (!item_response.ok) {
        throw new Error('Item not found');
      }
      const item_data = await item_response.json();
      const item = item_data.data || item_data;

      if (item.status !== 'returned') {
        throw new Error(`Item status is "${item.status}", not "returned". Cannot reshelve.`);
      }

      // Update status to available
      const update_response = await fetch(
        `${API_BASE_URL}/item-copies/${item_id_input}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'Available',
          }),
        }
      );

      if (!update_response.ok) {
        throw new Error('Failed to reshelve item');
      }

      set_success(`Item ${item_id_input} has been reshelved and is now available!`);
      set_item_id_input('');
      // Refresh list if showing
      if (returned_items.length > 0) {
        fetch_returned_items();
      }
    } catch (err) {
      set_error(err instanceof Error ? err.message : 'Failed to reshelve item');
    } finally {
      set_reshelving(null);
    }
  };

  // Reshelve from list
  const reshelve_item = async (item_id: number) => {
    set_reshelving(item_id);
    set_error(null);
    try {
      const response = await fetch(`${API_BASE_URL}/item-copies/${item_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'Available',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reshelve item');
      }

      // Mark as reshelved in local state
      set_returned_items((prev) =>
        prev.map((item) =>
          item.id === item_id ? { ...item, reshelved: true } : item
        )
      );
      set_success(`Item ${item_id} has been reshelved!`);
    } catch (err) {
      set_error(err instanceof Error ? err.message : 'Failed to reshelve');
    } finally {
      set_reshelving(null);
    }
  };

  // Undo reshelve
  const undo_reshelve = async (item_id: number) => {
    set_undoing(item_id);
    set_error(null);
    try {
      const response = await fetch(`${API_BASE_URL}/item-copies/${item_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'returned',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to undo reshelve');
      }

      // Mark as not reshelved
      set_returned_items((prev) =>
        prev.map((item) =>
          item.id === item_id ? { ...item, reshelved: false } : item
        )
      );
      set_success(`Reshelve undone for item ${item_id}`);
    } catch (err) {
      set_error(err instanceof Error ? err.message : 'Failed to undo');
    } finally {
      set_undoing(null);
    }
  };

  return (
    <Container
      maxWidth="xl"
      sx={{
        py: 4,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography
        variant="h3"
        component="h1"
        gutterBottom
        sx={{
          fontWeight: 'bold',
          mb: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <LibraryBooks color="primary" fontSize="large" />
        Reshelve Item
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => set_error(null)}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => set_success(null)}>
          <AlertTitle>Success!</AlertTitle>
          {success}
        </Alert>
      )}

      {/* Option 1: Reshelve by Item ID */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Option 1: Reshelve by Item ID
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Enter the item copy ID to mark it as available and ready for checkout.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <TextField
            label="Item Copy ID"
            value={item_id_input}
            onChange={(e) => set_item_id_input(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && item_id_input) {
                reshelve_by_id();
              }
            }}
            placeholder="Enter item copy ID"
            disabled={reshelving !== null}
            size="medium"
            sx={{ flexGrow: 1 }}
          />
          <Button
            variant="contained"
            onClick={reshelve_by_id}
            disabled={!item_id_input || reshelving !== null}
            startIcon={reshelving !== null ? <CircularProgress size={20} /> : <CheckCircle />}
            size="large"
          >
            {reshelving !== null ? 'Reshelving...' : 'Reshelve'}
          </Button>
        </Box>
      </Paper>

      <Divider sx={{ my: 3 }}>OR</Divider>

      {/* Option 2: Show List of Returned Items */}
      <Paper elevation={3} sx={{ p: 3, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Option 2: Returned Items Needing Reshelving
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Items that have been returned but not yet reshelved
            </Typography>
          </Box>
          <Button
            variant="outlined"
            onClick={fetch_returned_items}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <LibraryBooks />}
          >
            {loading ? 'Loading...' : 'Load Returned Items'}
          </Button>
        </Box>

        {returned_items.length > 0 && (
          <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Copy ID</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Branch</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {returned_items.map((item) => (
                  <TableRow
                    key={item.id}
                    sx={{
                      backgroundColor: item.reshelved ? 'success.50' : 'inherit',
                    }}
                  >
                    <TableCell>{item.id}</TableCell>
                    <TableCell>{item.title}</TableCell>
                    <TableCell>
                      <Chip label={item.item_type} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{item.branch_name}</TableCell>
                    <TableCell>
                      <Chip
                        label={item.reshelved ? 'Available' : 'Returned'}
                        size="small"
                        color={item.reshelved ? 'success' : 'warning'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {item.reshelved ? (
                        <IconButton
                          onClick={() => undo_reshelve(item.id)}
                          disabled={undoing === item.id}
                          color="warning"
                          title="Undo Reshelve"
                        >
                          {undoing === item.id ? (
                            <CircularProgress size={20} />
                          ) : (
                            <Undo />
                          )}
                        </IconButton>
                      ) : (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => reshelve_item(item.id)}
                          disabled={reshelving === item.id}
                          startIcon={
                            reshelving === item.id ? (
                              <CircularProgress size={16} />
                            ) : (
                              <CheckCircle />
                            )
                          }
                        >
                          Reshelve
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {returned_items.length === 0 && !loading && (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              py: 8,
            }}
          >
            <Typography variant="body1" color="text.secondary">
              Click "Load Returned Items" to see items that need reshelving
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};
