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
  type Create_Catalog_Item_Form_Data,
  Library_Item_Type,
} from '../../types';
import { validate_required, validate_year } from '../../utils/validators';
import { dataService } from '../../services/dataService';

interface CreateCatalogItemDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateCatalogItemDialog = ({
  open,
  onClose,
  onSuccess,
}: CreateCatalogItemDialogProps) => {
  const [formData, setFormData] = useState<Create_Catalog_Item_Form_Data>({
    title: '',
    item_type: Library_Item_Type.Book,
    description: '',
    publication_year: undefined,
    congress_code: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleInputChange =
    (field: keyof Create_Catalog_Item_Form_Data) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setFormData((prev) => ({
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

  const handleSelectChange = (event: SelectChangeEvent<Library_Item_Type>) => {
    setFormData((prev) => ({
      ...prev,
      item_type: event.target.value as Library_Item_Type,
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Title is required
    if (!validate_required(formData.title)) {
      newErrors.title = 'Title is required';
    }

    // Validate publication year if provided
    if (
      formData.publication_year &&
      !validate_year(formData.publication_year)
    ) {
      newErrors.publication_year = 'Invalid year';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await dataService.create_catalog_item(formData);

      // Reset form
      setFormData({
        title: '',
        item_type: Library_Item_Type.Book,
        description: '',
        publication_year: undefined,
        congress_code: '',
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error creating catalog item:', error);
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to create catalog item'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      // Reset form when closing
      setFormData({
        title: '',
        item_type: Library_Item_Type.Book,
        description: '',
        publication_year: undefined,
        congress_code: '',
      });
      setErrors({});
      setSubmitError(null);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        component: 'form',
        onSubmit: handleSubmit,
      }}
    >
      <DialogTitle>Create New Catalog Item</DialogTitle>

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
            value={formData.title}
            onChange={handleInputChange('title')}
            error={!!errors.title}
            helperText={errors.title}
            disabled={isSubmitting}
          />

          <FormControl fullWidth required>
            <InputLabel>Item Type</InputLabel>
            <Select
              value={formData.item_type}
              onChange={handleSelectChange}
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
            value={formData.description || ''}
            onChange={handleInputChange('description')}
            disabled={isSubmitting}
          />

          <TextField
            fullWidth
            label="Publication Year"
            type="number"
            value={formData.publication_year || ''}
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
            value={formData.congress_code || ''}
            onChange={handleInputChange('congress_code')}
            disabled={isSubmitting}
            helperText="Library of Congress classification code (optional)"
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isSubmitting}>
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
