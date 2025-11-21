import { useState } from 'react';
import { Container, Box, Button, Typography } from '@mui/material';
import { Add } from '@mui/icons-material';
import { useQueryClient } from '@tanstack/react-query';
import { LibraryItemDataGrid } from '../components/library_items/LibraryItemGrid';
import { CreateLibraryItemDialog } from '../components/library_items/CreateLibraryItemDialog';

export const LibraryItemsPage = () => {
  const [dialog_open, set_dialog_open] = useState(false);
  const queryClient = useQueryClient();

  const handle_create_library_item = () => {
    set_dialog_open(true);
  };

  const handle_create_library_item_close = () => {
    set_dialog_open(false);
  };

  const handle_create_library_item_success = () => {
    // Invalidate queries to refresh the data after creating item and copies
    queryClient.invalidateQueries({ queryKey: ['library_items'] });
    queryClient.invalidateQueries({ queryKey: ['item_copies'] });
  };
  return (
    <Container
      sx={{
        p: 3,
        maxHeight: '100%',
        overflow: 'hidden',
        height: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Typography variant="h5" component="h1">
            Library Items
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={handle_create_library_item}
            aria-label="Add library item"
          >
            Add Item
          </Button>
        </Box>
        <LibraryItemDataGrid />
        <CreateLibraryItemDialog
          open={dialog_open}
          on_close={handle_create_library_item_close}
          on_success={handle_create_library_item_success}
        />
      </>
    </Container>
  );
};
