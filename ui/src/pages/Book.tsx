import {
  Container,
  Typography,
  Paper,
  Stack,
  Box,
  Chip,
  Card,
  CardContent,
  Alert,
  Skeleton,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { useBook } from '../hooks/useBooks';
import { useCopies } from '../hooks/useCopies';
import { useBranchesContext } from '../hooks/useBranchHooks';
import { CopiesTable } from '../components/library_items/LibraryItemCopiesTable';

export const BookPage = () => {
  const { book_id } = useParams();

  const {
    data: book,
    isLoading: bookLoading,
    error: bookError,
  } = useBook(book_id ?? '');
  const {
    data: copies,
    isLoading: copiesLoading,
    error: copiesError,
  } = useCopies(book?.library_item_id ?? '');
  const { branches } = useBranchesContext();

  if (bookLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Skeleton variant="rectangular" height={60} />
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
            <Box sx={{ flex: 2 }}>
              <Skeleton variant="rectangular" height={400} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="rectangular" height={300} />
            </Box>
          </Stack>
        </Stack>
      </Container>
    );
  }

  if (bookError || !book) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{bookError?.message || 'Book not found'}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Stack gap={2}>
        {/* Header Section */}
        <Paper elevation={0}>
          <Stack spacing={2}>
            <Typography
              variant="h3"
              component="h1"
              fontWeight="bold"
              fontSize={{ xs: '1.75rem', sm: '2rem' }}
            >
              {book.title}
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="h6" color="text.secondary">
                by {book.author || 'Unknown Author'}
              </Typography>
              <Chip
                label={book.publisher || 'Unknown Publisher'}
                variant="outlined"
              />
            </Stack>
          </Stack>
        </Paper>

        <Stack direction={{ md: 'column', lg: 'row' }} gap={2}>
          {/* Main Content */}
          <Box sx={{ flex: 2 }}>
            <Stack spacing={3}>
              {/* Description */}
              {book.description && (
                <Card elevation={1}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Description
                    </Typography>
                    <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                      {book.description}
                    </Typography>
                  </CardContent>
                </Card>
              )}

              <Card elevation={1} sx={{ maxWidth: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Copies
                  </Typography>
                  {copiesLoading ? (
                    <Skeleton variant="rectangular" height={200} />
                  ) : copiesError ? (
                    <Alert severity="error">
                      Failed to load copies information
                    </Alert>
                  ) : copies && copies.length > 0 ? (
                    <CopiesTable copies={copies} branches={branches} />
                  ) : (
                    <Alert severity="info">
                      No copies available for this book
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Stack>
          </Box>

          {/* Sidebar */}
          <Box
            width={{ md: '100%', lg: 'auto' }}
            sx={{
              flex: 1,
              minWidth: { lg: 180, md: 'inherit' },
              maxWidth: { lg: 300, md: 'inherit' },
            }}
          >
            <Stack width="100%" direction={{ md: 'row', lg: 'column' }} gap={2}>
              {/* Book Details */}

              <Card elevation={1} sx={{ flex: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Book Details
                  </Typography>
                  <Stack
                    sx={{
                      flexDirection: { md: 'row', lg: 'column' },
                      justifyContent: { md: 'space-between', lg: 'flex-start' },
                      alignItems: { md: 'center', lg: 'flex-start' },
                    }}
                    spacing={2}
                  >
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        {'LOC Code'}
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ fontFamily: 'monospace' }}
                      >
                        {book.congress_code}
                      </Typography>
                    </Box>

                    {book.publication_year && (
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Year Published
                        </Typography>
                        <Typography variant="body1">
                          {book.publication_year}
                        </Typography>
                      </Box>
                    )}

                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Publisher
                      </Typography>
                      <Typography variant="body1">
                        {book.publisher || 'Unknown'}
                      </Typography>
                    </Box>

                    {book.number_of_pages && (
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Pages
                        </Typography>
                        <Typography variant="body1">
                          {book.number_of_pages}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>

              <Paper
                sx={{
                  height: 1,
                  overflow: 'clip',
                  background: `url(${
                    book?.cover_image_url ||
                    'https://m.media-amazon.com/images/I/81aY1lxk+9L._AC_UF1000,1000_QL80_.jpg'
                  })`,
                  backgroundPosition: 'center',
                  boxShadow: 3,
                }}
                elevation={1}
              >
                <Container
                  sx={{
                    height: '150px',
                    textAlign: 'center',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <img
                    src={
                      book?.cover_image_url ||
                      'https://m.media-amazon.com/images/I/81aY1lxk+9L._AC_UF1000,1000_QL80_.jpg'
                    }
                    alt={book.title}
                    style={{ height: '100%', objectFit: 'cover' }}
                  />
                </Container>
              </Paper>

              {/* Genres */}
              {book.genre && book.genre.length > 0 && (
                <Card elevation={1} sx={{ flex: 1 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Genres
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1}
                      flexWrap="wrap"
                      useFlexGap
                    >
                      {book.genre.map((genre) => (
                        <Chip
                          key={genre}
                          label={genre}
                          variant="filled"
                          color="primary"
                          size="small"
                        />
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              )}
            </Stack>
          </Box>
        </Stack>
      </Stack>
    </Container>
  );
};
