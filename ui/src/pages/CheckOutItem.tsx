import React, { useState, useCallback } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Alert,
  AlertTitle,
  Step,
  StepLabel,
  Stepper,
  Paper,
  Snackbar,
  Tooltip,
} from '@mui/material';
import { LibraryAdd } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { PatronsDataGrid } from '../components/patrons/PatronsDataGrid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { CopiesDataGrid } from '../components/copies/CopiesDataGrid';
import { format_date, is_overdue } from '../utils/dateUtils';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { useCheckoutBook } from '../hooks/useTransactions';
import { ConfirmCheckoutDetails } from '../components/common/ConfirmCheckoutDetails';

const two_weeks_from_now = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // Default 2 weeks from now

const steps = [
  'Select Patron',
  'Select Item',
  'Select Due Date',
  'Confirm Details',
];

const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 50 },
  {
    field: 'first_name',
    headerName: 'First Name',
    flex: 1,
  },
  { field: 'last_name', headerName: 'Last Name', flex: 1 },
  {
    field: 'balance',
    headerName: 'Balance',
    align: 'left',
    headerAlign: 'left',
    type: 'number',
    width: 150,
    valueFormatter: (value) =>
      value === null || value === undefined
        ? '$0.00'
        : `$${Number(value).toFixed(2)}`,
    renderCell: (params: GridRenderCellParams) => (
      <Box
        sx={{
          color: params.value > 0 ? 'warning.main' : 'inherit',
        }}
      >
        {`$${params.value.toFixed(2)}`}
      </Box>
    ),
  },
  {
    field: 'card_expiration_date',
    headerName: 'Card Expiration',
    valueGetter: (value) => {
      if (!value) return;
      return format_date(value);
    },
    flex: 3,
    renderCell: (params: GridRenderCellParams) => (
      <Box
        sx={{
          color: is_overdue(new Date(params.value))
            ? 'warning.main'
            : 'inherit',
        }}
      >
        {params.value}
      </Box>
    ),
  },
];

interface CheckOutFormData {
  patron_id: number;
  item_id: string;
  due_date: Date;
}

export const CheckOutItem: React.FC = () => {
  const [form_data, set_form_data] = useState<CheckOutFormData>({
    patron_id: 0,
    item_id: '',
    due_date: two_weeks_from_now,
  });

  const [error, set_error] = useState<string | null>(null);
  const [success, set_success] = useState<string | null>(null);

  const [active_step, set_active_step] = useState(0);
  const [skipped, set_skipped] = useState(new Set<number>());

  const { mutate: checkoutBook } = useCheckoutBook();

  const handle_retry = useCallback(() => {
    set_error(null);
    set_success(null);
  }, []);

  const is_step_skipped = (step: number) => {
    return skipped.has(step);
  };

  const handle_next = () => {
    if (active_step === steps.length - 1) {
      checkoutBook({
        patron_id: form_data.patron_id,
        copy_id: form_data.item_id,
        due_date: form_data.due_date,
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
  };

  const is_next_disabled = () => {
    if (active_step === 0 && !form_data.patron_id) return true;

    if (active_step === 1 && !form_data.item_id) return true;

    if (active_step === 2 && !form_data.due_date) return true;
    return false;
  };

  const handle_patron_selected = (patron_id: string) => {
    set_form_data((prev) => ({ ...prev, patron_id: Number(patron_id) }));
  };

  const handle_copy_selected = (copy_id: string) => {
    set_form_data((prev) => ({ ...prev, item_id: copy_id }));
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container
        maxWidth="xl"
        sx={{
          py: 2,
          height: 1,
          maxHeight: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}
      >
        <Typography
          onClick={() => console.log(form_data)}
          variant="h3"
          component="h1"
          gutterBottom
          title={'Active Step: ' + active_step}
          sx={{
            fontWeight: 'bold',
            mb: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
          }}
        >
          <LibraryAdd color="primary" fontSize="large" />
          Check Out Item
        </Typography>

        <Snackbar open={!!error} autoHideDuration={6000} onClose={handle_retry}>
          <Alert severity="error" sx={{ mb: 3 }}>
            <AlertTitle>Check-out Error</AlertTitle>
            {error}
            <Button
              size="small"
              onClick={handle_retry}
              sx={{ mt: 1, display: 'block' }}
            >
              Try Again
            </Button>
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!success}
          autoHideDuration={6000}
          onClose={() => set_success(null)}
        >
          <Alert severity="success" sx={{ mb: 3 }}>
            <AlertTitle>Success!</AlertTitle>
            {success}
          </Alert>
        </Snackbar>

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
                <PatronsDataGrid
                  cols={columns}
                  onError={set_error}
                  onPatronSelected={handle_patron_selected}
                  check_overdue={true}
                />
              )}
              {active_step === 1 && (
                <CopiesDataGrid on_copy_selected={handle_copy_selected} />
              )}
              {active_step === 2 && (
                <Paper
                  elevation={4}
                  sx={{
                    height: 'min-content',
                    width: 'min-content',
                    mx: 'auto',
                    mt: 2,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ p: 2, pb: 0 }}
                    color="text.secondary"
                    fontSize={{ xs: '0.9rem', sm: '1rem', md: '1.2rem' }}
                  >
                    Select Due Date
                  </Typography>
                  <DateCalendar
                    value={form_data.due_date}
                    onChange={(new_value) =>
                      set_form_data((prev) => ({
                        ...prev,
                        due_date: new_value || two_weeks_from_now,
                      }))
                    }
                  />
                </Paper>
              )}
              {active_step === 3 && (
                <ConfirmCheckoutDetails
                  patron_id={form_data.patron_id}
                  copy_id={form_data.item_id}
                  due_date={form_data.due_date}
                  on_confirm={() => {}}
                  on_cancel={() => {}}
                />
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
                      disabled={is_next_disabled()}
                    >
                      {active_step === steps.length - 1 ? 'Complete' : 'Next'}
                    </Button>
                  </span>
                }
                title={
                  is_next_disabled()
                    ? `Select ${
                        active_step === 0 ? 'patron' : 'item'
                      } to proceed`
                    : active_step === steps.length - 1
                    ? 'Complete the transaction'
                    : 'Next Page'
                }
              ></Tooltip>
            </Box>
          </>
        )}
      </Container>
    </LocalizationProvider>
  );
};
