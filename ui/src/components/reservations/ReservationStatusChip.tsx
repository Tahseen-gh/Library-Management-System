import { Chip } from '@mui/material';
import type { JSX } from 'react';
import type { ReservationStatus } from '../../types';

export function ReservationStatusChip({
  status,
}: {
  status: ReservationStatus;
}): JSX.Element {
  switch (status) {
    case 'pending':
      return <Chip variant="outlined" label="Pending" color="info" />;
    case 'fulfilled':
      return <Chip variant="outlined" label="Fulfilled" color="primary" />;
    case 'cancelled':
      return <Chip variant="outlined" label="Cancelled" color="error" />;
    case 'ready':
      return <Chip variant="outlined" label="Ready" color="success" />;
    case 'expired':
      return <Chip variant="outlined" label="Expired" color="warning" />;
    default:
      return <Chip variant="outlined" label="Unknown" />;
  }
}
