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
VALUES ('1', 'John', 'Smith', 'john.smith@example.com', '555-0101', 0.00, 1);

-- Patron 2: HAS FEES - $5.50 balance (Use to test fee blocking - US 2.7)
INSERT INTO PATRONS (id, first_name, last_name, email, phone, balance, isActive)
VALUES ('2', 'Jane', 'Doe', 'jane.doe@example.com', '555-0102', 5.50, 1);

-- Patron 3: INACTIVE (Use to test inactive blocking - US 1.3)
INSERT INTO PATRONS (id, first_name, last_name, email, phone, balance, isActive)
VALUES ('3', 'Bob', 'Johnson', 'bob.j@example.com', '555-0103', 0.00, 0);

-- Patron 4: HAS 20 CHECKED OUT BOOKS (Use to test 20-book limit - US 2.3)
INSERT INTO PATRONS (id, first_name, last_name, email, phone, balance, isActive)
VALUES ('4', 'Alice', 'Williams', 'alice.williams@example.com', '555-0104', 0.00, 1);

-- =====================================================
-- LIBRARY ITEMS - Books (20+)
-- =====================================================

-- Book 1: The Great Gatsby
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('1', 'The Great Gatsby', 'BOOK', 'Classic American novel', 1925);

-- Book 2: To Kill a Mockingbird
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('2', 'To Kill a Mockingbird', 'BOOK', 'Classic novel', 1960);

-- Book 3: Pride and Prejudice
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('3', 'Pride and Prejudice', 'BOOK', 'Romance classic', 1813);

-- Book 4: 1984
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('4', '1984', 'BOOK', 'Dystopian novel', 1949);

-- Book 5: The Catcher in the Rye
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('5', 'The Catcher in the Rye', 'BOOK', 'Coming of age', 1951);

-- Book 6: Brave New World
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('6', 'Brave New World', 'BOOK', 'Science fiction', 1932);

-- Book 7: Jane Eyre
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('7', 'Jane Eyre', 'BOOK', 'Gothic romance', 1847);

-- Book 8: Wuthering Heights
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('8', 'Wuthering Heights', 'BOOK', 'Romance', 1847);

-- Book 9: The Hobbit
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('9', 'The Hobbit', 'BOOK', 'Fantasy adventure', 1937);

-- Book 10: The Lord of the Rings
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('10', 'The Lord of the Rings', 'BOOK', 'Epic fantasy', 1954);

-- Book 11: Harry Potter and the Philosopher\'s Stone
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('11', 'Harry Potter and the Philosopher\'s Stone', 'BOOK', 'Fantasy', 1998);

-- Book 12: The Chronicles of Narnia
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('12', 'The Chronicles of Narnia', 'BOOK', 'Fantasy series', 1950);

-- Book 13: Dune
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('13', 'Dune', 'BOOK', 'Science fiction', 1965);

-- Book 14: Foundation
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('14', 'Foundation', 'BOOK', 'Science fiction', 1951);

-- Book 15: The Invisible Man
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('15', 'The Invisible Man', 'BOOK', 'Science fiction', 1897);

-- Book 16: Frankenstein
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('16', 'Frankenstein', 'BOOK', 'Gothic horror', 1818);

-- Book 17: Dracula
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('17', 'Dracula', 'BOOK', 'Gothic horror', 1897);

-- Book 18: The Count of Monte Cristo
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('18', 'The Count of Monte Cristo', 'BOOK', 'Adventure', 1844);

-- Book 19: The Three Musketeers
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('19', 'The Three Musketeers', 'BOOK', 'Adventure', 1844);

-- Book 20: Moby Dick
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('20', 'Moby Dick', 'BOOK', 'Adventure', 1851);

-- Book 21: (Extra book for more checkouts)
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('21', 'The Odyssey', 'BOOK', 'Epic poetry', 1614);

-- =====================================================
-- VIDEOS (Movies)
-- =====================================================

-- Movie 1: The Matrix
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('22', 'The Matrix', 'VIDEO', 'Sci-fi film', 1999);

