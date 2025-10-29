import type { JSX, PropsWithChildren } from 'react';
import { Container, Typography, Fab } from '@mui/material';
import React, { useState } from 'react';
import { Add } from '@mui/icons-material';
import { CatalogItemGrid } from '../components/catalog_items/CatalogItemGrid';
import { CreateCatalogItemDialog } from '../components/catalog_items/CreateCatalogItemDialog';

export const ItemCatalog = React.memo(({ children }: PropsWithChildren) => {
  return (
    <Container sx={{ p: 3 }}>
      <Typography
        variant="h3"
        component="h1"
        gutterBottom
        sx={{ fontWeight: 'bold', mb: 3 }}
      >
        Catalog
      </Typography>
      {children}
    </Container>
  );
});

export const ItemCatalogContent = (): JSX.Element => {
  const [dialog_open, set_dialog_open] = useState(false);

  const handle_create_catalog_item = () => {
    set_dialog_open(true);
  };

  const handle_create_catalog_item_close = () => {
    set_dialog_open(false);
  };

  return (
    <>
      <CatalogItemGrid />
      <Fab
        color="primary"
        onClick={handle_create_catalog_item}
        aria-label="Add catalog item"
        title="Add catalog item"
        sx={{
          position: 'fixed',
          bottom: '3vh',
          right: '3vh',
        }}
      >
        <Add />
      </Fab>
      <CreateCatalogItemDialog
        open={dialog_open}
        onClose={handle_create_catalog_item_close}
      />
    </>
  );
};
