import { useState, type FC } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Stack,
  IconButton,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { addYears } from 'date-fns';
import { validate_required } from '../../utils/validators';
import type { Patron_Form_Data } from '../../types';

export interface Patron_Form_Errors {
  first_name: string;
  last_name: string;
  balance?: string;
  birthday?: string;
  card_expiration_date: string;
  image_url?: string;
}

interface New_Patron_Modal_Props {
  open: boolean;
  on_close: () => void;
  on_submit: (patron_data: Patron_Form_Data) => void;
  is_loading?: boolean;
}

const New_Patron_Modal: FC<New_Patron_Modal_Props> = ({
  open,
  on_close,
  on_submit,
  is_loading = false,
}) => {
  const [form_data, set_form_data] = useState<Patron_Form_Data>({
    first_name: '',
    last_name: '',
    balance: 0,
    birthday: undefined,
    card_expiration_date: addYears(new Date(), 1), // Default to 1 year from now
    image_url: '',
  });

  const [errors, set_errors] = useState<Partial<Patron_Form_Errors>>({});
  const [submit_error, set_submit_error] = useState<string>('');

  const validate_form = (): boolean => {
    const new_errors: Partial<Patron_Form_Errors> = {};

    // Required fields validation
    if (!validate_required(form_data.first_name)) {
      new_errors.first_name = 'First name is required';
    }
    if (!validate_required(form_data.last_name)) {
      new_errors.last_name = 'Last name is required';
    }
    if (!form_data.card_expiration_date) {
      new_errors.card_expiration_date = 'Card expiration date is required';
    } else if (form_data.card_expiration_date <= new Date()) {
      new_errors.card_expiration_date =
        'Card expiration date must be in the future';
    }

    // Optional field validations
    if (form_data.balance !== undefined && form_data.balance < 0) {
      new_errors.balance = 'Balance cannot be negative';
    }

    if (form_data.birthday && form_data.birthday > new Date()) {
      new_errors.birthday = 'Birthday cannot be in the future';
    }

    set_errors(new_errors);
    return Object.keys(new_errors).length === 0;
  };

  const handle_input_change =
    (field: keyof Patron_Form_Data) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      set_form_data((prev) => ({
        ...prev,
        [field]:
          field === 'balance' ? (value === '' ? 0 : parseFloat(value)) : value,
      }));

      // Clear error for this field when user starts typing
      if (errors[field as keyof Patron_Form_Errors]) {
        set_errors((prev) => ({ ...prev, [field]: undefined }));
      }
      set_submit_error('');
    };

  const handle_date_change =
    (field: 'birthday' | 'card_expiration_date') => (date: Date | null) => {
      set_form_data((prev) => ({
        ...prev,
        [field]: date,
      }));

      // Clear error for this field when user changes date
      if (errors[field as keyof Patron_Form_Errors]) {
        set_errors((prev) => ({ ...prev, [field]: undefined }));
      }
      set_submit_error('');
    };

  const handle_submit = () => {
    if (!validate_form()) {
      return;
    }

    on_submit(form_data);
  };

  const handle_close = () => {
    if (!is_loading) {
      // Reset form when closing
      set_form_data({
        first_name: '',
        last_name: '',
        balance: 0,
        birthday: undefined,
        card_expiration_date: addYears(new Date(), 1),
        image_url: '',
      });
      set_errors({});
      set_submit_error('');
      on_close();
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog
        open={open}
        onClose={handle_close}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: '500px' },
        }}
      >
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            Create New Patron
            <IconButton
              onClick={handle_close}
              disabled={is_loading}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {submit_error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submit_error}
            </Alert>
          )}

          <Stack spacing={3}>
            {/* Personal Information */}
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                flexDirection: { xs: 'column', sm: 'row' },
              }}
            >
              <TextField
                fullWidth
                label="First Name"
                value={form_data.first_name}
                onChange={handle_input_change('first_name')}
                error={!!errors.first_name}
                helperText={errors.first_name}
                disabled={is_loading}
                required
              />
              <TextField
                fullWidth
                label="Last Name"
                value={form_data.last_name}
                onChange={handle_input_change('last_name')}
                error={!!errors.last_name}
                helperText={errors.last_name}
                disabled={is_loading}
                required
              />
            </Box>

            {/* Dates */}
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                flexDirection: { xs: 'column', sm: 'row' },
              }}
            >
              <DatePicker
                label="Birthday (Optional)"
                value={form_data.birthday}
                onChange={handle_date_change('birthday')}
                disabled={is_loading}
                maxDate={new Date()}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.birthday,
                    helperText: errors.birthday,
                  },
                }}
              />
              <DatePicker
                label="Card Expiration Date"
                value={form_data.card_expiration_date}
                onChange={handle_date_change('card_expiration_date')}
                disabled={is_loading}
                minDate={new Date()}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.card_expiration_date,
                    helperText: errors.card_expiration_date,
                    required: true,
                  },
                }}
              />
            </Box>

            {/* Financial Information */}
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                flexDirection: { xs: 'column', sm: 'row' },
              }}
            >
              <TextField
                fullWidth
                label="Initial Balance"
                type="number"
                value={form_data.balance}
                onChange={handle_input_change('balance')}
                error={!!errors.balance}
                helperText={errors.balance || 'Leave as 0 for new patrons'}
                disabled={is_loading}
                inputProps={{ min: 0, step: 0.01 }}
              />
              <TextField
                fullWidth
                label="Profile Image URL (Optional)"
                value={form_data.image_url}
                onChange={handle_input_change('image_url')}
                error={!!errors.image_url}
                helperText={errors.image_url}
                disabled={is_loading}
                placeholder="https://example.com/image.jpg"
              />
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={handle_close}
            disabled={is_loading}
            variant="outlined"
            size="large"
          >
            Cancel
          </Button>
          <Button
            onClick={handle_submit}
            disabled={is_loading}
            variant="contained"
            size="large"
            startIcon={is_loading ? undefined : <PersonAddIcon />}
          >
            {is_loading ? 'Creating...' : 'Create Patron'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default New_Patron_Modal;
