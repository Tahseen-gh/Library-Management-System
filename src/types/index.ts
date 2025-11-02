export interface Transaction {
  id: string;
  copy_id: string;
  patron_id: string; // Changed from number to string
  transaction_type: 'checkout' | 'checkin' | 'renewal'; // Changed to lowercase
  createdAt: Date; // Changed from created_at
  updatedAt: Date; // Changed from updated_at
  due_date?: string;
  return_date?: string;
  fine_amount?: number;
  status: 'active' | 'returned' | 'overdue' | 'lost' | 'completed'; // Changed to lowercase
  notes: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  item_type?: Library_Item_Type;
  branch_name: string;
}

export interface Reservation {
  id: string;
  library_item_id: string; // Changed from book_id
  patron_id: string; // Added patron_id
  reservation_date: string;
  status: 'active' | 'fulfilled' | 'cancelled'; // Changed 'pending' to 'active'
  expiry_date: string;
  queue_position?: number; // Added queue_position
  notification_sent?: string; // Added notification_sent
  book?: Book;
}

export interface Fine {
  id: string;
  transaction_id: string;
  patron_id: string; // Added patron_id
  amount: number;
  reason: string;
  is_paid: boolean;
  paid_date?: string; // Added paid_date
  payment_method?: string; // Added payment_method
  notes?: string; // Added notes
  createdAt: string; // Changed from created_at
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
  id: string; // Changed from number to string
  first_name: string;
  last_name: string;
  email?: string; // Added email
  phone?: string; // Added phone
  balance: number;
  birthday?: Date;
  isActive: boolean; // Changed from card_expiration_date
  createdAt: Date; // Added createdAt
  image_url?: string;
}

export interface Branch {
  id: string; // Changed from number to string
  branch_name: string;
  address?: string; // Added address
  phone?: string; // Added phone
  is_main: boolean;
  createdAt: Date; // Added createdAt
}

export enum Library_Item_Type {
  BOOK = 'BOOK', // Changed to uppercase
  VIDEO = 'VIDEO', // Changed to uppercase
  AUDIOBOOK = 'AUDIOBOOK', // Changed to uppercase
}

export interface Create_Catalog_Item_Form_Data {
  title: string;
  item_type: Library_Item_Type;
  description?: string;
  publication_year?: number;
  library_of_congress_code?: string; // Changed from congress_code
  cost?: number; // Added cost
  available?: boolean; // Added available
  location?: string; // Added location
  condition?: string; // Added condition
  date_acquired?: string; // Added date_acquired
}

export interface Catalog_Item {
  id: string;
  title: string;
  item_type: Library_Item_Type;
  description?: string;
  publication_year?: number;
  library_of_congress_code?: string; // Changed from congress_code
  cost?: number; // Added cost
  available?: boolean; // Added available
  location?: string; // Added location
  condition?: string; // Added condition
  date_acquired?: string; // Added date_acquired
  createdAt: Date; // Added createdAt
  updatedAt: Date; // Added updatedAt
}

export type Condition = 'New' | 'Excellent' | 'Good' | 'Fair' | 'Poor';
export type Availability_Status =
  | 'available' // Changed to lowercase
  | 'borrowed' // Changed from 'Checked Out'
  | 'reserved' // Changed to lowercase
  | 'maintenance' // Changed from 'Processing'
  | 'damaged' // Changed to lowercase
  | 'lost'; // Changed to lowercase

export interface Item_Copy {
  id: string;
  library_item_id: string; // Changed from catalog_id
  branch_id: string; // Changed from number to string
  status: Availability_Status;
  condition?: Condition;
  cost?: number; // Made optional
  location?: string; // Added location
  notes?: string;
  date_acquired?: string; // Added date_acquired
  createdAt: Date; // Added createdAt
  updatedAt: Date; // Added updatedAt
}

export interface Book extends Catalog_Item {
  id: string;
  library_item_id: string; // Changed from catalog_id
  publisher?: string; // Made optional
  author?: string; // Made optional
  genre?: string; // Changed from Genre[] to string
  cover_image_url?: string; // Changed from cover_img_url
  number_of_pages?: number;
  isbn?: string; // Added isbn
}

export interface Recording extends Catalog_Item {
  artist: string;
  library_item_id: string; // Changed from catalog_id
  label: string;
  duration_seconds?: number;
}

export interface Video extends Catalog_Item {
  director?: string; // Made optional
  library_item_id: string; // Changed from catalog_id
  studio?: string; // Changed from producer
  genre?: string; // Added genre
  cover_image_url?: string; // Added cover_image_url
  duration_minutes?: number;
  format?: string; // Added format (DVD, Blu-ray, etc.)
  rating?: string; // Added rating
  isbn?: string; // Added isbn
}

export interface Periodical extends Catalog_Item {
  issue_number: string;
  library_item_id: string; // Changed from catalog_id
  publisher: string;
}

export interface Magazine extends Catalog_Item {
  issue_number: string;
  library_item_id: string; // Changed from catalog_id
  publisher: string;
}

export interface Audiobook extends Catalog_Item {
  narrator?: string; // Made optional
  library_item_id: string; // Changed from catalog_id
  publisher?: string; // Added publisher
  genre?: string; // Added genre
  cover_image_url?: string; // Added cover_image_url
  duration_minutes?: number; // Changed from duration_hours
  format?: string; // Added format
  isbn?: string; // Added isbn
}