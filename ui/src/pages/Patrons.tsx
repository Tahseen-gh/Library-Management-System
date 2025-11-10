import {
  useMediaQuery,
  Container,
  Typography,
  useTheme,
  Box,
  Button,
  ButtonGroup,
  Stack,
} from '@mui/material';
import { useState } from 'react';
import { PatronsDataGrid } from '../components/patrons/PatronsDataGrid';
import PatronsList from '../components/patrons/PatronsList';
import type { GridDensity } from '@mui/x-data-grid';

export const Patrons = () => {
  const theme = useTheme();
  const xsUp = useMediaQuery(theme.breakpoints.up('sm'));
  const [error, setError] = useState<string | null>(null);
  const [density, set_density] = useState<GridDensity>('standard');

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  return (
    <Container
      maxWidth="lg"
      sx={{
        p: 3,
        overflow: 'hidden',
        height: 1,
        maxHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}
        >
          Patrons
        </Typography>
        {xsUp && (
          <ButtonGroup title="Grid density">
            <Button
              variant={density === 'compact' ? 'contained' : 'outlined'}
              onClick={() => set_density('compact')}
            >
              Compact
            </Button>
            <Button
              variant={density === 'standard' ? 'contained' : 'outlined'}
              onClick={() => set_density('standard')}
            >
              Standard
            </Button>
            <Button
              variant={density === 'comfortable' ? 'contained' : 'outlined'}
              onClick={() => set_density('comfortable')}
            >
              Comfortable
            </Button>
          </ButtonGroup>
        )}
      </Stack>
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          Error: {error}
        </Typography>
      )}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {xsUp ? (
          <PatronsDataGrid
            check_overdue={false}
            density={density}
            onError={handleError}
          />
        ) : (
          <PatronsList />
        )}
      </Box>
    </Container>
  );
};
