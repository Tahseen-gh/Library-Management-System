import { type FC } from 'react';
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
} from '@mui/material';
import { Person, LibraryBooks, CalendarToday } from '@mui/icons-material';
import { format_date, is_overdue } from '../../utils/dateUtils';
import { usePatronById } from '../../hooks/usePatrons';
import { useCopyById } from '../../hooks/useCopies';

interface ConfirmCheckoutDetailsProps {
  patron_id: number;
  copy_id: string;
  due_date: Date;
  on_confirm: () => void;
  on_cancel: () => void;
}

export const ConfirmCheckoutDetails: FC<ConfirmCheckoutDetailsProps> = ({
  patron_id,
  copy_id,
  due_date,
  on_cancel,
}) => {
  const { data: patron, isLoading: loading_patron } = usePatronById(patron_id);
  const { data: item_copy, isLoading: loading_copy } = useCopyById(copy_id);

  const hasOutstandingBalance = patron ? patron.balance > 0 : false;
  const isCardExpired = patron
    ? patron.card_expiration_date &&
      is_overdue(new Date(patron.card_expiration_date))
    : false;

  const is_any_loading = loading_patron || loading_copy;

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
      {/* Warnings */}
      {(hasOutstandingBalance || isCardExpired) && (
        <Box sx={{ mb: 3 }}>
          {hasOutstandingBalance && (
            <Alert severity="warning" sx={{ mb: 1 }}>
              <AlertTitle>Outstanding Balance</AlertTitle>
              This patron has an outstanding balance of $
              {patron.balance.toFixed(2)}.
            </Alert>
          )}
          {isCardExpired && (
            <Alert severity="error" sx={{ mb: 1 }}>
              <AlertTitle>Expired Library Card</AlertTitle>
              This patron's library card expired on{' '}
              {format_date(patron.card_expiration_date)}.
            </Alert>
          )}
        </Box>
      )}

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
                  {item_copy.id}
                </Typography>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 1 }}
                >
                  <Chip
                    label={item_copy.id}
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
                {item_copy.id && (
                  <Typography variant="body2" color="text.secondary">
                    Published: {item_copy.id}
                  </Typography>
                )}
                {item_copy.id && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    {item_copy.id}
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
