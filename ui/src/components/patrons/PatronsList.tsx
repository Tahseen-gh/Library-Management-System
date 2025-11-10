import { type FC } from 'react';
import { List, ListItem, Skeleton } from '@mui/material';
import { ListViewCell } from '../common/ListViewCell';
import { blueberryTwilightPalette } from '@mui/x-charts/colorPalettes';
import { useAllPatrons } from '../../hooks/usePatrons';

const colors = blueberryTwilightPalette('dark'); // 6 colors available

const PatronsList: FC = () => {
  const { data: patrons = [], isLoading: loading } = useAllPatrons();

  if (loading) {
    return <Skeleton variant="rectangular" height={'40vh'} />;
  }

  return (
    <List
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        py: 0,
      }}
    >
      {patrons.map((patron, index) => (
        <ListItem
          key={patron.id}
          sx={{
            borderBottom: index < patrons.length - 1 ? '1px solid' : 'none',
            borderColor: 'divider',
            bgcolor: index % 2 === 0 ? 'background.paper' : '#1811d610',
          }}
        >
          <ListViewCell
            key={patron.id}
            patron={patron}
            color={colors[index % colors.length]}
          />
        </ListItem>
      ))}
    </List>
  );
};
export default PatronsList;
