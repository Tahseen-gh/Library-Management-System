import { useQuery } from '@tanstack/react-query';
import { dataService } from '../services/dataService';

export const useCatalogItems = () => {
  return useQuery({
    queryKey: ['library_items'], // Changed from 'catalog_items'
    queryFn: () => dataService.get_all_catalog_items(),
  });
};