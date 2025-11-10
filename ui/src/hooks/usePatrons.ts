import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

export const useUpdatePatron = (options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) => {
  const query_client = useQueryClient();

  return useMutation({
    mutationFn: ({
      patron_id,
      patron_data,
    }: {
      patron_id: number;
      patron_data: Partial<Patron_Form_Data>;
    }) => data_service.update_patron(patron_id, patron_data),
    onSuccess: (_data, variables) => {
      query_client.invalidateQueries({
        queryKey: ['patron', variables.patron_id],
      });
      query_client.invalidateQueries({ queryKey: ['all_patrons'] });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
};

export const useDeletePatronById = (options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) => {
  const query_client = useQueryClient();

  return useMutation({
    mutationFn: (patron_id: number) =>
      data_service.delete_patron_by_id(patron_id),
    onSuccess: (_data, patron_id) => {
      query_client.invalidateQueries({ queryKey: ['all_patrons'] });
      query_client.invalidateQueries({ queryKey: ['patron', patron_id] });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
};
