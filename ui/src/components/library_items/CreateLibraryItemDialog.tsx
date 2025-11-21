import { useState, useEffect } from 'react';
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
  Typography,
  Divider,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import {
  type Create_Library_Item_Form_Data,
  Library_Item_Type,
  type Branch,
  type Condition,
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
    congress_code: '', // Will store Item ID
  });

  const [copy_data, set_copy_data] = useState({
    owning_branch_id: 1,
    cost: 0,
    condition: 'Good' as Condition,
    notes: '',
    number_of_copies: 1,
  });

  const [branches, setBranches] = useState<Branch[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, set_is_submitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Load branches on mount
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const fetchedBranches = await data_service.get_all_branches();
        setBranches(fetchedBranches);
        if (fetchedBranches.length > 0) {
          set_copy_data((prev) => ({
            ...prev,
            owning_branch_id: fetchedBranches[0].id,
          }));
        }
      } catch (error) {
        console.error('Error loading branches:', error);
      }
    };

    if (open) {
      loadBranches();
    }
  }, [open]);

  // Check for duplicates when title changes
  useEffect(() => {
    const checkDuplicates = async () => {
      if (form_data.title.trim().length > 2) {
        try {
          const duplicates =
            await data_service.check_duplicate_library_item(form_data.title);
          if (duplicates.length > 0) {
            setDuplicateWarning(
              `Warning: Found ${duplicates.length} existing item(s) with the same title.`
            );
          } else {
            setDuplicateWarning(null);
          }
        } catch (error) {
          console.error('Error checking duplicates:', error);
        }
      } else {
        setDuplicateWarning(null);
      }
    };

    const debounceTimer = setTimeout(checkDuplicates, 500);
    return () => clearTimeout(debounceTimer);
  }, [form_data.title]);

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

  const handleCopyInputChange =
    (field: keyof typeof copy_data) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      set_copy_data((prev) => ({
        ...prev,
        [field]:
          field === 'cost' || field === 'number_of_copies'
            ? value
              ? parseFloat(value)
              : 0
            : value,
      }));
    };

  const handleCopySelectChange = (
    event: SelectChangeEvent<number | Condition>
  ) => {
    const { name, value } = event.target;
    set_copy_data((prev) => ({
      ...prev,
      [name as string]:
        name === 'owning_branch_id' ? parseInt(value as string) : value,
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

    // Validate copy data
    if (copy_data.cost < 0) {
      newErrors.cost = 'Cost must be a positive number';
    }

    if (copy_data.number_of_copies < 1 || copy_data.number_of_copies > 50) {
      newErrors.number_of_copies = 'Number of copies must be between 1 and 50';
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
    setSubmitSuccess(null);

    try {
      // Create the library item first
      const created_item = await data_service.create_library_item(form_data);

      // Create the specified number of copies
      const copy_promises = [];
      for (let i = 0; i < copy_data.number_of_copies; i++) {
        copy_promises.push(
          data_service.create_copy({
            library_item_id: created_item.id,
            owning_branch_id: copy_data.owning_branch_id,
            condition: copy_data.condition,
            status: 'Available',
            cost: copy_data.cost,
            notes: copy_data.notes || undefined,
          })
        );
      }

      await Promise.all(copy_promises);

      // Show success message
      setSubmitSuccess(
        `Successfully created "${form_data.title}" with ${copy_data.number_of_copies} ${
          copy_data.number_of_copies === 1 ? 'copy' : 'copies'
        } (all marked as Available)`
      );

      // Reset form
      set_form_data({
        title: '',
        item_type: Library_Item_Type.Book,
        description: '',
        publication_year: undefined,
        congress_code: '',
      });

      set_copy_data({
        owning_branch_id: branches.length > 0 ? branches[0].id : 1,
        cost: 0,
        condition: 'Good',
        notes: '',
        number_of_copies: 1,
      });

      setDuplicateWarning(null);

      // Close after a brief delay to show success message
      setTimeout(() => {
        on_success?.();
        on_close();
        setSubmitSuccess(null);
      }, 2000);
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

      set_copy_data({
        owning_branch_id: branches.length > 0 ? branches[0].id : 1,
        cost: 0,
        condition: 'Good',
        notes: '',
        number_of_copies: 1,
      });

      setErrors({});
      setSubmitError(null);
      setSubmitSuccess(null);
      setDuplicateWarning(null);
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
            <Alert severity="error" onClose={() => setSubmitError(null)}>
              {submitError}
            </Alert>
          )}

          {submitSuccess && (
            <Alert severity="success" onClose={() => setSubmitSuccess(null)}>
              {submitSuccess}
            </Alert>
          )}

          {duplicateWarning && (
            <Alert severity="warning" onClose={() => setDuplicateWarning(null)}>
              {duplicateWarning}
            </Alert>
          )}

          <Typography variant="h6" sx={{ mt: 1 }}>
            Library Item Details
          </Typography>

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
            label="Item ID"
            value={form_data.congress_code || ''}
            onChange={handleInputChange('congress_code')}
            disabled={isSubmitting}
            helperText="Format: BOOK-1001, VIDEO-2001, CD-3001, etc. (optional)"
            placeholder="e.g., BOOK-1001, VIDEO-2001"
          />

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6">Copy Details</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Add physical copies of this item to your library. Copy IDs will be
            auto-generated.
          </Typography>

          <FormControl fullWidth required>
            <InputLabel>Branch</InputLabel>
            <Select
              name="owning_branch_id"
              value={copy_data.owning_branch_id}
              onChange={handleCopySelectChange}
              label="Branch"
              disabled={isSubmitting || branches.length === 0}
            >
              {branches.map((branch) => (
                <MenuItem key={branch.id} value={branch.id}>
                  {branch.branch_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            required
            fullWidth
            label="Number of Copies"
            type="number"
            value={copy_data.number_of_copies}
            onChange={handleCopyInputChange('number_of_copies')}
            error={!!errors.number_of_copies}
            helperText={
              errors.number_of_copies || 'Number of copies to create (1-50)'
            }
            disabled={isSubmitting}
            inputProps={{
              min: 1,
              max: 50,
            }}
          />

          <TextField
            required
            fullWidth
            label="Cost per Copy"
            type="number"
            value={copy_data.cost}
            onChange={handleCopyInputChange('cost')}
            error={!!errors.cost}
            helperText={errors.cost || 'Replacement cost in dollars'}
            disabled={isSubmitting}
            inputProps={{
              min: 0,
              step: 0.01,
            }}
          />

          <FormControl fullWidth required>
            <InputLabel>Condition</InputLabel>
            <Select
              name="condition"
              value={copy_data.condition}
              onChange={handleCopySelectChange}
              label="Condition"
              disabled={isSubmitting}
            >
              <MenuItem value="New">New</MenuItem>
              <MenuItem value="Excellent">Excellent</MenuItem>
              <MenuItem value="Good">Good</MenuItem>
              <MenuItem value="Fair">Fair</MenuItem>
              <MenuItem value="Poor">Poor</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Notes"
            multiline
            rows={2}
            value={copy_data.notes}
            onChange={handleCopyInputChange('notes')}
            disabled={isSubmitting}
            helperText="Optional notes about these copies"
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
          {isSubmitting
            ? 'Creating...'
            : `Create Item & ${copy_data.number_of_copies} ${
                copy_data.number_of_copies === 1 ? 'Copy' : 'Copies'
              }`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
