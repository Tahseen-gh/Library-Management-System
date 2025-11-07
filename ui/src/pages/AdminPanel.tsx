import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Box,
  Alert,
  Snackbar,
  AlertTitle,
} from '@mui/material';
import { Add, PersonAdd, Assignment, Assessment } from '@mui/icons-material';
import CreateBookDrawer from '../components/books/CreateBookDrawer';
import { useState } from 'react';
import type { Book_Form_Data, Patron_Form_Data } from '../types';
import { useCreateBook } from '../hooks/useBooks';
import { RecentTransactionsList } from '../components/common/RecentTransactionsList';
import NewPatronModal from '../components/patrons/NewPatronModal';
import { useCreatePatron } from '../hooks/usePatrons';

export const AdminPanel = () => {
  const [create_book_drawer_open, set_create_book_drawer_open] =
    useState(false);
  const [create_patron_modal_open, set_create_patron_modal_open] =
    useState(false);
  const [success_snackbar_open, set_success_snackbar_open] = useState(false);
  const [error_snackbar_open, set_error_snackbar_open] = useState(false);
  const [snackbar_message, set_snackbar_message] = useState('');

  const { mutate: createBook, error } = useCreateBook();

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
    <Container sx={{ p: 3 }}>
      {/* Existing book error snackbar */}
      <Snackbar
        anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
        open={Boolean(error)}
        onClose={() => {}}
        autoHideDuration={6000}
      >
        <Alert severity="error">
          {error?.message}
          <AlertTitle>{error?.name}</AlertTitle>
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
      <Typography
        variant="h3"
        component="h1"
        gutterBottom
        sx={{ fontWeight: 'bold', mb: 3 }}
      >
        Admin Panel
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                System Statistics
              </Typography>
              <Box sx={{ space: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 1,
                  }}
                >
                  <Typography color="text.secondary">Total Books:</Typography>
                  <Typography sx={{ fontWeight: 600 }}>1,345</Typography>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 1,
                  }}
                >
                  <Typography color="text.secondary">
                    Active Members:
                  </Typography>
                  <Typography sx={{ fontWeight: 600 }}>340</Typography>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 1,
                  }}
                >
                  <Typography color="text.secondary">
                    Books Checked Out:
                  </Typography>
                  <Typography sx={{ fontWeight: 600 }}>95</Typography>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 1,
                  }}
                >
                  <Typography color="text.secondary">Overdue Books:</Typography>
                  <Typography sx={{ fontWeight: 600, color: 'error.main' }}>
                    12
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">Total Fines:</Typography>
                  <Typography sx={{ fontWeight: 600 }}>$245.50</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  fullWidth
                  sx={{ justifyContent: 'flex-start', p: 2 }}
                  onClick={() => set_create_book_drawer_open(true)}
                >
                  Add New Book
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<PersonAdd />}
                  fullWidth
                  sx={{ justifyContent: 'flex-start', p: 2 }}
                  onClick={() => set_create_patron_modal_open(true)}
                >
                  Register New Member
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<Assignment />}
                  fullWidth
                  sx={{ justifyContent: 'flex-start', p: 2 }}
                >
                  Process Returns
                </Button>
                <Button
                  variant="contained"
                  color="warning"
                  startIcon={<Assessment />}
                  fullWidth
                  sx={{ justifyContent: 'flex-start', p: 2 }}
                >
                  Generate Reports
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <RecentTransactionsList />
      <CreateBookDrawer
        open={create_book_drawer_open}
        onClose={() => set_create_book_drawer_open(false)}
        onSubmit={(bookData: Book_Form_Data) => {
          createBook(bookData);
          set_create_book_drawer_open(false);
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
    </Container>
  );
};
