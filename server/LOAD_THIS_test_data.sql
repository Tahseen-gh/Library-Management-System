-- =====================================================
-- ENHANCED TEST DATA FOR LIBRARY MANAGEMENT SYSTEM
-- Sprint 1 Testing - All User Stories
-- =====================================================

-- BRANCHES
INSERT INTO BRANCHES (id, branch_name, address, phone, is_main)
VALUES ('1', 'Main Library', '123 Main St', '555-0000', 1);

INSERT INTO BRANCHES (id, branch_name, address, phone, is_main)
VALUES ('2', 'Downtown Branch', '456 Downtown Ave', '555-0001', 0);

-- =====================================================
-- PATRONS - Test Scenarios
-- =====================================================

-- Patron 1: VALID - No fees, no books (Use this one first!)
INSERT INTO PATRONS (id, first_name, last_name, email, phone, balance, isActive)
VALUES ('patron-001', 'John', 'Smith', 'john.smith@example.com', '555-0101', 0.00, 1);

-- Patron 2: HAS FEES - $5.50 balance (Use to test fee blocking - US 2.7)
INSERT INTO PATRONS (id, first_name, last_name, email, phone, balance, isActive)
VALUES ('patron-002', 'Jane', 'Doe', 'jane.doe@example.com', '555-0102', 5.50, 1);

-- Patron 3: INACTIVE (Use to test inactive blocking - US 1.3)
INSERT INTO PATRONS (id, first_name, last_name, email, phone, balance, isActive)
VALUES ('patron-003', 'Bob', 'Johnson', 'bob.j@example.com', '555-0103', 0.00, 0);

-- Patron 4: HAS 20 CHECKED OUT BOOKS (Use to test 20-book limit - US 2.3)
INSERT INTO PATRONS (id, first_name, last_name, email, phone, balance, isActive)
VALUES ('patron-004', 'Alice', 'Williams', 'alice.williams@example.com', '555-0104', 0.00, 1);

-- =====================================================
-- LIBRARY ITEMS - Books (20+)
-- =====================================================

-- Book 1: The Great Gatsby
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('item-book-001', 'The Great Gatsby', 'BOOK', 'Classic American novel', 1925);

-- Book 2: To Kill a Mockingbird
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('item-book-002', 'To Kill a Mockingbird', 'BOOK', 'Classic novel', 1960);

-- Book 3: Pride and Prejudice
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('item-book-003', 'Pride and Prejudice', 'BOOK', 'Romance classic', 1813);

-- Book 4: 1984
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('item-book-004', '1984', 'BOOK', 'Dystopian novel', 1949);

-- Book 5: The Catcher in the Rye
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('item-book-005', 'The Catcher in the Rye', 'BOOK', 'Coming of age', 1951);

-- Book 6: Brave New World
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('item-book-006', 'Brave New World', 'BOOK', 'Science fiction', 1932);

-- Book 7: Jane Eyre
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('item-book-007', 'Jane Eyre', 'BOOK', 'Gothic romance', 1847);

-- Book 8: Wuthering Heights
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('item-book-008', 'Wuthering Heights', 'BOOK', 'Romance', 1847);

-- Book 9: The Hobbit
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('item-book-009', 'The Hobbit', 'BOOK', 'Fantasy adventure', 1937);

-- Book 10: The Lord of the Rings
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('item-book-010', 'The Lord of the Rings', 'BOOK', 'Epic fantasy', 1954);

-- Book 11: Harry Potter and the Philosopher\'s Stone
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('item-book-011', 'Harry Potter and the Philosopher\'s Stone', 'BOOK', 'Fantasy', 1998);

-- Book 12: The Chronicles of Narnia
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('item-book-012', 'The Chronicles of Narnia', 'BOOK', 'Fantasy series', 1950);

-- Book 13: Dune
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('item-book-013', 'Dune', 'BOOK', 'Science fiction', 1965);

-- Book 14: Foundation
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('item-book-014', 'Foundation', 'BOOK', 'Science fiction', 1951);

-- Book 15: The Invisible Man
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('item-book-015', 'The Invisible Man', 'BOOK', 'Science fiction', 1897);

-- Book 16: Frankenstein
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('item-book-016', 'Frankenstein', 'BOOK', 'Gothic horror', 1818);

-- Book 17: Dracula
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('item-book-017', 'Dracula', 'BOOK', 'Gothic horror', 1897);

-- Book 18: The Count of Monte Cristo
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('item-book-018', 'The Count of Monte Cristo', 'BOOK', 'Adventure', 1844);

-- Book 19: The Three Musketeers
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('item-book-019', 'The Three Musketeers', 'BOOK', 'Adventure', 1844);

-- Book 20: Moby Dick
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('item-book-020', 'Moby Dick', 'BOOK', 'Adventure', 1851);

-- Book 21: (Extra book for more checkouts)
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('item-book-021', 'The Odyssey', 'BOOK', 'Epic poetry', 1614);

