import { useState } from 'react';
import { Container, Fab } from '@mui/material';
import { Add } from '@mui/icons-material';
import { LibraryItemDataGrid } from '../components/library_items/LibraryItemGrid';
import { CreateLibraryItemDialog } from '../components/library_items/CreateLibraryItemDialog';

export const LibraryItemsPage = () => {
  const [dialog_open, set_dialog_open] = useState(false);

  const handle_create_library_item = () => {
    set_dialog_open(true);
  };

  const handle_create_library_item_close = () => {
    set_dialog_open(false);
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
        <LibraryItemDataGrid />
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
    </Container>
  );
};
