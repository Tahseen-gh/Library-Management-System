import { Chip } from '@mui/material';
import type { JSX } from 'react';
import type { Transaction_Status } from '../../types';

export function TransactionStatusChip({
  status,
}: {
  status: Transaction_Status;
}): JSX.Element {
  switch (status) {
    case 'Active':
      return <Chip variant="outlined" label="Active" color="info" />;
    case 'Returned':
      return <Chip variant="outlined" label="Returned" color="primary" />;
    case 'Overdue':
      return <Chip variant="outlined" label="Overdue" color="error" />;
    case 'Lost':
      return <Chip variant="outlined" label="Lost" color="success" />;
    case 'Completed':
      return <Chip variant="outlined" label="Completed" color="warning" />;
    default:
      return <Chip variant="outlined" label="Unknown" />;
  }
}