-- Movie 2: Inception
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('23', 'Inception', 'VIDEO', 'Sci-fi thriller', 2010);

-- Movie 3: The Shawshank Redemption
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('24', 'The Shawshank Redemption', 'VIDEO', 'Drama', 1994);

-- =====================================================
-- AUDIOBOOKS
-- =====================================================

-- Audiobook 1: Sherlock Holmes
INSERT INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('25', 'Sherlock Holmes Complete Collection', 'AUDIOBOOK', 'Mystery', 1892);

-- =====================================================
-- LIBRARY ITEM COPIES
-- =====================================================

-- Create 1 copy of each book (available)
INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('1', '1', '1', 'Excellent', 'available');

INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('2', '2', '1', 'Good', 'available');

INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('3', '3', '1', 'Excellent', 'available');

INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('4', '4', '1', 'Good', 'available');

INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('5', '5', '1', 'Excellent', 'available');

INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('6', '6', '1', 'Good', 'available');

INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('7', '7', '1', 'Excellent', 'available');

INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('8', '8', '1', 'Fair', 'available');

INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('9', '9', '1', 'Excellent', 'available');

INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('10', '10', '1', 'Good', 'available');

INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('11', '11', '1', 'Excellent', 'available');

INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('12', '12', '1', 'Good', 'available');

INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('13', '13', '1', 'Excellent', 'available');

INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('14', '14', '1', 'Good', 'available');

INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('15', '15', '1', 'Excellent', 'available');

INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('16', '16', '1', 'Good', 'available');

INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('17', '17', '1', 'Fair', 'available');

INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('18', '18', '1', 'Excellent', 'available');

INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('19', '19', '1', 'Good', 'available');

INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('20', '20', '1', 'Excellent', 'available');

INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('21', '21', '1', 'Good', 'available');

-- Movie Copies
INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('22', '22', '1', 'Excellent', 'available');

INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('23', '23', '1', 'Good', 'available');

INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('24', '24', '1', 'Excellent', 'available');

-- Audiobook Copy
INSERT INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('25', '25', '1', 'Excellent', 'available');

-- =====================================================
-- TRANSACTIONS - Patron 4 with 20 checked out books (US 2.3 test)
-- =====================================================

INSERT INTO TRANSACTIONS (id, copy_id, patron_id, transaction_type, checkout_date, due_date, return_date, fine_amount, status)
VALUES ('1', '1', '4', 'checkout', datetime('now', '-5 days'), datetime('now', '+23 days'), NULL, 0, 'active');

INSERT INTO TRANSACTIONS (id, copy_id, patron_id, transaction_type, checkout_date, due_date, return_date, fine_amount, status)
VALUES ('2', '2', '4', 'checkout', datetime('now', '-4 days'), datetime('now', '+24 days'), NULL, 0, 'active');

INSERT INTO TRANSACTIONS (id, copy_id, patron_id, transaction_type, checkout_date, due_date, return_date, fine_amount, status)
VALUES ('3', '3', '4', 'checkout', datetime('now', '-3 days'), datetime('now', '+25 days'), NULL, 0, 'active');

INSERT INTO TRANSACTIONS (id, copy_id, patron_id, transaction_type, checkout_date, due_date, return_date, fine_amount, status)
VALUES ('4', '4', '4', 'checkout', datetime('now', '-2 days'), datetime('now', '+26 days'), NULL, 0, 'active');

INSERT INTO TRANSACTIONS (id, copy_id, patron_id, transaction_type, checkout_date, due_date, return_date, fine_amount, status)
VALUES ('5', '5', '4', 'checkout', datetime('now', '-1 days'), datetime('now', '+27 days'), NULL, 0, 'active');

INSERT INTO TRANSACTIONS (id, copy_id, patron_id, transaction_type, checkout_date, due_date, return_date, fine_amount, status)
VALUES ('6', '6', '4', 'checkout', datetime('now'), datetime('now', '+28 days'), NULL, 0, 'active');

