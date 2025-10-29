import { useQuery } from '@tanstack/react-query';
import { dataService } from '../services/dataService';

export const useBranches = () => {
  return useQuery({
    queryKey: ['branches'],
    queryFn: () => dataService.get_all_branches(),
  });
};
