import type { JSX, PropsWithChildren } from 'react';
import { Container, Typography, Fab } from '@mui/material';
import { useState, memo } from 'react';
import { Add } from '@mui/icons-material';
import { LibraryItemGrid } from '../components/library_items/LibraryItemGrid';
import { CreateLibraryItemDialog } from '../components/library_items/CreateLibraryItemDialog';

export const LibraryItemsPage = memo(({ children }: PropsWithChildren) => {
  return (
    <Container sx={{ p: 3 }}>
      <Typography
        variant="h3"
        component="h1"
        gutterBottom
        sx={{ fontWeight: 'bold', mb: 3 }}
      >
        Items
      </Typography>
      {children}
    </Container>
  );
});

export const LibraryItemsContent = (): JSX.Element => {
  const [dialog_open, set_dialog_open] = useState(false);

  const handle_create_library_item = () => {
    set_dialog_open(true);
  };

  const handle_create_library_item_close = () => {
    set_dialog_open(false);
  };

  return (
    <>
      <LibraryItemGrid />
      <Fab
        color="primary"
        onClick={handle_create_library_item}
        aria-label="Add library item"
        title="Add library item"
        sx={{
          position: 'fixed',
          bottom: '3vh',
          right: '3vh',
        }}
      >
        <Add />
      </Fab>
      <CreateLibraryItemDialog
        open={dialog_open}
        on_close={handle_create_library_item_close}
      />
    </>
  );
};
