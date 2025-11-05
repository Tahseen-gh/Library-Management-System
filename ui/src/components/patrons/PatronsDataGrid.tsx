import {
  DataGrid,
  type GridColDef,
  type GridDensity,
  type GridRenderCellParams,
  type GridRowSelectionModel,
} from '@mui/x-data-grid';

import { useEffect, useState } from 'react';
import { useAllPatrons } from '../../hooks/usePatrons';
import { format_date, is_overdue } from '../../utils/dateUtils';
import { Alert, Box, Link, Snackbar } from '@mui/material';

const columns: GridColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 50,
  },
  {
    field: 'first_name',
    headerName: 'Name',
    flex: 2,
    renderCell: (params: GridRenderCellParams) => (
      <Link
        sx={{ textDecoration: 'none', color: 'primary' }}
        href={`/patron/${params.row.id}`}
      >{`${params.value} ${params.row.last_name}`}</Link>
    ),
  },
  {
    field: 'balance',
    headerName: 'Balance',
    flex: 1,
    valueFormatter: (value: number) => {
      if (!value || typeof value !== 'number') return '$0.00';
      return `$${value.toFixed(2)}`;
    },
  },
  {
    field: 'birthday',
    headerName: 'Birthday',
    valueGetter: (value) => {
      if (!value || typeof value !== 'string') return '(No birthdate listed)';
      if (typeof value === 'string' && (value as string).length !== 10)
        return '(Invalid Format)';
      return format_date(value);
    },
    flex: 3,
    renderCell: (params: GridRenderCellParams) => <Box>{params.value}</Box>,
  },
  {
    field: 'card_expiration_date',
    headerName: 'Card Expiration',
    valueGetter: (value) => {
      if (!value || typeof value !== 'string')
        return '(No expiration date listed)';
      return format_date(value);
    },
    flex: 3,
    renderCell: (params: GridRenderCellParams) => (
      <Box
        sx={{
          color: !is_overdue(params.value) ? 'inherit' : 'error.main',
        }}
      >
        {params.value}
      </Box>
    ),
  },
];

interface PatronsDataGridProps {
  onError?: (error: string) => void;
  cols?: GridColDef[];
  onPatronSelected?: (patronId: string) => void;
  check_overdue?: boolean;
  density?: GridDensity;
}

export const PatronsDataGrid: React.FC<PatronsDataGridProps> = ({
  onError,
  cols = columns,
  onPatronSelected = undefined,
  check_overdue: check_card_and_blanance = false,
  density = 'standard',
}) => {
  const { data: patrons, isLoading: loading, error } = useAllPatrons();

  const [snack, set_snack] = useState<boolean>(false);

  useEffect(() => {
    if (error && onError) {
      onError(error.message);
    }
  }, [error, onError]);

  const patron_can_be_selected = (row: {
    card_expiration_date: Date;
    balance: number;
  }) => {
    if (!check_card_and_blanance) return true;
    return (
      check_card_and_blanance &&
      !is_overdue(row.card_expiration_date) &&
      !(row.balance > 0)
    );
  };

  return (
    <>
      <DataGrid
        showToolbar
        density={density}
        onRowDoubleClick={(params) =>
          !patron_can_be_selected(params.row) && set_snack(true)
        }
        rows={patrons || []}
        columns={cols}
        loading={loading}
        label="Patrons"
        pageSizeOptions={[50, 20, 15, 10, 5]}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 20, page: 0 },
          },
          filter: {
            filterModel: {
              items: check_card_and_blanance
                ? [
                    {
                      field: 'balance',
                      operator: '=',
                      value: 0,
                    },
                  ]
                : [],
            },
          },
        }}
        slotProps={{
          toolbar: {
            printOptions: { disableToolbarButton: true },
            csvOptions: { disableToolbarButton: true },
          },
        }}
        disableRowSelectionOnClick={!check_card_and_blanance}
        onRowSelectionModelChange={(x) => {
          const selected_id =
            Array.from((x as GridRowSelectionModel).ids)[0]?.toString() || '';
          if (onPatronSelected) {
            onPatronSelected(selected_id);
          }
        }}
        isRowSelectable={(params) => patron_can_be_selected(params.row)}
        disableDensitySelector={false}
      />
      <Snackbar
        open={snack}
        autoHideDuration={6000}
        onClose={() => set_snack(false)}
        anchorOrigin={{ horizontal: 'center', vertical: 'top' }}
      >
        <Alert severity="info">
          {
            'Only patrons with a zero balance and a valid library card can be selected.'
          }
        </Alert>
      </Snackbar>
    </>
  );
};
