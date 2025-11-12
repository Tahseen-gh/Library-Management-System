import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { data_service } from '../services/dataService';
import type { Condition } from '../types';

export const useTransactions = () => {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: () => data_service.getAllTransactions(),
  });
};

export const useOverdueTransactions = () => {
  return useQuery({
    queryKey: ['transactions', 'overdue'],
    queryFn: () => data_service.getOverdueTransactions(),
  });
};

export const useActiveTransactions = () => {
  return useQuery({
    queryKey: ['transactions', 'active'],
    queryFn: () => data_service.getActiveTransactions(),
  });
};

export const useCheckoutBook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      patron_id,
      copy_id,
      due_date,
    }: {
      patron_id: number;
      copy_id: number;
      due_date?: Date;
    }) => data_service.checkoutBook(patron_id, copy_id, due_date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};

export const useReturnBook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      copy_id,
      new_condition,
      new_location_id,
      notes,
    }: {
      copy_id: number;
      new_condition?: Condition;
      new_location_id?: number;
      notes?: string;
    }) =>
      data_service.return_book(copy_id, new_condition, new_location_id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};

export const useGetTransactionsByPatronId = (patron_id: number) => {
  return useQuery({
    queryKey: ['transactions', 'patron', patron_id],
    queryFn: () => data_service.getTransactionsByPatronId(patron_id),
  });
};
