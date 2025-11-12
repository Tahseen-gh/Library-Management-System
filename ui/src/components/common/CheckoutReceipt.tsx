import { type FC, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  TextField,
  Stack,
  Alert,
  Paper,
  IconButton,
} from '@mui/material';
import {
  CheckCircle,
  Email,
  Sms,
  Print,
  Close,
} from '@mui/icons-material';
import { format_date } from '../../utils/dateUtils';

interface CheckoutReceiptProps {
  open: boolean;
  onClose: () => void;
  receipt: any;
  onEmailReceipt?: (email: string) => Promise<void>;
  onSmsReceipt?: (phone: string) => Promise<void>;
}

export const CheckoutReceipt: FC<CheckoutReceiptProps> = ({
  open,
  onClose,
  receipt,
  onEmailReceipt,
  onSmsReceipt,
}) => {
  const [show_email_input, set_show_email_input] = useState(false);
  const [show_sms_input, set_show_sms_input] = useState(false);
  const [email_input, set_email_input] = useState('');
  const [phone_input, set_phone_input] = useState('');
  const [sending_email, set_sending_email] = useState(false);
  const [sending_sms, set_sending_sms] = useState(false);
  const [email_sent, set_email_sent] = useState(false);
  const [sms_sent, set_sms_sent] = useState(false);
  const [error_message, set_error_message] = useState<string | null>(null);

  const handle_send_email = async () => {
    if (!email_input.trim() || !onEmailReceipt) return;

    set_sending_email(true);
    set_error_message(null);

    try {
      await onEmailReceipt(email_input);
      set_email_sent(true);
      set_show_email_input(false);
      set_email_input('');
    } catch (error: any) {
      set_error_message(error.message || 'Failed to send email');
    } finally {
      set_sending_email(false);
    }
  };

  const handle_send_sms = async () => {
    if (!phone_input.trim() || !onSmsReceipt) return;

    set_sending_sms(true);
    set_error_message(null);

    try {
      await onSmsReceipt(phone_input);
      set_sms_sent(true);
      set_show_sms_input(false);
      set_phone_input('');
    } catch (error: any) {
      set_error_message(error.message || 'Failed to send SMS');
    } finally {
      set_sending_sms(false);
    }
  };

  const handle_print = () => {
    window.print();
  };

  const handle_close = () => {
    set_show_email_input(false);
    set_show_sms_input(false);
    set_email_input('');
    set_phone_input('');
    set_email_sent(false);
    set_sms_sent(false);
    set_error_message(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handle_close}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle sx={{ color: 'success.main', fontSize: 32 }} />
            <Typography variant="h5" fontWeight="bold">
              Checkout Receipt
            </Typography>
          </Box>
          <IconButton onClick={handle_close} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Paper elevation={0} sx={{ bgcolor: 'background.paper', border: '2px solid', borderColor: 'success.main', p: 3, mb: 2 }}>
          {/* Transaction ID */}
          {receipt?.transaction_id && (
            <Box sx={{ mb: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Transaction ID
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                #{receipt.transaction_id}
              </Typography>
            </Box>
          )}

          {receipt?.id && !receipt?.transaction_id && (
            <Box sx={{ mb: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Transaction ID
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                #{receipt.id}
              </Typography>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Patron Information */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              PATRON INFORMATION
            </Typography>
            {receipt?.patron_id && (
              <Typography variant="body2">
                Patron ID: {receipt.patron_id}
              </Typography>
            )}
            {(receipt?.first_name || receipt?.last_name) && (
              <Typography variant="body2">
                Name: {receipt.first_name} {receipt.last_name}
              </Typography>
            )}
            {receipt?.patron_name && !receipt?.first_name && (
              <Typography variant="body2">
                Name: {receipt.patron_name}
              </Typography>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Book/Item Information */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              BOOK INFORMATION
            </Typography>
            {receipt?.title && (
              <Typography variant="body2">
                Title: {receipt.title}
              </Typography>
            )}
            {receipt?.author && (
              <Typography variant="body2">
                Author: {receipt.author}
              </Typography>
            )}
            {receipt?.director && !receipt?.author && (
              <Typography variant="body2">
                Director: {receipt.director}
              </Typography>
            )}
            {receipt?.item_type && (
              <Typography variant="body2">
                Type: {receipt.item_type === 'BOOK' ? 'Book' : receipt.is_new_release ? 'New (Movie)' : 'Movie'}
              </Typography>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Due Date Information */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              DUE DATE - Based on Item Type
            </Typography>
            {receipt?.due_date && (
              <Typography variant="body2" color="primary.main" fontWeight="bold" sx={{ mb: 1 }}>
                Due Date: {format_date(receipt.due_date)}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Loan Duration Rules:
            </Typography>
            <Typography variant="body2" component="div" sx={{ pl: 2 }}>
              • Books: 4 weeks<br />
              • Movies: 1 week<br />
              • New (movies): 3 days
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Footer Message */}
          <Box sx={{ textAlign: 'center', py: 1 }}>
            <Typography variant="body2" color="text.secondary" fontStyle="italic">
              Please return within due date, call for more enquiries
            </Typography>
          </Box>
        </Paper>

        {/* Success Messages */}
        {email_sent && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Receipt sent via email successfully!
          </Alert>
        )}

        {sms_sent && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Receipt sent via SMS successfully!
          </Alert>
        )}

        {/* Error Message */}
        {error_message && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => set_error_message(null)}>
            {error_message}
          </Alert>
        )}

        {/* Email Input */}
        {show_email_input && (
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email_input}
              onChange={(e) => set_email_input(e.target.value)}
              size="small"
              autoFocus
              disabled={sending_email}
              onKeyPress={(e) => e.key === 'Enter' && handle_send_email()}
            />
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Button
                size="small"
                variant="contained"
                onClick={handle_send_email}
                disabled={!email_input.trim() || sending_email}
              >
                Send Email
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => set_show_email_input(false)}
                disabled={sending_email}
              >
                Cancel
              </Button>
            </Stack>
          </Box>
        )}

        {/* SMS Input */}
        {show_sms_input && (
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="Phone Number"
              type="tel"
              value={phone_input}
              onChange={(e) => set_phone_input(e.target.value)}
              size="small"
              autoFocus
              disabled={sending_sms}
              onKeyPress={(e) => e.key === 'Enter' && handle_send_sms()}
            />
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Button
                size="small"
                variant="contained"
                onClick={handle_send_sms}
                disabled={!phone_input.trim() || sending_sms}
              >
                Send SMS
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => set_show_sms_input(false)}
                disabled={sending_sms}
              >
                Cancel
              </Button>
            </Stack>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        {/* Email Button */}
        {onEmailReceipt && !show_email_input && (
          <Button
            startIcon={<Email />}
            onClick={() => set_show_email_input(true)}
            variant="outlined"
            size="small"
          >
            Email
          </Button>
        )}

        {/* SMS Button */}
        {onSmsReceipt && !show_sms_input && (
          <Button
            startIcon={<Sms />}
            onClick={() => set_show_sms_input(true)}
            variant="outlined"
            size="small"
          >
            SMS
          </Button>
        )}

        {/* Print Button */}
        <Button
          startIcon={<Print />}
          onClick={handle_print}
          variant="outlined"
          size="small"
        >
          Print
        </Button>

        <Box sx={{ flex: 1 }} />

        {/* Close Button */}
        <Button onClick={handle_close} variant="contained" size="large">
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
};
