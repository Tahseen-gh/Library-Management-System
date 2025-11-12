import { Avatar, Chip, Stack, Typography } from '@mui/material';
import type { Patron } from '../../types';
import { isAfter } from 'date-fns';
import { Link } from 'react-router-dom';

const today = new Date();

export function ListViewCell({
  patron,
  color,
}: {
  patron: Patron;
  color: string;
}) {
  const expired_card = isAfter(today, new Date(patron.card_expiration_date));
  return (
    <Stack
      direction="row"
      sx={{
        alignItems: 'center',
        height: '100%',
        gap: 2,
        flex: 1,
      }}
    >
      <Avatar
        src={patron?.image_url}
        sx={{ width: 32, height: 32, bgcolor: color }}
      />
      <Stack
        sx={{
          flexGrow: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link style={{ textDecoration: 'none' }} to={`/patron/${patron.id}`}>
          <Typography variant="body2" fontWeight={500}>
            {patron.first_name} {patron.last_name}
          </Typography>
        </Link>
        <Chip
          label={expired_card ? 'Expired' : 'Active'}
          color={expired_card ? 'warning' : 'success'}
          size={'small'}
          variant="outlined"
        />
      </Stack>
      {/* <Stack direction="row" sx={{ gap: 0.5 }}>
        <EditAction {...props} />
        <DeleteAction {...props} />
      </Stack> */}
    </Stack>
  );
}
