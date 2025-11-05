import { useQuery } from '@tanstack/react-query';
import { data_service } from '../services/dataService';

export const useLibraryItems = () => {
  return useQuery({
    queryKey: ['library_items'],
    queryFn: () => data_service.get_all_library_items(),
  });
};
