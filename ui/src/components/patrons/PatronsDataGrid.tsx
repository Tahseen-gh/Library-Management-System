import {
  DataGrid,
  type GridColDef,
  type GridDensity,
  type GridRenderCellParams,
  type GridRowSelectionModel,
} from '@mui/x-data-grid';

import { useState } from 'react';
import { useAllPatrons } from '../../hooks/usePatrons';
import { format_date, is_overdue } from '../../utils/dateUtils';
import { Alert, Box, Chip, Snackbar, Typography, TextField, InputAdornment } from '@mui/material';
import { Link } from 'react-router-dom';
import { Search } from '@mui/icons-material';
import { CustomToolbar } from '../common/CustomDataGridToolbar';

const NoResultsOverlay = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
      }}
    >
      <Typography variant="h6" color="text.secondary">
        No results found
      </Typography>
    </Box>
  );
};

const columns: GridColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 90,
  },
  {
    field: 'first_name',
    headerName: 'Name',
    flex: 2,
    renderCell: (params: GridRenderCellParams) => (
      <Link
        to={`/patron/${params.row.id}`}
        style={{ textDecoration: 'none', height: '100%', display: 'block' }}
      >
        <Typography
          sx={(theme) => ({
            textDecoration: 'none',
            color: `color-mix(in srgb, ${theme.palette.primary.main} 50%, ${theme.palette.text.primary} 50%)`,
            display: 'inline',
            fontWeight: 500,
          })}
        >{`${params.value} ${params.row.last_name}`}</Typography>
      </Link>
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
      if (typeof value === 'string' && (value as string).length !== 10) {
        if ((value as string).includes('T')) {
          return format_date((value as string).split('T')[0]);
        }
        return '(Invalid Format)';
      }
      return format_date(value);
    },
    flex: 2,
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
    flex: 2,
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
  { field: 'email', headerName: 'Email', flex: 2 },
  { field: 'phone', headerName: 'Phone #', flex: 2 },
  {
    field: 'active_checkouts',
    headerName: 'Checked Out',
    flex: 1,
    renderCell: (params: GridRenderCellParams) => {
      const count = params.value || 0;
      const tooMany = count >= 20;
      return (
        <Chip
          label={`${count} / 20`}
          size="small"
          color={tooMany ? 'error' : 'default'}
          variant={tooMany ? 'filled' : 'outlined'}
        />
      );
    },
  },
  {
    field: 'is_active',
    headerName: 'Status',
    flex: 1,
    renderCell: (params) => (
      <>
        {params.value ? (
          <Chip variant="outlined" color="success" label="Active"></Chip>
        ) : (
          <Chip variant="outlined" color="error" label="Inactive"></Chip>
        )}
      </>
    ),
  },
];

interface PatronsDataGridProps {
  cols?: GridColDef[];
  onPatronSelected?: (patronId: string) => void;
  check_overdue?: boolean;
  patrons?: any[];
  loading?: boolean;
}

export const PatronsDataGrid: React.FC<PatronsDataGridProps> = ({
  cols = columns,
  onPatronSelected = undefined,
  check_overdue: check_card_and_blanance = false,
  patrons: patronsProp = [],
  loading: loadingProp = false,
}) => {
  const { data: allPatrons, isLoading: isLoadingPatrons } = useAllPatrons();

  const [snack, set_snack] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [density, set_density] = useState<GridDensity>('standard');

  // Get all patrons if not provided
  const patronsData = patronsProp.length > 0 ? patronsProp : (allPatrons || []);
  const isLoadingData = loadingProp || isLoadingPatrons;

  // Filter patrons based on search term
  const filteredPatrons = patronsData.filter((patron) => {
    const trimmedSearch = searchTerm.trim();
    if (!trimmedSearch) return true;

    const search = trimmedSearch.toLowerCase();
    const idMatch = patron.id.toString().includes(search);
    const firstNameMatch = patron.first_name?.toLowerCase().includes(search);
    const lastNameMatch = patron.last_name?.toLowerCase().includes(search);
    const fullNameMatch = `${patron.first_name} ${patron.last_name}`.toLowerCase().includes(search);

    return idMatch || firstNameMatch || lastNameMatch || fullNameMatch;
  });

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
      {/* Search Bar */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Search by name or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <DataGrid
        showToolbar
        density={density}
        onRowDoubleClick={(params) =>
          !patron_can_be_selected(params.row) && set_snack(true)
        }
        rows={filteredPatrons}
        columns={cols}
        loading={isLoadingData}
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
        slots={{
          toolbar: CustomToolbar,
          noRowsOverlay: NoResultsOverlay,
          noResultsOverlay: NoResultsOverlay,
        }}
        slotProps={{
          toolbar: {
            density: density,
            onDensityChange: set_density,
            label: 'Patrons',
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
