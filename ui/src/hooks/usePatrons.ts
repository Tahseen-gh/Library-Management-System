import { useMutation, useQuery } from '@tanstack/react-query';
import { data_service } from '../services/dataService';
import type { Patron_Form_Data } from '../types';

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

export const useCreatePatron = (options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) => {
  return useMutation({
    mutationFn: (patron_data: Patron_Form_Data) =>
      data_service.create_patron(patron_data),
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
};