INSERT INTO TRANSACTIONS (id, copy_id, patron_id, transaction_type, checkout_date, due_date, return_date, fine_amount, status)
VALUES ('7', '7', '4', 'checkout', datetime('now'), datetime('now', '+28 days'), NULL, 0, 'active');

INSERT INTO TRANSACTIONS (id, copy_id, patron_id, transaction_type, checkout_date, due_date, return_date, fine_amount, status)
VALUES ('8', '8', '4', 'checkout', datetime('now'), datetime('now', '+28 days'), NULL, 0, 'active');

INSERT INTO TRANSACTIONS (id, copy_id, patron_id, transaction_type, checkout_date, due_date, return_date, fine_amount, status)
VALUES ('9', '9', '4', 'checkout', datetime('now'), datetime('now', '+28 days'), NULL, 0, 'active');

INSERT INTO TRANSACTIONS (id, copy_id, patron_id, transaction_type, checkout_date, due_date, return_date, fine_amount, status)
VALUES ('10', '10', '4', 'checkout', datetime('now'), datetime('now', '+28 days'), NULL, 0, 'active');

INSERT INTO TRANSACTIONS (id, copy_id, patron_id, transaction_type, checkout_date, due_date, return_date, fine_amount, status)
VALUES ('11', '11', '4', 'checkout', datetime('now'), datetime('now', '+28 days'), NULL, 0, 'active');

INSERT INTO TRANSACTIONS (id, copy_id, patron_id, transaction_type, checkout_date, due_date, return_date, fine_amount, status)
VALUES ('12', '12', '4', 'checkout', datetime('now'), datetime('now', '+28 days'), NULL, 0, 'active');

INSERT INTO TRANSACTIONS (id, copy_id, patron_id, transaction_type, checkout_date, due_date, return_date, fine_amount, status)
VALUES ('13', '13', '4', 'checkout', datetime('now'), datetime('now', '+28 days'), NULL, 0, 'active');

INSERT INTO TRANSACTIONS (id, copy_id, patron_id, transaction_type, checkout_date, due_date, return_date, fine_amount, status)
VALUES ('14', '14', '4', 'checkout', datetime('now'), datetime('now', '+28 days'), NULL, 0, 'active');

INSERT INTO TRANSACTIONS (id, copy_id, patron_id, transaction_type, checkout_date, due_date, return_date, fine_amount, status)
VALUES ('15', '15', '4', 'checkout', datetime('now'), datetime('now', '+28 days'), NULL, 0, 'active');

INSERT INTO TRANSACTIONS (id, copy_id, patron_id, transaction_type, checkout_date, due_date, return_date, fine_amount, status)
VALUES ('16', '16', '4', 'checkout', datetime('now'), datetime('now', '+28 days'), NULL, 0, 'active');

INSERT INTO TRANSACTIONS (id, copy_id, patron_id, transaction_type, checkout_date, due_date, return_date, fine_amount, status)
VALUES ('17', '17', '4', 'checkout', datetime('now'), datetime('now', '+28 days'), NULL, 0, 'active');

INSERT INTO TRANSACTIONS (id, copy_id, patron_id, transaction_type, checkout_date, due_date, return_date, fine_amount, status)
VALUES ('18', '18', '4', 'checkout', datetime('now'), datetime('now', '+28 days'), NULL, 0, 'active');

INSERT INTO TRANSACTIONS (id, copy_id, patron_id, transaction_type, checkout_date, due_date, return_date, fine_amount, status)
VALUES ('19', '19', '4', 'checkout', datetime('now'), datetime('now', '+28 days'), NULL, 0, 'active');

INSERT INTO TRANSACTIONS (id, copy_id, patron_id, transaction_type, checkout_date, due_date, return_date, fine_amount, status)
VALUES ('20', '20', '4', 'checkout', datetime('now'), datetime('now', '+28 days'), NULL, 0, 'active');

-- Update copy statuses to borrowed for patron-004
UPDATE LIBRARY_ITEM_COPIES SET status = 'borrowed' WHERE id IN ('1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20');
