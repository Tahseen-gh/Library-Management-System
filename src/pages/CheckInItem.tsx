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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import { AssignmentTurnedIn } from '@mui/icons-material';
import type { SelectChangeEvent } from '@mui/material/Select';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

const conditions = ['New', 'Excellent', 'Good', 'Fair', 'Poor'];

const get_condition_color = (condition: string) => {
  switch (condition) {
    case 'New':
    case 'Excellent':
      return 'success';
    case 'Good':
      return 'info';
    case 'Fair':
      return 'warning';
    case 'Poor':
      return 'error';
    default:
      return 'default';
  }
};

export const CheckInItem: React.FC = () => {
  const [item_id_input, set_item_id_input] = useState<string>('');
  const [condition, set_condition] = useState<string>('Excellent');
  const [notes, set_notes] = useState<string>('');
  
  const [step, set_step] = useState<'input' | 'confirm' | 'complete'>('input');
  const [item_verified, set_item_verified] = useState(false);
  
  const [processing, set_processing] = useState(false);
  const [error, set_error] = useState<string | null>(null);
  const [return_result, set_return_result] = useState<{
    fine_amount: number;
    days_overdue: number;
  } | null>(null);

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

      // Check if item is currently checked out
      if (item.status !== 'borrowed') {
        set_error(`Item is not checked out. Current status: ${item.status}`);
        return;
      }

      set_item_verified(true);
      set_step('confirm');
    } catch (err) {
      set_error('Item not found or not checked out. Please verify the ID.');
    } finally {
      set_processing(false);
    }
  };

  // Step 2: Process Return
  const process_return = async () => {
    set_processing(true);
    set_error(null);

    try {
      const response = await fetch(`${API_BASE_URL}/transactions/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          copy_id: item_id_input,
          new_condition: condition,
          notes: notes || undefined,
        }),
      });

      if (!response.ok) {
        const error_data = await response.json();
        throw new Error(error_data.message || 'Return failed');
      }

      const result = await response.json();
      const data = result.data || result;
      
      set_return_result({
        fine_amount: data.fine_amount || 0,
        days_overdue: data.days_overdue || 0,
      });
      
      set_step('complete');
    } catch (err) {
      set_error(err instanceof Error ? err.message : 'Failed to process return');
    } finally {
      set_processing(false);
    }
  };

  const handle_reset = () => {
    set_item_id_input('');
    set_condition('Excellent');
    set_notes('');
    set_step('input');
    set_item_verified(false);
    set_error(null);
    set_return_result(null);
  };

  const handle_condition_change = (event: SelectChangeEvent) => {
    set_condition(event.target.value);
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
        <AssignmentTurnedIn color="primary" fontSize="large" />
        Check In Item
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => set_error(null)}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 4, flex: 1 }}>
        {/* STEP: Input Item ID */}
        {step === 'input' && (
          <Box>
            <Typography variant="h5" gutterBottom fontWeight="bold">
              Return Item
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Enter the item's copy ID to process the return.
            </Typography>

            <TextField
              fullWidth
              label="Item ID"
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
              {processing ? 'Verifying...' : 'Verify'}
            </Button>

            <Box sx={{ mt: 3, p: 2, bgcolor: 'info.50', borderRadius: 1, border: '1px solid', borderColor: 'info.main' }}>
              <Typography variant="body2" display="block" gutterBottom fontWeight="bold" color="info.main">
                Actions:
              </Typography>
              <Typography variant="body2" display="block" color="text.primary">• Check if item exists</Typography>
              <Typography variant="body2" display="block" color="text.primary">• Retrieve patron account</Typography>
              <Typography variant="body2" display="block" color="text.primary">• Get due date for item</Typography>
            </Box>
          </Box>
        )}

        {/* STEP: Confirm Details */}
        {step === 'confirm' && item_verified && (
          <Box>
            <Typography variant="h5" gutterBottom fontWeight="bold">
              Process Return
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Confirm item details before completing the return.
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2" fontWeight="bold">
                Item ID: {item_id_input}
              </Typography>
            </Alert>

            <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, mb: 3, border: '1px solid', borderColor: 'grey.300' }}>
              <Typography variant="body2" fontWeight="bold" gutterBottom color="text.primary">
                Processing Steps:
              </Typography>
              <Typography variant="body2" color="text.primary">1. Retrieve due date</Typography>
              <Typography variant="body2" color="text.primary">2. Compare with current date</Typography>
              <Typography variant="body2" color="text.primary">3. Determine if overdue</Typography>
              <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.50', borderRadius: 1, border: '1px solid', borderColor: 'warning.main' }}>
                <Typography variant="body2" fontWeight="bold" gutterBottom color="warning.dark">
                  If Late:
                </Typography>
                <Typography variant="body2" color="text.primary">• Calculate fee amount</Typography>
                <Typography variant="body2" color="text.primary">• Apply fee to patron</Typography>
                <Typography variant="caption" display="block" sx={{ mt: 1 }} color="text.secondary">
                  Fee determined by days late ($0.50/day)
                </Typography>
              </Box>
            </Box>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Item Condition</InputLabel>
              <Select
                value={condition}
                label="Item Condition"
                onChange={handle_condition_change}
              >
                {conditions.map((c) => (
                  <MenuItem key={c} value={c}>
                    <Chip
                      label={c}
                      color={get_condition_color(c)}
                      variant="outlined"
                      size="small"
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Notes (Optional)"
              multiline
              rows={3}
              value={notes}
              onChange={(e) => set_notes(e.target.value)}
              placeholder="Add any notes about the item condition..."
              sx={{ mb: 3 }}
            />

            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={process_return}
              disabled={processing}
              startIcon={processing ? <CircularProgress size={20} /> : null}
              size="large"
            >
              {processing ? 'Processing...' : 'Complete Return'}
            </Button>
          </Box>
        )}

        {/* STEP: Complete */}
        {step === 'complete' && return_result && (
          <Box>
            <Typography variant="h5" gutterBottom fontWeight="bold" textAlign="center" color="success.main">
              Return Complete
            </Typography>

            <Box sx={{ mt: 3, p: 3, bgcolor: 'success.50', borderRadius: 2, border: '2px solid', borderColor: 'success.main' }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Actions Completed:
              </Typography>

              <Box sx={{ my: 2 }}>
                <Typography variant="body1" gutterBottom>
                  ✓ Remove item from patron account
                </Typography>
                <Typography variant="body1" gutterBottom>
                  ✓ Update item status to "available"
                </Typography>
                <Typography variant="body1" gutterBottom>
                  ✓ Display confirmation
                </Typography>
              </Box>

              {return_result.days_overdue > 0 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <AlertTitle>Late Return - Fee Applied</AlertTitle>
                  <Typography variant="body2">
                    Days Overdue: {return_result.days_overdue}
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    Fine Amount: ${return_result.fine_amount.toFixed(2)}
                  </Typography>
                </Alert>
              )}

              {return_result.days_overdue === 0 && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  <AlertTitle>On Time Return</AlertTitle>
                  <Typography variant="body2">
                    No late fees applied.
                  </Typography>
                </Alert>
              )}
            </Box>

            <Button
              fullWidth
              variant="contained"
              onClick={handle_reset}
              size="large"
              sx={{ mt: 3 }}
            >
              Process Another Return
            </Button>
          </Box>
        )}

        {/* Navigation Buttons */}
        {step !== 'complete' && (
          <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
            {step === 'confirm' && (
              <Button
                variant="outlined"
                onClick={() => {
                  set_step('input');
                  set_item_verified(false);
                }}
                disabled={processing}
              >
                Back
              </Button>
            )}
            <Box sx={{ flex: 1 }} />
            <Button
              variant="outlined"
              onClick={handle_reset}
              disabled={processing}
            >
              Reset
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};
