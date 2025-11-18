import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Alert,
} from '@mui/material';
import { useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

interface RegisterPatronDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RegisterPatronDialog = ({
  open,
  onClose,
  onSuccess,
}: RegisterPatronDialogProps) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    birthday: '',
    card_expiration_date: '',
    balance: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: e.target.value });
    setError('');
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.first_name || !formData.last_name) {
      setError('First name and last name are required');
      return;
    }

    if (!formData.birthday) {
      setError('Birthday is required');
      return;
    }

    if (!formData.card_expiration_date) {
      setError('Expiry date is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Prepare data - only include non-empty fields
      const patronData: Record<string, string | number> = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        birthday: formData.birthday,
        card_expiration_date: formData.card_expiration_date,
        balance: formData.balance ? parseFloat(formData.balance) : 0,
      };

      if (formData.email) patronData.email = formData.email;
      if (formData.phone) patronData.phone = formData.phone;

      const response = await fetch(`${API_BASE_URL}/patrons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patronData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to register patron');
        setLoading(false);
        return;
      }

      // Success - reset form and close
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        birthday: '',
        card_expiration_date: '',
        balance: '',
      });
      setLoading(false);
      onSuccess();
      onClose();
    } catch {
      setError('An error occurred while registering the patron');
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        birthday: '',
        card_expiration_date: '',
        balance: '',
      });
      setError('');
      onClose();
    }
  };

  // Set default card expiration date to 2 years from today
  const getDefaultCardExpiration = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 2);
    return date.toISOString().split('T')[0];
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create Patron</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="First Name"
            value={formData.first_name}
            onChange={handleChange('first_name')}
            required
            fullWidth
            disabled={loading}
          />

          <TextField
            label="Last Name"
            value={formData.last_name}
            onChange={handleChange('last_name')}
            required
            fullWidth
            disabled={loading}
          />

          <TextField
            label="Birthday"
            type="date"
            value={formData.birthday}
            onChange={handleChange('birthday')}
            required
            fullWidth
            InputLabelProps={{ shrink: true }}
            disabled={loading}
          />

          <TextField
            label="Expiry Date"
            type="date"
            value={formData.card_expiration_date || getDefaultCardExpiration()}
            onChange={handleChange('card_expiration_date')}
            required
            fullWidth
            InputLabelProps={{ shrink: true }}
            disabled={loading}
            helperText="Library card will be valid until this date"
          />

          <TextField
            label="Initial Balance"
            type="number"
            value={formData.balance}
            onChange={handleChange('balance')}
            fullWidth
            disabled={loading}
            inputProps={{ min: 0, step: 0.01 }}
            helperText="Enter initial balance (default: $0.00)"
          />

          <TextField
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleChange('email')}
            fullWidth
            disabled={loading}
          />

          <TextField
            label="Phone Number"
            value={formData.phone}
            onChange={handleChange('phone')}
            fullWidth
            disabled={loading}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !formData.first_name || !formData.last_name || !formData.birthday || !formData.card_expiration_date}
        >
          {loading ? 'Creating...' : 'Create Patron'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
