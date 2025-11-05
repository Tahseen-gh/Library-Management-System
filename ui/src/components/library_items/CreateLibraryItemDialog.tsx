import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import {
  type Create_Library_Item_Form_Data,
  Library_Item_Type,
} from '../../types';
import { validate_required, validate_year } from '../../utils/validators';
import { data_service } from '../../services/dataService';

interface CreateLibraryItemDialogProps {
  open: boolean;
  on_close: () => void;
  on_success?: () => void;
}

export const CreateLibraryItemDialog = ({
  open,
  on_close,
  on_success,
}: CreateLibraryItemDialogProps) => {
  const [form_data, set_form_data] = useState<Create_Library_Item_Form_Data>({
    title: '',
    item_type: Library_Item_Type.Book,
    description: '',
    publication_year: undefined,
    congress_code: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, set_is_submitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleInputChange =
    (field: keyof Create_Library_Item_Form_Data) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      set_form_data((prev) => ({
        ...prev,
        [field]:
          field === 'publication_year'
            ? value
              ? parseInt(value)
              : undefined
            : value,
      }));

      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    };

  const handle_select_change = (
    event: SelectChangeEvent<Library_Item_Type>
  ) => {
    set_form_data((prev) => ({
      ...prev,
      item_type: event.target.value as Library_Item_Type,
    }));
  };

  const validate_form = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Title is required
    if (!validate_required(form_data.title)) {
      newErrors.title = 'Title is required';
    }

    // Validate publication year if provided
    if (
      form_data.publication_year &&
      !validate_year(form_data.publication_year)
    ) {
      newErrors.publication_year = 'Invalid year';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handle_submit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validate_form()) {
      return;
    }

    set_is_submitting(true);
    setSubmitError(null);

    try {
      await data_service.create_library_item(form_data);

      // Reset form
      set_form_data({
        title: '',
        item_type: Library_Item_Type.Book,
        description: '',
        publication_year: undefined,
        congress_code: '',
      });

      on_success?.();
      on_close();
    } catch (error: Error | unknown) {
      console.error('Error creating library item:', error);
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to create library item'
      );
    } finally {
      set_is_submitting(false);
    }
  };

  const handle_close = () => {
    if (!isSubmitting) {
      // Reset form when closing
      set_form_data({
        title: '',
        item_type: Library_Item_Type.Book,
        description: '',
        publication_year: undefined,
        congress_code: '',
      });
      setErrors({});
      setSubmitError(null);
      on_close();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handle_close}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          component: 'form',
          onSubmit: handle_submit,
        },
      }}
    >
      <DialogTitle>Create New Library Item</DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )}

          <TextField
            required
            fullWidth
            label="Title"
            value={form_data.title}
            onChange={handleInputChange('title')}
            error={!!errors.title}
            helperText={errors.title}
            disabled={isSubmitting}
          />

          <FormControl fullWidth required>
            <InputLabel>Item Type</InputLabel>
            <Select
              value={form_data.item_type}
              onChange={handle_select_change}
              label="Item Type"
              disabled={isSubmitting}
            >
              {Object.values(Library_Item_Type).map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={form_data.description || ''}
            onChange={handleInputChange('description')}
            disabled={isSubmitting}
          />

          <TextField
            fullWidth
            label="Publication Year"
            type="number"
            value={form_data.publication_year || ''}
            onChange={handleInputChange('publication_year')}
            error={!!errors.publication_year}
            helperText={errors.publication_year}
            disabled={isSubmitting}
            inputProps={{
              min: 1,
              max: new Date().getFullYear(),
            }}
          />

          <TextField
            fullWidth
            label="Congress Code"
            value={form_data.congress_code || ''}
            onChange={handleInputChange('congress_code')}
            disabled={isSubmitting}
            helperText="Library of Congress classification code (optional)"
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handle_close} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
        >
          {isSubmitting ? 'Creating...' : 'Create Item'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
