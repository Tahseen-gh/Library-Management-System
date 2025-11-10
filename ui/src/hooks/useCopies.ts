import { useQuery } from '@tanstack/react-query';
import { data_service } from '../services/dataService';
import type { Item_Copy } from '../types';

export const useCopies = (item_id: number) => {
  return useQuery({
    queryKey: ['item_copies', item_id],
    queryFn: () => data_service.get_all_copies_by_item_id(item_id),
    enabled: !!item_id,
  });
};

export const useAllCopyIds = () => {
  return useQuery({
    queryKey: ['all_item_copy_ids'],
    queryFn: () => data_service.get_all_copy_ids(),
  });
};

export const useAllCopies = () => {
  return useQuery({
    queryKey: ['all_item_copies'],
    queryFn: (): Promise<Item_Copy[]> => data_service.get_all_copies(),
  });
};

export const useCopyById = (copy_id: number) => {
  return useQuery({
    queryKey: ['item_copy', copy_id],
    queryFn: () => data_service.get_copy_by_id(copy_id),
    enabled: !!copy_id,
  });
};
