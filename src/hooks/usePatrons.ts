import { useQuery } from '@tanstack/react-query';
import { dataService } from '../services/dataService';

export const useAllPatrons = () => {
  return useQuery({
    queryKey: ['all_patrons'],
    queryFn: () => dataService.get_all_patrons(),
  });
};

export const usePatronById = (patron_id: number) => {
  return useQuery({
    queryKey: ['patron', patron_id],
    queryFn: () => dataService.get_patron_by_id(patron_id),
  });
};