-- =====================================================
-- VIDEOS (Movies)
-- =====================================================

-- Movie 1: The Matrix
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('item-video-001', 'The Matrix', 'VIDEO', 'Sci-fi film', 1999);

-- Movie 2: Inception
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('item-video-002', 'Inception', 'VIDEO', 'Sci-fi thriller', 2010);

-- Movie 3: The Shawshank Redemption
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('item-video-003', 'The Shawshank Redemption', 'VIDEO', 'Drama', 1994);

-- =====================================================
-- AUDIOBOOKS
-- =====================================================

-- Audiobook 1: Sherlock Holmes
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('item-audio-001', 'Sherlock Holmes Complete Collection', 'AUDIOBOOK', 'Mystery', 1892);

-- =====================================================
-- LIBRARY ITEM COPIES
-- =====================================================

-- Create 1 copy of each book (available)
INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('copy-001', 'item-book-001', '1', 'Excellent', 'available');

INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('copy-002', 'item-book-002', '1', 'Good', 'available');

INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('copy-003', 'item-book-003', '1', 'Excellent', 'available');

INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('copy-004', 'item-book-004', '1', 'Good', 'available');

INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('copy-005', 'item-book-005', '1', 'Excellent', 'available');

INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('copy-006', 'item-book-006', '1', 'Good', 'available');

INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('copy-007', 'item-book-007', '1', 'Excellent', 'available');

INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('copy-008', 'item-book-008', '1', 'Fair', 'available');

INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('copy-009', 'item-book-009', '1', 'Excellent', 'available');

INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('copy-010', 'item-book-010', '1', 'Good', 'available');

INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('copy-011', 'item-book-011', '1', 'Excellent', 'available');

INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('copy-012', 'item-book-012', '1', 'Good', 'available');

INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('copy-013', 'item-book-013', '1', 'Excellent', 'available');

INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('copy-014', 'item-book-014', '1', 'Good', 'available');

INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('copy-015', 'item-book-015', '1', 'Excellent', 'available');

INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('copy-016', 'item-book-016', '1', 'Good', 'available');

INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('copy-017', 'item-book-017', '1', 'Fair', 'available');

INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('copy-018', 'item-book-018', '1', 'Excellent', 'available');

INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('copy-019', 'item-book-019', '1', 'Good', 'available');

INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('copy-020', 'item-book-020', '1', 'Excellent', 'available');

INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('copy-021', 'item-book-021', '1', 'Good', 'available');

-- Movie Copies
INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('copy-movie-001', 'item-video-001', '1', 'Excellent', 'available');

INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('copy-movie-002', 'item-video-002', '1', 'Good', 'available');

INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('copy-movie-003', 'item-video-003', '1', 'Excellent', 'available');

-- Audiobook Copy
INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('copy-audio-001', 'item-audio-001', '1', 'Excellent', 'available');

-- =====================================================
-- TRANSACTIONS - Patron 4 with 20 checked out books (US 2.3 test)
-- =====================================================

INSERT INTO TRANSACTIONS (id, copy_id, patron_id, transaction_type, checkout_date, due_date, return_date, fine_amount, status)
VALUES ('trans-001', 'copy-001', 'patron-004', 'checkout', datetime('now', '-5 days'), datetime('now', '+23 days'), NULL, 0, 'active');

INSERT INTO TRANSACTIONS (id, copy_id, patron_id, transaction_type, checkout_date, due_date, return_date, fine_amount, status)
VALUES ('trans-002', 'copy-002', 'patron-004', 'checkout', datetime('now', '-4 days'), datetime('now', '+24 days'), NULL, 0, 'active');

INSERT INTO TRANSACTIONS (id, copy_id, patron_id, transaction_type, checkout_date, due_date, return_date, fine_amount, status)
VALUES ('trans-003', 'copy-003', 'patron-004', 'checkout', datetime('now', '-3 days'), datetime('now', '+25 days'), NULL, 0, 'active');

INSERT INTO TRANSACTIONS (id, copy_id, patron_id, transaction_type, checkout_date, due_date, return_date, fine_amount, status)
VALUES ('trans-004', 'copy-004', 'patron-004', 'checkout', datetime('now', '-2 days'), datetime('now', '+26 days'), NULL, 0, 'active');

INSERT INTO TRANSACTIONS (id, copy_id, patron_id, transaction_type, checkout_date, due_date, return_date, fine_amount, status)
VALUES ('trans-005', 'copy-005', 'patron-004', 'checkout', datetime('now', '-1 days'), datetime('now', '+27 days'), NULL, 0, 'active');

INSERT INTO TRANSACTIONS (id, copy_id, patron_id, transaction_type, checkout_date, due_date, return_date, fine_amount, status)
VALUES ('trans-006', 'copy-006', 'patron-004', 'checkout', datetime('now'), datetime('now', '+28 days'), NULL, 0, 'active');

