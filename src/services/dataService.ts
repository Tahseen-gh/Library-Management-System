import type {
  Book,
  Transaction,
  Reservation,
  BookFilters,
  Catalog_Item,
  Item_Copy,
  Branch,
  Patron,
  Book_Form_Data,
  Create_Catalog_Item_Form_Data,
  Condition,
} from '../types';
import { Genre } from '../types';

// API configuration
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

// Generic HTTP request function
const api_request = async <T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const error_data = await response.json().catch(() => ({}));
      throw new Error(
        error_data.message ||
          error_data.error ||
          `HTTP ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network request failed');
  }
};

export const dataService = {
  //! Book operations

  async get_books(filters?: BookFilters): Promise<Book[]> {
    const search_params = new URLSearchParams();

    if (filters?.search) {
      search_params.append('search', filters.search);
    }

    if (filters?.genre) {
      search_params.append('genre', filters.genre);
    }

    if (filters?.author) {
      search_params.append('author', filters.author);
    }

    if (filters?.availability) {
      search_params.append('availability', filters.availability);
    }

    search_params.append('item_type', 'Book');

    const query_string = search_params.toString()
      ? `?${search_params.toString()}`
      : '';
    const books = await api_request<Book[]>(`/catalog-items${query_string}`);

    // Filter only books from catalog items
    return books.filter((item) => item.item_type === 'Book');
  },

  async getBookById(id: string): Promise<Book | null> {
    try {
      // First get the catalog item
      const catalog_item = await api_request<Catalog_Item>(
        `/catalog-items/${id}`
      );

      if (!catalog_item || catalog_item.item_type !== 'Book') {
        return null;
      }

      // Then get book-specific details if they exist
      // For now, we'll construct a basic book from catalog item
      const book: Book = {
        id: catalog_item.id,
        title: catalog_item.title,
        item_type: catalog_item.item_type,
        description: catalog_item.description,
        publication_year: catalog_item.publication_year,
        congress_code: catalog_item.congress_code,
        author: '', // These would come from books table
        genre: [],
        publisher: '',
        cover_img_url: '',
        catalog_id: catalog_item.id,
      };

      return book;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  },

  async create_book(book: Book_Form_Data): Promise<Book> {
    const catalog_item_data = {
      title: book.title,
      item_type: 'Book',
      description: book.description,
      publication_year: book.publication_year,
      congress_code: book.congress_code,
    };

    const created_item = await api_request<Catalog_Item>('/catalog-items', {
      method: 'POST',
      body: JSON.stringify(catalog_item_data),
    });

    // Convert catalog item back to book format
    return {
      ...created_item,
      author: book.author || '',
      genre: book?.genre || [],
      publisher: book?.publisher || '',
      cover_img_url: book?.cover_img_url || '',
      catalog_id: created_item.id,
    };
  },

  async updateBook(id: string, updates: Partial<Book>): Promise<Book | null> {
    try {
      const catalog_updates = {
        title: updates.title,
        description: updates.description,
        publication_year: updates.publication_year,
        congress_code: updates.congress_code,
      };

      await api_request(`/catalog-items/${id}`, {
        method: 'PUT',
        body: JSON.stringify(catalog_updates),
      });

      // Return updated book
      return await this.getBookById(id);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  },

  async deleteBook(id: string): Promise<boolean> {
    await api_request(`/catalog-items/${id}`, {
      method: 'DELETE',
    });
    return true;
  },

  async getGenres(): Promise<Genre[]> {
    // Since we don't have a dedicated books table with genres in the new API,
    // we'll return a static list of common genres for now
    // TODO: Implement genre extraction from catalog items or create separate endpoint
    const common_genres = [
      'Fiction',
      'Non-Fiction',
      'Mystery',
      'Romance',
      'Science Fiction',
      'Fantasy',
      'Biography',
      'History',
      'Children',
      'Young Adult',
      'Poetry',
      'Drama',
    ] as Genre[];

    return common_genres.sort();
  },

  // Transaction operations
  async checkoutBook(
    patron_id: number,
    copy_id: string,
    due_date?: Date
  ): Promise<Transaction> {
    const checkout_data = {
      copy_id,
      patron_id,
      due_date: due_date?.toISOString() || undefined,
    };

    const transaction = await api_request<Transaction>(
      '/transactions/checkout',
      {
        method: 'POST',
        body: JSON.stringify(checkout_data),
      }
    );

    return transaction;
  },

  async return_book(
    copy_id: string,
    new_condition?: Condition,
    new_location_id?: number,
    notes?: string
  ): Promise<Transaction | null> {
    try {
      const checkin_data = {
        copy_id,
        new_condition,
        new_location_id,
        notes,
      };

      const result = await api_request<{ transaction_id: string }>(
        '/transactions/checkin',
        {
          method: 'POST',
          body: JSON.stringify(checkin_data),
        }
      );

      // Get the updated transaction
      return await api_request<Transaction>(
        `/transactions/${result.transaction_id}`
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  },

  async getAllTransactions(): Promise<Transaction[]> {
    return await api_request<Transaction[]>('/transactions');
  },

  async getOverdueTransactions(): Promise<Transaction[]> {
    // Get all active transactions and filter overdue on client side
    // TODO: Add server-side filtering for overdue transactions
    const all_transactions = await api_request<Transaction[]>(
      '/transactions?status=Active'
    );
    const now = new Date();

    return all_transactions.filter((transaction) => {
      return transaction.due_date && new Date(transaction.due_date) < now;
    });
  },

  async getActiveTransactions(): Promise<Transaction[]> {
    return await api_request<Transaction[]>('/transactions?status=Active');
  },

  // Reservation operations
  async reserveBook(
    catalog_item_id: string,
    patron_id?: number
  ): Promise<Reservation> {
    const reservation_data = {
      catalog_item_id,
      patron_id,
    };

    return await api_request<Reservation>('/reservations', {
      method: 'POST',
      body: JSON.stringify(reservation_data),
    });
  },

  async getAllReservations(): Promise<Reservation[]> {
    return await api_request<Reservation[]>('/reservations');
  },

  async cancelReservation(reservation_id: string): Promise<Reservation | null> {
    try {
      await api_request(`/reservations/${reservation_id}`, {
        method: 'DELETE',
      });
      return null; // Deletion successful
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  },

  async get_all_catalog_items(): Promise<Catalog_Item[]> {
    return await api_request<Catalog_Item[]>('/catalog-items');
  },

  async create_catalog_item(
    item: Create_Catalog_Item_Form_Data
  ): Promise<Catalog_Item> {
    return await api_request<Catalog_Item>('/catalog-items', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  async get_all_copies_by_item_id(item_id: string): Promise<Item_Copy[]> {
    return await api_request<Item_Copy[]>(`/item-copies/catalog/${item_id}`);
  },

  async get_all_copy_ids(): Promise<string[]> {
    const copies = await api_request<Item_Copy[]>('/item-copies');
    return copies.map((item: Item_Copy) => item.id);
  },

  async get_all_copies(): Promise<Item_Copy[]> {
    return await api_request<Item_Copy[]>('/item-copies');
  },

  async get_copy_by_id(copy_id: string): Promise<Item_Copy | null> {
    try {
      return await api_request<Item_Copy>(`/item-copies/${copy_id}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  },

  async get_all_branches(): Promise<Branch[]> {
    return await api_request<Branch[]>('/branches');
  },

  async get_all_patrons(): Promise<Patron[]> {
    return await api_request<Patron[]>('/patrons');
  },

  async get_patron_by_id(patron_id: number): Promise<Patron | null> {
    try {
      return await api_request<Patron>(`/patrons/${patron_id}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  },
};
