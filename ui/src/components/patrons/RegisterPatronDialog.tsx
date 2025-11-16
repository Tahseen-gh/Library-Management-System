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
    address: '',
    birthday: '',
    card_expiration_date: '',
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

    if (!formData.card_expiration_date) {
      setError('Card expiration date is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Prepare data - only include non-empty fields
      const patronData: Record<string, string> = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        card_expiration_date: formData.card_expiration_date,
      };

      if (formData.email) patronData.email = formData.email;
      if (formData.phone) patronData.phone = formData.phone;
      if (formData.address) patronData.address = formData.address;
      if (formData.birthday) patronData.birthday = formData.birthday;

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
        address: '',
        birthday: '',
        card_expiration_date: '',
      });
      setLoading(false);
      onSuccess();
      onClose();
    } catch (err) {
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
        address: '',
        birthday: '',
        card_expiration_date: '',
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
      <DialogTitle>Register New Patron</DialogTitle>
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
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleChange('email')}
            fullWidth
            disabled={loading}
          />

          <TextField
            label="Phone"
            value={formData.phone}
            onChange={handleChange('phone')}
            fullWidth
            disabled={loading}
          />

          <TextField
            label="Address"
            value={formData.address}
            onChange={handleChange('address')}
            fullWidth
            multiline
            rows={2}
            disabled={loading}
          />

          <TextField
            label="Birthday"
            type="date"
            value={formData.birthday}
            onChange={handleChange('birthday')}
            fullWidth
            InputLabelProps={{ shrink: true }}
            disabled={loading}
          />

          <TextField
            label="Card Expiration Date"
            type="date"
            value={formData.card_expiration_date || getDefaultCardExpiration()}
            onChange={handleChange('card_expiration_date')}
            required
            fullWidth
            InputLabelProps={{ shrink: true }}
            disabled={loading}
            helperText="Library card will be valid until this date"
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
          disabled={loading || !formData.first_name || !formData.last_name}
        >
          {loading ? 'Registering...' : 'Register Patron'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
