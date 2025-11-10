import { useState, type FC } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  Stack,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider,
  Alert,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  LinearProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import {
  Library_Item_Type,
  type Create_Library_Item_Form_Data,
} from '../../types';

export interface LibraryItemFormErrors {
  title: string;
  item_type: string;
  congress_code?: string;
  publication_year?: string;
  description?: string;
}

interface CreateLibraryItemDrawerProps {
  open: boolean;
  loading?: boolean;
  on_close: () => void;
  on_submit: (item_data: Create_Library_Item_Form_Data) => void;
}

const CreateLibraryItemDrawer: FC<CreateLibraryItemDrawerProps> = ({
  open,
  loading = false,
  on_close,
  on_submit,
}) => {
  const [form_data, set_form_data] = useState<Create_Library_Item_Form_Data>({
    title: '',
    item_type: Library_Item_Type.Book,
    congress_code: '',
    publication_year: undefined,
    description: '',
  });

  const [errors, set_errors] = useState<Partial<LibraryItemFormErrors>>({});
  const [submit_error, set_submit_error] = useState<string>('');

  const validate_form = (): boolean => {
    const new_errors: Partial<LibraryItemFormErrors> = {};

    // Required fields validation
    if (!form_data.title.trim()) {
      new_errors.title = 'Title is required';
    }
    if (!form_data.item_type) {
      new_errors.item_type = 'Item type is required';
    }

    // Optional field validations
    if (
      form_data.publication_year &&
      (isNaN(Number(form_data.publication_year)) ||
        Number(form_data.publication_year) < 1000 ||
        Number(form_data.publication_year) > new Date().getFullYear() + 1)
    ) {
      new_errors.publication_year = 'Published year must be a valid year';
    }

    if (
      form_data.congress_code &&
      form_data.congress_code.length > 0 &&
      form_data.congress_code.length < 5
    ) {
      new_errors.congress_code =
        'Library of Congress Code should be at least 5 characters';
    }

    set_errors(new_errors);
    return Object.keys(new_errors).length === 0;
  };

  const handle_input_change = (
    field: keyof Create_Library_Item_Form_Data,
    value: string | number | Library_Item_Type
  ) => {
    set_form_data((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field as keyof LibraryItemFormErrors]) {
      set_errors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
    if (submit_error) {
      set_submit_error('');
    }
  };

  const handle_submit = () => {
    if (validate_form()) {
      try {
        on_submit(form_data);
        handle_clear();
      } catch {
        set_submit_error('Failed to create book. Please try again.');
      }
    }
  };

  const handle_clear = () => {
    set_form_data({
      title: '',
      item_type: Library_Item_Type.Book,
      congress_code: '',
      publication_year: undefined,
      description: '',
    });
    set_errors({});
    set_submit_error('');
  };

  const handle_close = () => {
    handle_clear();
    on_close();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handle_close}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: '85%' },
            maxWidth: '1200px',
          },
        },
      }}
    >
      <Card
        sx={{
          height: '100%',
          borderRadius: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <CardHeader
          sx={(theme) => ({
            bgcolor:
              theme.palette.mode === 'light'
                ? (theme.alpha(theme.palette.primary.light, 0.1) as string)
                : (theme.alpha(theme.palette.primary.dark, 0.1) as string),
          })}
          title={
            <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
              Add New Item
            </Typography>
          }
          action={
            <IconButton onClick={handle_close} size="small">
              <CloseIcon />
            </IconButton>
          }
        />
        <CardContent
          sx={{
            p: 2,
            flex: 1,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <Box
            sx={{
              flex: 1,
              p: 3,
              overflow: 'auto',
              position: 'relative',
              height: 1,
            }}
          >
            {submit_error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {submit_error}
              </Alert>
            )}
            <Stack spacing={3}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, color: 'primary.main' }}
              >
                Required Information
              </Typography>
              <TextField
                label="Title"
                value={form_data.title}
                onChange={(e) => handle_input_change('title', e.target.value)}
                error={!!errors.title}
                helperText={errors.title}
                fullWidth
                required
                variant="outlined"
                disabled={loading}
              />

              <FormControl fullWidth variant="outlined" required>
                <InputLabel>Item Type</InputLabel>
                <Select
                  value={form_data.item_type}
                  onChange={(e) =>
                    handle_input_change(
                      'item_type',
                      e.target.value as Library_Item_Type
                    )
                  }
                  label="Item Type"
                  error={!!errors.item_type}
                  disabled={loading}
                >
                  {Object.values(Library_Item_Type).map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Divider />

              {/* Optional Fields */}
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, color: 'primary.main' }}
              >
                Additional Information (Optional)
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Library of Congress Code"
                  value={form_data.congress_code}
                  onChange={(e) =>
                    handle_input_change('congress_code', e.target.value)
                  }
                  error={!!errors.congress_code}
                  helperText={errors.congress_code}
                  fullWidth
                  variant="outlined"
                  disabled={loading}
                />

                <TextField
                  label="Published Year"
                  type="number"
                  value={form_data.publication_year}
                  onChange={(e) =>
                    handle_input_change(
                      'publication_year',
                      Number(e.target.value)
                    )
                  }
                  error={!!errors.publication_year}
                  helperText={errors.publication_year}
                  fullWidth
                  variant="outlined"
                  disabled={loading}
                />
              </Stack>

              <TextField
                label="Description"
                value={form_data.description}
                onChange={(e) =>
                  handle_input_change('description', e.target.value)
                }
                fullWidth
                multiline
                rows={4}
                variant="outlined"
                placeholder="Brief description of the book..."
                disabled={loading}
              />
            </Stack>
            <LinearProgress
              sx={{
                visibility: loading ? 'visible' : 'hidden',
                width: '50%',
                position: 'absolute',
                margin: 'auto',
                bottom: 0,
                left: '25%',
              }}
            />
          </Box>
        </CardContent>
        <CardActions sx={{ gap: 2, p: 2 }}>
          <Button
            sx={{ p: { xs: 1, sm: 2 } }}
            variant="outlined"
            startIcon={<CloseIcon />}
            onClick={handle_close}
            fullWidth
            disabled={loading}
          >
            Close
          </Button>
          <Button
            sx={{ p: { xs: 1, sm: 2 } }}
            variant="outlined"
            startIcon={<ClearIcon />}
            onClick={handle_clear}
            fullWidth
            disabled={loading}
          >
            Clear Form
          </Button>
          <Button
            sx={{ p: { xs: 1, sm: 2 } }}
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handle_submit}
            fullWidth
            disabled={loading}
          >
            Add Item
          </Button>
        </CardActions>
      </Card>
    </Drawer>
  );
};

export default CreateLibraryItemDrawer;
