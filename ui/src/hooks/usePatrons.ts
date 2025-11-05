import { useQuery } from '@tanstack/react-query';
import { data_service } from '../services/dataService';

export const useAllPatrons = () => {
  return useQuery({
    queryKey: ['all_patrons'],
    queryFn: () => data_service.get_all_patrons(),
  });
};

export const usePatronById = (patron_id: number) => {
  return useQuery({
    queryKey: ['patron', patron_id],
    queryFn: () => data_service.get_patron_by_id(patron_id),
  });
};
