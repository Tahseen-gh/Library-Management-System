import { useQuery } from '@tanstack/react-query';
import { dataService } from '../services/dataService';

export const useCatalogItems = () => {
  return useQuery({
    queryKey: ['catalog_items'],
    queryFn: () => dataService.get_all_catalog_items(),
  });
};
