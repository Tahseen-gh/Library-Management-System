import { format, isAfter, parseISO } from 'date-fns';

export const format_date = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'MMM dd, yyyy');
};

export const format_date_time = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'MMM dd, yyyy HH:mm');
};

export const is_overdue = (due_date: Date): boolean => {
  return isAfter(new Date(), due_date);
};

export const calculate_days_overdue = (due_date: Date): number => {
  if (!is_overdue(due_date)) return 0;

  const now = new Date();
  const diffTime = Math.abs(now.getTime() - due_date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

export const calculate_fine = (
  due_date: Date,
  finePerDay: number = 0.5
): number => {
  const days_overdue = calculate_days_overdue(due_date);
  return days_overdue * finePerDay;
};

/**
 * Calculate due date based on item type
 * Books: 4 weeks (28 days)
 * Movies/Videos: 1 week (7 days)
 * New items (marked as new): 3 days
 * Default: 2 weeks (14 days)
 */
export const calculate_due_date = (
  item_type: string,
  is_new: boolean = false
): Date => {
  const now = new Date();
  let days_to_add = 14; // Default

  if (is_new) {
    days_to_add = 3; // New items: 3 days
  } else if (item_type === 'BOOK' || item_type === 'Book') {
    days_to_add = 28; // Books: 4 weeks
  } else if (
    item_type === 'VIDEO' ||
    item_type === 'Video' ||
    item_type === 'AUDIOBOOK' ||
    item_type === 'Audiobook'
  ) {
    days_to_add = 7; // Movies/Videos: 1 week
  }

  const due_date = new Date(now);
  due_date.setDate(due_date.getDate() + days_to_add);

  return due_date;
};
