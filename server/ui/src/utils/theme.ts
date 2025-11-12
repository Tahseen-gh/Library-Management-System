import { createTheme } from '@mui/material';

const theme = createTheme({
  colorSchemes: { dark: true, light: true },
  components: {
    // Name of the component
    MuiTypography: {
      defaultProps: {
        color: 'textPrimary',
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          ':last-child': {
            paddingBottom: '8px',
          },
        },
      },
      defaultProps: {
        sx: {
          pb: '16px !important',
        },
      },
    },
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true, // No more ripple, on the whole application 💣!
      },
    },
  },
});

export default theme;
