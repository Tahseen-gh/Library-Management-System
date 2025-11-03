import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Alert,
  AlertTitle,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import { LibraryAdd, AssignmentTurnedIn } from '@mui/icons-material';
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

export const Home = () => {
  // Checkout state
  const [checkout_step, set_checkout_step] = useState(0);
  const [patron_id_input, set_patron_id_input] = useState('');
  const [item_id_input, set_item_id_input] = useState('');
  const [patron_eligibility, set_patron_eligibility] = useState<any>(null);
  const [item_info, set_item_info] = useState<any>(null);
  const [checking_patron, set_checking_patron] = useState(false);
  const [checking_item, set_checking_item] = useState(false);
  const [processing_checkout, set_processing_checkout] = useState(false);
  const [checkout_error, set_checkout_error] = useState<string | null>(null);
  const [checkout_success, set_checkout_success] = useState<string | null>(null);
  const [receipt_data, set_receipt_data] = useState<any>(null);

  // Check-in state
  const [checkin_step, set_checkin_step] = useState<'input' | 'confirm' | 'complete'>('input');
  const [checkin_item_id, set_checkin_item_id] = useState('');
  const [checkin_condition, set_checkin_condition] = useState('Excellent');
  const [checkin_notes, set_checkin_notes] = useState('');
  const [checkin_processing, set_checkin_processing] = useState(false);
  const [checkin_error, set_checkin_error] = useState<string | null>(null);
  const [checkin_result, set_checkin_result] = useState<any>(null);

  // Checkout functions
  const check_patron_eligibility = async () => {
    if (!patron_id_input.trim()) {
      set_checkout_error('Please enter a Patron ID');
      return;
    }

    set_checking_patron(true);
    set_checkout_error(null);

    try {
      const response = await fetch(`${API_BASE_URL}/patrons/${patron_id_input}/checkout-eligibility`);
      const data = await response.json();

      set_patron_eligibility(data);

      if (data.eligible) {
        set_checkout_step(1);
      } else {
        set_checkout_error(data.message || 'Patron is not eligible for checkout');
      }
    } catch (err) {
      set_checkout_error('Failed to verify patron. Please check the ID and try again.');
      set_patron_eligibility(null);
    } finally {
      set_checking_patron(false);
    }
  };

  const check_item_availability = async () => {
    if (!item_id_input.trim()) {
      set_checkout_error('Please enter an Item ID');
      return;
    }

    set_checking_item(true);
    set_checkout_error(null);

    try {
      const response = await fetch(`${API_BASE_URL}/item-copies/${item_id_input}`);
      
      if (!response.ok) {
        throw new Error('Item not found');
      }

      const item_data = await response.json();
      const item = item_data.data || item_data;

      if (item.status !== 'available') {
        set_checkout_error(`Item is not available for checkout. Current status: ${item.status}`);
        set_item_info(null);
        return;
      }

      set_item_info(item);
      set_checkout_step(2);
    } catch (err) {
      set_checkout_error('Item not found. Please verify the ID and try again.');
      set_item_info(null);
    } finally {
      set_checking_item(false);
    }
  };

  const complete_checkout = async () => {
    if (!patron_eligibility?.patron_info?.id || !item_id_input) {
      set_checkout_error('Missing required information');
      return;
    }

    set_processing_checkout(true);
    set_checkout_error(null);

    try {
      const response = await fetch(`${API_BASE_URL}/transactions/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patron_id: patron_eligibility.patron_info.id,
          copy_id: item_id_input,
        }),
      });

      if (!response.ok) {
        const error_data = await response.json();
        throw new Error(error_data.message || 'Checkout failed');
      }

      const receipt = await response.json();
      
      // Store receipt data and move to step 3
      set_receipt_data({
        patron: patron_eligibility.patron_info,
        item: item_info,
        transaction: receipt,
        due_date: calculate_due_date(item_info.item_type),
        checkout_date: new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
      });
      
      set_checkout_step(3);
    } catch (err) {
      set_checkout_error(err instanceof Error ? err.message : 'Failed to complete checkout');
    } finally {
      set_processing_checkout(false);
    }
  };

  const reset_checkout = () => {
    set_checkout_step(0);
    set_patron_id_input('');
    set_item_id_input('');
    set_patron_eligibility(null);
    set_item_info(null);
    set_checkout_error(null);
    set_checkout_success(null);
    set_receipt_data(null);
  };

  const calculate_due_date = (item_type: string): string => {
    const today = new Date();
    let days = 14;

    switch (item_type.toUpperCase()) {
      case 'BOOK':
        days = 28;
        break;
      case 'VIDEO':
        days = 7;
        break;
      case 'AUDIOBOOK':
        days = 28;
        break;
    }

    const due_date = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
    return due_date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Check-in functions
  const verify_checkin_item = async () => {
    if (!checkin_item_id.trim()) {
      set_checkin_error('Please enter an Item ID');
      return;
    }

    set_checkin_processing(true);
    set_checkin_error(null);

    try {
      const response = await fetch(`${API_BASE_URL}/item-copies/${checkin_item_id}`);
      
      if (!response.ok) {
        throw new Error('Item not found');
      }

      const item_data = await response.json();
      const item = item_data.data || item_data;

      if (item.status !== 'borrowed') {
        set_checkin_error(`Item is not checked out. Current status: ${item.status}`);
        return;
      }

      set_checkin_step('confirm');
    } catch (err) {
      set_checkin_error('Item not found or not checked out. Please verify the ID.');
    } finally {
      set_checkin_processing(false);
    }
  };

  const process_checkin = async () => {
    set_checkin_processing(true);
    set_checkin_error(null);

    try {
      const response = await fetch(`${API_BASE_URL}/transactions/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          copy_id: checkin_item_id,
          new_condition: checkin_condition,
          notes: checkin_notes || undefined,
        }),
      });

      if (!response.ok) {
        const error_data = await response.json();
        throw new Error(error_data.message || 'Return failed');
      }

      const result = await response.json();
      const data = result.data || result;
      
      set_checkin_result({
        fine_amount: data.fine_amount || 0,
        days_overdue: data.days_overdue || 0,
      });
      
      set_checkin_step('complete');
    } catch (err) {
      set_checkin_error(err instanceof Error ? err.message : 'Failed to process return');
    } finally {
      set_checkin_processing(false);
    }
  };

  const reset_checkin = () => {
    set_checkin_item_id('');
    set_checkin_condition('Excellent');
    set_checkin_notes('');
    set_checkin_step('input');
    set_checkin_error(null);
    set_checkin_result(null);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
        Welcome!
      </Typography>

      {/* CHECKOUT SECTION */}
      <Paper elevation={3} sx={{ p: 4, mb: 6, bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <LibraryAdd color="primary" fontSize="large" />
          <Typography variant="h4" component="h2" fontWeight="bold">
            Check Out Item
          </Typography>
        </Box>

        {checkout_error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => set_checkout_error(null)}>
            <AlertTitle>Error</AlertTitle>
            {checkout_error}
          </Alert>
        )}

        {checkout_success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            <AlertTitle>Success!</AlertTitle>
            {checkout_success}
          </Alert>
        )}

        {checkout_step === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>Enter Patron ID</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Enter the patron's library card ID number to verify eligibility.
            </Typography>

            <TextField
              fullWidth
              label="Patron ID"
              value={patron_id_input}
              onChange={(e) => set_patron_id_input(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && patron_id_input) {
                  check_patron_eligibility();
                }
              }}
              disabled={checking_patron}
              sx={{ mb: 2 }}
            />

            <Button
              variant="contained"
              onClick={check_patron_eligibility}
              disabled={!patron_id_input || checking_patron}
              startIcon={checking_patron ? <CircularProgress size={20} /> : null}
            >
              {checking_patron ? 'Verifying...' : 'Check ID'}
            </Button>

            <Box sx={{ mt: 3, p: 2, bgcolor: 'info.50', borderRadius: 1, border: '1px solid', borderColor: 'info.main' }}>
              <Typography variant="body2" fontWeight="bold" color="info.main" gutterBottom>
                Validation Checks:
              </Typography>
              <Typography variant="body2" color="text.primary">• Card not expired</Typography>
              <Typography variant="body2" color="text.primary">• No fines owed</Typography>
              <Typography variant="body2" color="text.primary">• Less than 20 books checked out</Typography>
            </Box>
          </Box>
        )}

        {checkout_step === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>Enter Book ID</Typography>
            
            {patron_eligibility?.patron_info && (
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight="bold">
                  Patron: {patron_eligibility.patron_info.name}
                </Typography>
                <Typography variant="caption">
                  Active checkouts: {patron_eligibility.patron_info.active_checkouts}/20
                </Typography>
              </Alert>
            )}

            <TextField
              fullWidth
              label="Item ID"
              value={item_id_input}
              onChange={(e) => set_item_id_input(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && item_id_input) {
                  check_item_availability();
                }
              }}
              disabled={checking_item}
              sx={{ mb: 2 }}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="outlined" onClick={() => set_checkout_step(0)}>
                Back
              </Button>
              <Button
                variant="contained"
                onClick={check_item_availability}
                disabled={!item_id_input || checking_item}
                startIcon={checking_item ? <CircularProgress size={20} /> : null}
              >
                {checking_item ? 'Checking...' : 'Check Book'}
              </Button>
            </Box>
          </Box>
        )}

        {checkout_step === 2 && patron_eligibility?.patron_info && item_info && (
          <Box>
            <Typography variant="h6" gutterBottom color="success.main">
              Checkout Confirmation
            </Typography>

            <Box sx={{ p: 3, bgcolor: 'success.50', borderRadius: 2, border: '2px solid', borderColor: 'success.main' }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                PATRON INFORMATION
              </Typography>
              <Typography variant="body2">Patron ID: {patron_eligibility.patron_info.id}</Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Name: {patron_eligibility.patron_info.name}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                BOOK INFORMATION
              </Typography>
              <Typography variant="body2">Title: {item_info.title || 'N/A'}</Typography>
              <Typography variant="body2">Type: {item_info.item_type}</Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>Status: {item_info.status}</Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                DUE DATE - Based on Item Type
              </Typography>
              <Typography variant="body1" fontWeight="bold" color="primary">
                Due Date: {calculate_due_date(item_info.item_type)}
              </Typography>

              <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1, border: '2px solid #333' }}>
                <Typography variant="body2" gutterBottom fontWeight="bold" sx={{ color: '#000000' }}>
                  Loan Duration Rules:
                </Typography>
                <Typography variant="body2" sx={{ color: '#000000' }}>• Books: 4 weeks</Typography>
                <Typography variant="body2" sx={{ color: '#000000' }}>• Movies: 1 week</Typography>
                <Typography variant="body2" sx={{ color: '#000000' }}>• Audiobooks: 4 weeks</Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button variant="outlined" onClick={() => set_checkout_step(1)}>
                Back
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={complete_checkout}
                disabled={processing_checkout}
                startIcon={processing_checkout ? <CircularProgress size={20} /> : null}
              >
                {processing_checkout ? 'Processing...' : 'Complete Checkout'}
              </Button>
              <Button variant="outlined" onClick={reset_checkout}>
                Reset
              </Button>
            </Box>
          </Box>
        )}

        {checkout_step === 3 && receipt_data && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <AssignmentTurnedIn color="success" />
              <Typography variant="h6" color="success.main">
                Checkout Receipt
              </Typography>
            </Box>

            <Box sx={{ p: 3, bgcolor: 'success.50', borderRadius: 2, border: '2px solid', borderColor: 'success.main', mb: 3 }}>
              <Typography variant="body1" fontWeight="bold" color="success.main" gutterBottom sx={{ mb: 2 }}>
                ✓ SUCCESS - Item Checked Out Successfully
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                PATRON INFORMATION
              </Typography>
              <Typography variant="body2" sx={{ ml: 1, mb: 1 }}>ID: {receipt_data.patron.id}</Typography>
              <Typography variant="body2" sx={{ ml: 1, mb: 2 }}>Name: {receipt_data.patron.name}</Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                ITEM INFORMATION
              </Typography>
              <Typography variant="body2" sx={{ ml: 1, mb: 1 }}>Title: {receipt_data.item.title || 'N/A'}</Typography>
              <Typography variant="body2" sx={{ ml: 1, mb: 1 }}>Type: {receipt_data.item.item_type}</Typography>
              <Typography variant="body2" sx={{ ml: 1, mb: 2 }}>Copy ID: {receipt_data.item.id}</Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                CHECKOUT DETAILS
              </Typography>
              <Typography variant="body2" sx={{ ml: 1, mb: 1 }}>Checkout Date: {receipt_data.checkout_date}</Typography>
              <Typography variant="body2" sx={{ ml: 1, mb: 1, color: 'error.main', fontWeight: 'bold' }}>Due Date: {receipt_data.due_date}</Typography>
              <Typography variant="caption" sx={{ ml: 1, display: 'block', color: 'text.secondary' }}>
                Please return by the due date to avoid late fees
              </Typography>

              <Box sx={{ mt: 3, p: 2, bgcolor: 'info.50', borderRadius: 1, border: '1px solid', borderColor: 'info.main' }}>
                <Typography variant="body2" fontWeight="bold" color="info.main" gutterBottom>
                  Next Steps:
                </Typography>
                <Typography variant="body2" color="text.primary">• Keep this receipt for your records</Typography>
                <Typography variant="body2" color="text.primary">• Return item by the due date</Typography>
                <Typography variant="body2" color="text.primary">• Contact staff if you need a renewal</Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={reset_checkout}
              >
                Complete New Checkout
              </Button>
              <Button
                variant="outlined"
                onClick={reset_checkout}
              >
                Done
              </Button>
            </Box>
          </Box>
        )}
      </Paper>

      <Divider sx={{ my: 6 }} />

      {/* CHECK-IN SECTION */}
      <Paper elevation={3} sx={{ p: 4, bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <AssignmentTurnedIn color="primary" fontSize="large" />
          <Typography variant="h4" component="h2" fontWeight="bold">
            Check In Item
          </Typography>
        </Box>

        {checkin_error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => set_checkin_error(null)}>
            <AlertTitle>Error</AlertTitle>
            {checkin_error}
          </Alert>
        )}

        {checkin_step === 'input' && (
          <Box>
            <Typography variant="h6" gutterBottom>Return Item</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Enter the item's copy ID to process the return.
            </Typography>

            <TextField
              fullWidth
              label="Item ID"
              value={checkin_item_id}
              onChange={(e) => set_checkin_item_id(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && checkin_item_id) {
                  verify_checkin_item();
                }
              }}
              disabled={checkin_processing}
              sx={{ mb: 2 }}
            />

            <Button
              variant="contained"
              onClick={verify_checkin_item}
              disabled={!checkin_item_id || checkin_processing}
              startIcon={checkin_processing ? <CircularProgress size={20} /> : null}
            >
              {checkin_processing ? 'Verifying...' : 'Verify'}
            </Button>

            <Box sx={{ mt: 3, p: 2, bgcolor: 'info.50', borderRadius: 1, border: '1px solid', borderColor: 'info.main' }}>
              <Typography variant="body2" fontWeight="bold" color="info.main" gutterBottom>
                Actions:
              </Typography>
              <Typography variant="body2" color="text.primary">• Check if item exists</Typography>
              <Typography variant="body2" color="text.primary">• Retrieve patron account</Typography>
              <Typography variant="body2" color="text.primary">• Get due date for item</Typography>
            </Box>
          </Box>
        )}

        {checkin_step === 'confirm' && (
          <Box>
            <Typography variant="h6" gutterBottom>Process Return</Typography>

            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight="bold">
                Item ID: {checkin_item_id}
              </Typography>
            </Alert>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Item Condition</InputLabel>
              <Select
                value={checkin_condition}
                label="Item Condition"
                onChange={(e: SelectChangeEvent) => set_checkin_condition(e.target.value)}
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
              value={checkin_notes}
              onChange={(e) => set_checkin_notes(e.target.value)}
              sx={{ mb: 2 }}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="outlined" onClick={() => set_checkin_step('input')}>
                Back
              </Button>
              <Button
                variant="contained"
                onClick={process_checkin}
                disabled={checkin_processing}
                startIcon={checkin_processing ? <CircularProgress size={20} /> : null}
              >
                {checkin_processing ? 'Processing...' : 'Complete Return'}
              </Button>
            </Box>
          </Box>
        )}

        {checkin_step === 'complete' && checkin_result && (
          <Box>
            <Typography variant="h6" gutterBottom color="success.main">
              Return Complete
            </Typography>

            <Box sx={{ p: 3, bgcolor: 'success.50', borderRadius: 2, border: '2px solid', borderColor: 'success.main' }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Actions Completed:
              </Typography>
              <Typography variant="body2" gutterBottom>✓ Remove item from patron account</Typography>
              <Typography variant="body2" gutterBottom>✓ Update item status to "available"</Typography>
              <Typography variant="body2" gutterBottom>✓ Display confirmation</Typography>

              {checkin_result.days_overdue > 0 ? (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <AlertTitle>Late Return - Fee Applied</AlertTitle>
                  <Typography variant="body2">Days Overdue: {checkin_result.days_overdue}</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    Fine Amount: ${checkin_result.fine_amount.toFixed(2)}
                  </Typography>
                </Alert>
              ) : (
                <Alert severity="success" sx={{ mt: 2 }}>
                  <AlertTitle>On Time Return</AlertTitle>
                  <Typography variant="body2">No late fees applied.</Typography>
                </Alert>
              )}
            </Box>

            <Button variant="contained" onClick={reset_checkin} sx={{ mt: 3 }}>
              Process Another Return
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};
