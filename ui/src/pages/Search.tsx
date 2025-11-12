import React, { useState } from 'react';
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
  Divider,
  Stack,
  Card,
  CardContent,
  CardActionArea,
  Chip,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

interface ItemCopyWithDetails {
  id: number;
  library_item_id: number;
  branch_id: number;
  status: string;
  condition?: string;
  cost: number;
  notes?: string;
  title?: string;
  item_type?: string;
  due_date?: string;
  patron_name?: string;
  patron_id?: number;
}

interface ItemRecord {
  itemName: string;
  itemId: number;
  itemType: string;
  copyId: number;
  status: string;
  dueDate?: string;
  patronName?: string;
  patronId?: number;
  condition?: string;
  branchId: number;
}

interface FullItemDetails {
  itemName: string;
  itemId: number;
  itemType: string;
  copyId: number;
  status: string;
  dueDate?: string;
  patronName?: string;
  patronId?: number;
  condition?: string;
  availableCopies: string;
  totalCopies: number;
}

type SearchBy = 'Item Name' | 'Item ID';
type Step = 'Display search options' | 'Search Results' | 'Full Item Record';

export default function Search() {
  const [step, setStep] = useState<Step>('Display search options');
  const [searchBy, setSearchBy] = useState<SearchBy>('Item Name');
  const [searchInput, setSearchInput] = useState('');
  const [validationError, setValidationError] = useState('');
  const [searchResults, setSearchResults] = useState<ItemRecord[]>([]);
  const [selectedItem, setSelectedItem] = useState<FullItemDetails | null>(null);
  const [loading, setLoading] = useState(false);

  const validateSearchCriteria = (): boolean => {
    if (!searchInput.trim()) {
      setValidationError('Search criteria cannot be empty');
      return false;
    }
    setValidationError('');
    return true;
  };

  const executeItemSearch = async () => {
    setLoading(true);
    try {
      let copies: ItemCopyWithDetails[] = [];

      if (searchBy === 'Item ID') {
        // Search by library item ID - get all copies of that item
        const response = await fetch(`${API_BASE_URL}/item-copies/item/${searchInput}`);
        if (!response.ok) {
          throw new Error('Item not found');
        }
        const data = await response.json();
        copies = data.data || data;

        // Get library item details
        const itemResponse = await fetch(`${API_BASE_URL}/library-items/${searchInput}`);
        if (itemResponse.ok) {
          const itemData = await itemResponse.json();
          const item = itemData.data || itemData;
          copies = copies.map(copy => ({
            ...copy,
            title: item.title,
            item_type: item.item_type,
          }));
        }
      } else {
        // Search by item name - get all library items matching the search
        const itemsResponse = await fetch(`${API_BASE_URL}/library-items`);
        if (!itemsResponse.ok) {
          throw new Error('Failed to fetch items');
        }
        const itemsData = await itemsResponse.json();
        const items = itemsData.data || itemsData;

        // Filter items by partial name match (case insensitive)
        const matchingItems = items.filter((item: any) =>
          item.title.toLowerCase().includes(searchInput.toLowerCase())
        );

        if (matchingItems.length === 0) {
          setValidationError('No items found matching the search criteria');
          setLoading(false);
          return;
        }

        // Get copies for all matching items
        for (const item of matchingItems) {
          const copiesResponse = await fetch(`${API_BASE_URL}/item-copies/item/${item.id}`);
          if (copiesResponse.ok) {
            const copiesData = await copiesResponse.json();
            const itemCopies = copiesData.data || copiesData;
            copies.push(...itemCopies.map((copy: any) => ({
              ...copy,
              title: item.title,
              item_type: item.item_type,
            })));
          }
        }
      }

      // For each copy, get transaction details if checked out
      const copiesWithDetails = await Promise.all(
        copies.map(async (copy) => {
          if (copy.status === 'Checked Out') {
            try {
              const transactionsResponse = await fetch(
                `${API_BASE_URL}/transactions?status=Active`
              );
              if (transactionsResponse.ok) {
                const transactionsData = await transactionsResponse.json();
                const transactions = transactionsData.data || transactionsData;
                const transaction = transactions.find((t: any) => t.copy_id === copy.id);

                if (transaction) {
                  return {
                    ...copy,
                    due_date: transaction.due_date,
                    patron_name: `${transaction.first_name} ${transaction.last_name}`,
                    patron_id: transaction.patron_id,
                  };
                }
              }
            } catch (error) {
              console.error('Error fetching transaction for copy:', copy.id, error);
            }
          }
          return copy;
        })
      );

      const results: ItemRecord[] = copiesWithDetails.map((copy) => ({
        itemName: copy.title || 'Unknown',
        itemId: copy.library_item_id,
        itemType: copy.item_type || 'Unknown',
        copyId: copy.id,
        status: copy.status,
        dueDate: copy.due_date,
        patronName: copy.patron_name,
        patronId: copy.patron_id,
        condition: copy.condition,
        branchId: copy.branch_id,
      }));

      if (results.length === 0) {
        setValidationError('No items found matching the search criteria');
      } else {
        setSearchResults(results);
        setStep('Search Results');
      }
    } catch (error: any) {
      setValidationError(error.message || 'Failed to search items');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchItems = () => {
    const isValid = validateSearchCriteria();

    if (!isValid) {
      return;
    }

    executeItemSearch();
  };

  const displayFullItemRecord = async (item: ItemRecord) => {
    setLoading(true);
    try {
      // Get all copies of this item to calculate availability
      const copiesResponse = await fetch(`${API_BASE_URL}/item-copies/item/${item.itemId}`);
      if (!copiesResponse.ok) {
        throw new Error('Failed to fetch item copies');
      }
      const copiesData = await copiesResponse.json();
      const copies = copiesData.data || copiesData;

      const totalCopies = copies.length;
      const availableCopies = copies.filter((c: any) => c.status === 'Available').length;

      setSelectedItem({
        ...item,
        availableCopies: `${availableCopies}/${totalCopies}`,
        totalCopies,
      });
      setStep('Full Item Record');
    } catch (error: any) {
      setValidationError(error.message || 'Failed to load full item details');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('Display search options');
    setSearchInput('');
    setSearchResults([]);
    setSelectedItem(null);
    setValidationError('');
  };

  if (step === 'Display search options') {
    return (
      <Container maxWidth="lg" sx={{ pt: 4, pb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
            Search Items
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
                value="Item ID"
                control={<Radio />}
                label="Item ID"
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
              placeholder={searchBy === 'Item Name' ? 'Enter item name or part of it......' : 'Enter item ID'}
              type={searchBy === 'Item ID' ? 'number' : 'text'}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleSearchItems();
              }}
            />
            <Button
              variant="contained"
              onClick={handleSearchItems}
              disabled={loading}
              startIcon={<SearchIcon />}
              sx={{ minWidth: 150 }}
            >
              {loading ? 'Searching...' : 'Search Items'}
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  if (step === 'Search Results') {
    return (
      <Container maxWidth="lg" sx={{ pt: 4, pb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
            Search Results
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}. Click on an item to view full details.
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            {searchResults.map((item, index) => (
              <Grid item xs={12} key={index}>
                <Card elevation={2}>
                  <CardActionArea onClick={() => displayFullItemRecord(item)}>
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="h6" fontWeight="bold" gutterBottom>
                            {item.itemName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Item ID: {item.itemId} | Copy ID: {item.copyId} | Type: {item.itemType}
                          </Typography>
                        </Box>
                        <Chip
                          label={item.status}
                          color={
                            item.status === 'Available'
                              ? 'success'
                              : item.status === 'Checked Out'
                              ? 'warning'
                              : 'default'
                          }
                          sx={{ fontWeight: 'bold' }}
                        />
                      </Stack>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Button variant="outlined" onClick={handleReset}>
            New Search
          </Button>
        </Paper>
      </Container>
    );
  }

  if (step === 'Full Item Record' && selectedItem) {
    return (
      <Container maxWidth="md" sx={{ pt: 4, pb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
            Full Item Record
          </Typography>

          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                ITEM NAME
              </Typography>
              <Typography variant="h6" fontWeight="600">
                {selectedItem.itemName}
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                ITEM ID
              </Typography>
              <Typography variant="body1">
                {selectedItem.itemId}
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                COPY ID
              </Typography>
              <Typography variant="body1">
                {selectedItem.copyId}
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                TYPE
              </Typography>
              <Typography variant="body1">
                {selectedItem.itemType}
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                STATUS INFORMATION
              </Typography>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Current Status:
                  </Typography>
                  <Chip
                    label={selectedItem.status}
                    size="small"
                    color={
                      selectedItem.status === 'Available'
                        ? 'success'
                        : selectedItem.status === 'Checked Out'
                        ? 'warning'
                        : 'default'
                    }
                  />
                </Box>
                {selectedItem.dueDate && (
                  <Typography variant="body2">
                    Due Date: {new Date(selectedItem.dueDate).toLocaleDateString()}
                  </Typography>
                )}
                {selectedItem.patronName && selectedItem.patronId && (
                  <>
                    <Typography variant="body2">
                      Current Patron: {selectedItem.patronName}
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 15 }}>
                      Patron ID: {selectedItem.patronId}
                    </Typography>
                  </>
                )}
                {selectedItem.condition && (
                  <Typography variant="body2">
                    Condition: {selectedItem.condition}
                  </Typography>
                )}
              </Stack>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                COPY AVAILABILITY
              </Typography>
              <Typography variant="body1">
                Available copies: {selectedItem.availableCopies}
              </Typography>
            </Box>
          </Stack>

          <Box sx={{ mt: 4 }}>
            <Button variant="outlined" onClick={handleReset}>
              New Search
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  return null;
}
