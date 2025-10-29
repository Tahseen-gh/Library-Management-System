export interface Transaction {
  id: string;
  copy_id: string;
  patron_id: number;
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
  branch_name: string;
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
  cover_img_url?: string;
}

export interface Patron {
  id: number;
  first_name: string;
  last_name: string;
  balance: number;
  birthday?: Date;
  card_expiration_date: Date;
  image_url?: string;
}

export interface Branch {
  id: number;
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

export interface Create_Catalog_Item_Form_Data {
  title: string;
  item_type: Library_Item_Type;
  description?: string;
  publication_year?: number;
  congress_code?: string;
}

export interface Catalog_Item {
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
  catalog_id: string;
  branch_id: number;
  status: Availability_Status;
  condition?: Condition;
  cost: number;
  notes?: string;
}

export interface Book extends Catalog_Item {
  id: string;
  catalog_id: string;
  publisher: string;
  author: string;
  genre?: Genre[];
  cover_img_url?: string;
  number_of_pages?: number;
}

export interface Recording extends Catalog_Item {
  artist: string;
  catalog_id: string;
  label: string;
  duration_seconds?: number;
}

export interface Video extends Catalog_Item {
  director: string;
  catalog_id: string;
  producer: string;
  duration_minutes?: number;
}

export interface Periodical extends Catalog_Item {
  issue_number: string;
  catalog_id: string;
  publisher: string;
}

export interface Magazine extends Catalog_Item {
  issue_number: string;
  catalog_id: string;
  publisher: string;
}

export interface Audiobook extends Catalog_Item, Book {
  narrator: string;
  catalog_id: string;
  duration_hours?: number;
}
