-- =====================================================
-- TEST DATA FOR SPRINT 1 - CHECKOUT & CHECK-IN
-- =====================================================
-- This script creates sample patrons, items, and transactions
-- for testing the checkout and check-in functionality
-- =====================================================

-- Create a test branch if it doesn't exist
INSERT OR IGNORE INTO BRANCHES (id, branch_name, address, phone, is_main) 
VALUES ('test-branch-1', 'Main Library', '123 Library St', '555-0100', 1);

-- =====================================================
-- TEST PATRONS
-- =====================================================

-- Patron 1: VALID - No fees, no books checked out
-- Use this for successful checkout tests
INSERT OR IGNORE INTO PATRONS (id, first_name, last_name, email, phone, balance, isActive)
VALUES ('1', 'John', 'Smith', 'john.smith@example.com', '555-0101', 0.00, 1);

-- Patron 2: HAS FEES - $5.50 balance
-- Use this to test fee blocking
INSERT OR IGNORE INTO PATRONS (id, first_name, last_name, email, phone, balance, isActive)
VALUES ('2', 'Jane', 'Doe', 'jane.doe@example.com', '555-0102', 5.50, 1);

-- Patron 3: INACTIVE - Account disabled
-- Use this to test inactive account blocking
INSERT OR IGNORE INTO PATRONS (id, first_name, last_name, email, phone, balance, isActive)
VALUES ('3', 'Bob', 'Johnson', 'bob.j@example.com', '555-0103', 0.00, 0);

-- Patron 4: VALID - Has some books checked out
-- Use this to test patron with existing checkouts
INSERT OR IGNORE INTO PATRONS (id, first_name, last_name, email, phone, balance, isActive)
VALUES ('4', 'Alice', 'Williams', 'alice.w@example.com', '555-0104', 0.00, 1);

-- =====================================================
-- TEST LIBRARY ITEMS
-- =====================================================

-- Book 1: The Great Gatsby
INSERT OR IGNORE INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('1', 'The Great Gatsby', 'BOOK', 'Classic American novel', 1925);

-- Book 2: To Kill a Mockingbird
INSERT OR IGNORE INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('2', 'To Kill a Mockingbird', 'BOOK', 'Classic novel about justice', 1960);

-- Book 3: 1984
INSERT OR IGNORE INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('3', '1984', 'BOOK', 'Dystopian novel by George Orwell', 1949);

-- Movie 1: The Matrix
INSERT OR IGNORE INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('4', 'The Matrix', 'VIDEO', 'Sci-fi action film', 1999);

-- Audiobook 1: Becoming
INSERT OR IGNORE INTO LIBRARY_ITEMS (id, title, item_type, description, publication_year)
VALUES ('5', 'Becoming', 'AUDIOBOOK', 'Michelle Obama autobiography', 2018);

-- =====================================================
-- TEST ITEM COPIES
-- =====================================================

-- Copy 1: The Great Gatsby - AVAILABLE
-- Use for: Successful checkout test
INSERT OR IGNORE INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('1', '1', 'test-branch-1', 'Excellent', 'available');

-- Copy 2: To Kill a Mockingbird - AVAILABLE
-- Use for: Testing book loan duration (28 days)
INSERT OR IGNORE INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('2', '2', 'test-branch-1', 'Good', 'available');

-- Copy 3: 1984 - BORROWED and OVERDUE
-- Use for: Testing late return with fees
INSERT OR IGNORE INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('3', '3', 'test-branch-1', 'Excellent', 'borrowed');

-- Copy 4: The Matrix - AVAILABLE
-- Use for: Testing movie loan duration (7 days)
INSERT OR IGNORE INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('4', '4', 'test-branch-1', 'Excellent', 'available');

-- Copy 5: Becoming (Audiobook) - AVAILABLE
-- Use for: Testing audiobook loan duration (28 days)
INSERT OR IGNORE INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('5', '5', 'test-branch-1', 'New', 'available');

-- Copy 6: The Great Gatsby (another copy) - BORROWED
-- Use for: Testing on-time return (no fees)
INSERT OR IGNORE INTO LIBRARY_ITEM_COPIES (id, library_item_id, branch_id, condition, status)
VALUES ('6', '1', 'test-branch-1', 'Good', 'borrowed');

-- =====================================================
-- ACTIVE TRANSACTIONS
-- =====================================================

-- Transaction 1: patron-004 has copy-006 (Not overdue)
-- Use for: Testing on-time return
INSERT OR IGNORE INTO TRANSACTIONS 
  (id, copy_id, patron_id, transaction_type, checkout_date, due_date, status, fine_amount)
VALUES 
  ('1', '6', '4', 'checkout', 
   datetime('now', '-5 days'), datetime('now', '+23 days'), 'active', 0.00);

-- Transaction 2: patron-001 has copy-003 (OVERDUE by 7 days)
-- Use for: Testing late return with $3.50 fee
INSERT OR IGNORE INTO TRANSACTIONS 
  (id, copy_id, patron_id, transaction_type, checkout_date, due_date, status, fine_amount)
VALUES 
  ('2', '3', '1', 'checkout', 
   datetime('now', '-35 days'), datetime('now', '-7 days'), 'active', 0.00);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Uncomment these to verify data was inserted:

-- SELECT 'PATRONS' as table_name, COUNT(*) as count FROM PATRONS
-- UNION ALL
-- SELECT 'LIBRARY_ITEMS', COUNT(*) FROM LIBRARY_ITEMS
-- UNION ALL
-- SELECT 'LIBRARY_ITEM_COPIES', COUNT(*) FROM LIBRARY_ITEM_COPIES
-- UNION ALL
-- SELECT 'TRANSACTIONS', COUNT(*) FROM TRANSACTIONS;

-- =====================================================
-- TEST DATA REFERENCE GUIDE
-- =====================================================
/*

QUICK REFERENCE FOR TESTING:

VALID CHECKOUTS:
  patron-001 + copy-001  ✅ Should work (Book, 28 days)
  patron-001 + copy-002  ✅ Should work (Book, 28 days)
  patron-004 + copy-004  ✅ Should work (Movie, 7 days)
  patron-001 + copy-005  ✅ Should work (Audiobook, 28 days)

BLOCKED CHECKOUTS:
  patron-002 + any item  ❌ Has $5.50 in fees
  patron-003 + any item  ❌ Account inactive
  any patron + copy-003  ❌ Item borrowed
  any patron + copy-006  ❌ Item borrowed

VALID CHECK-INS:
  copy-006  ✅ On-time return (no fees)
  copy-003  ✅ Late return ($3.50 fee, 7 days late)

BLOCKED CHECK-INS:
  copy-001  ❌ Not checked out
  copy-002  ❌ Not checked out
  copy-004  ❌ Not checked out
  copy-005  ❌ Not checked out

*/
