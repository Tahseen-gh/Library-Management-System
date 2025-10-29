import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Stack,
  Button,
} from '@mui/material';
import {
  Assessment,
  History,
  LibraryAdd,
  LibraryAddCheck,
  TrendingUp,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { Logo } from '../components/common/Logo';

export const Home = () => {
  return (
    <Container sx={{ p: 3 }}>
      <Typography
        variant="h3"
        component="h1"
        gutterBottom
        sx={{
          fontWeight: 'bold',
          mb: 3,
          color: 'text.primary',
          fontSize: 'calc(1.5rem + 2vw)',
        }}
      >
        {'Welcome!'}
      </Typography>

      <Grid container sx={{ mb: 2 }} spacing={2}>
        <Grid size={{ xs: 6 }} sx={{ height: { xs: '4rem', sm: '8rem' } }}>
          <Link to="/checkin" style={{ textDecoration: 'none' }}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              startIcon={
                <LibraryAddCheck
                  sx={{
                    fontSize: {
                      xs: '1rem !important',
                      sm: '1.25rem !important',
                      md: '2rem !important',
                      lg: '2.5rem !important',
                      xl: '3rem !important',
                    },
                  }}
                />
              }
              sx={{
                height: '60%',
                fontSize: { xs: '1rem', sm: '1.25rem', md: '2rem' },
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background:
                    'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                },
              }}
            >
              Check In
            </Button>
          </Link>
        </Grid>
        <Grid size={{ xs: 6 }} sx={{ height: { xs: '4rem', sm: '8rem' } }}>
          <Link to="/checkout" style={{ textDecoration: 'none' }}>
            <Button
              fullWidth
              variant="contained"
              color="secondary"
              startIcon={
                <LibraryAdd
                  sx={{
                    fontSize: {
                      xs: '1rem !important',
                      sm: '1.25rem !important',
                      md: '2rem !important',
                      lg: '2.5rem !important',
                      xl: '3rem !important',
                    },
                  }}
                />
              }
              sx={{
                height: '60%',
                fontSize: { xs: '1rem', sm: '1.25rem', md: '2rem' },
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                '&:hover': {
                  background:
                    'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
                },
              }}
            >
              Check Out
            </Button>
          </Link>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }} sx={{ textAlign: 'center' }}>
          <Logo size={'90%'} />
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack sx={{ flexDirection: 'row', alignItems: 'center', mb: 2 }}>
                <Assessment sx={{ mr: 1, color: 'primary.main' }} />
                <Typography
                  variant="h6"
                  component="h2"
                  sx={{ fontWeight: 600 }}
                >
                  Quick Stats
                </Typography>
              </Stack>
              <List dense>
                <ListItem disablePadding>
                  <ListItemText primary="Books Available: 1,250" />
                </ListItem>
                <ListItem disablePadding>
                  <ListItemText primary="Books Checked Out: 95" />
                </ListItem>
                <ListItem disablePadding>
                  <ListItemText primary="Active Members: 340" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack sx={{ flexDirection: 'row', alignItems: 'center', mb: 2 }}>
                <History sx={{ mr: 1, color: 'secondary.main' }} />
                <Typography
                  variant="h6"
                  component="h2"
                  sx={{ fontWeight: 600 }}
                >
                  Recent Activity
                </Typography>
              </Stack>
              <List dense>
                <ListItem disablePadding>
                  <ListItemText
                    primary='• "The Great Gatsby" returned'
                    sx={{ variant: 'body2' }}
                  />
                </ListItem>
                <ListItem disablePadding>
                  <ListItemText
                    primary="• New member registered"
                    sx={{ variant: 'body2' }}
                  />
                </ListItem>
                <ListItem disablePadding>
                  <ListItemText
                    primary='• "1984" checked out'
                    sx={{ variant: 'body2' }}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack sx={{ flexDirection: 'row', alignItems: 'center', mb: 2 }}>
                <TrendingUp sx={{ mr: 1, color: 'success.main' }} />
                <Typography
                  variant="h6"
                  component="h2"
                  sx={{ fontWeight: 600 }}
                >
                  Popular Books
                </Typography>
              </Stack>
              <List dense>
                <ListItem disablePadding>
                  <ListItemText
                    primary='1. "To Kill a Mockingbird"'
                    sx={{ variant: 'body2' }}
                  />
                </ListItem>
                <ListItem disablePadding>
                  <ListItemText
                    primary='2. "Pride and Prejudice"'
                    sx={{ variant: 'body2' }}
                  />
                </ListItem>
                <ListItem disablePadding>
                  <ListItemText
                    primary='3. "The Catcher in the Rye"'
                    sx={{ variant: 'body2' }}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};
