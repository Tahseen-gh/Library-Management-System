import {
  Container,
  Typography,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Grid,
  Button,
  Chip,
  Box,
  Step,
  StepLabel,
  Stepper,
  Tooltip,
  Snackbar,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  Stack,
} from '@mui/material';
import { useState, useEffect, type FC } from 'react';
import { type SelectChangeEvent } from '@mui/material/Select';
import { useBranchesContext } from '../hooks/useBranchHooks';
import { get_condition_color } from '../utils/colors';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import type { Condition } from '../types';
import { useReturnBook } from '../hooks/useTransactions';
import { useCopyById } from '../hooks/useCopies';
import { Warning, ErrorOutline, CheckCircle } from '@mui/icons-material';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

const conditions: string[] = ['New', 'Excellent', 'Good', 'Fair', 'Poor'];
const steps = ['Enter Item ID', 'Review Details', 'Confirm Check-In'];

interface CheckInFormData {
  copy_id: number | null;
  new_condition?: Condition;
  new_location_id?: number;
  notes?: string;
}

interface ItemDetails {
  title: string;
  patron_name: string;
  patron_id: number;
  due_date: string;
  is_overdue: boolean;
  days_overdue: number;
  fine_amount: number;
  item_type: string;
}

export const CheckInItem: FC = () => {
  const [form_data, set_form_data] = useState<CheckInFormData>({
    copy_id: null,
  });

  const [active_step, set_active_step] = useState(0);
  const [skipped, set_skipped] = useState(new Set<number>());
  const [snackbar_open, set_snackbar_open] = useState(false);
  const [copy_id_input, set_copy_id_input] = useState('');
  const [item_details, set_item_details] = useState<ItemDetails | null>(null);
  const [loading_details, set_loading_details] = useState(false);
  const [error_message, set_error_message] = useState<string | null>(null);

  const { branches, loading } = useBranchesContext();

  const [condition, set_condition] = useState<Condition>('Excellent');

  const { data: copy_data } = useCopyById(form_data.copy_id ?? 0);

  // Update condition when copy data is fetched
  useEffect(() => {
    if (copy_data?.condition) {
      set_condition(copy_data.condition);
    }
  }, [copy_data]);

  const {
    mutate: return_book,
    isPending: is_returning,
    isError,
    isSuccess,
  } = useReturnBook();

  // Fetch item details when copy ID is entered
  const fetch_item_details = async (copy_id: number) => {
    console.log('[CheckIn] fetch_item_details called with copy_id:', copy_id);
    set_loading_details(true);
    set_error_message(null);
    set_item_details(null);

    try {
      // Fetch copy details
      console.log('[CheckIn] Fetching copy details from:', `${API_BASE_URL}/item-copies/${copy_id}`);
      const copy_response = await fetch(`${API_BASE_URL}/item-copies/${copy_id}`);
      if (!copy_response.ok) {
        throw new Error('Item copy not found');
      }
      const copy_data = await copy_response.json();
      const copy = copy_data.data || copy_data;
      console.log('[CheckIn] Copy data:', copy);

      // Check if item is checked out
      if (copy.status !== 'Checked Out') {
        console.log('[CheckIn] ERROR: Item not checked out, status is:', copy.status);
        throw new Error(`Item status is "${copy.status}", not checked out. Cannot check in.`);
      }
      console.log('[CheckIn] Copy status valid: Checked Out');

      // Fetch active transaction for this copy
      console.log('[CheckIn] Fetching active transactions...');
      const transaction_response = await fetch(
        `${API_BASE_URL}/transactions?status=Active`
      );
      if (!transaction_response.ok) {
        throw new Error('Failed to fetch transaction');
      }
      const transaction_data = await transaction_response.json();
      const transactions = transaction_data.data || transaction_data;
      console.log('[CheckIn] Found', transactions.length, 'active transactions');
      const active_transaction = transactions.find((t: any) => t.copy_id === copy_id);

      if (!active_transaction) {
        console.log('[CheckIn] ERROR: No transaction found for copy_id:', copy_id);
        throw new Error('No active transaction found for this item');
      }
      console.log('[CheckIn] Found transaction:', active_transaction);

      // Calculate if overdue
      const due_date = new Date(active_transaction.due_date);
      const today = new Date();
      const is_overdue = today > due_date;
      const days_overdue = is_overdue
        ? Math.ceil((today.getTime() - due_date.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      const fine_amount = days_overdue * 0.5; // $0.50 per day

      const details = {
        title: copy.title || 'Unknown',
        patron_name: `${active_transaction.first_name} ${active_transaction.last_name}`,
        patron_id: active_transaction.patron_id,
        due_date: active_transaction.due_date,
        is_overdue,
        days_overdue,
        fine_amount,
        item_type: copy.item_type || 'Unknown',
      };

      console.log('[CheckIn] Setting item_details:', details);
      set_item_details(details);

      set_form_data((prev) => ({ ...prev, copy_id }));
      console.log('[CheckIn] SUCCESS: All data loaded successfully');
    } catch (error: any) {
      console.log('[CheckIn] ERROR caught:', error.message);
      set_error_message(error.message || 'Failed to load item details');
    } finally {
      set_loading_details(false);
    }
  };

  const handle_lookup_item = () => {
    const copy_id = parseInt(copy_id_input);
    if (isNaN(copy_id) || copy_id <= 0) {
      set_error_message('Please enter a valid Copy ID');
      return;
    }
    fetch_item_details(copy_id);
  };

  // Handle success/error states
  useEffect(() => {
    if (isSuccess) {
      set_snackbar_open(true);
      // Reset form and go to completion step
      setTimeout(() => {
        set_active_step(steps.length);
        set_form_data({ copy_id: null });
        set_condition('Excellent');
      }, 1000);
    } else if (isError) {
      set_snackbar_open(true);
    }
  }, [isSuccess, isError]);

  const is_step_skipped = (step: number) => {
    return skipped.has(step);
  };

  const handle_next = () => {
    if (active_step === steps.length - 1) {
      return_book(
        {
          copy_id: form_data.copy_id || 0,
          new_condition: condition,
          new_location_id: form_data?.new_location_id || 0,
          notes: form_data?.notes,
        },
        {
          onSuccess: () => {
            set_snackbar_open(true);
            // Reset form and go to completion step
            setTimeout(() => {
              set_active_step(steps.length);
              set_form_data({ copy_id: null });
              set_condition('Excellent');
            }, 1000);
          },
          onError: () => {
            set_snackbar_open(true);
          },
        }
      );
      return;
    }
    let new_skipped = skipped;
    if (is_step_skipped(active_step)) {
      new_skipped = new Set(new_skipped.values());
      new_skipped.delete(active_step);
    }

    set_active_step((prevActiveStep) => prevActiveStep + 1);
    set_skipped(new_skipped);
  };

  const handle_back = () => {
    set_active_step((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    set_active_step(0);
    set_form_data({ copy_id: null });
    set_condition('Excellent');
    set_copy_id_input('');
    set_item_details(null);
    set_error_message(null);
  };

  const handle_close_snackbar = () => {
    set_snackbar_open(false);
  };

  const is_next_disabled = () => {
    if (active_step === 0 && !item_details) return true;
    if (active_step === 1 && !form_data.copy_id) return true;
    return false;
  };

  const handle_copy_selected = (copy_id: number) => {
    set_form_data((prev) => ({ ...prev, copy_id: copy_id }));
  };

  const handle_condition_change = (event: SelectChangeEvent) => {
    set_condition(event.target.value as Condition);
  };

  const handle_notes_change = (event: React.ChangeEvent<HTMLInputElement>) => {
    set_form_data((prev) => ({ ...prev, notes: event.target.value }));
  };

  const handle_change_branch = (event: SelectChangeEvent<string>) => {
    set_form_data((prev) => ({
      ...prev,
      new_location_id: Number(event.target.value),
    }));
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="xl" sx={{ pt: 4, height: '100%' }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          title={form_data?.new_condition}
          sx={{
            fontWeight: 'bold',
            mb: 3,
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
          }}
        >
          {`Check In Item | Copy ID: ${form_data.copy_id || ''}`}
        </Typography>

        <Stepper activeStep={active_step}>
          {steps.map((label, index) => {
            const stepProps: { completed?: boolean } = {};
            const labelProps: {
              optional?: React.ReactNode;
            } = {};
            if (is_step_skipped(index)) {
              stepProps.completed = false;
            }
            return (
              <Step key={label} {...stepProps}>
                <StepLabel {...labelProps}>{label}</StepLabel>
              </Step>
            );
          })}
        </Stepper>
        {active_step === steps.length ? (
          <>
            <Typography sx={{ mt: 2, mb: 1 }}>
              {"All steps completed - you're finished"}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
              <Box sx={{ flex: '1 1 auto' }} />
              <Button onClick={handleReset}>Reset</Button>
            </Box>
          </>
        ) : (
          <>
            <Box
              sx={{
                flex: 1,
                mt: 2,
                overflow: 'hidden',
              }}
            >
              {/* Step 0: Enter Item ID */}
              {active_step === 0 && (
                <Grid container spacing={3} sx={{ mb: 3, pt: 1 }}>
                  <Grid size={{ xs: 12 }}>
                    <Paper elevation={3} sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom fontWeight="bold">
                        Enter Copy ID to Check In
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Enter the physical copy ID of the item being returned
                      </Typography>

                      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                        <TextField
                          label="Copy ID"
                          value={copy_id_input}
                          onChange={(e) => set_copy_id_input(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') handle_lookup_item();
                          }}
                          placeholder="Enter copy ID"
                          type="number"
                          fullWidth
                          error={!!error_message}
                          disabled={loading_details}
                        />
                        <Button
                          variant="contained"
                          onClick={handle_lookup_item}
                          disabled={!copy_id_input || loading_details}
                          sx={{ minWidth: 120 }}
                          startIcon={loading_details ? <CircularProgress size={20} /> : null}
                        >
                          {loading_details ? 'Looking up...' : 'Look Up'}
                        </Button>
                      </Stack>

                      {error_message && (
                        <Alert severity="error" sx={{ mb: 2 }} icon={<ErrorOutline />}>
                          {error_message}
                        </Alert>
                      )}

                      {item_details && (
                        <Paper
                          elevation={2}
                          sx={{
                            bgcolor: 'background.paper',
                            border: '2px solid',
                            borderColor: item_details.is_overdue ? 'warning.main' : 'success.main',
                            p: 3,
                            mt: 2,
                          }}
                        >
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                            {item_details.is_overdue ? (
                              <Warning color="warning" />
                            ) : (
                              <CheckCircle color="success" />
                            )}
                            <Typography variant="h6" fontWeight="bold" color="inherit">
                              Item Details
                            </Typography>
                          </Stack>

                          <Divider sx={{ mb: 2 }} />

                          <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Typography variant="body2" color="text.secondary">
                                Title
                              </Typography>
                              <Typography variant="body1" fontWeight="600" color="inherit">
                                {item_details.title}
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Typography variant="body2" color="text.secondary">
                                Type
                              </Typography>
                              <Typography variant="body1" fontWeight="600" color="inherit">
                                {item_details.item_type}
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Typography variant="body2" color="text.secondary">
                                Checked Out By
                              </Typography>
                              <Typography variant="body1" fontWeight="600" color="inherit">
                                {item_details.patron_name} (ID: {item_details.patron_id})
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Typography variant="body2" color="text.secondary">
                                Due Date
                              </Typography>
                              <Typography variant="body1" fontWeight="600" color="inherit">
                                {new Date(item_details.due_date).toLocaleDateString()}
                              </Typography>
                            </Grid>

                            {item_details.is_overdue && (
                              <>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                  <Typography variant="body2" color="error">
                                    Days Overdue
                                  </Typography>
                                  <Typography variant="body1" fontWeight="600" color="error">
                                    {item_details.days_overdue} days
                                  </Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                  <Typography variant="body2" color="error">
                                    Late Fee
                                  </Typography>
                                  <Typography variant="h6" fontWeight="bold" color="error">
                                    ${item_details.fine_amount.toFixed(2)}
                                  </Typography>
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                  <Alert severity="warning" icon={<Warning />}>
                                    This item is overdue. A fine of ${item_details.fine_amount.toFixed(2)} will be applied to patron {item_details.patron_name}.
                                  </Alert>
                                </Grid>
                              </>
                            )}

                            {!item_details.is_overdue && (
                              <Grid size={{ xs: 12 }}>
                                <Alert severity="success" icon={<CheckCircle />}>
                                  Item returned on time. No fines will be applied.
                                </Alert>
                              </Grid>
                            )}
                          </Grid>
                        </Paper>
                      )}
                    </Paper>
                  </Grid>
                </Grid>
              )}

              {/* Step 1: Review Details */}
              {active_step === 1 && item_details && (
                <Grid container spacing={3} sx={{ mb: 3, pt: 1 }}>
                  <Grid size={{ xs: 12 }}>
                    <Paper elevation={3} sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom fontWeight="bold">
                        Review Item Condition
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Inspect the item and update its condition if needed
                      </Typography>

                      <Grid container spacing={3}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <FormControl fullWidth>
                            <InputLabel id="condition-simple-select-label" shrink>
                              Condition
                            </InputLabel>
                            <Select
                              title="The condition of the library item"
                              labelId="condition-simple-select-label"
                              id="condition-simple-select"
                              value={condition || form_data?.new_condition || ''}
                              label="Condition"
                              onChange={handle_condition_change}
                              notched
                            >
                              {conditions.map((c) => (
                                <MenuItem key={c} value={c}>
                                  <Chip
                                    label={c}
                                    color={get_condition_color(c)}
                                    variant="outlined"
                                  />
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <FormControl fullWidth>
                            <InputLabel id="branch-select-label">
                              New Location (Optional)
                            </InputLabel>
                            <Select
                              disabled={loading}
                              label="New Location (Optional)"
                              labelId="branch-select-label"
                              id="branch-select"
                              value={form_data?.new_location_id?.toString() || ''}
                              onChange={handle_change_branch}
                            >
                              {branches &&
                                branches.map((branch) => (
                                  <MenuItem
                                    key={branch.id}
                                    value={branch.id.toString()}
                                  >
                                    {branch.branch_name}
                                  </MenuItem>
                                ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <TextField
                            fullWidth
                            label="Notes (Optional)"
                            multiline
                            rows={4}
                            value={form_data?.notes || ''}
                            onChange={handle_notes_change}
                            placeholder="Add any notes about the item condition or return"
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                </Grid>
              )}

              {/* Step 2: Confirm Check-In */}
              {active_step === 2 && item_details && (
                <Grid container spacing={3} sx={{ mb: 3, pt: 1 }}>
                  <Grid size={{ xs: 12 }}>
                    <Paper elevation={3} sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom fontWeight="bold">
                        Confirm Check-In
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Review the details below and confirm to complete the check-in
                      </Typography>

                      <Paper elevation={1} sx={{ bgcolor: 'background.default', p: 3, mb: 2, border: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          ITEM INFORMATION
                        </Typography>
                        <Typography variant="body1" fontWeight="600" gutterBottom>
                          {item_details.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Copy ID: {form_data.copy_id} | Type: {item_details.item_type}
                        </Typography>

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          PATRON INFORMATION
                        </Typography>
                        <Typography variant="body1" fontWeight="600">
                          {item_details.patron_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Patron ID: {item_details.patron_id}
                        </Typography>

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          RETURN DETAILS
                        </Typography>
                        <Typography variant="body2" color="text.primary">
                          Due Date: {new Date(item_details.due_date).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2" color="text.primary">
                          Condition: {condition}
                        </Typography>
                        {form_data.new_location_id && (
                          <Typography variant="body2" color="text.primary">
                            New Location: {branches?.find(b => b.id === form_data.new_location_id)?.branch_name}
                          </Typography>
                        )}

                        {item_details.is_overdue && (
                          <>
                            <Divider sx={{ my: 2 }} />
                            <Alert severity="warning" icon={<Warning />}>
                              <Typography variant="body2" fontWeight="600">
                                Overdue by {item_details.days_overdue} days
                              </Typography>
                              <Typography variant="body2">
                                Late fee of ${item_details.fine_amount.toFixed(2)} will be added to patron's account
                              </Typography>
                            </Alert>
                          </>
                        )}
                      </Paper>

                      <Alert severity="info" sx={{ mb: 2 }}>
                        After check-in, this item will be marked as "returned" and must be reshelved using the "Mark Items as Available" page before it can be checked out again.
                      </Alert>
                    </Paper>
                  </Grid>
                </Grid>
              )}

              <Box />
            </Box>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                pt: 2,
              }}
            >
              <Button
                disabled={active_step === 0}
                onClick={handle_back}
                sx={{ mr: 1 }}
                variant="outlined"
              >
                Back
              </Button>
              <Box sx={{ flex: '1 1 auto' }} />
              <Tooltip
                children={
                  <span>
                    {/* this span is needed to avoid a ref error caused by MUI code */}
                    <Button
                      variant="outlined"
                      onClick={handle_next}
                      disabled={is_next_disabled() || is_returning}
                      startIcon={
                        is_returning && active_step === steps.length - 1 ? (
                          <CircularProgress size={20} />
                        ) : null
                      }
                    >
                      {active_step === steps.length - 1
                        ? is_returning
                          ? 'Processing...'
                          : 'Complete Check-In'
                        : 'Next'}
                    </Button>
                  </span>
                }
                title={
                  is_next_disabled()
                    ? `Select ${
                        active_step === 0 ? 'patron' : 'item'
                      } to proceed`
                    : active_step === steps.length - 1
                    ? 'Finish Check-In'
                    : 'Next page'
                }
              ></Tooltip>
            </Box>
          </>
        )}

        <Snackbar
          open={snackbar_open}
          autoHideDuration={6000}
          onClose={handle_close_snackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={handle_close_snackbar}
            severity={isSuccess ? 'success' : 'error'}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {isSuccess
              ? `Item ${form_data.copy_id} successfully checked in!`
              : 'Failed to check in item. Please try again.'}
          </Alert>
        </Snackbar>
      </Container>
    </LocalizationProvider>
  );
};
