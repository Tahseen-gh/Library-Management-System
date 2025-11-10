import { Chip } from '@mui/material';
import type { JSX } from 'react';
import type { Transaction_Type } from '../../types';

export function TransactionTypeChip({
  status,
}: {
  status: Transaction_Type;
}): JSX.Element {
  switch (status) {
    case 'CHECKOUT':
      return <Chip variant="outlined" label="Checkout" color="info" />;
    case 'CHECKIN':
      return <Chip variant="outlined" label="Checkin" color="primary" />;
    case 'BALANCE':
      return <Chip variant="outlined" label="Balance" color="error" />;
    case 'RENEWAL':
      return <Chip variant="outlined" label="Renewal" color="success" />;
    case 'LOST':
      return <Chip variant="outlined" label="Lost" color="error" />;
    case 'DAMAGED':
      return <Chip variant="outlined" label="Damaged" color="warning" />;
    default:
      return <Chip variant="outlined" label="Unknown" />;
  }
}
