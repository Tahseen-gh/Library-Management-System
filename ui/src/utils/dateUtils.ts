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