INSERT INTO TRANSACTIONS (id, copy_id, patron_id, transaction_type, checkout_date, due_date, return_date, fine_amount, status)
VALUES ('trans-007', 'copy-007', 'patron-004', 'checkout', datetime('now'), datetime('now', '+28 days'), NULL, 0, 'active');

INSERT INTO TRANSACTIONS (id, copy_id, patron_id, transaction_type, checkout_date, due_date, return_date, fine_amount, status)
VALUES ('trans-008', 'copy-008', 'patron-004', 'checkout', datetime('now'), datetime('now', '+28 days'), NULL, 0, 'active');

INSERT INTO TRANSACTIONS (id, copy_id, patron_id, transaction_type, checkout_date, due_date, return_date, fine_amount, status)
VALUES ('trans-009', 'copy-009', 'patron-004', 'checkout', datetime('now'), datetime('now', '+28 days'), NULL, 0, 'active');

INSERT INTO TRANSACTIONS (id, copy_id, patron_id, transaction_type, checkout_date, due_date, return_date, fine_amount, status)
VALUES ('trans-010', 'copy-010', 'patron-004', 'checkout', datetime('now'), datetime('now', '+28 days'), NULL, 0, 'active');

INSERT INTO TRANSACTIONS (id, copy_id, patron_id, transaction_type, checkout_date, due_date, return_date, fine_amount, status)
VALUES ('trans-011', 'copy-011', 'patron-004', 'checkout', datetime('now'), datetime('now', '+28 days'), NULL, 0, 'active');

INSERT INTO TRANSACTIONS (id, copy_id, patron_id, transaction_type, checkout_date, due_date, return_date, fine_amount, status)
VALUES ('trans-012', 'copy-012', 'patron-004', 'checkout', datetime('now'), datetime('now', '+28 days'), NULL, 0, 'active');

INSERT INTO TRANSACTIONS (id, copy_id, patron_id, transaction_type, checkout_date, due_date, return_date, fine_amount, status)
VALUES ('trans-013', 'copy-013', 'patron-004', 'checkout', datetime('now'), datetime('now', '+28 days'), NULL, 0, 'active');

INSERT INTO TRANSACTIONS (id, copy_id, patron_id, transaction_type, checkout_date, due_date, return_date, fine_amount, status)
VALUES ('trans-014', 'copy-014', 'patron-004', 'checkout', datetime('now'), datetime('now', '+28 days'), NULL, 0, 'active');

INSERT INTO TRANSACTIONS (id, copy_id, patron_id, transaction_type, checkout_date, due_date, return_date, fine_amount, status)
VALUES ('trans-015', 'copy-015', 'patron-004', 'checkout', datetime('now'), datetime('now', '+28 days'), NULL, 0, 'active');

INSERT INTO TRANSACTIONS (id, copy_id, patron_id, transaction_type, checkout_date, due_date, return_date, fine_amount, status)
VALUES ('trans-016', 'copy-016', 'patron-004', 'checkout', datetime('now'), datetime('now', '+28 days'), NULL, 0, 'active');

INSERT INTO TRANSACTIONS (id, copy_id, patron_id, transaction_type, checkout_date, due_date, return_date, fine_amount, status)
VALUES ('trans-017', 'copy-017', 'patron-004', 'checkout', datetime('now'), datetime('now', '+28 days'), NULL, 0, 'active');

INSERT INTO TRANSACTIONS (id, copy_id, patron_id, transaction_type, checkout_date, due_date, return_date, fine_amount, status)
VALUES ('trans-018', 'copy-018', 'patron-004', 'checkout', datetime('now'), datetime('now', '+28 days'), NULL, 0, 'active');

INSERT INTO TRANSACTIONS (id, copy_id, patron_id, transaction_type, checkout_date, due_date, return_date, fine_amount, status)
VALUES ('trans-019', 'copy-019', 'patron-004', 'checkout', datetime('now'), datetime('now', '+28 days'), NULL, 0, 'active');

INSERT INTO TRANSACTIONS (id, copy_id, patron_id, transaction_type, checkout_date, due_date, return_date, fine_amount, status)
VALUES ('trans-020', 'copy-020', 'patron-004', 'checkout', datetime('now'), datetime('now', '+28 days'), NULL, 0, 'active');

-- Update copy statuses to borrowed for patron-004
UPDATE LIBRARY_ITEM_COPIES SET status = 'borrowed' WHERE id IN ('copy-001', 'copy-002', 'copy-003', 'copy-004', 'copy-005', 'copy-006', 'copy-007', 'copy-008', 'copy-009', 'copy-010', 'copy-011', 'copy-012', 'copy-013', 'copy-014', 'copy-015', 'copy-016', 'copy-017', 'copy-018', 'copy-019', 'copy-020');
