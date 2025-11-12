import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { data_service } from '../services/dataService';
import type { Book, BookFilters } from '../types';

export const useBooks = (filters?: BookFilters) => {
  return useQuery({
    queryKey: ['books', filters],
    queryFn: () => data_service.get_books(filters),
  });
};

export const useBook = (id: string) => {
  return useQuery({
    queryKey: ['book', id],
    queryFn: () => data_service.getBookById(id),
    enabled: !!id,
  });
};

export const useCreateBook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: data_service.create_book,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });
};

export const useUpdateBook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Book> }) =>
      data_service.updateBook(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });
};

export const useDeleteBook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: data_service.deleteBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });
};

export const useGenres = () => {
  return useQuery({
    queryKey: ['genres'],
    queryFn: data_service.getGenres,
  });
};
