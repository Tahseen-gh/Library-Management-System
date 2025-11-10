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
} from '@mui/material';
import { useState, useEffect, type FC } from 'react';
import { type SelectChangeEvent } from '@mui/material/Select';
import { useBranchesContext } from '../hooks/useBranchHooks';
import { get_condition_color } from '../utils/colors';
import { CheckedOutItemsGrid } from '../components/common/CheckedOutItemsGrid';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import type { Condition } from '../types';
import { useReturnBook } from '../hooks/useTransactions';

const conditions: string[] = ['New', 'Excellent', 'Good', 'Fair', 'Poor'];
const steps = ['Select Item', 'Confirm Details'];

interface CheckInFormData {
  copy_id: number;
  new_condition?: Condition;
  new_location_id?: number;
  notes?: string;
}

export const CheckInItem: FC = () => {
  const [form_data, set_form_data] = useState<CheckInFormData>({
    copy_id: 0,
  });

  const [active_step, set_active_step] = useState(0);
  const [skipped, set_skipped] = useState(new Set<number>());
  const [snackbar_open, set_snackbar_open] = useState(false);

  const { branches, loading } = useBranchesContext();

  const [condition, set_condition] = useState<Condition>('Excellent');

  const {
    mutate: return_book,
    isPending: is_returning,
    isError,
    isSuccess,
  } = useReturnBook();

  // Handle success/error states
  useEffect(() => {
    if (isSuccess) {
      set_snackbar_open(true);
      // Reset form and go to completion step
      setTimeout(() => {
        set_active_step(steps.length);
        set_form_data({ copy_id: 0 });
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
      return_book({
        copy_id: form_data.copy_id,
        new_condition: condition,
        new_location_id: form_data?.new_location_id || 0,
        notes: form_data?.notes,
      });
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
    set_form_data({ copy_id: 0 });
    set_condition('Excellent');
  };

  const handle_close_snackbar = () => {
    set_snackbar_open(false);
  };

  const is_next_disabled = () => {
    if (active_step === 0 && (!form_data.copy_id || form_data.copy_id === 0))
      return true;

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
      <Container sx={{ pt: 4, maxWidth: '7xl', height: '100%' }}>
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
          {'Check In Item' +
            (form_data.copy_id ? `: ${form_data.copy_id}` : '')}
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
              {active_step === 0 && (
                <CheckedOutItemsGrid select_item_copy={handle_copy_selected} />
              )}
              {active_step === 1 && (
                <Grid container spacing={3} sx={{ mb: 3, pt: 1 }}>
                  <Grid size={{ xs: 12, sm: 12, md: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel id="condition-simple-select-label" shrink>
                        Condition
                      </InputLabel>
                      <Select
                        title="The condition of the library item"
                        disabled={!form_data.copy_id}
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
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      disabled={!form_data.copy_id}
                      fullWidth
                      label="Notes"
                      multiline
                      rows={4}
                      value={form_data?.notes || ''}
                      onChange={handle_notes_change}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 12, md: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel id="branch-select-label">
                        {'New Location?'}
                      </InputLabel>
                      <Select
                        disabled={!form_data.copy_id || loading}
                        label={'New Location?'}
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
                          : 'Finish'
                        : 'Next'}
                    </Button>
                  </span>
                }
                title={
                  is_next_disabled()
                    ? `Select ${
                        active_step === 0 ? 'patron' : 'item'
                      } to proceed`
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
