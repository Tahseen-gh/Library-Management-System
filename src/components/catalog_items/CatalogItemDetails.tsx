import { Stack, Typography, Box, Paper } from '@mui/material';
import type { Branch, Catalog_Item } from '../../types';
import { Library_Item_Type } from '../../types';
import { DetailsDrawer } from '../common/DetailsDrawer';
import { useCopies } from '../../hooks/useCopies';
import { useBranches } from '../../hooks/useBranches';
import { CopiesTable } from './CopiesTable';
import HeadsetIcon from '@mui/icons-material/Headset';
import { MenuBook, Newspaper, PersonalVideo } from '@mui/icons-material';

interface ItemDetailsProps {
  is_open: boolean;
  item: Catalog_Item | null;
  onClose: () => void;
}

interface ItemInfoField {
  label: string;
  value: string | number | undefined;
}

interface LayoutConfig {
  title: string;
  fields: ItemInfoField[];
  descriptionTitle: string;
  icon?: React.ReactNode;
}

const getLayoutConfig = (item: Catalog_Item): LayoutConfig => {
  switch (item.item_type) {
    case Library_Item_Type.Book:
      return {
        title: 'Book Information',
        descriptionTitle: 'Synopsis',
        fields: [
          { label: 'ISBN', value: item.id },
          { label: 'Publication Year', value: item.publication_year },
          { label: 'Genre', value: 'Literature' },
          { label: 'Pages', value: 'Estimated 300-400' },
        ],
        icon: <MenuBook fontSize="large" />,
      };
    case Library_Item_Type.Periodical:
      return {
        title: 'Periodical Details',
        descriptionTitle: 'Contents Overview',
        fields: [
          { label: 'Issue ID', value: item.id },
          { label: 'Publication Date', value: item.publication_year },
          { label: 'Frequency', value: 'Monthly' },
          { label: 'Publisher', value: 'Academic Press' },
        ],
        icon: <Newspaper fontSize="large" />,
      };
    case Library_Item_Type.Recording:
      return {
        title: 'Album Information',
        descriptionTitle: 'Album Description',
        fields: [
          { label: 'Catalog Number', value: item.id },
          { label: 'Release Year', value: item.publication_year },
          { label: 'Duration', value: 'Approx. 45-60 minutes' },
          { label: 'Format', value: 'CD/Vinyl' },
        ],
        icon: <HeadsetIcon fontSize="large" />,
      };
    case Library_Item_Type.Video:
      return {
        title: 'Video Details',
        descriptionTitle: 'Plot Summary',
        fields: [
          { label: 'Video ID', value: item.id },
          { label: 'Release Year', value: item.publication_year },
          { label: 'Runtime', value: 'Feature Length' },
          { label: 'Format', value: 'DVD/Blu-ray' },
        ],
        icon: <PersonalVideo fontSize="large" />,
      };
    case Library_Item_Type.Magazine:
      return {
        title: 'Magazine Information',
        descriptionTitle: 'Featured Articles',
        fields: [
          { label: 'Issue Number', value: item.id },
          { label: 'Publication Date', value: item.publication_year },
          { label: 'Volume', value: 'Current Issue' },
          { label: 'Category', value: 'General Interest' },
        ],
      };
    case Library_Item_Type.Audiobook:
      return {
        title: 'Audiobook Details',
        descriptionTitle: 'Story Overview',
        fields: [
          { label: 'Audiobook ID', value: item.id },
          { label: 'Publication Year', value: item.publication_year },
          { label: 'Duration', value: '8-12 hours' },
          { label: 'Narrator', value: 'Professional Voice Actor' },
        ],
        icon: <MenuBook fontSize="large" />,
      };
    default:
      return {
        title: 'Item Information',
        descriptionTitle: 'Description',
        fields: [
          { label: 'Item ID', value: item.id },
          { label: 'Publication Year', value: item.publication_year },
        ],
      };
  }
};

const ItemLayout = ({
  item,
  branches,
}: {
  item: Catalog_Item;
  branches: Branch[];
}) => {
  const config = getLayoutConfig(item);

  return (
    <Stack spacing={2}>
      <ItemInfoSection title={config.title} fields={config.fields} />
      <DescriptionSection
        title={config.descriptionTitle}
        description={item.description}
      />
      <CopiesSection item={item} branches={branches} />
    </Stack>
  );
};

const ItemInfoSection = ({
  title,
  fields,
}: {
  title: string;
  fields: ItemInfoField[];
}) => (
  <Paper elevation={1} sx={{ p: 2 }}>
    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
      {title}
    </Typography>
    <Stack spacing={1}>
      {fields.map(
        (field, index) =>
          field.value && (
            <Typography key={index} variant="body2">
              <strong>{field.label}:</strong> {field.value}
            </Typography>
          )
      )}
    </Stack>
  </Paper>
);

const DescriptionSection = ({
  title,
  description,
}: {
  title: string;
  description?: string;
}) => {
  if (!description) return null;
  return (
    <Paper elevation={1} sx={{ p: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body1">{description}</Typography>
    </Paper>
  );
};

const CopiesSection = ({
  item,
  branches,
}: {
  item: Catalog_Item;
  branches: Branch[];
}) => {
  const { data: copies, isLoading: loading, error } = useCopies(item.id);

  return (
    <Paper elevation={1} sx={{ py: 2, px: 0 }}>
      <Typography
        sx={{ pl: 2 }}
        variant="subtitle2"
        color="text.secondary"
        gutterBottom
      >
        Available Copies
      </Typography>
      {loading && <Typography variant="body2">Loading...</Typography>}
      {error && (
        <Typography variant="body2" color="error">
          {error.message}
        </Typography>
      )}
      {!loading && !error && copies && (
        <CopiesTable copies={copies} branches={branches} />
      )}
    </Paper>
  );
};

export const CatalogItemDetails = ({
  is_open,
  item,
  onClose,
}: ItemDetailsProps) => {
  const { data: branches } = useBranches();
  if (!item) {
    return (
      <DetailsDrawer open={is_open} handleClose={onClose}>
        <Box p={3}>
          <Typography variant="h6" color="text.secondary">
            No item selected
          </Typography>
        </Box>
      </DetailsDrawer>
    );
  }

  const config = getLayoutConfig(item);

  return (
    <DetailsDrawer open={is_open} handleClose={onClose}>
      <Box p={3}>
        <Stack spacing={3}>
          <Stack spacing={2} direction={'row'} sx={{ alignItems: 'center' }}>
            {config?.icon && config.icon}
            <Typography variant="h4" component="h1">
              {item.title}
            </Typography>
          </Stack>
          <ItemLayout item={item} branches={branches || []} />
        </Stack>
      </Box>
    </DetailsDrawer>
  );
};
