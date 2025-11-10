import {
  Container,
  Typography,
  Grid,
  Button,
  Box,
  Card,
  CardContent,
  Alert,
  AlertTitle,
  Snackbar,
  CardHeader,
  Stack,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Assessment,
  Assignment,
  CheckCircle,
  LibraryAdd,
  LibraryAddCheck,
  PersonAdd,
  Shelves,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import CreateLibraryItemDrawer from '../components/books/CreateLibraryItemDrawer';
import { RecentTransactionsList } from '../components/common/RecentTransactionsList';
import NewPatronModal from '../components/patrons/NewPatronModal';
import type { Create_Library_Item_Form_Data, Patron_Form_Data } from '../types';
import React, { useState, type PropsWithChildren } from 'react';
import { useCreatePatron } from '../hooks/usePatrons';
import { useStats } from '../hooks/useStats';
import { useCreateLibraryItem } from '../hooks/useLibraryItems';

export const HomePage = () => {
  const [create_book_drawer_open, set_create_book_drawer_open] =
    useState(false);
  const [create_patron_modal_open, set_create_patron_modal_open] =
    useState(false);
  const [success_snackbar_open, set_success_snackbar_open] = useState(false);
  const [error_snackbar_open, set_error_snackbar_open] = useState(false);
  const [snackbar_message, set_snackbar_message] = useState('');

  const {
    mutate: create_item,
    error: create_item_error,
    isPending: create_item_loading,
  } = useCreateLibraryItem();

  const { mutate: create_patron, isPending: create_patron_loading } =
    useCreatePatron({
      onSuccess: () => {
        set_snackbar_message('Patron created successfully!');
        set_success_snackbar_open(true);
        set_create_patron_modal_open(false);
      },
      onError: (error: Error) => {
        set_snackbar_message(error.message || 'Failed to create patron');
        set_error_snackbar_open(true);
      },
    });

  const handle_create_patron = (patron_data: Patron_Form_Data) => {
    create_patron(patron_data);
  };

  return (
    <Container maxWidth="xl" sx={{ p: 3 }}>
      <Typography
        variant="h3"
        component="h1"
        gutterBottom
        sx={{
          fontWeight: 'bold',
          mb: 3,
          color: 'text.primary',
          fontSize: 'calc(1.3rem + 1.6vw)',
        }}
      >
        {'Welcome!'}
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card
            sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            <CardHeader
              title={
                <Typography variant="h5" sx={{ fontWeight: 500 }}>
                  Statistics
                </Typography>
              }
            />
            <CardContent sx={{ flex: 1 }}>
              <StatsCard />
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title={
                <Typography variant="h5" sx={{ fontWeight: 500 }}>
                  Quick Actions
                </Typography>
              }
            />
            <CardContent sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>
              <Stack sx={{ flexGrow: 1, gap: 1 }}>
                <ActionButton
                  onClick={() => set_create_book_drawer_open(true)}
                  label="Add New Item"
                  key="add-item-button"
                  icon={<Add />}
                />
                <ActionButton
                  label="Register New Patron"
                  key="register-patron-button"
                  icon={<PersonAdd />}
                  onClick={() => set_create_patron_modal_open(true)}
                />
                <ActionButton
                  icon={<Assignment />}
                  label="Process Returns"
                  key="process-returns-button"
                ></ActionButton>
                <ActionButton
                  icon={<Assessment />}
                  label="Generate Reports"
                  key="generate-reports-button"
                ></ActionButton>
              </Stack>
              <Stack sx={{ flexGrow: 1, gap: 1 }}>
                <ActionLink url="/checkin">
                  <ActionButton
                    label="Check In"
                    key="asdfeee"
                    icon={<LibraryAddCheck />}
                  />
                </ActionLink>
                <ActionLink url="/checkout">
                  <ActionButton
                    label="Check Out"
                    key="checkout-button"
                    icon={<LibraryAdd />}
                  />
                </ActionLink>
                <ActionLink url="/available">
                  <ActionButton
                    label="Mark Items Available"
                    key="mark-available-button"
                    icon={<CheckCircle />}
                  />
                </ActionLink>
                <ActionLink url="/reshelve">
                  <ActionButton
                    label="Reshelve Items"
                    key="reshelve-button"
                    icon={<Shelves />}
                  />
                </ActionLink>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <RecentTransactionsList />
      <CreateLibraryItemDrawer
        open={create_book_drawer_open}
        loading={create_item_loading}
        on_close={() => set_create_book_drawer_open(false)}
        on_submit={(item_data: Create_Library_Item_Form_Data) => {
          create_item(item_data, {
            onSuccess: () => {
              set_snackbar_message('Library item created successfully!');
              set_success_snackbar_open(true);
            },
          });
        }}
      />
      <NewPatronModal
        open={create_patron_modal_open}
        on_close={function (): void {
          set_create_patron_modal_open(false);
        }}
        on_submit={handle_create_patron}
        is_loading={create_patron_loading}
      />
      {/* Existing book error snackbar */}
      <Snackbar
        anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
        open={Boolean(create_item_error)}
        onClose={() => {}}
        autoHideDuration={6000}
      >
        <Alert severity="error">
          {create_item_error?.message}
          <AlertTitle>{create_item_error?.name}</AlertTitle>
        </Alert>
      </Snackbar>

      {/* Success snackbar for patron creation */}
      <Snackbar
        anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
        open={success_snackbar_open}
        onClose={() => set_success_snackbar_open(false)}
        autoHideDuration={6000}
      >
        <Alert
          severity="success"
          onClose={() => set_success_snackbar_open(false)}
        >
          {snackbar_message}
        </Alert>
      </Snackbar>

      {/* Error snackbar for patron creation */}
      <Snackbar
        anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
        open={error_snackbar_open}
        onClose={() => set_error_snackbar_open(false)}
        autoHideDuration={6000}
      >
        <Alert severity="error" onClose={() => set_error_snackbar_open(false)}>
          {snackbar_message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

type Gradient_Colors = {
  active_primary: string;
  active_secondary: string;
  hover_primary: string;
  hover_secondary: string;
  contrast: string;
};

function ActionButton({
  label,
  icon,
  colors,
  ...remainingProps
}: {
  label: string;
  colors?: Gradient_Colors;
  onClick?: () => void;
  icon: React.ReactNode;
}) {
  const default_colors: Gradient_Colors = {
    active_primary: '#e33259ff',
    active_secondary: '#1d1d90ff',
    hover_primary: '#4d166dff',
    hover_secondary: '#2e94cfff',
    contrast: '#ffffff',
  };

  colors = colors || default_colors;
  return (
    <Button
      fullWidth
      variant="contained"
      color="primary"
      startIcon={icon}
      sx={{
        justifyContent: 'flex-start',
        p: 2,
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        '& .MuiButton-startIcon': { color: colors.contrast },
        background: `linear-gradient(90deg, ${colors.active_primary} 20%, ${colors.active_secondary} 85%)`,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(90deg, ${colors.hover_primary} 20%, ${colors.hover_secondary} 85%)`,
          opacity: 0,
          transition: 'opacity 0.3s ease',
          zIndex: 1,
        },
        '&:hover::before': {
          opacity: 1,
        },
        '& .MuiButton-startIcon, & .MuiButton-endIcon, & > span': {
          position: 'relative',
          zIndex: 2,
        },
      }}
      {...remainingProps}
    >
      <span style={{ color: colors.contrast }}>{label}</span>
    </Button>
  );
}

function ActionLink({ url, children }: PropsWithChildren<{ url: string }>) {
  return (
    <Link to={url} style={{ textDecoration: 'none', display: 'block' }}>
      {children}
    </Link>
  );
}

function StatsCard() {
  const { data, isLoading, error } = useStats();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Typography color="error" variant="body2">
          Failed to load statistics: {error.message}
        </Typography>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box p={2}>
        <Typography color="text.secondary" variant="body2">
          No statistics available
        </Typography>
      </Box>
    );
  }

  const get_overdue_color = (count: number): string => {
    if (count > 10) return 'error.main'; // this is arbitrary, it could be adjusted
    if (count > 0) return 'warning.main';
    return 'inherit';
  };

  const stats_items = [
    { label: 'Total Items', value: data.total_items },
    { label: 'Active Patrons', value: data.total_active_patrons },
    { label: 'Checked Out', value: data.active_checkouts },
    {
      label: 'Overdue',
      value: data.overdue_items,
      color: get_overdue_color(data.overdue_items),
    },
    { label: 'Total Fines', value: `$${data.total_outstanding_fines}` },
  ];

  return (
    <Stack spacing={1} sx={{ height: 1, justifyContent: 'space-evenly' }}>
      {stats_items.map(({ label, value, color }) => (
        <StatItem key={label} label={label} value={value} value_color={color} />
      ))}
    </Stack>
  );
}

function StatItem({
  label,
  value,
  value_color = 'inherit',
}: {
  label: string;
  value: string | number;
  value_color?: string;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        py: 0.5,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}:
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, color: value_color }}>
        {value}
      </Typography>
    </Box>
  );
}
