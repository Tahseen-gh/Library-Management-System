import {
  QuestionMark,
  ChromeReaderMode,
  MenuBook,
  Newspaper,
  Mic,
  YouTube,
  Album,
} from '@mui/icons-material';
import { Chip } from '@mui/material';
import type { JSX } from 'react';
import type { Library_Item_Type } from '../../types';

type Item_Type_Config = {
  label: string;
  icon: JSX.Element;
};

const ITEM_TYPE_MAP: Record<Library_Item_Type, Item_Type_Config> = {
  BOOK: { label: 'Book', icon: <ChromeReaderMode /> },
  MAGAZINE: { label: 'Magazine', icon: <MenuBook /> },
  PERIODICAL: { label: 'Periodical', icon: <Newspaper /> },
  RECORDING: { label: 'Recording', icon: <Mic /> },
  AUDIOBOOK: { label: 'Audiobook', icon: <ChromeReaderMode /> },
  VIDEO: { label: 'Video', icon: <YouTube /> },
  CD: { label: 'CD', icon: <Album /> },
  VINYL: { label: 'Vinyl', icon: <Album /> },
};

const ItemTypeChip = ({ item_type }: { item_type: Library_Item_Type }) => {
  const { label, icon } = ITEM_TYPE_MAP[item_type] ?? {
    label: 'Unknown',
    icon: <QuestionMark />,
  };

  return <Chip variant="outlined" color="info" label={label} icon={icon} />;
};

export default ItemTypeChip;
