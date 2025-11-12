import { useMutation, useQuery } from '@tanstack/react-query';
import { data_service } from '../services/dataService';
import type { Create_Library_Item_Form_Data } from '../types';

export const useLibraryItems = () => {
  return useQuery({
    queryKey: ['library_items'],
    queryFn: () => data_service.get_all_library_items(),
  });
};

export const useCreateLibraryItem = (options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) => {
  return useMutation({
    mutationFn: (item_data: Create_Library_Item_Form_Data) =>
      data_service.create_library_item(item_data),
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
};
