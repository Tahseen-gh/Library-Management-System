import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Box,
  Stack,
  Chip,
} from '@mui/material';
import { BookmarkAdd, Info } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import type { Book } from '../../types';

interface BookCatalogCardProps {
  book: Book;
  onDetailsClick: (book: Book) => void;
}

export const BookCatalogCard: React.FC<BookCatalogCardProps> = ({
  book,
  onDetailsClick,
}) => {
  const theme = useTheme();
  const smUp = useMediaQuery(theme.breakpoints.up('md'));
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardMedia
        onClick={() => onDetailsClick(book)}
        sx={{
          height: 150,
          cursor: 'pointer',
        }}
        title={`${book.title}`}
        image={book?.cover_img_url || undefined}
        component={'img'}
      />
      <CardContent
        sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}
      >
        <Typography
          gutterBottom
          variant="h6"
          component="h2"
          onClick={() => onDetailsClick(book)}
          sx={{ cursor: 'pointer' }}
        >
          {book.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {'By: ' + book.author}
        </Typography>
        {(book?.publisher || book?.publication_year) && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {book?.publisher && `Published By: ${book?.publisher}`}
            {book?.publication_year && book?.publisher && ' in '}
            {book?.publication_year && book?.publication_year?.toString()}
          </Typography>
        )}
        {book?.genre && book.genre.length > 0 && (
          <Stack direction={'row'} sx={{ mb: 1 }}>
            {book.genre.map((g) => (
              <Chip key={g} label={g} sx={{ mr: 0.5, mb: 0.5 }} />
            ))}
          </Stack>
        )}
        <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
          <Button
            variant="contained"
            startIcon={<BookmarkAdd />}
            size="small"
            sx={{ flex: 1 }}
          >
            {smUp ? 'Reserve' : ''}
          </Button>
          <Button
            variant="outlined"
            startIcon={<Info />}
            size="small"
            sx={{ flex: 1 }}
            onClick={() => onDetailsClick(book)}
          >
            {smUp ? 'Details' : ''}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};
