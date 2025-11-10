import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
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

export const useAllCopies = (branch_id?: number) => {
  return useQuery({
    queryKey: ['all_item_copies', branch_id],
    queryFn: (): Promise<Item_Copy[]> => data_service.get_all_copies(branch_id),
  });
};
export const useCopyById = (
  copy_id: number,
  options?: {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
  }
) => {
  const query = useQuery({
    queryKey: ['item_copy', copy_id],
    queryFn: () => data_service.get_copy_by_id(copy_id),
    enabled: !!copy_id,
  });

  useEffect(() => {
    if (query.isSuccess && options?.onSuccess) {
      options.onSuccess();
    }
  }, [query.isSuccess, options?.onSuccess, options]);

  useEffect(() => {
    if (query.isError && options?.onError) {
      options.onError(query.error);
    }
  }, [query.isError, query.error, options?.onError, options]);

  return query;
};
