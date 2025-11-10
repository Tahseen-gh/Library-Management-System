import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Box,
  Chip,
  Divider,
} from '@mui/material';
import { Autorenew, Assignment, Cancel } from '@mui/icons-material';

export const MyBooks = () => {
  const currentBooks = [
    {
      id: 1,
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      dueDate: '2025-10-25',
      status: 'checked_out',
    },
    {
      id: 2,
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      dueDate: '2025-10-22',
      status: 'overdue',
    },
  ];

  const reservations = [
    {
      id: 3,
      title: '1984',
      author: 'George Orwell',
      position: 2,
      estimatedDate: '2025-11-01',
    },
  ];

  return (
    <Container sx={{ p: 3 }}>
      <Typography
        variant="h3"
        component="h1"
        gutterBottom
        sx={{ fontWeight: 'bold', mb: 3 }}
      >
        My Books
      </Typography>

      {/* Currently Checked Out */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h5"
          component="h2"
          gutterBottom
          sx={{ fontWeight: 600, mb: 2 }}
        >
          Currently Checked Out
        </Typography>
        <Card>
          {currentBooks.length > 0 ? (
            currentBooks.map((book, index) => (
              <Box key={book.id}>
                <CardContent
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Box>
                    <Typography variant="h6" component="h3" gutterBottom>
                      {book.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      by {book.author}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant="body2"
                        color={
                          book.status === 'overdue' ? 'error' : 'text.secondary'
                        }
                      >
                        Due: {book.dueDate}
                      </Typography>
                      {book.status === 'overdue' && (
                        <Chip label="OVERDUE" color="error" size="small" />
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      startIcon={<Autorenew />}
                      size="small"
                    >
                      Renew
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Assignment />}
                      size="small"
                    >
                      Return
                    </Button>
                  </Box>
                </CardContent>
                {index < currentBooks.length - 1 && <Divider />}
              </Box>
            ))
          ) : (
            <CardContent>
              <Typography color="text.secondary" align="center">
                No books currently checked out
              </Typography>
            </CardContent>
          )}
        </Card>
      </Box>

      {/* Reservations */}
      <Box>
        <Typography
          variant="h5"
          component="h2"
          gutterBottom
          sx={{ fontWeight: 600, mb: 2 }}
        >
          Reservations
        </Typography>
        <Card>
          {reservations.length > 0 ? (
            reservations.map((book, index) => (
              <Box key={book.id}>
                <CardContent
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Box>
                    <Typography variant="h6" component="h3" gutterBottom>
                      {book.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      by {book.author}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Position in queue: {book.position} | Estimated
                      availability: {book.estimatedDate}
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Cancel />}
                    size="small"
                  >
                    Cancel Reservation
                  </Button>
                </CardContent>
                {index < reservations.length - 1 && <Divider />}
              </Box>
            ))
          ) : (
            <CardContent>
              <Typography color="text.secondary" align="center">
                No active reservations
              </Typography>
            </CardContent>
          )}
        </Card>
      </Box>
    </Container>
  );
};
