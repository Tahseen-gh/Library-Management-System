import React, { useState } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Alert,
  AlertTitle,
  Step,
  StepLabel,
  Stepper,
  Paper,
  TextField,
  CircularProgress,
  Divider,
} from '@mui/material';
import { LibraryAdd } from '@mui/icons-material';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

const steps = ['Enter Patron ID', 'Enter Book ID', 'Confirmation'];

interface PatronEligibility {
  eligible: boolean;
  reason?: string;
  message?: string;
  balance?: number;
  patron_info?: {
    id: string;
    name: string;
    active_checkouts: number;
    balance: number;
  };
}

interface ItemInfo {
  id: string;
  title: string;
  item_type: string;
  status: string;
  author?: string;
  director?: string;
  narrator?: string;
  library_item_id: string;
}

export const CheckOutItem: React.FC = () => {
  const [active_step, set_active_step] = useState(0);
  const [patron_id_input, set_patron_id_input] = useState<string>('');
  const [item_id_input, set_item_id_input] = useState<string>('');
  
  const [patron_eligibility, set_patron_eligibility] = useState<PatronEligibility | null>(null);
  const [item_info, set_item_info] = useState<ItemInfo | null>(null);
  
  const [checking_patron, set_checking_patron] = useState(false);
  const [checking_item, set_checking_item] = useState(false);
  const [processing_checkout, set_processing_checkout] = useState(false);
  
  const [error, set_error] = useState<string | null>(null);
  const [success, set_success] = useState<string | null>(null);

  // STEP 1: Check Patron ID
  const check_patron_eligibility = async () => {
    if (!patron_id_input.trim()) {
      set_error('Please enter a Patron ID');
      return;
    }

    set_checking_patron(true);
    set_error(null);

    try {
      const response = await fetch(`${API_BASE_URL}/patrons/${patron_id_input}/checkout-eligibility`);
      const data = await response.json();

      set_patron_eligibility(data);

      if (data.eligible) {
        // Move to next step
        set_active_step(1);
      } else {
        set_error(data.message || 'Patron is not eligible for checkout');
      }
    } catch (err) {
      set_error('Failed to verify patron. Please check the ID and try again.');
      set_patron_eligibility(null);
    } finally {
      set_checking_patron(false);
    }
  };

  // STEP 2: Check Book/Item ID
  const check_item_availability = async () => {
    if (!item_id_input.trim()) {
      set_error('Please enter an Item ID');
      return;
    }

    set_checking_item(true);
    set_error(null);

    try {
      const response = await fetch(`${API_BASE_URL}/item-copies/${item_id_input}`);
      
      if (!response.ok) {
        throw new Error('Item not found');
      }

      const item_data = await response.json();
      const item = item_data.data || item_data;

      // Check if item is available
      if (item.status !== 'available') {
        set_error(`Item is not available for checkout. Current status: ${item.status}`);
        set_item_info(null);
        return;
      }

      set_item_info(item);
      set_active_step(2);
    } catch (err) {
      set_error('Item not found. Please verify the ID and try again.');
      set_item_info(null);
    } finally {
      set_checking_item(false);
    }
  };

  // STEP 3: Complete Checkout
  const complete_checkout = async () => {
    if (!patron_eligibility?.patron_info?.id || !item_id_input) {
      set_error('Missing required information');
      return;
    }

    set_processing_checkout(true);
    set_error(null);

    try {
      const response = await fetch(`${API_BASE_URL}/transactions/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patron_id: patron_eligibility.patron_info.id,
          copy_id: item_id_input,
        }),
      });

      if (!response.ok) {
        const error_data = await response.json();
        throw new Error(error_data.message || 'Checkout failed');
      }

      const result = await response.json();
      set_success('Item checked out successfully!');
      
      // Reset form after 2 seconds
      setTimeout(() => {
        handle_reset();
      }, 2000);
    } catch (err) {
      set_error(err instanceof Error ? err.message : 'Failed to complete checkout');
    } finally {
      set_processing_checkout(false);
    }
  };

  const handle_back = () => {
    set_error(null);
    if (active_step === 1) {
      set_item_id_input('');
      set_item_info(null);
    }
    set_active_step((prev) => prev - 1);
  };

  const handle_reset = () => {
    set_active_step(0);
    set_patron_id_input('');
    set_item_id_input('');
    set_patron_eligibility(null);
    set_item_info(null);
    set_error(null);
    set_success(null);
  };

  const calculate_due_date = (item_type: string): string => {
    const today = new Date();
    let days = 14; // default

    switch (item_type.toUpperCase()) {
      case 'BOOK':
        days = 28; // 4 weeks
        break;
      case 'VIDEO':
        days = 7; // 1 week
        break;
      case 'NEW_VIDEO':
        days = 3; // 3 days for new movies
        break;
    }

    const due_date = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
    return due_date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
        <LibraryAdd color="primary" fontSize="large" />
        Check Out Item
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

      <Stepper activeStep={active_step} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper elevation={3} sx={{ p: 4, flex: 1 }}>
        {/* STEP 0: Enter Patron ID */}
        {active_step === 0 && (
          <Box>
            <Typography variant="h5" gutterBottom fontWeight="bold">
              Enter Patron ID
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
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
              placeholder="Enter patron ID"
              autoFocus
              disabled={checking_patron}
              sx={{ mb: 3 }}
            />

            <Button
              fullWidth
              variant="contained"
              onClick={check_patron_eligibility}
              disabled={!patron_id_input || checking_patron}
              startIcon={checking_patron ? <CircularProgress size={20} /> : null}
              size="large"
            >
              {checking_patron ? 'Verifying...' : 'Check ID'}
            </Button>

            <Box sx={{ mt: 3, p: 2, bgcolor: 'info.50', borderRadius: 1, border: '1px solid', borderColor: 'info.main' }}>
              <Typography variant="body2" display="block" gutterBottom fontWeight="bold" color="info.main">
                Validation Checks:
              </Typography>
              <Typography variant="body2" display="block" color="text.primary">• Card not expired</Typography>
              <Typography variant="body2" display="block" color="text.primary">• No fines owed</Typography>
              <Typography variant="body2" display="block" color="text.primary">• Less than 20 books checked out</Typography>
            </Box>
          </Box>
        )}

        {/* STEP 1: Enter Book ID */}
        {active_step === 1 && (
          <Box>
            <Typography variant="h5" gutterBottom fontWeight="bold">
              Enter Book ID
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Enter the item's copy ID to check availability.
            </Typography>

            {patron_eligibility?.patron_info && (
              <Alert severity="success" sx={{ mb: 3 }}>
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
              placeholder="Enter item copy ID"
              autoFocus
              disabled={checking_item}
              sx={{ mb: 3 }}
            />

            <Button
              fullWidth
              variant="contained"
              onClick={check_item_availability}
              disabled={!item_id_input || checking_item}
              startIcon={checking_item ? <CircularProgress size={20} /> : null}
              size="large"
            >
              {checking_item ? 'Checking...' : 'Check Book'}
            </Button>
          </Box>
        )}

        {/* STEP 2: Confirmation */}
        {active_step === 2 && patron_eligibility?.patron_info && item_info && (
          <Box>
            <Typography variant="h5" gutterBottom fontWeight="bold" textAlign="center" color="success.main">
              Checkout Confirmation
            </Typography>

            <Box sx={{ mt: 3, p: 3, bgcolor: 'success.50', borderRadius: 2, border: '2px solid', borderColor: 'success.main' }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                PATRON INFORMATION
              </Typography>
              <Typography variant="body1">Patron ID: {patron_eligibility.patron_info.id}</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Name: {patron_eligibility.patron_info.name}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom fontWeight="bold">
                BOOK INFORMATION
              </Typography>
              <Typography variant="body1">Title: {item_info.title || 'N/A'}</Typography>
              <Typography variant="body1">Type: {item_info.item_type}</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>Status: {item_info.status}</Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom fontWeight="bold">
                DUE DATE - Based on Item Type
              </Typography>
              <Typography variant="body1" fontWeight="bold" color="primary">
                Due Date: {calculate_due_date(item_info.item_type)}
              </Typography>

              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="body2" gutterBottom fontWeight="bold">
                  Loan Duration Rules:
                </Typography>
                <Typography variant="body2">• Books: 4 weeks</Typography>
                <Typography variant="body2">• Movies: 1 week</Typography>
                <Typography variant="body2">• New Movies: 3 days</Typography>
              </Box>
            </Box>

            <Button
              fullWidth
              variant="contained"
              color="success"
              onClick={complete_checkout}
              disabled={processing_checkout}
              startIcon={processing_checkout ? <CircularProgress size={20} /> : null}
              size="large"
              sx={{ mt: 3 }}
            >
              {processing_checkout ? 'Processing...' : 'Complete Checkout'}
            </Button>
          </Box>
        )}

        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
          <Button
            variant="outlined"
            onClick={handle_back}
            disabled={active_step === 0 || checking_patron || checking_item || processing_checkout}
          >
            Back
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button
            variant="outlined"
            onClick={handle_reset}
            disabled={checking_patron || checking_item || processing_checkout}
          >
            Reset
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};
