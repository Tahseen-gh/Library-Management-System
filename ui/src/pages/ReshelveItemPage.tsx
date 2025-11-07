import React, { useState } from 'react';
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
  TextField,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { LibraryBooks } from '@mui/icons-material';
import { useBranchContext } from '../contexts/Branch_Context';
// import { useActiveTransactions } from '../hooks/useTransactions';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

const steps = [
  'Enter Item ID',
  'Check Damage',
  'Process Return',
  'Confirmation',
];

interface TransactionInfo {
  transaction_id: number;
  copy_id: number;
  patron_id: number;
  patron_name: string;
  item_title: string;
  checkout_date: string;
  due_date: string;
  is_overdue: boolean;
  days_overdue: number;
  late_fee: number;
}

export const ReshelveItemPage: React.FC = () => {
  const { branches, selected_branch } = useBranchContext();
  const [active_step, set_active_step] = useState(0);
  const [item_id_input, set_item_id_input] = useState<string>('');
  const [return_branch_id, set_return_branch_id] = useState<number>(1);

  const [transaction_info, set_transaction_info] =
    useState<TransactionInfo | null>(null);
  const [is_damaged, set_is_damaged] = useState(false);
  const [damage_notes, set_damage_notes] = useState('');
  const [bin_location, set_bin_location] = useState<string>('');
  const [needs_transfer, set_needs_transfer] = useState(false);
  const [home_branch_name, set_home_branch_name] = useState<string>('');

  const [checking_item, set_checking_item] = useState(false);
  const [processing_return, set_processing_return] = useState(false);

  const [error, set_error] = useState<string | null>(null);
  const [success, set_success] = useState<string | null>(null);

  // Set return branch when selected branch changes
  React.useEffect(() => {
    if (selected_branch) {
      set_return_branch_id(selected_branch.id);
    }
  }, [selected_branch]);

  //? This is what we should be using to get active transactions
  // const { data: active_transactions, is_loading } = useActiveTransactions();

  // STEP 1: Scan Item ID and Retrieve Transaction Info
  const scan_and_identify = async () => {
    if (!item_id_input.trim()) {
      set_error('Please enter an Item ID');
      return;
    }

    set_checking_item(true);
    set_error(null);

    try {
      // Get active transactions for this copy from actual TRANSACTIONS table
      const tx_response = await fetch(
        `${API_BASE_URL}/transactions?status=active`
      );

      if (!tx_response.ok) {
        throw new Error('Failed to retrieve transactions');
      }

      const tx_data = await tx_response.json();
      const all_transactions = tx_data.data || tx_data;

      // Find transaction matching this copy_id (convert input to number for comparison)
      const transaction = all_transactions.find(
        (tx: TransactionInfo) => tx.copy_id === parseInt(item_id_input)
      );

      if (!transaction) {
        throw new Error('No active checkout found for this item');
      }

      // Get patron details from PATRONS table
      const patron_response = await fetch(
        `${API_BASE_URL}/patrons/${transaction.patron_id}`
      );
      let patron_name = 'Unknown';
      if (patron_response.ok) {
        const patron_data = await patron_response.json();
        const patron = patron_data.data || patron_data;
        patron_name = `${patron.first_name || ''} ${
          patron.last_name || ''
        }`.trim();
      }

      // Get item details from LIBRARY_ITEM_COPIES table
      const copy_response = await fetch(
        `${API_BASE_URL}/item-copies/${item_id_input}`
      );
      let item_title = 'Unknown Item';
      if (copy_response.ok) {
        const copy_data = await copy_response.json();
        const copy = copy_data.data || copy_data;
        item_title = copy.title || 'Unknown Item';
      }

      // Calculate if overdue
      const due_date = new Date(transaction.due_date);
      const current_date = new Date();
      const is_overdue = current_date > due_date;
      const days_overdue = is_overdue
        ? Math.ceil(
            (current_date.getTime() - due_date.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 0;

      // Calculate late fee ($0.50 per day)
      const late_fee = days_overdue * 0.5;

      // Build transaction info
      const info: TransactionInfo = {
        transaction_id: transaction.id,
        copy_id: transaction.copy_id,
        patron_id: transaction.patron_id,
        patron_name,
        item_title,
        checkout_date: transaction.checkout_date || transaction.createdAt,
        due_date: transaction.due_date,
        is_overdue,
        days_overdue,
        late_fee,
      };

      set_transaction_info(info);
      set_active_step(1); // Move to damage check
    } catch (err) {
      set_error(
        err instanceof Error
          ? err.message
          : 'Item not recognized - not in system'
      );
      set_transaction_info(null);
    } finally {
      set_checking_item(false);
    }
  };

  // STEP 2: Handle damage check
  const handle_damage_check = () => {
    // Always proceed to step 2 (process return)
    // The complete_return function will handle damaged items differently
    set_active_step(2);
  };

  // STEP 3: Complete Return
  const complete_return = async () => {
    if (!transaction_info) {
      set_error('Missing transaction information');
      return;
    }

    set_processing_return(true);
    set_error(null);

    try {
      // If damaged, first update item status to "damaged"
      if (is_damaged) {
        const damage_response = await fetch(
          `${API_BASE_URL}/item-copies/${transaction_info.copy_id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              status: 'damaged',
              notes: damage_notes || 'Item damaged on return',
            }),
          }
        );

        if (!damage_response.ok) {
          const error_data = await damage_response.json();
          throw new Error(
            error_data.message ||
              error_data.error ||
              'Failed to mark item as damaged'
          );
        }

        console.log('Item marked as damaged, now checking in...');

        // Then check in the transaction (no late fees for damaged items)
        const checkin_response = await fetch(
          `${API_BASE_URL}/transactions/checkin`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              copy_id: transaction_info.copy_id,
              return_branch_id: return_branch_id,
              new_condition: 'Poor',
              notes: `DAMAGED: ${damage_notes}`,
            }),
          }
        );

        if (!checkin_response.ok) {
          const error_data = await checkin_response.json();
          throw new Error(
            error_data.message || error_data.error || 'Check-in failed'
          );
        }

        console.log('Check-in complete for damaged item');

        set_bin_location('DAMAGE BIN');
        set_success('Item marked as damaged and placed in damage bin');
        set_active_step(3);
        return;
      }

      // For non-damaged items: If overdue, create fine record FIRST
      if (transaction_info.is_overdue && transaction_info.late_fee > 0) {
        try {
          await fetch(`${API_BASE_URL}/fines`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              transaction_id: transaction_info.transaction_id,
              patron_id: transaction_info.patron_id,
              amount: transaction_info.late_fee,
              reason: `Late return: ${transaction_info.days_overdue} days overdue`,
            }),
          });
        } catch (fine_err) {
          console.warn('Failed to create fine record:', fine_err);
        }
      }

      // Check in the item (updates status to "returned", NOT "available")
      const checkin_response = await fetch(
        `${API_BASE_URL}/transactions/checkin`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            copy_id: transaction_info.copy_id,
            return_branch_id: return_branch_id,
            notes: transaction_info.is_overdue
              ? `Returned ${transaction_info.days_overdue} days late`
              : 'Returned on time',
          }),
        }
      );

      if (!checkin_response.ok) {
        const error_data = await checkin_response.json();
        throw new Error(
          error_data.message || error_data.error || 'Check-in failed'
        );
      }

      // Get the response data with bin label and transfer info
      const checkin_data = await checkin_response.json();
      const response_data = checkin_data.data || checkin_data;

      // Set bin location and transfer info from API response
      set_bin_location(response_data.bin_label || 'RESHELVE BIN');
      set_needs_transfer(response_data.needs_transfer || false);
      set_home_branch_name(response_data.home_branch || '');
      set_success('Item returned and ready for reshelving!');
      set_active_step(3);
    } catch (err) {
      set_error(
        err instanceof Error ? err.message : 'Failed to complete return'
      );
    } finally {
      set_processing_return(false);
    }
  };

  const handle_back = () => {
    set_error(null);
    if (active_step === 1) {
      set_item_id_input('');
      set_transaction_info(null);
      set_is_damaged(false);
      set_damage_notes('');
    }
    if (active_step === 2) {
      set_is_damaged(false);
      set_damage_notes('');
    }
    set_active_step((prev) => prev - 1);
  };

  const handle_reset = () => {
    set_active_step(0);
    set_item_id_input('');
    set_transaction_info(null);
    set_is_damaged(false);
    set_damage_notes('');
    set_bin_location('');
    set_error(null);
    set_success(null);
  };

  const format_date = (date_string: string): string => {
    try {
      return new Date(date_string).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return date_string;
    }
  };

  return (
    <Container
      maxWidth="md"
      sx={{
        py: 4,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography
        variant="h3"
        component="h1"
        gutterBottom
        sx={{
          fontWeight: 'bold',
          mb: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <LibraryBooks color="primary" fontSize="large" />
        Reshelve / Check-In Item
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => set_error(null)}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <AlertTitle>Success!</AlertTitle>
          {success}
        </Alert>
      )}

      <Stepper activeStep={active_step} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper elevation={3} sx={{ p: 4, flex: 1 }}>
        {/* STEP 0: Enter Item ID */}
        {active_step === 0 && (
          <Box>
            <Typography variant="h5" gutterBottom fontWeight="bold">
              Enter Returned Item ID
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Enter the item's copy ID and select the branch where it's being
              returned.
            </Typography>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Return Branch</InputLabel>
              <Select
                value={return_branch_id.toString()}
                label="Return Branch"
                onChange={(e) => set_return_branch_id(parseInt(e.target.value))}
                disabled={checking_item}
              >
                {branches.map((branch) => (
                  <MenuItem key={branch.id} value={branch.id.toString()}>
                    {branch.branch_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Item Copy ID"
              value={item_id_input}
              onChange={(e) => set_item_id_input(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && item_id_input) {
                  scan_and_identify();
                }
              }}
              placeholder="Enter item copy ID"
              disabled={checking_item}
              sx={{ mb: 3 }}
            />

            <Button
              fullWidth
              variant="contained"
              onClick={scan_and_identify}
              disabled={!item_id_input || checking_item}
              startIcon={checking_item ? <CircularProgress size={20} /> : null}
              size="large"
            >
              {checking_item ? 'Verifying...' : 'Verify Item'}
            </Button>
          </Box>
        )}

        {/* STEP 1: Check Damage */}
        {active_step === 1 && transaction_info && (
          <Box>
            <Typography variant="h5" gutterBottom fontWeight="bold">
              Check for Damage
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Inspect the item and indicate if there is any damage.
            </Typography>

            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body1" fontWeight="bold">
                Item: {transaction_info.item_title}
              </Typography>
              <Typography variant="body2">
                Copy ID: {transaction_info.copy_id}
              </Typography>
            </Box>

            <Box
              sx={{
                mb: 3,
                p: 3,
                border: '2px solid',
                borderColor: 'warning.main',
                borderRadius: 2,
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                fontWeight="bold"
                color="warning.main"
              >
                Is the item damaged?
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button
                  variant={is_damaged ? 'outlined' : 'contained'}
                  color="success"
                  onClick={() => set_is_damaged(false)}
                  fullWidth
                >
                  No - Item is in good condition
                </Button>
                <Button
                  variant={is_damaged ? 'contained' : 'outlined'}
                  color="error"
                  onClick={() => set_is_damaged(true)}
                  fullWidth
                >
                  Yes - Item is damaged
                </Button>
              </Box>
            </Box>

            {is_damaged && (
              <TextField
                fullWidth
                label="Damage Notes"
                multiline
                rows={3}
                value={damage_notes}
                onChange={(e) => set_damage_notes(e.target.value)}
                placeholder="Describe the damage..."
                sx={{ mb: 3 }}
              />
            )}

            <Button
              fullWidth
              variant="contained"
              onClick={handle_damage_check}
              size="large"
            >
              Continue
            </Button>
          </Box>
        )}

        {/* STEP 2: Process Return */}
        {active_step === 2 && transaction_info && (
          <Box>
            <Typography
              variant="h5"
              gutterBottom
              fontWeight="bold"
              textAlign="center"
            >
              Review & Process Return
            </Typography>

            {is_damaged && (
              <Alert severity="error" sx={{ mb: 3 }}>
                <AlertTitle>⚠️ DAMAGED ITEM</AlertTitle>
                <Typography variant="body2">
                  This item has been marked as damaged and will be placed in the
                  DAMAGE BIN.
                </Typography>
                {damage_notes && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Notes: {damage_notes}
                  </Typography>
                )}
              </Alert>
            )}

            <Box
              sx={{
                mt: 3,
                p: 3,
                bgcolor: 'grey.50',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'grey.300',
              }}
            >
              <Typography variant="h6" gutterBottom fontWeight="bold">
                ITEM INFORMATION
              </Typography>
              <Typography variant="body1">
                Copy ID: {transaction_info.copy_id}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Title: {transaction_info.item_title}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom fontWeight="bold">
                PATRON INFORMATION
              </Typography>
              <Typography variant="body1">
                Patron: {transaction_info.patron_name}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                ID: {transaction_info.patron_id}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom fontWeight="bold">
                DUE DATE & OVERDUE STATUS
              </Typography>
              <Typography variant="body1">
                Due Date: {format_date(transaction_info.due_date)}
              </Typography>
              {transaction_info.is_overdue && !is_damaged ? (
                <Box
                  sx={{
                    p: 2,
                    mt: 2,
                    bgcolor: 'error.50',
                    borderRadius: 1,
                    border: '2px solid',
                    borderColor: 'error.main',
                  }}
                >
                  <Typography
                    variant="body1"
                    fontWeight="bold"
                    color="error.main"
                  >
                    ITEM IS OVERDUE
                  </Typography>
                  <Typography variant="body1" color="error.main">
                    Days Overdue: {transaction_info.days_overdue}
                  </Typography>
                  <Typography
                    variant="body1"
                    fontWeight="bold"
                    color="error.main"
                    sx={{ mt: 1 }}
                  >
                    Late Fee: ${transaction_info.late_fee.toFixed(2)}
                  </Typography>
                  <Typography
                    variant="caption"
                    display="block"
                    sx={{ mt: 1 }}
                    color="text.secondary"
                  >
                    ($0.50 per day) - will be applied to patron account
                  </Typography>
                </Box>
              ) : !is_damaged ? (
                <Box
                  sx={{
                    p: 2,
                    mt: 2,
                    bgcolor: 'success.50',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'success.main',
                  }}
                >
                  <Typography
                    variant="body1"
                    fontWeight="bold"
                    color="success.main"
                  >
                    Item returned on time - No late fees
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    p: 2,
                    mt: 2,
                    bgcolor: 'warning.50',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'warning.main',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Late fees are not assessed for damaged items.
                  </Typography>
                </Box>
              )}
            </Box>

            <Button
              fullWidth
              variant="contained"
              color={is_damaged ? 'error' : 'primary'}
              onClick={complete_return}
              disabled={processing_return}
              startIcon={
                processing_return ? <CircularProgress size={20} /> : null
              }
              size="large"
              sx={{ mt: 3 }}
            >
              {processing_return
                ? 'Processing...'
                : is_damaged
                ? 'Mark as Damaged & Complete Return'
                : 'Complete Return'}
            </Button>
          </Box>
        )}

        {/* STEP 3: Return Complete - Confirmation */}
        {active_step === 3 && transaction_info && (
          <Box>
            <Typography
              variant="h5"
              gutterBottom
              fontWeight="bold"
              textAlign="center"
              color="success.main"
            >
              Return Complete
            </Typography>

            <Box
              sx={{
                mt: 3,
                p: 3,
                bgcolor: is_damaged ? 'error.50' : 'success.50',
                borderRadius: 2,
                border: '2px solid',
                borderColor: is_damaged ? 'error.main' : 'success.main',
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                fontWeight="bold"
                color="text.primary"
              >
                RETURN CONFIRMATION
              </Typography>

              <Typography variant="body1" color="text.primary">
                Item ID: {transaction_info.copy_id}
              </Typography>
              <Typography variant="body1" color="text.primary">
                Title: {transaction_info.item_title}
              </Typography>
              <Typography variant="body1" color="text.primary" sx={{ mb: 2 }}>
                Patron: {transaction_info.patron_name}
              </Typography>

              <Divider sx={{ my: 2 }} />

              {is_damaged ? (
                <>
                  <Typography
                    variant="body1"
                    fontWeight="bold"
                    color="error.main"
                  >
                    Status: Item marked as DAMAGED
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Item is NOT available for checkout
                  </Typography>
                  {damage_notes && (
                    <Typography
                      variant="body2"
                      color="text.primary"
                      sx={{ mt: 1 }}
                    >
                      Damage notes: {damage_notes}
                    </Typography>
                  )}
                </>
              ) : (
                <>
                  <Typography
                    variant="body1"
                    fontWeight="bold"
                    color="text.primary"
                  >
                    Status: Item returned (ready for reshelving)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Item is NOT yet available for checkout
                  </Typography>
                </>
              )}

              {transaction_info.is_overdue && !is_damaged && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography
                    variant="body1"
                    color="error.main"
                    fontWeight="bold"
                  >
                    ❌ Late Fee Applied: ${transaction_info.late_fee.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Fee has been added to patron account
                  </Typography>
                </>
              )}

              <Divider sx={{ my: 2 }} />

              <Box
                sx={{
                  p: 2,
                  bgcolor: needs_transfer ? 'error.50' : 'warning.50',
                  borderRadius: 1,
                  border: '2px solid',
                  borderColor: needs_transfer ? 'error.main' : 'warning.main',
                }}
              >
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  color={needs_transfer ? 'error.main' : 'warning.main'}
                >
                  📦 BIN LOCATION
                </Typography>
                <Typography
                  variant="body1"
                  fontWeight="bold"
                  fontSize="1.5rem"
                  color="text.primary"
                  sx={{ my: 1 }}
                >
                  {bin_location || (is_damaged ? 'DAMAGE BIN' : 'RESHELVE BIN')}
                </Typography>
                {needs_transfer && home_branch_name && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <AlertTitle>⚠️ Inter-Branch Transfer Required</AlertTitle>
                    <Typography variant="body2">
                      This item belongs to <strong>{home_branch_name}</strong>.
                      Place it in the transfer bin labeled for that branch.
                    </Typography>
                  </Alert>
                )}
              </Box>
            </Box>

            <Button
              fullWidth
              variant="contained"
              onClick={handle_reset}
              size="large"
              sx={{ mt: 3 }}
            >
              Process Another Return
            </Button>
          </Box>
        )}

        {/* Navigation Buttons - only show when not on final step */}
        {active_step !== 3 && (
          <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
            <Button
              variant="outlined"
              onClick={handle_back}
              disabled={active_step === 0 || checking_item || processing_return}
            >
              Back
            </Button>
            <Box sx={{ flex: 1 }} />
            <Button
              variant="outlined"
              onClick={handle_reset}
              disabled={checking_item || processing_return}
            >
              Reset
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};
