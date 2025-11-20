import { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Alert,
  Box,
  Grid,
  Stack,
  Card,
  CardContent,
  Snackbar,
} from '@mui/material';
import { BookmarkAdd as ReserveIcon } from '@mui/icons-material';
import { ReservationDialog } from '../components/reservations/ReservationDialog';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

interface ItemCopyWithDetails {
  id: number;
  library_item_id: number;
  branch_id: number;
  status: string;
  condition?: string;
  copy_label?: string;
  copy_number?: number;
  total_copies?: number;
  title?: string;
  item_type?: string;
}

interface ItemResult {
  itemName: string;
  itemId: number;
  itemType: string;
  availableCopies: number;
  totalCopies: number;
  copies: ItemCopyWithDetails[];
}

type SearchBy = 'Item Name' | 'Copy ID';

export default function Reserve() {
  const [searchBy, setSearchBy] = useState<SearchBy>('Item Name');
  const [searchInput, setSearchInput] = useState('');
  const [validationError, setValidationError] = useState('');
  const [searchResults, setSearchResults] = useState<ItemResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Reservation dialog state
  const [reservationDialogOpen, setReservationDialogOpen] = useState(false);
  const [reservationItem, setReservationItem] = useState<{ id: number; name: string; copyId?: number } | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);

  const validateSearchCriteria = (): boolean => {
    if (!searchInput.trim()) {
      setValidationError('Search criteria cannot be empty');
      return false;
    }
    if (searchBy === 'Copy ID' && isNaN(Number(searchInput))) {
      setValidationError('Copy ID must be a number');
      return false;
    }
    setValidationError('');
    return true;
  };

  const executeSearch = async () => {
    setLoading(true);
    setValidationError('');

    try {
      let items: any[] = [];

      if (searchBy === 'Copy ID') {
        // Search by Copy ID - get specific copy and its library item
        const copyResponse = await fetch(`${API_BASE_URL}/item-copies/${searchInput}`);
        if (!copyResponse.ok) {
          throw new Error('Copy not found');
        }
        const copyData = await copyResponse.json();
        const copy = copyData.data || copyData;

        // Get the library item for this copy
        const itemResponse = await fetch(`${API_BASE_URL}/library-items/${copy.library_item_id}`);
        if (!itemResponse.ok) {
          throw new Error('Item not found');
        }
        const itemData = await itemResponse.json();
        const item = itemData.data || itemData;
        items = [item];
      } else {
        // Search by Item Name - get all library items
        const itemsResponse = await fetch(`${API_BASE_URL}/library-items`);
        if (!itemsResponse.ok) {
          throw new Error('Failed to fetch items');
        }
        const itemsData = await itemsResponse.json();
        const allItems = itemsData.data || itemsData;

        // Filter items by partial name match (case insensitive)
        items = allItems.filter((item: any) =>
          item.title.toLowerCase().includes(searchInput.toLowerCase())
        );

        if (items.length === 0) {
          setValidationError('No items found matching the search criteria');
          setLoading(false);
          return;
        }
      }

      // Get copies for all matching items
      const results: ItemResult[] = await Promise.all(
        items.map(async (item) => {
          const copiesResponse = await fetch(`${API_BASE_URL}/item-copies/item/${item.id}`);
          const copiesData = copiesResponse.ok ? await copiesResponse.json() : { data: [] };
          const copies = copiesData.data || copiesData || [];

          const availableCopies = copies.filter((c: any) => c.status === 'Available').length;

          return {
            itemName: item.title,
            itemId: item.id,
            itemType: item.item_type,
            availableCopies,
            totalCopies: copies.length,
            copies,
          };
        })
      );

      setSearchResults(results);
      setShowResults(true);
    } catch (error: any) {
      setValidationError(error.message || 'Failed to search items');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const isValid = validateSearchCriteria();
    if (!isValid) {
      return;
    }
    executeSearch();
  };

  const handleReset = () => {
    setShowResults(false);
    setSearchInput('');
    setSearchResults([]);
    setValidationError('');
  };

  const handleReserveClick = (itemId: number, itemName: string, copyId?: number) => {
    setReservationItem({ id: itemId, name: itemName, copyId });
    setReservationDialogOpen(true);
  };

  const handleReservationSuccess = async (message: string) => {
    setSuccessMessage(message);
    setShowSuccessSnackbar(true);
    setReservationDialogOpen(false);

    // Refresh search results
    if (searchInput) {
      await executeSearch();
    }
  };

  if (showResults) {
    return (
      <>
        <Container maxWidth="lg" sx={{ pt: 4, pb: 4 }}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
              Reserve - Search Results
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Found {searchResults.length} item{searchResults.length !== 1 ? 's' : ''}
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              {searchResults.map((item, index) => (
                <Grid size={{ xs: 12 }} key={index}>
                  <Card elevation={2}>
                    <CardContent>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="h6" fontWeight="bold" gutterBottom>
                            {item.itemName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Item ID: {item.itemId} | Type: {item.itemType}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Available Copies: {item.availableCopies}/{item.totalCopies}
                          </Typography>
                        </Box>

                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<ReserveIcon />}
                            onClick={() => handleReserveClick(item.itemId, item.itemName)}
                          >
                            Reserve Any Copy
                          </Button>
                          {item.copies.map((copy) => (
                            <Button
                              key={copy.id}
                              variant="outlined"
                              size="small"
                              startIcon={<ReserveIcon />}
                              onClick={() => handleReserveClick(item.itemId, item.itemName, copy.id)}
                              disabled={copy.status !== 'Available' && copy.status !== 'Checked Out'}
                            >
                              Reserve Copy {copy.copy_number} - {copy.status}
                            </Button>
                          ))}
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Button variant="outlined" onClick={handleReset}>
              New Search
            </Button>
          </Paper>
        </Container>

        {/* Reservation Dialog */}
        {reservationItem && (
          <ReservationDialog
            open={reservationDialogOpen}
            onClose={() => setReservationDialogOpen(false)}
            itemId={reservationItem.id}
            itemName={reservationItem.name}
            copyId={reservationItem.copyId}
            onSuccess={handleReservationSuccess}
          />
        )}

        {/* Success Snackbar */}
        <Snackbar
          open={showSuccessSnackbar}
          autoHideDuration={6000}
          onClose={() => setShowSuccessSnackbar(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setShowSuccessSnackbar(false)}
            severity="success"
            sx={{ width: '100%' }}
          >
            {successMessage}
          </Alert>
        </Snackbar>
      </>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ pt: 4, pb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
          Reserve
        </Typography>

        <FormControl component="fieldset" sx={{ mb: 3 }}>
          <FormLabel component="legend" sx={{ fontWeight: 'bold', mb: 1 }}>
            Search By
          </FormLabel>
          <RadioGroup
            value={searchBy}
            onChange={(e) => setSearchBy(e.target.value as SearchBy)}
          >
            <FormControlLabel
              value="Item Name"
              control={<Radio />}
              label="Item Name (partial search supported)"
            />
            <FormControlLabel
              value="Copy ID"
              control={<Radio />}
              label="Copy ID"
            />
          </RadioGroup>
        </FormControl>

        {validationError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {validationError}
          </Alert>
        )}

        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <TextField
            fullWidth
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={
              searchBy === 'Item Name'
                ? 'Item Name (partial search supported)'
                : 'Enter copy ID'
            }
            type={searchBy === 'Copy ID' ? 'number' : 'text'}
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleSearch();
            }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={loading}
            startIcon={<ReserveIcon />}
            sx={{ minWidth: 150 }}
          >
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
