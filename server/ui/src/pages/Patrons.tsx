import { useMediaQuery, Container, useTheme, Box } from '@mui/material';
import { PatronsDataGrid } from '../components/patrons/PatronsDataGrid';
import PatronsList from '../components/patrons/PatronsList';

export const Patrons = () => {
  const theme = useTheme();
  const xsUp = useMediaQuery(theme.breakpoints.up('sm'));
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
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {xsUp ? <PatronsDataGrid check_overdue={false} /> : <PatronsList />}
      </Box>
    </Container>
  );
};
