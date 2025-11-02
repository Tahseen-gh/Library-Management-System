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
  [Library_Item_Type.BOOK]: CHIP_COLORS[0], // Changed from Book
  [Library_Item_Type.VIDEO]: CHIP_COLORS[5], // Changed from Video
  [Library_Item_Type.AUDIOBOOK]: CHIP_COLORS[4], // Changed from Audiobook
};

const STATUS_COLOR_MAP: Record<string, ChipColor> = {
  available: 'success', // Changed from 'Available'
  borrowed: 'warning', // Changed from 'Checked Out'
  maintenance: 'warning', // Changed from 'Maintenance'
  reserved: 'info', // Changed from 'Reserved'
  damaged: 'error', // Changed from 'Damaged'
  lost: 'error', // Changed from 'Lost'
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