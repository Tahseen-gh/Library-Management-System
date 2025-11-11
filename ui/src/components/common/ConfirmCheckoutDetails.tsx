import { type FC, useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
  Alert,
  AlertTitle,
  Button,
  Skeleton,
  Grid,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { Person, LibraryBooks, CalendarToday, Warning } from '@mui/icons-material';
import { format_date, is_overdue } from '../../utils/dateUtils';
import { usePatronById, useUpdatePatron } from '../../hooks/usePatrons';
import { useCopyById } from '../../hooks/useCopies';

interface ConfirmCheckoutDetailsProps {
  patron_id: number;
  copy_id: number;
  due_date: Date;
  on_confirm: () => void;
  on_cancel: () => void;
  on_validation_change?: (is_valid: boolean) => void;
}

export const ConfirmCheckoutDetails: FC<ConfirmCheckoutDetailsProps> = ({
  patron_id,
  copy_id,
  due_date,
  on_cancel,
  on_validation_change,
}) => {
  const { data: patron, isLoading: loading_patron } = usePatronById(patron_id);
  const { data: item_copy, isLoading: loading_copy } = useCopyById(copy_id);
  const { mutate: updatePatron } = useUpdatePatron();

  // Validation override states
  const [card_override, set_card_override] = useState(false);
  const [fine_resolved, set_fine_resolved] = useState(false);
  const [show_fine_dialog, set_show_fine_dialog] = useState(false);
  const [fine_amount_input, set_fine_amount_input] = useState('');
  const [show_override_dialog, set_show_override_dialog] = useState(false);

  const hasOutstandingBalance = patron ? patron.balance > 0 : false;
  const isCardExpired = patron
    ? patron.card_expiration_date &&
      is_overdue(new Date(patron.card_expiration_date))
    : false;
  const hasTooManyBooks = patron ? (patron.active_checkouts || 0) >= 20 : false;

  // Blocking conditions
  const has_blocking_issues =
    hasTooManyBooks || // HARD BLOCK
    (isCardExpired && !card_override) || // Can be overridden
    (hasOutstandingBalance && !fine_resolved); // Can be resolved

  // Notify parent of validation status
  useEffect(() => {
    if (on_validation_change) {
      on_validation_change(!has_blocking_issues);
    }
  }, [has_blocking_issues, on_validation_change]);

  const is_any_loading = loading_patron || loading_copy;

  const handle_collect_fine = () => {
    if (patron && fine_amount_input) {
      const amount = parseFloat(fine_amount_input);
      if (amount >= patron.balance) {
        updatePatron(
          {
            patron_id: patron.id,
            patron_data: { balance: 0 },
          },
          {
            onSuccess: () => {
              set_fine_resolved(true);
              set_show_fine_dialog(false);
            },
          }
        );
      }
    }
  };

  const handle_waive_fine = () => {
    if (patron) {
      updatePatron(
        {
          patron_id: patron.id,
          patron_data: { balance: 0 },
        },
        {
          onSuccess: () => {
            set_fine_resolved(true);
            set_show_fine_dialog(false);
          },
        }
      );
    }
  };

  const handle_override_card = () => {
    set_card_override(true);
    set_show_override_dialog(false);
  };

  // If still loading essential data, show loading skeleton
  if (is_any_loading) {
    return (
      <Container sx={{ p: 2 }}>
        <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
          Confirm Checkout Details
        </Typography>

        <Grid container spacing={3}>
          {/* Patron Loading Skeleton */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Skeleton
                    variant="circular"
                    width={40}
                    height={40}
                    sx={{ mr: 2 }}
                  />
                  <Skeleton variant="text" width={200} height={32} />
                </Box>
                <Box sx={{ ml: 7 }}>
                  <Skeleton
                    variant="text"
                    width={150}
                    height={24}
                    sx={{ mb: 1 }}
                  />
                  <Skeleton
                    variant="text"
                    width={100}
                    height={20}
                    sx={{ mb: 1 }}
                  />
                  <Skeleton
                    variant="rectangular"
                    width={80}
                    height={24}
                    sx={{ mb: 1 }}
                  />
                  <Skeleton variant="rectangular" width={120} height={24} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Item Loading Skeleton */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Skeleton
                    variant="circular"
                    width={40}
                    height={40}
                    sx={{ mr: 2 }}
                  />
                  <Skeleton variant="text" width={180} height={32} />
                </Box>
                <Box sx={{ ml: 7 }}>
                  <Skeleton
                    variant="text"
                    width={250}
                    height={24}
                    sx={{ mb: 1 }}
                  />
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <Skeleton variant="rectangular" width={60} height={24} />
                    <Skeleton variant="rectangular" width={50} height={24} />
                  </Box>
                  <Skeleton
                    variant="text"
                    width={120}
                    height={20}
                    sx={{ mb: 1 }}
                  />
                  <Skeleton variant="text" width={100} height={20} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Due Date Loading Skeleton */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Skeleton
                    variant="circular"
                    width={40}
                    height={40}
                    sx={{ mr: 2 }}
                  />
                  <Skeleton variant="text" width={120} height={32} />
                </Box>
                <Box sx={{ ml: 7 }}>
                  <Skeleton
                    variant="text"
                    width={150}
                    height={32}
                    sx={{ mb: 1 }}
                  />
                  <Skeleton variant="text" width={200} height={20} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    );
  }

  // If data couldn't be loaded
  if (!patron || !item_copy) {
    return (
      <Container sx={{ p: 2 }}>
        <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
          Confirm Checkout Details
        </Typography>
        <Alert severity="error" onClick={() => console.log(patron, item_copy)}>
          <AlertTitle>Error Loading Data</AlertTitle>
          Unable to load the required information for this checkout. Please try
          again.
        </Alert>
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            justifyContent: 'flex-end',
            pt: 2,
            mt: 3,
          }}
        >
          <Button variant="outlined" onClick={on_cancel} size="large">
            Go Back
          </Button>
        </Box>
      </Container>
    );
  }
  return (
    <Container sx={{ p: 2 }}>
      {/* Blocking Errors and Warnings */}
      {(hasTooManyBooks || hasOutstandingBalance || isCardExpired) && (
        <Box sx={{ mb: 3 }}>
          {/* HARD BLOCK: Too Many Books */}
          {hasTooManyBooks && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <AlertTitle>⛔ Too Many Books - CANNOT PROCEED</AlertTitle>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Patron has {patron?.active_checkouts || 0} books checked out.
                Maximum allowed is 20 books.
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                Transaction must be terminated. Patron must return books before
                checking out more items.
              </Typography>
            </Alert>
          )}

          {/* Outstanding Balance - Can be resolved */}
          {hasOutstandingBalance && !fine_resolved && !hasTooManyBooks && (
            <Alert
              severity="warning"
              sx={{ mb: 2 }}
              action={
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => set_show_fine_dialog(true)}
                  >
                    Collect Fine
                  </Button>
                  <Button
                    color="inherit"
                    size="small"
                    onClick={handle_waive_fine}
                  >
                    Waive Fine
                  </Button>
                </Box>
              }
            >
              <AlertTitle>💰 Outstanding Fines</AlertTitle>
              Patron owes ${patron?.balance.toFixed(2)}. Fine must be collected
              or waived before proceeding.
            </Alert>
          )}

          {/* Fine Resolved */}
          {fine_resolved && (
            <Alert severity="success" sx={{ mb: 2 }}>
              <AlertTitle>✓ Fine Resolved</AlertTitle>
              Fine has been resolved. You may proceed with checkout.
            </Alert>
          )}

          {/* Expired Card - Can be overridden */}
          {isCardExpired && !card_override && !hasTooManyBooks && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => set_show_override_dialog(true)}
                >
                  Override
                </Button>
              }
            >
              <AlertTitle>📅 Expired Library Card</AlertTitle>
              This patron's library card expired on{' '}
              {format_date(patron?.card_expiration_date)}. Card must be renewed
              or overridden.
            </Alert>
          )}

          {/* Card Overridden */}
          {card_override && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <AlertTitle>✓ Card Expiration Overridden</AlertTitle>
              Card expiration has been overridden. You may proceed with
              checkout.
            </Alert>
          )}
        </Box>
      )}

      {/* Fine Collection Dialog */}
      <Dialog
        open={show_fine_dialog}
        onClose={() => set_show_fine_dialog(false)}
      >
        <DialogTitle>Collect Fine</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Patron owes: ${patron?.balance.toFixed(2)}
          </Typography>
          <TextField
            autoFocus
            label="Amount Collected"
            type="number"
            fullWidth
            value={fine_amount_input}
            onChange={(e) => set_fine_amount_input(e.target.value)}
            inputProps={{ min: 0, step: 0.01 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => set_show_fine_dialog(false)}>Cancel</Button>
          <Button onClick={handle_collect_fine} variant="contained">
            Collect
          </Button>
        </DialogActions>
      </Dialog>

      {/* Override Card Dialog */}
      <Dialog
        open={show_override_dialog}
        onClose={() => set_show_override_dialog(false)}
      >
        <DialogTitle>Override Expired Card</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <AlertTitle>
              <Warning sx={{ mr: 1 }} />
              Override Warning
            </AlertTitle>
            You are about to override the card expiration check. This action
            will be logged for audit purposes.
          </Alert>
          <Typography variant="body2">
            Patron: {patron?.first_name} {patron?.last_name}
          </Typography>
          <Typography variant="body2">
            Card Expired: {format_date(patron?.card_expiration_date)}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => set_show_override_dialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handle_override_card}
            variant="contained"
            color="warning"
          >
            Override
          </Button>
        </DialogActions>
      </Dialog>

      <Grid container spacing={3}>
        {/* Patron Information */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{ bgcolor: 'primary.main', mr: 2 }}
                  src={patron.image_url}
                >
                  <Person />
                </Avatar>
                <Typography variant="h6" component="h3">
                  Patron Information
                </Typography>
              </Box>
              <Box sx={{ ml: 7 }}>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {patron.first_name} {patron.last_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Patron ID: {patron.id}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mr: 1 }}
                  >
                    Balance:
                  </Typography>
                  <Chip
                    label={`$${patron.balance.toFixed(2)}`}
                    size="small"
                    color={patron.balance > 0 ? 'warning' : 'success'}
                    variant="outlined"
                  />
                </Box>
                {patron.card_expiration_date && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mr: 1 }}
                    >
                      Card Expires:
                    </Typography>
                    <Chip
                      label={format_date(patron.card_expiration_date)}
                      size="small"
                      color={isCardExpired ? 'error' : 'default'}
                      variant="outlined"
                    />
                  </Box>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mr: 1 }}
                  >
                    Active Checkouts:
                  </Typography>
                  <Chip
                    label={`${patron.active_checkouts || 0} / 20`}
                    size="small"
                    color={hasTooManyBooks ? 'error' : 'default'}
                    variant="outlined"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Item Information */}

        <Grid size={{ xs: 12, sm: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                  <LibraryBooks />
                </Avatar>
                <Typography variant="h6" component="h3">
                  Item Information
                </Typography>
              </Box>
              <Box sx={{ ml: 7 }}>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {(item_copy as any).title || 'Unknown Title'}
                </Typography>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 1 }}
                >
                  <Chip
                    label={(item_copy as any).item_type || 'BOOK'}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    label={item_copy.condition || 'Good'}
                    size="small"
                    color="default"
                    variant="outlined"
                  />
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  Copy ID: {item_copy.id}
                </Typography>
                {(item_copy as any).branch_name && (
                  <Typography variant="body2" color="text.secondary">
                    Branch: {(item_copy as any).branch_name}
                  </Typography>
                )}
                {item_copy.status && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    Status: {item_copy.status}
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Due Date Information */}

        <Grid size={{ xs: 12, sm: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <CalendarToday />
                </Avatar>
                <Typography variant="h6" component="h3">
                  Due Date
                </Typography>
              </Box>
              <Box sx={{ ml: 7 }}>
                <Typography variant="h6" color="primary.main">
                  {format_date(due_date)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Item must be returned by this date
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};
