import { Drawer } from '@mui/material';

interface DetailsDrawerProps {
  open: boolean;
  handleClose: () => void;
  children: React.ReactNode;
}
export const DetailsDrawer = ({
  open,
  handleClose,
  children,
}: DetailsDrawerProps) => {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: '85%' },
            maxWidth: '1200px',
          },
        },
      }}
    >
      {children}
    </Drawer>
  );
};
