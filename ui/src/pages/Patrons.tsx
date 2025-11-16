import { useMediaQuery, Container, useTheme, Box, Button, Stack, Snackbar, Alert } from '@mui/material';
import { PatronsDataGrid } from '../components/patrons/PatronsDataGrid';
import PatronsList from '../components/patrons/PatronsList';
import { RegisterPatronDialog } from '../components/patrons/RegisterPatronDialog';
import { useState } from 'react';
import { Add } from '@mui/icons-material';

export const Patrons = () => {
  const theme = useTheme();
  const xsUp = useMediaQuery(theme.breakpoints.up('sm'));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [successSnackbar, setSuccessSnackbar] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => {
    setSuccessSnackbar(true);
    setRefreshKey((prev) => prev + 1); // Trigger refresh of patron list
  };

  return (
    <Container
      maxWidth="xl"
      sx={{
        p: 3,
        overflow: 'hidden',
        height: 1,
        maxHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box />
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setDialogOpen(true)}
        >
          Register New Patron
        </Button>
      </Stack>

      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {xsUp ? <PatronsDataGrid key={refreshKey} check_overdue={false} /> : <PatronsList />}
      </Box>

      <RegisterPatronDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleSuccess}
      />

      <Snackbar
        open={successSnackbar}
        autoHideDuration={4000}
        onClose={() => setSuccessSnackbar(false)}
        anchorOrigin={{ horizontal: 'center', vertical: 'top' }}
      >
        <Alert severity="success" onClose={() => setSuccessSnackbar(false)}>
          Patron registered successfully!
        </Alert>
      </Snackbar>
    </Container>
  );
};
