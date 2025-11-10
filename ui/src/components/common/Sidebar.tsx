import { Link, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Home,
  Dashboard,
  SsidChart,
  Groups2,
  Book,
  CheckCircle,
  Output,
  Input,
  Shelves,
} from '@mui/icons-material';
import { type PropsWithChildren } from 'react';

const drawerWidth = 256;

export const Sidebar = ({
  sidebarOpen,
  setSidebarOpen,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}) => {
  const location = useLocation();

  const theme = useTheme();
  const xsUp = useMediaQuery(theme.breakpoints.up('md'));

  const isActive = (path: string) => {
    return (
      location.pathname === path ||
      (path !== '/' && location.pathname.startsWith(path))
    );
  };

  const menu_items = [
    { text: 'Home', path: '/', icon: <Home /> },
    { text: 'Dashboard', path: '/dashboard', icon: <Dashboard /> },
    { text: 'Library Items', path: '/library-items', icon: <Book /> },
    { text: 'Patrons', path: '/patrons', icon: <Groups2 /> },
    { text: 'Transactions', path: '/transactions', icon: <SsidChart /> },
  ];

  const circulation_items = [
    { text: 'Check In', path: '/reshelve', icon: <Input /> },
    {
      text: 'Check Out',
      path: '/checkout',
      icon: <Output sx={{ transform: 'rotate(180deg)' }} />,
    },
    { text: 'Mark Available', path: '/available', icon: <CheckCircle /> },
    { text: 'Reshelve', path: '/reshelve', icon: <Shelves /> },
  ];

  const Get_Drawer_Component = ({ children }: PropsWithChildren) => {
    if (!xsUp) {
      return (
        <Drawer
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          sx={{
            width: drawerWidth * 0.6,
          }}
        >
          {children}
        </Drawer>
      );
    }
    return (
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            position: 'relative',
            height: 'calc(100vh - 64px)',
            top: 0,
          },
        }}
      >
        {children}
      </Drawer>
    );
  };

  return (
    <Get_Drawer_Component>
      <Box sx={{ overflow: 'auto', pt: 2 }}>
        <List>
          {menu_items.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                component={Link}
                to={item.path}
                selected={isActive(item.path)}
                onClick={() => !xsUp && setSidebarOpen(false)}
                sx={{
                  mx: 1,
                  borderRadius: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.50',
                    color: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'primary.100',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive(item.path) ? 'primary.main' : 'inherit',
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  slotProps={{
                    primary: { fontWeight: isActive(item.path) ? 600 : 400 },
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
          <Divider sx={{ my: 1, mx: 2 }} />
          {circulation_items.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                component={Link}
                to={item.path}
                selected={isActive(item.path)}
                onClick={() => !xsUp && setSidebarOpen(false)}
                sx={{
                  mx: 1,
                  borderRadius: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.50',
                    color: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'primary.100',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive(item.path) ? 'primary.main' : 'inherit',
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  slotProps={{
                    primary: { fontWeight: isActive(item.path) ? 600 : 400 },
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Get_Drawer_Component>
  );
};
