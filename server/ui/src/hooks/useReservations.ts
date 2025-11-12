import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { data_service } from '../services/dataService';

export const useReservations = () => {
  return useQuery({
    queryKey: ['reservations'],
    queryFn: () => data_service.getAllReservations(),
  });
};

export const useCancelReservation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: data_service.cancelReservation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
};
