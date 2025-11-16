import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Divider,
  Stack,
} from '@mui/material';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

interface Patron {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  card_expiration_date: string;
  is_active: boolean;
}

interface ReservationDialogProps {
  open: boolean;
  onClose: () => void;
  itemId: number;
  itemName: string;
  onSuccess?: (message: string, onWaitlist: boolean) => void;
}

export const ReservationDialog = ({
  open,
  onClose,
  itemId,
  itemName,
  onSuccess,
}: ReservationDialogProps) => {
  const [step, setStep] = useState<'enter_patron' | 'display_patron' | 'processing'>('enter_patron');
  const [patronId, setPatronId] = useState('');
  const [patron, setPatron] = useState<Patron | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 3: Enter patron information
  const handleLookupPatron = async () => {
    if (!patronId.trim()) {
      setError('Please enter a patron ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Step 4: Lookup patron record
      const response = await fetch(`${API_BASE_URL}/reservations/validate-patron/${patronId}`);
      const data = await response.json();

      if (!response.ok) {
        // Step 7: Return validation failure
        if (data.valid === false) {
          setError(data.error || 'Patron validation failed');
          if (data.patron) {
            setPatron(data.patron);
            setStep('display_patron');
          }
          return;
        }
        throw new Error(data.error || 'Failed to lookup patron');
      }

      // Step 5: Display patron details
      // Step 6: Validate patron account (done in backend)
      if (data.valid) {
        setPatron(data.patron);
        setStep('display_patron');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to lookup patron');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReservation = async () => {
    if (!patron) return;

    setStep('processing');
    setLoading(true);
    setError('');

    try {
      // Create reservation
      const response = await fetch(`${API_BASE_URL}/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          library_item_id: itemId,
          patron_id: patron.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases from diagram
        if (data.validation_failed) {
          // Step 7: Return validation failure
          setError(data.message || 'Patron validation failed');
          setStep('display_patron');
          return;
        } else if (data.already_reserved) {
          // Step 10: Item already reserved
          setError(data.message || 'Item already reserved for this patron');
          setStep('display_patron');
          return;
        }
        throw new Error(data.error || 'Failed to create reservation');
      }

      // Success - either reservation created or added to waitlist
      const message = data.on_waitlist
        ? `${patron.first_name} ${patron.last_name} has been added to the waitlist for "${itemName}"`
        : `Reservation created successfully for ${patron.first_name} ${patron.last_name}`;

      if (onSuccess) {
        onSuccess(message, data.on_waitlist);
      }

      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create reservation');
      setStep('display_patron');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('enter_patron');
    setPatronId('');
    setPatron(null);
    setError('');
    setLoading(false);
    onClose();
  };

  const handleAbort = () => {
    // Inform patron and abort reservation
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Reserve Item
        {itemName && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {itemName}
          </Typography>
        )}
      </DialogTitle>

      <DialogContent>
        {/* Step 2: Display reservation prompt */}
        {step === 'enter_patron' && (
          <Box sx={{ pt: 1 }}>
            <Typography variant="body2" gutterBottom>
              Enter patron ID to reserve this item
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Patron ID"
              value={patronId}
              onChange={(e) => setPatronId(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleLookupPatron();
              }}
              disabled={loading}
              autoFocus
              sx={{ mb: 2 }}
            />
          </Box>
        )}

        {/* Step 5: Display patron details */}
        {step === 'display_patron' && patron && (
          <Box sx={{ pt: 1 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              PATRON INFORMATION
            </Typography>

            <Stack spacing={2} sx={{ mt: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Name
                </Typography>
                <Typography variant="body1">
                  {patron.first_name} {patron.last_name}
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Patron ID
                </Typography>
                <Typography variant="body1">{patron.id}</Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1">{patron.email}</Typography>
              </Box>

              {patron.phone && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Phone
                    </Typography>
                    <Typography variant="body1">{patron.phone}</Typography>
                  </Box>
                </>
              )}

              {patron.address && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Address
                    </Typography>
                    <Typography variant="body1">{patron.address}</Typography>
                  </Box>
                </>
              )}

              <Divider />

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Status
                </Typography>
                <Typography variant="body1">
                  {patron.is_active ? 'Active' : 'Inactive'}
                </Typography>
              </Box>
            </Stack>

            {!error && (
              <Alert severity="info" sx={{ mt: 3 }}>
                Please confirm to create reservation for this patron
              </Alert>
            )}
          </Box>
        )}

        {step === 'processing' && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        {step === 'enter_patron' && (
          <>
            <Button onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleLookupPatron}
              variant="contained"
              disabled={loading || !patronId.trim()}
            >
              {loading ? 'Looking up...' : 'Lookup Patron'}
            </Button>
          </>
        )}

        {step === 'display_patron' && (
          <>
            <Button onClick={handleAbort} disabled={loading}>
              Cancel
            </Button>
            {!error && (
              <Button
                onClick={handleConfirmReservation}
                variant="contained"
                disabled={loading || !patron?.is_active}
              >
                Confirm Reservation
              </Button>
            )}
          </>
        )}

        {step === 'processing' && (
          <Button onClick={handleClose} disabled>
            Processing...
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
