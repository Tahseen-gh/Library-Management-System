import { Link } from 'react-router-dom';
import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
  Stack,
  useColorScheme,
} from '@mui/material';
import { DarkMode, LightMode, Menu } from '@mui/icons-material';
import { BranchSelector } from './BranchSelector';

export const Header = ({
  sidebarOpen,
  setSidebarOpen,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}) => {
  const theme = useTheme();
  const xsUp = useMediaQuery(theme.breakpoints.up('md'));

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar
        sx={{
          mx: 'auto',
          width: '100%',
          px: { xs: 1, sm: 2, lg: 3 },
          height: '64px',
        }}
      >
        <Stack
          sx={{ flexGrow: 1, alignItems: 'center' }}
          direction="row"
          spacing={1}
        >
          {!xsUp && (
            <IconButton onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu />
            </IconButton>
          )}
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            {xsUp ? 'Wayback Public Library' : 'WPL'}
          </Typography>
        </Stack>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BranchSelector
            width={{ xs: 150, sm: 175, md: 'calc(5rem + 100px)' }}
            size="small"
          />
          <LightDarkToggle />
        </Box>
      </Toolbar>
    </AppBar>
  );
};

const LightDarkToggle = () => {
  const { mode, setMode } = useColorScheme();

  return (
    <IconButton
      onClick={() => setMode(mode !== 'dark' ? 'dark' : 'light')}
      sx={{
        overflow: 'clip',
        position: 'relative',
        width: 40,
        height: 40,
      }}
    >
      <LightMode
        sx={{
          transform: `translateY(${mode === 'dark' ? '40px' : '0px'})`,
          position: 'absolute',
          transitionProperty: 'transform',
          transitionDuration: '300ms',
          transitionTimingFunction: 'ease-in-out',
        }}
      />
      <DarkMode
        sx={{
          transform: `translateY(${mode === 'dark' ? '0px' : '40px'})`,
          position: 'absolute',
          transitionProperty: 'transform',
          transitionDuration: '300ms',
          transitionTimingFunction: 'ease-in-out',
        }}
      />
    </IconButton>
  );
};
