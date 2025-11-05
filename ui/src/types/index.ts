export interface Transaction {
  id: string;
  copy_id: string;
  patron_id: string;
  transaction_type: 'Checkout' | 'Checkin' | 'Balance' | 'Renewal';
  created_at: Date;
  updated_at: Date;
  due_date?: string;
  return_date?: string;
  fine_amount?: number;
  status: 'Active' | 'Returned' | 'Overdue' | 'Lost' | 'Completed';
  notes: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  item_type?: Library_Item_Type;
  branch_id: string;
}

export interface Reservation {
  id: string;
  book_id: string;
  reservation_date: string;
  status: 'pending' | 'fulfilled' | 'cancelled';
  expiry_date: string;
  book?: Book;
}

export interface Fine {
  id: string;
  transaction_id: string;
  amount: number;
  reason: string;
  is_paid: boolean;
  created_at: string;
  transaction?: Transaction;
}

export interface BookFilters {
  search?: string;
  genre?: Genre;
  author?: string;
  availability?: 'all' | 'available' | 'unavailable';
}

export enum Genre {
  Academic = 'Academic',
  Art = 'Art',
  Biography = 'Biography',
  Business = 'Business',
  Children = 'Children',
  Cooking = 'Cooking',
  Drama = 'Drama',
  Fantasy = 'Fantasy',
  Fiction = 'Fiction',
  Health = 'Health',
  History = 'History',
  Horror = 'Horror',
  Mystery = 'Mystery',
  NonFiction = 'Non-Fiction',
  Poetry = 'Poetry',
  Political = 'Political',
  Reference = 'Reference',
  Romance = 'Romance',
  ScienceFiction = 'Science Fiction',
  SelfHelp = 'Self-Help',
  Technology = 'Technology',
  Thriller = 'Thriller',
  Travel = 'Travel',
  YoungAdult = 'Young Adult',
}

export interface Book_Form_Data {
  title: string;
  author: string;
  publisher: string;
  cost: number;
  congress_code?: string;
  publication_year?: number;
  genre?: Genre[];
  description?: string;
  cover_image_url?: string;
}

export interface Patron {
  id: string;
  first_name: string;
  last_name: string;
  balance: number;
  birthday?: Date;
  card_expiration_date: Date;
  image_url?: string;
}

export interface Branch {
  id: string;
  branch_name: string;
  is_main: boolean;
}

export enum Library_Item_Type {
  Book = 'Book',
  Periodical = 'Periodical',
  Recording = 'Recording',
  Video = 'Video',
  Magazine = 'Magazine',
  Audiobook = 'Audiobook',
}

export interface Create_Library_Item_Form_Data {
  title: string;
  item_type: Library_Item_Type;
  description?: string;
  publication_year?: number;
  congress_code?: string;
}

export interface Library_Item {
  id: string;
  title: string;
  item_type: Library_Item_Type;
  description?: string;
  publication_year?: number;
  congress_code: string;
}

export type Condition = 'New' | 'Excellent' | 'Good' | 'Fair' | 'Poor';
export type Availability_Status =
  | 'Available'
  | 'Checked Out'
  | 'Reserved'
  | 'Processing'
  | 'Damaged'
  | 'Lost';

export interface Item_Copy {
  id: string;
  library_item_id: string;
  branch_id: string;
  status: Availability_Status;
  condition?: Condition;
  cost: number;
  notes?: string;
}

export interface Book extends Library_Item {
  id: string;
  library_item_id: string;
  publisher: string;
  author: string;
  genre?: Genre[];
  cover_image_url?: string;
  number_of_pages?: number;
}

export interface Recording extends Library_Item {
  artist: string;
  library_item_id: string;
  label: string;
  duration_seconds?: number;
}

export interface Video extends Library_Item {
  director: string;
  library_item_id: string;
  producer: string;
  duration_minutes?: number;
}

export interface Periodical extends Library_Item {
  issue_number: string;
  library_item_id: string;
  publisher: string;
}

export interface Magazine extends Library_Item {
  issue_number: string;
  library_item_id: string;
  publisher: string;
}

export interface Audiobook extends Library_Item, Book {
  narrator: string;
  library_item_id: string;
  duration_hours?: number;
}
