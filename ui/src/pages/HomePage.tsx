import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  Paper,
  Divider,
  Stack,
  CircularProgress,
  Card,
  CardContent,
  CardActionArea,
  Fade,
} from '@mui/material';
import {
  CheckCircle,
  Error as ErrorIcon,
  Warning as WarningIcon,
  ArrowBack,
  Output,
  Input,
  Search,
} from '@mui/icons-material';
import { data_service } from '../services/dataService';
import { CheckoutReceipt } from '../components/common/CheckoutReceipt';
import { format_date } from '../utils/dateUtils';

// Types
type PatronErrorType = 'invalid_id' | 'card_expired' | 'too_many_books' | 'outstanding_fines' | null;
type BookErrorType = 'not_found' | 'unavailable' | 'reserved' | null;

type ProcessMode = 'none' | 'checkout' | 'checkin';
type CheckoutStep = 'patron_entry' | 'book_entry' | 'confirmation' | 'complete';
type CheckinStep = 'item_entry' | 'complete';

export const HomePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Process mode
  const [process_mode, set_process_mode] = useState<ProcessMode>('none');

  // Check URL parameters on mount
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'checkout') {
      set_process_mode('checkout');
      set_checkout_step('patron_entry');
    } else if (mode === 'checkin') {
      set_process_mode('checkin');
      set_checkin_step('item_entry');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // CHECKOUT STATE
  const [checkout_step, set_checkout_step] = useState<CheckoutStep>('patron_entry');

  // Patron state
  const [patron_id, set_patron_id] = useState('');
  const [patron_data, set_patron_data] = useState<any>(null);
  const [patron_error, set_patron_error] = useState<PatronErrorType>(null);
  const [patron_loading, set_patron_loading] = useState(false);

  // Book state
  const [book_id, set_book_id] = useState('');
  const [book_data, set_book_data] = useState<any>(null);
  const [book_error, set_book_error] = useState<BookErrorType>(null);
  const [book_loading, set_book_loading] = useState(false);

  // Receipt state
  const [receipt_data, set_receipt_data] = useState<any>(null);
  const [show_receipt, set_show_receipt] = useState(false);
  const [checkout_loading, set_checkout_loading] = useState(false);

  // CHECKIN STATE
  const [checkin_step, set_checkin_step] = useState<CheckinStep>('item_entry');
  const [return_item_id, set_return_item_id] = useState('');
  const [return_data, set_return_data] = useState<any>(null);
  const [return_loading, set_return_loading] = useState(false);
  const [return_error, set_return_error] = useState<string | null>(null);

  // ===============================
  // NAVIGATION
  // ===============================

  const start_checkout = () => {
    set_process_mode('checkout');
    set_checkout_step('patron_entry');
  };

  const return_to_home = () => {
    set_process_mode('none');
    reset_checkout();
    reset_checkin();
    setSearchParams({});
  };

  const reset_checkout = () => {
    set_checkout_step('patron_entry');
    set_patron_id('');
    set_patron_data(null);
    set_patron_error(null);
    set_book_id('');
    set_book_data(null);
    set_book_error(null);
    set_receipt_data(null);
    set_show_receipt(false);
    set_checkout_loading(false);
  };

  const reset_checkin = () => {
    set_checkin_step('item_entry');
    set_return_item_id('');
    set_return_data(null);
    set_return_error(null);
    set_return_loading(false);
  };

  // ===============================
  // CHECKOUT HANDLERS
  // ===============================

  const handle_check_patron = async () => {
    if (!patron_id.trim()) return;

    set_patron_loading(true);
    set_patron_error(null);

    try {
      const patron = await data_service.get_patron_by_id(Number(patron_id));

      if (!patron) {
        set_patron_error('invalid_id');
        set_patron_loading(false);
        return;
      }

      if (patron.card_expiration_date) {
        const expiration = new Date(patron.card_expiration_date);
        if (expiration < new Date()) {
          set_patron_data(patron);
          set_patron_error('card_expired');
          set_patron_loading(false);
          return;
        }
      }

      if (patron.balance > 0) {
        set_patron_data(patron);
        set_patron_error('outstanding_fines');
        set_patron_loading(false);
        return;
      }

      if (patron.active_checkouts && patron.active_checkouts >= 20) {
        set_patron_data(patron);
        set_patron_error('too_many_books');
        set_patron_loading(false);
        return;
      }

      set_patron_data(patron);
      set_checkout_step('book_entry');
      set_patron_loading(false);
    } catch {
      set_patron_error('invalid_id');
      set_patron_loading(false);
    }
  };

  const handle_collect_fine = () => {
    set_patron_error(null);
    set_checkout_step('book_entry');
  };

  const handle_waive_fine = () => {
    set_patron_error(null);
    set_checkout_step('book_entry');
  };

  const handle_renew_card = () => {
    set_patron_error(null);
    set_checkout_step('book_entry');
  };

  const handle_override = () => {
    set_patron_error(null);
    set_checkout_step('book_entry');
  };

  const handle_terminate_checkout = () => {
    reset_checkout();
  };

  const handle_try_again_patron = () => {
    set_patron_id('');
    set_patron_data(null);
    set_patron_error(null);
  };

  const handle_check_book = async () => {
    if (!book_id.trim()) return;

    set_book_loading(true);
    set_book_error(null);

    try {
      const copy = await data_service.get_copy_by_id(Number(book_id));

      if (!copy) {
        set_book_error('not_found');
        set_book_loading(false);
        return;
      }

      if (copy.status !== 'Available') {
        set_book_data(copy);
        if (copy.status === 'Reserved') {
          set_book_error('reserved');
        } else {
          set_book_error('unavailable');
        }
        set_book_loading(false);
        return;
      }

      set_book_data(copy);
      set_checkout_step('confirmation');
      set_book_loading(false);
    } catch {
      set_book_error('not_found');
      set_book_loading(false);
    }
  };

  const handle_try_again_book = () => {
    set_book_id('');
    set_book_data(null);
    set_book_error(null);
  };

  const calculate_due_date = (item_type: string): Date => {
    const checkout_date = new Date();
    let days_to_add = 14;

    switch (item_type?.toUpperCase()) {
      case 'BOOK':
        days_to_add = 28;
        break;
      case 'VIDEO':
        days_to_add = 7;
        break;
      case 'NEW_VIDEO':
        days_to_add = 3;
        break;
      default:
        days_to_add = 14;
    }

    const due_date = new Date(checkout_date);
    due_date.setDate(due_date.getDate() + days_to_add);
    return due_date;
  };

  const get_loan_duration_text = (item_type: string): string => {
    switch (item_type?.toUpperCase()) {
      case 'BOOK':
        return '4 weeks';
      case 'VIDEO':
        return '1 week';
      case 'NEW_VIDEO':
        return '3 days';
      default:
        return '2 weeks';
    }
  };

  const handle_complete_checkout = async () => {
    if (!patron_data || !book_data) return;

    set_checkout_loading(true);

    try {
      // Calculate due date based on item type
      const due_date = calculate_due_date(book_data.item_type);

      // Call checkout with due date
      const response = await data_service.checkoutBook(patron_data.id, book_data.id, due_date);

      // The transaction response itself contains all receipt data
      set_receipt_data(response);
      set_show_receipt(true);
      set_checkout_step('complete');
      set_checkout_loading(false);
    } catch (error: any) {
      alert(error.message || 'Failed to complete checkout');
      set_checkout_loading(false);
    }
  };

  // Receipt sending methods - disabled until backend endpoints are available
  // const handle_email_receipt = async (email: string) => {
  //   if (receipt_data?.transaction_id) {
  //     await data_service.send_receipt_email(receipt_data.transaction_id, email);
  //   }
  // };

  // const handle_sms_receipt = async (phone: string) => {
  //   if (receipt_data?.transaction_id) {
  //     await data_service.send_receipt_sms(receipt_data.transaction_id, phone);
  //   }
  // };

  const handle_close_receipt = () => {
    set_show_receipt(false);
    reset_checkout();
  };

  // ===============================
  // CHECKIN HANDLERS
  // ===============================

  const handle_return_item = async () => {
    if (!return_item_id.trim()) return;

    set_return_loading(true);
    set_return_error(null);

    try {
      const result = await data_service.return_book(Number(return_item_id));

      if (!result) {
        set_return_error('Item not found or not currently checked out');
        set_return_loading(false);
        return;
      }

      set_return_data(result);
      set_checkin_step('complete');
      set_return_loading(false);
    } catch (error: any) {
      set_return_error(error.message || 'Failed to return item');
      set_return_loading(false);
    }
  };

  // ===============================
  // RENDER: LANDING PAGE
  // ===============================

  const render_landing = () => {
    return (
      <Fade in timeout={600}>
        <Box>
          {/* Hero Section */}
          <Box sx={{ textAlign: 'center', mb: 8, pt: 4 }}>
            <Typography
              variant="h2"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 800,
                background: 'linear-gradient(90deg, #1976d2 0%, #2196f3 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2,
              }}
            >
              Welcome to Wayback Library
            </Typography>
            <Typography variant="h5" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
              Your gateway to knowledge and discovery
            </Typography>
          </Box>

          {/* Action Cards */}
          <Stack spacing={4} sx={{ maxWidth: 800, mx: 'auto' }}>
            {/* Checkout Card */}
            <Card
              elevation={4}
              sx={{
                transition: 'all 0.3s ease',
                '&:hover': { transform: 'translateY(-8px)', boxShadow: 8 },
              }}
            >
              <CardActionArea onClick={start_checkout}>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Output sx={{ fontSize: 40, color: 'white', transform: 'rotate(180deg)' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h4" fontWeight="bold" gutterBottom>
                        Check Out
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Start the checkout process for a patron. Verify patron information, select
                        items, and complete the transaction.
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>

            {/* Check In Card */}
            <Card
              elevation={4}
              sx={{
                transition: 'all 0.3s ease',
                '&:hover': { transform: 'translateY(-8px)', boxShadow: 8 },
              }}
            >
              <CardActionArea component={Link} to="/checkin">
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Input sx={{ fontSize: 40, color: 'white' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h4" fontWeight="bold" gutterBottom>
                        Check In
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Process returned items. Verify the item, calculate any late fees, and update
                        the system.
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>

            {/* Search Card */}
            <Card
              elevation={4}
              sx={{
                transition: 'all 0.3s ease',
                '&:hover': { transform: 'translateY(-8px)', boxShadow: 8 },
              }}
            >
              <CardActionArea component={Link} to="/search">
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Search sx={{ fontSize: 40, color: 'white' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h4" fontWeight="bold" gutterBottom>
                        Search Items
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Search for items by name or ID. View item details, status, and availability
                        information.
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Stack>

          {/* Footer Info */}
          <Box sx={{ textAlign: 'center', mt: 8, py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Need help? Contact library staff or visit the help desk
            </Typography>
          </Box>
        </Box>
      </Fade>
    );
  };

  // ===============================
  // RENDER: CHECKOUT FLOW
  // ===============================

  const render_patron_entry = () => {
    return (
      <Paper elevation={3} sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Enter Patron ID
        </Typography>

        <Box sx={{ mt: 3 }}>
          <Typography variant="body1" gutterBottom>
            Patron ID:
          </Typography>
          <TextField
            fullWidth
            value={patron_id}
            onChange={(e) => set_patron_id(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handle_check_patron()}
            placeholder="Enter patron ID number"
            disabled={patron_loading}
            autoFocus
            sx={{ mb: 2 }}
          />

          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handle_check_patron}
            disabled={!patron_id.trim() || patron_loading}
          >
            {patron_loading ? <CircularProgress size={24} /> : 'Check ID'}
          </Button>
        </Box>

        {/* Error States */}
        {patron_error === 'invalid_id' && (
          <Alert
            severity="error"
            icon={<ErrorIcon />}
            sx={{ mt: 3 }}
            action={
              <Button color="inherit" size="small" onClick={handle_try_again_patron}>
                Try Again
              </Button>
            }
          >
            <Typography variant="h6">Invalid ID</Typography>
            <Typography variant="body2">Patron ID not found. Please try again.</Typography>
          </Alert>
        )}

        {patron_error === 'card_expired' && patron_data && (
          <Alert severity="error" icon={<ErrorIcon />} sx={{ mt: 3 }}>
            <Typography variant="h6">Card Expired</Typography>
            <Typography variant="body2" gutterBottom>
              Patron: {patron_data.first_name} {patron_data.last_name}
            </Typography>
            <Typography variant="body2" gutterBottom>
              Card expired: {format_date(patron_data.card_expiration_date)}
            </Typography>
            <Typography variant="body2" gutterBottom>
              Transaction cannot proceed.
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button variant="contained" size="small" onClick={handle_renew_card}>
                Renew Card
              </Button>
              <Button variant="outlined" size="small" onClick={handle_override}>
                Override
              </Button>
            </Box>
          </Alert>
        )}

        {patron_error === 'too_many_books' && patron_data && (
          <Alert severity="error" icon={<ErrorIcon />} sx={{ mt: 3 }}>
            <Typography variant="h6">Too Many Books</Typography>
            <Typography variant="body2" gutterBottom>
              Patron: {patron_data.first_name} {patron_data.last_name}
            </Typography>
            <Typography variant="body2" gutterBottom>
              This patron has {patron_data.active_checkouts} books checked out.
            </Typography>
            <Typography variant="body2" gutterBottom fontWeight="bold">
              Maximum limit is 20 books. Cannot proceed.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button variant="contained" size="small" onClick={handle_terminate_checkout}>
                Terminate Checkout
              </Button>
            </Box>
          </Alert>
        )}

        {patron_error === 'outstanding_fines' && patron_data && (
          <Alert severity="warning" icon={<WarningIcon />} sx={{ mt: 3 }}>
            <Typography variant="h6">Outstanding Fines</Typography>
            <Typography variant="body2" gutterBottom>
              Patron: {patron_data.first_name} {patron_data.last_name}
            </Typography>
            <Typography variant="body2" gutterBottom>
              Balance: <strong>${patron_data.balance.toFixed(2)}</strong>
            </Typography>
            <Typography variant="body2" gutterBottom>Patron owes fines.</Typography>
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button variant="contained" size="small" onClick={handle_collect_fine}>
                Collect Fine
              </Button>
              <Button variant="outlined" size="small" onClick={handle_waive_fine}>
                Waive Fine
              </Button>
            </Box>
          </Alert>
        )}
      </Paper>
    );
  };

  const render_book_entry = () => {
    return (
      <Paper elevation={3} sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Enter Book ID
        </Typography>

        {patron_data && (
          <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 3 }}>
            <Typography variant="body2">
              Patron: <strong>{patron_data.first_name} {patron_data.last_name}</strong>
            </Typography>
            <Typography variant="body2">
              ID: {patron_data.id} | Active Checkouts: {patron_data.active_checkouts}
            </Typography>
          </Alert>
        )}

        <Box sx={{ mt: 3 }}>
          <Typography variant="body1" gutterBottom>
            Book ID:
          </Typography>
          <TextField
            fullWidth
            value={book_id}
            onChange={(e) => set_book_id(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handle_check_book()}
            placeholder="Enter book/item copy ID"
            disabled={book_loading}
            autoFocus
            sx={{ mb: 2 }}
          />

          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handle_check_book}
            disabled={!book_id.trim() || book_loading}
          >
            {book_loading ? <CircularProgress size={24} /> : 'Check Book'}
          </Button>
        </Box>

        {book_error === 'not_found' && (
          <Alert
            severity="error"
            icon={<ErrorIcon />}
            sx={{ mt: 3 }}
            action={
              <Button color="inherit" size="small" onClick={handle_try_again_book}>
                Try Again
              </Button>
            }
          >
            <Typography variant="h6">Book Not Found</Typography>
            <Typography variant="body2">
              Book ID not recognized. Not in system. Please verify and try again.
            </Typography>
          </Alert>
        )}

        {book_error === 'unavailable' && book_data && (
          <Alert severity="error" icon={<ErrorIcon />} sx={{ mt: 3 }}>
            <Typography variant="h6">Book Unavailable</Typography>
            <Typography variant="body2" gutterBottom>Title: {book_data.title}</Typography>
            <Typography variant="body2" gutterBottom>Type: {book_data.item_type}</Typography>
            <Typography variant="body2" gutterBottom>Status: <strong>{book_data.status}</strong></Typography>
            <Typography variant="body2" gutterBottom>
              This book is currently unavailable for checkout.
            </Typography>
          </Alert>
        )}

        {book_error === 'reserved' && book_data && (
          <Alert severity="error" icon={<ErrorIcon />} sx={{ mt: 3 }}>
            <Typography variant="h6">Book Reserved</Typography>
            <Typography variant="body2" gutterBottom>Title: {book_data.title}</Typography>
            <Typography variant="body2" gutterBottom>Status: <strong>Reserved by another patron</strong></Typography>
            <Typography variant="body2" gutterBottom>
              This book is reserved and cannot be checked out.
            </Typography>
          </Alert>
        )}

        <Box sx={{ mt: 3 }}>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => {
              set_checkout_step('patron_entry');
              set_book_id('');
              set_book_data(null);
              set_book_error(null);
            }}
          >
            Back to Patron Entry
          </Button>
        </Box>
      </Paper>
    );
  };

  const render_confirmation = () => {
    if (!patron_data || !book_data) return null;

    const due_date = calculate_due_date(book_data.item_type);
    const loan_duration = get_loan_duration_text(book_data.item_type);

    return (
      <Paper elevation={3} sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Checkout Confirmation
        </Typography>

        <Alert severity="success" icon={<CheckCircle />} sx={{ mt: 3 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              PATRON INFORMATION
            </Typography>
            <Typography variant="body2">Patron ID: {patron_data.id}</Typography>
            <Typography variant="body2">
              Name: {patron_data.first_name} {patron_data.last_name}
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              BOOK INFORMATION
            </Typography>
            <Typography variant="body2">Title: {book_data.title}</Typography>
            <Typography variant="body2">Type: {book_data.item_type}</Typography>
            <Typography variant="body2">Copy ID: {book_data.id}</Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              DUE DATE - Based on Item Type
            </Typography>
            <Typography variant="body2">
              Due Date: <strong>{format_date(due_date)}</strong>
            </Typography>
            <Typography variant="body2">
              Loan Duration: <strong>{loan_duration}</strong>
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Loan Duration Rules:
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              • Books: 4 weeks
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              • Movies: 1 week
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              • New (movies): 3 days
            </Typography>
          </Box>
        </Alert>

        <Stack spacing={2} sx={{ mt: 3 }}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            color="success"
            onClick={handle_complete_checkout}
            disabled={checkout_loading}
          >
            {checkout_loading ? <CircularProgress size={24} /> : 'Complete Checkout'}
          </Button>

          <Button
            fullWidth
            variant="outlined"
            onClick={() => {
              set_checkout_step('book_entry');
              set_book_id('');
              set_book_data(null);
            }}
          >
            Back to Book Entry
          </Button>

          <Button fullWidth variant="text" color="error" onClick={reset_checkout}>
            Cancel Checkout
          </Button>
        </Stack>
      </Paper>
    );
  };

  const render_checkout_complete = () => {
    return (
      <Paper elevation={3} sx={{ p: 4, maxWidth: 600, mx: 'auto', textAlign: 'center' }}>
        <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Checkout Complete!
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          The transaction has been completed successfully.
        </Typography>

        <Button fullWidth variant="contained" size="large" onClick={reset_checkout} sx={{ mt: 3 }}>
          Start New Checkout
        </Button>
      </Paper>
    );
  };

  // ===============================
  // RENDER: CHECKIN FLOW
  // ===============================

  const render_checkin_entry = () => {
    return (
      <Paper elevation={3} sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Return Item
        </Typography>

        <Box sx={{ mt: 3 }}>
          <Typography variant="body1" gutterBottom>
            Item ID:
          </Typography>
          <TextField
            fullWidth
            value={return_item_id}
            onChange={(e) => set_return_item_id(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handle_return_item()}
            placeholder="Enter item copy ID"
            disabled={return_loading}
            autoFocus
            sx={{ mb: 2 }}
          />

          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handle_return_item}
            disabled={!return_item_id.trim() || return_loading}
          >
            {return_loading ? <CircularProgress size={24} /> : 'Verify Return'}
          </Button>
        </Box>

        {return_error && (
          <Alert severity="error" icon={<ErrorIcon />} sx={{ mt: 3 }}>
            <Typography variant="h6">Error</Typography>
            <Typography variant="body2">{return_error}</Typography>
          </Alert>
        )}
      </Paper>
    );
  };

  const render_checkin_complete = () => {
    if (!return_data) return null;

    return (
      <Paper elevation={3} sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Return Complete
        </Typography>

        <Alert severity="success" icon={<CheckCircle />} sx={{ mt: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Item Returned Successfully
          </Typography>

          {return_data.item && (
            <>
              <Typography variant="body2">Title: {return_data.item.title}</Typography>
              <Typography variant="body2">Type: {return_data.item.item_type}</Typography>
            </>
          )}

          {return_data.patron && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2">Returned by: {return_data.patron.name}</Typography>
            </>
          )}

          {return_data.late_fee && return_data.late_fee > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="warning.main" fontWeight="bold">
                Late Fee Applied: ${return_data.late_fee.toFixed(2)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Days Overdue: {return_data.days_overdue || 0}
              </Typography>
            </>
          )}
        </Alert>

        <Button fullWidth variant="contained" size="large" onClick={reset_checkin} sx={{ mt: 3 }}>
          Process Another Return
        </Button>
      </Paper>
    );
  };

  // ===============================
  // MAIN RENDER
  // ===============================

  return (
    <Container maxWidth="md" sx={{ py: 4, minHeight: '100vh' }}>
      {/* Back Button */}
      {process_mode !== 'none' && (
        <Box sx={{ mb: 3 }}>
          <Button startIcon={<ArrowBack />} onClick={return_to_home} variant="outlined">
            Back to Home
          </Button>
        </Box>
      )}

      {/* Landing Page */}
      {process_mode === 'none' && render_landing()}

      {/* Checkout Flow */}
      {process_mode === 'checkout' && (
        <Fade in timeout={400}>
          <Box>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                Check Out Process
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Follow the prompts to complete patron checkout
              </Typography>
            </Box>

            {checkout_step === 'patron_entry' && render_patron_entry()}
            {checkout_step === 'book_entry' && render_book_entry()}
            {checkout_step === 'confirmation' && render_confirmation()}
            {checkout_step === 'complete' && render_checkout_complete()}
          </Box>
        </Fade>
      )}

      {/* Checkin Flow */}
      {process_mode === 'checkin' && (
        <Fade in timeout={400}>
          <Box>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                Check In Process
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Process returned items and calculate any fees
              </Typography>
            </Box>

            {checkin_step === 'item_entry' && render_checkin_entry()}
            {checkin_step === 'complete' && render_checkin_complete()}
          </Box>
        </Fade>
      )}

      {/* Receipt Dialog */}
      {receipt_data && (
        <CheckoutReceipt
          open={show_receipt}
          onClose={handle_close_receipt}
          receipt={receipt_data}
        />
      )}
    </Container>
  );
};
