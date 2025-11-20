import { Container, IconButton, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import { DataGrid, type GridDensity, type GridColDef } from '@mui/x-data-grid';
import { useReservations } from '../hooks/useReservations';
import { ReservationStatusChip } from '../components/reservations/ReservationStatusChip';
import ItemTypeChip from '../components/library_items/ItemTypeChip';
import type { ReservationStatus } from '../types';
import { useState } from 'react';
import { CustomToolbar } from '../components/common/CustomDataGridToolbar';
import CancelIcon from '@mui/icons-material/Cancel';
import { useQueryClient } from '@tanstack/react-query';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

interface Reservation {
  id: number;
  first_name: string;
  last_name: string;
  title: string;
  status: ReservationStatus;
  queue_position: number;
}

export const ReservationsPage = () => {
  const { data: reservations = [], isLoading: loading } = useReservations();
  const [density, set_density] = useState<GridDensity>('standard');
  const [cancel_dialog_open, set_cancel_dialog_open] = useState(false);
  const [selected_reservation, set_selected_reservation] = useState<Reservation | null>(null);
  const [cancelling, set_cancelling] = useState(false);
  const query_client = useQueryClient();

  const handle_cancel_click = (reservation: Reservation) => {
    set_selected_reservation(reservation);
    set_cancel_dialog_open(true);
  };

  const handle_cancel_confirm = async () => {
    if (!selected_reservation) return;

    set_cancelling(true);
    try {
      const response = await fetch(`${API_BASE_URL}/reservations/${selected_reservation.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error_data = await response.json();
        throw new Error(error_data.error || 'Failed to cancel reservation');
      }

      // Refresh the reservations list
      query_client.invalidateQueries({ queryKey: ['reservations'] });

      set_cancel_dialog_open(false);
      set_selected_reservation(null);
    } catch (error) {
      console.error('Error canceling reservation:', error);
      alert(error instanceof Error ? error.message : 'Failed to cancel reservation');
    } finally {
      set_cancelling(false);
    }
  };

  const handle_cancel_close = () => {
    set_cancel_dialog_open(false);
    set_selected_reservation(null);
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 60 },
    {
      field: 'first_name',
      headerName: 'Patron',
      width: 200,
      valueGetter: (value, row) => {
        if (!value) return '';
        return `${value} ${row.last_name}`;
      },
    },
    { field: 'title', headerName: 'Item', width: 275 },
    {
      field: 'reservation_date',
      headerName: 'Reservation Date',
      width: 150,
    },
    { field: 'expiry_date', headerName: 'Expiry Date', width: 150 },
    {
      field: 'status',
      headerName: 'Status',
      width: 125,
      renderCell: (params) => (
        <ReservationStatusChip
          status={params.value as ReservationStatus}
        />
      ),
    },
    { field: 'queue_position', headerName: 'Queue Spot', width: 100 },
    {
      field: 'item_type',
      headerName: 'Type',
      width: 100,
      renderCell: (params) => {
        return <ItemTypeChip item_type={params.value} />;
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      sortable: false,
      renderCell: (params) => {
        const status = params.row.status as ReservationStatus;
        const can_cancel = status === 'waiting' || status === 'ready';

        return (
          <Button
            onClick={() => handle_cancel_click(params.row as Reservation)}
            disabled={!can_cancel}
            color="error"
            variant="outlined"
            size="small"
            startIcon={<CancelIcon />}
          >
            Cancel Reservation
          </Button>
        );
      },
    },
  ];

  return (
    <>
      <Container
        maxWidth="lg"
        sx={{
          p: 3,
          overflow: 'hidden',
          height: 1,
          maxHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <DataGrid
          showToolbar
          rows={reservations}
          getRowId={(row) => row.id}
          columns={columns}
          loading={loading}
          slots={{ toolbar: CustomToolbar }}
          slotProps={{
            toolbar: {
              density: density,
              onDensityChange: set_density,
              label: 'Reservations',
            },
          }}
        />
      </Container>

      <Dialog
        open={cancel_dialog_open}
        onClose={handle_cancel_close}
        aria-labelledby="cancel-dialog-title"
        aria-describedby="cancel-dialog-description"
      >
        <DialogTitle id="cancel-dialog-title">
          Cancel Reservation
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="cancel-dialog-description">
            Are you sure you want to cancel the reservation for{' '}
            <strong>{selected_reservation?.title}</strong> by{' '}
            <strong>
              {selected_reservation?.first_name} {selected_reservation?.last_name}
            </strong>
            ?
            {selected_reservation?.status === 'ready' && (
              <>
                <br />
                <br />
                This reservation is ready for pickup. Canceling it will make the item available
                for the next patron in the queue or return it to general circulation.
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handle_cancel_close} disabled={cancelling}>
            No, Keep It
          </Button>
          <Button
            onClick={handle_cancel_confirm}
            color="error"
            variant="contained"
            disabled={cancelling}
            autoFocus
          >
            {cancelling ? 'Canceling...' : 'Yes, Cancel Reservation'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
