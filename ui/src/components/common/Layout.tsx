import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Box, Stack } from '@mui/material';
import { useState } from 'react';
import { Branch_Provider } from '../../contexts/Branch_Context';

export const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Branch_Provider>
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <Stack direction="row" sx={{ flexGrow: 1, overflow: 'hidden' }}>
          <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <Box
            component="main"
            sx={(theme) => ({
              flexGrow: 1,
              bgcolor: 'background.default',
              width: 1,
              overflow: 'auto',
              '& ::-webkit-scrollbar': { width: '4px', height: '4px' },
              '& ::-webkit-scrollbar-track': {
                background: theme.palette.divider,
                borderRadius: '100vw',
              },
              '& ::-webkit-scrollbar-thumb': {
                backgroundColor: theme.palette.text.primary,
                borderRadius: '100vw',
              },
            })}
          >
            <Outlet />
          </Box>
        </Stack>
      </Branch_Provider>
    </Box>
  );
};
