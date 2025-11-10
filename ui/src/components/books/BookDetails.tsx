import { type FC } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Divider,
  Stack,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  MenuBook as BookIcon,
  Person as AuthorIcon,
  Business as PublisherIcon,
} from '@mui/icons-material';
import type { Book } from '../../types';

interface BookDetailsProps {
  book: Book | null;
  onClose: () => void;
}

const BookDetails: FC<BookDetailsProps> = ({ book, onClose }) => {
  if (!book) return null;

  return (
    <Stack
      sx={{
        width: { xs: '100vw', sm: '75vw', md: '60vw' },
        maxWidth: '1200px',
        minWidth: '360px',
        overflow: 'hidden',
        height: '100%',
      }}
    >
      <Stack
        direction="row"
        sx={{
          p: 2,
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
          Book Details
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Stack>

      {/* Content */}
      <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
        <Stack spacing={3} gap={1}>
          {/* Title */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <BookIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="subtitle2" color="text.secondary">
                Title
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 500, mb: 1 }}>
              {book.title}
            </Typography>
          </Box>

          <Divider sx={{ m: '0 !important' }} />

          {/* Author */}
          <Box>
            <Stack flexDirection={'row'} sx={{ alignItems: 'center', mb: 1 }}>
              <AuthorIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="subtitle2" color="text.secondary">
                Author
              </Typography>
            </Stack>
            <Typography variant="body1">{book.author}</Typography>
          </Box>

          <Divider sx={{ m: '0 !important' }} />

          {/* Publisher */}
          <Box>
            <Stack flexDirection={'row'} sx={{ alignItems: 'center', mb: 1 }}>
              <PublisherIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="subtitle2" color="text.secondary">
                Publisher
              </Typography>
            </Stack>
            <Typography variant="body1">{book.publisher}</Typography>
          </Box>

          <Divider sx={{ m: '0 !important' }} />

          {/* Optional fields */}
          {book?.congress_code && (
            <>
              <Divider sx={{ m: '0 !important' }} />
              <Box>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Library of Congress Code
                </Typography>
                <Typography variant="body1">{book.congress_code}</Typography>
              </Box>
            </>
          )}

          {book.publication_year && (
            <>
              <Divider sx={{ m: '0 !important' }} />
              <Box>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Published Year
                </Typography>
                <Typography variant="body1">{book.publication_year}</Typography>
              </Box>
            </>
          )}

          {book.genre && (
            <>
              <Divider sx={{ m: '0 !important' }} />
              <Box>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Genre
                </Typography>
                <Stack direction={'row'} gap={1}>
                  {book.genre.map((g) => (
                    <Chip key={g} label={g} variant="filled" color="info" />
                  ))}
                </Stack>
              </Box>
            </>
          )}

          {book.description && (
            <>
              <Divider sx={{ m: '0 !important' }} />
              <Box>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Description
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ lineHeight: 1.6 }}
                >
                  {book.description}
                </Typography>
              </Box>
            </>
          )}
        </Stack>
      </Box>
    </Stack>
  );
};

export default BookDetails;
