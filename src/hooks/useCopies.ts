import { useQuery } from '@tanstack/react-query';
import { dataService } from '../services/dataService';
import type { Item_Copy } from '../types';

export const useCopies = (item_id: string) => {
  return useQuery({
    queryKey: ['library_item_copies', item_id], // Changed from 'item_copies'
    queryFn: () => dataService.get_all_copies_by_item_id(item_id),
    enabled: !!item_id,
  });
};

export const useAllCopyIds = () => {
  return useQuery({
    queryKey: ['all_library_item_copy_ids'], // Changed from 'all_item_copy_ids'
    queryFn: () => dataService.get_all_copy_ids(),
  });
};

export const useAllCopies = (branch_id?: number) => {
  return useQuery({
    queryKey: ['all_library_item_copies', branch_id], // Changed from 'all_item_copies'
    queryFn: (): Promise<Item_Copy[]> => dataService.get_all_copies(branch_id),
  });
};

export const useCopyById = (copy_id: string) => {
  return useQuery({
    queryKey: ['library_item_copy', copy_id], // Changed from 'item_copy'
    queryFn: () => dataService.get_copy_by_id(copy_id),
    enabled: !!copy_id,
  });
};