import { useQuery } from '@tanstack/react-query';
import { data_service } from '../services/dataService';

export const useBranches = () => {
  return useQuery({
    queryKey: ['branches'],
    queryFn: () => data_service.get_all_branches(),
  });
};
