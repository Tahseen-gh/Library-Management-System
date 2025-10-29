import { blueberryTwilightPalette } from '@mui/x-charts/colorPalettes';
import { Library_Item_Type } from '../types';

type ChipColor =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'error'
  | 'info'
  | 'success'
  | 'warning';

const CHIP_COLORS = blueberryTwilightPalette('dark');

const ITEM_TYPE_COLOR_MAP: Record<Library_Item_Type, string> = {
  [Library_Item_Type.Book]: CHIP_COLORS[0],
  [Library_Item_Type.Magazine]: CHIP_COLORS[1],
  [Library_Item_Type.Periodical]: CHIP_COLORS[2],
  [Library_Item_Type.Recording]: CHIP_COLORS[3],
  [Library_Item_Type.Audiobook]: CHIP_COLORS[4],
  [Library_Item_Type.Video]: CHIP_COLORS[5],
};

const STATUS_COLOR_MAP: Record<string, ChipColor> = {
  Available: 'success',
  'Checked Out': 'warning',
  Maintenance: 'warning',
  Reserved: 'info',
  Processing: 'secondary',
  Damaged: 'error',
  Lost: 'error',
};

const CONDITION_COLOR_MAP: Record<string, ChipColor> = {
  New: 'success',
  Good: 'success',
  Excellent: 'success',
  Fair: 'primary',
  Poor: 'warning',
};

export const get_color_for_item_type = (item_type: string): string => {
  return ITEM_TYPE_COLOR_MAP[item_type as Library_Item_Type] ?? 'default';
};

export const get_status_color = (status: string): ChipColor => {
  return STATUS_COLOR_MAP[status] ?? 'default';
};

export const get_condition_color = (condition?: string): ChipColor => {
  return condition ? (CONDITION_COLOR_MAP[condition] ?? 'default') : 'default';
};
