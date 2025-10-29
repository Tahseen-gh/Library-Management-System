import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Stack,
} from '@mui/material';
import { BookmarkAdd, CheckCircle } from '@mui/icons-material';
import type { Book } from '../../types';

interface BookCardProps {
  book: Book;
  onReserve?: (bookId: string) => void;
  onCheckout?: (bookId: string) => void;
}

export const BookCard: React.FC<BookCardProps> = ({ book }) => {
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.2s ease-in-out',
        '&:hover': {
          boxShadow: 4,
        },
      }}
    >
      {book.cover_img_url && (
        <CardMedia
          component="img"
          height="192"
          image={book.cover_img_url}
          alt={book.title}
          sx={{ objectFit: 'cover' }}
        />
      )}

      <CardContent
        sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}
      >
        <Typography
          variant="h6"
          component="h3"
          gutterBottom
          sx={{ fontWeight: 600 }}
        >
          {book.title}
        </Typography>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          by {book.author}
        </Typography>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          {book.publisher} • {book.publication_year}
        </Typography>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          Genre: {book.genre}
        </Typography>

        {book.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              flexGrow: 1,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {book.description}
          </Typography>
        )}

        <Stack direction="row" spacing={1} sx={{ mt: 'auto' }}>
          <Button
            // onClick={() => onCheckout(book.id)}
            variant="contained"
            startIcon={<CheckCircle />}
            fullWidth
            size="small"
          >
            Checkout
          </Button>
          <Button
            // onClick={() => onReserve(book.id)}
            variant="outlined"
            startIcon={<BookmarkAdd />}
            fullWidth
            size="small"
          >
            Reserve
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};
