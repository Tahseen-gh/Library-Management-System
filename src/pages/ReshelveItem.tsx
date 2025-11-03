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
} from '@mui/material';
import { BookmarkAdd } from '@mui/icons-material';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

export const ReshelveItem: React.FC = () => {
  const [item_id_input, set_item_id_input] = useState<string>('');

  const [step, set_step] = useState<'input' | 'confirm' | 'complete'>('input');
  const [item_info, set_item_info] = useState<any>(null);

  const [processing, set_processing] = useState(false);
  const [error, set_error] = useState<string | null>(null);
  const [success, set_success] = useState<string | null>(null);

  // Step 1: Verify Item
  const verify_item = async () => {
    if (!item_id_input.trim()) {
      set_error('Please enter an Item ID');
      return;
    }

    set_processing(true);
    set_error(null);

    try {
      // Check if item exists
      const response = await fetch(`${API_BASE_URL}/item-copies/${item_id_input}`);

      if (!response.ok) {
        throw new Error('Item not found');
      }

      const item_data = await response.json();
      const item = item_data.data || item_data;

      // Check if item is in 'returned' status
      if (item.status !== 'returned') {
        set_error(`Item cannot be reshelved. Current status: ${item.status}. Only items with 'returned' status can be reshelved.`);
        set_processing(false);
        return;
      }

      set_item_info(item);
      set_step('confirm');
    } catch (err) {
      set_error('Item not found. Please verify the ID.');
    } finally {
      set_processing(false);
    }
  };

  // Step 2: Process Reshelve
  const process_reshelve = async () => {
    set_processing(true);
    set_error(null);

    try {
      const response = await fetch(`${API_BASE_URL}/transactions/reshelve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          copy_id: item_id_input,
        }),
      });

      if (!response.ok) {
        const error_data = await response.json();
        throw new Error(error_data.error || 'Reshelve failed');
      }

      const result = await response.json();
      set_success('Item reshelved successfully!');
      set_step('complete');
    } catch (err) {
      set_error(err instanceof Error ? err.message : 'Failed to reshelve item');
    } finally {
      set_processing(false);
    }
  };

  const handle_reset = () => {
    set_item_id_input('');
    set_step('input');
    set_item_info(null);
    set_error(null);
    set_success(null);
  };

  return (
    <Container
      maxWidth="md"
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
        <BookmarkAdd color="primary" fontSize="large" />
        Reshelve Item
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => set_error(null)}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <AlertTitle>Success!</AlertTitle>
          {success}
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 4, flex: 1 }}>
        {/* STEP: Input Item ID */}
        {step === 'input' && (
          <Box>
            <Typography variant="h5" gutterBottom fontWeight="bold">
              Enter Item ID
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Enter the ID of the item to reshelve. Item must be in 'returned' status.
            </Typography>

            <TextField
              fullWidth
              label="Item Copy ID"
              value={item_id_input}
              onChange={(e) => set_item_id_input(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && item_id_input) {
                  verify_item();
                }
              }}
              placeholder="Enter item copy ID"
              autoFocus
              disabled={processing}
              sx={{ mb: 3 }}
            />

            <Button
              fullWidth
              variant="contained"
              onClick={verify_item}
              disabled={!item_id_input || processing}
              startIcon={processing ? <CircularProgress size={20} /> : null}
              size="large"
            >
              {processing ? 'Verifying...' : 'Verify Item'}
            </Button>

            <Box sx={{ mt: 3, p: 2, bgcolor: 'info.50', borderRadius: 1, border: '1px solid', borderColor: 'info.main' }}>
              <Typography variant="body2" display="block" gutterBottom fontWeight="bold" color="info.main">
                Reshelve Process:
              </Typography>
              <Typography variant="body2" display="block" color="text.primary">1. Verify item is in 'returned' status</Typography>
              <Typography variant="body2" display="block" color="text.primary">2. Change status to 'available'</Typography>
              <Typography variant="body2" display="block" color="text.primary">3. Item can now be checked out again</Typography>
            </Box>
          </Box>
        )}

        {/* STEP: Confirm Reshelve */}
        {step === 'confirm' && item_info && (
          <Box>
            <Typography variant="h5" gutterBottom fontWeight="bold" textAlign="center" color="primary">
              Confirm Reshelve
            </Typography>

            <Box sx={{ mt: 3, p: 3, bgcolor: 'primary.50', borderRadius: 2, border: '2px solid', borderColor: 'primary.main' }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                ITEM INFORMATION
              </Typography>
              <Typography variant="body1">Item ID: {item_info.id}</Typography>
              <Typography variant="body1">Title: {item_info.title || 'N/A'}</Typography>
              <Typography variant="body1">Type: {item_info.item_type}</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Current Status: <Chip label={item_info.status} color="warning" size="small" />
              </Typography>

              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="body2" gutterBottom fontWeight="bold">
                  Action:
                </Typography>
                <Typography variant="body2">This item will be marked as 'available' and can be checked out again.</Typography>
              </Box>
            </Box>

            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={process_reshelve}
              disabled={processing}
              startIcon={processing ? <CircularProgress size={20} /> : null}
              size="large"
              sx={{ mt: 3 }}
            >
              {processing ? 'Processing...' : 'Confirm Reshelve'}
            </Button>

            <Button
              fullWidth
              variant="outlined"
              onClick={() => set_step('input')}
              disabled={processing}
              sx={{ mt: 2 }}
            >
              Back
            </Button>
          </Box>
        )}

        {/* STEP: Complete */}
        {step === 'complete' && (
          <Box>
            <Typography variant="h5" gutterBottom fontWeight="bold" textAlign="center" color="success.main">
              Reshelve Complete!
            </Typography>

            <Box sx={{ mt: 3, p: 3, bgcolor: 'success.50', borderRadius: 2, border: '2px solid', borderColor: 'success.main' }}>
              <Typography variant="body1" gutterBottom fontWeight="bold">
                Item ID: {item_id_input}
              </Typography>
              <Typography variant="body1">
                Status: <Chip label="Available" color="success" size="small" />
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                The item has been reshelved and is now available for checkout.
              </Typography>
            </Box>

            <Button
              fullWidth
              variant="contained"
              onClick={handle_reset}
              size="large"
              sx={{ mt: 3 }}
            >
              Reshelve Another Item
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};
