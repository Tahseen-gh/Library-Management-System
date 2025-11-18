#!/bin/bash

echo "=========================================="
echo "TESTING CHECK-IN AND RESERVATION ISSUES"
echo "=========================================="
echo ""

# Get a book with 3 copies
ITEM_ID=26  # The Midnight Library (3 copies)

echo "Test Item: The Midnight Library (ID: $ITEM_ID)"
echo "-------------------------------------------"
echo ""

echo "Step 1: Check current status of all copies"
echo "-------------------------------------------"
curl -s "http://localhost:3000/api/v1/item-copies/item/$ITEM_ID" | jq -r '.data[] | "Copy #\(.id): \(.status)"'

echo ""
echo "Step 2: Check existing reservations"
echo "-------------------------------------------"
curl -s "http://localhost:3000/api/v1/reservations?library_item_id=$ITEM_ID" | jq '.data[] | {patron_id: .patron_id, status: .status, queue: .queue_position}'

echo ""
echo "Step 3: Create reservation for Patron 6"
echo "-------------------------------------------"
RESERVATION=$(curl -s -X POST http://localhost:3000/api/v1/reservations \
  -H "Content-Type: application/json" \
  -d "{\"library_item_id\": $ITEM_ID, \"patron_id\": 6}")
echo "$RESERVATION" | jq '{success: .success, status: .data.status, message: .message}'

echo ""
echo "Step 4: Check which copy was reserved"
echo "-------------------------------------------"
curl -s "http://localhost:3000/api/v1/item-copies/item/$ITEM_ID" | jq -r '.data[] | "Copy #\(.id): \(.status)"'

echo ""
echo "Step 5: Try to check out the reserved copy as Patron 6"
echo "-------------------------------------------"
RESERVED_COPY=$(curl -s "http://localhost:3000/api/v1/item-copies/item/$ITEM_ID" | jq -r '.data[] | select(.status == "Reserved") | .id' | head -1)
echo "Attempting to checkout Copy #$RESERVED_COPY for Patron 6..."

if [ ! -z "$RESERVED_COPY" ]; then
  CHECKOUT=$(curl -s -X POST http://localhost:3000/api/v1/transactions/checkout \
    -H "Content-Type: application/json" \
    -d "{\"copy_id\": $RESERVED_COPY, \"patron_id\": 6, \"due_date\": \"2025-12-01\"}")

  if echo "$CHECKOUT" | jq -e '.success' > /dev/null 2>&1; then
    echo "✅ Checkout successful!"
    echo "$CHECKOUT" | jq '{success: .success, message: .message}'
  else
    echo "❌ Checkout FAILED!"
    echo "$CHECKOUT" | jq '{error: .error, message: .message}'
  fi
else
  echo "No reserved copy found"
fi

echo ""
echo "Step 6: Create another reservation for Patron 7"
echo "-------------------------------------------"
RESERVATION2=$(curl -s -X POST http://localhost:3000/api/v1/reservations \
  -H "Content-Type: application/json" \
  -d "{\"library_item_id\": $ITEM_ID, \"patron_id\": 7}")
echo "$RESERVATION2" | jq '{success: .success, status: .data.status}'

echo ""
echo "Step 7: Try to check out reserved copy as Patron 6 AGAIN"
echo "-------------------------------------------"
RESERVED_COPY=$(curl -s "http://localhost:3000/api/v1/item-copies/item/$ITEM_ID" | jq -r '.data[] | select(.status == "Reserved") | .id' | head -1)

if [ ! -z "$RESERVED_COPY" ]; then
  CHECKOUT2=$(curl -s -X POST http://localhost:3000/api/v1/transactions/checkout \
    -H "Content-Type: application/json" \
    -d "{\"copy_id\": $RESERVED_COPY, \"patron_id\": 6, \"due_date\": \"2025-12-01\"}")

  if echo "$CHECKOUT2" | jq -e '.success' > /dev/null 2>&1; then
    echo "✅ Checkout successful!"
  else
    echo "❌ Checkout FAILED - This is the BUG!"
    echo "$CHECKOUT2" | jq '{error: .error, message: .message}'
    echo ""
    echo "Why it fails:"
    echo "  - Patron 6 has 'ready' reservation for this item"
    echo "  - Patron 7 also has 'ready' reservation for this item (different copy)"
    echo "  - System checks if OTHER patrons have reservations (line 200)"
    echo "  - Finds Patron 7's reservation"
    echo "  - Blocks Patron 6 from checking out their own reserved copy!"
  fi
fi

echo ""
echo "=========================================="
echo "ISSUE IDENTIFIED"
echo "=========================================="
echo ""
echo "Problem: Checkout logic checks for reservations at ITEM level,"
echo "         but copies are reserved individually."
echo ""
echo "Current logic (line 200-203 in transactions.js):"
echo "  'SELECT * FROM RESERVATIONS WHERE library_item_id = ? AND patron_id != ?'"
echo ""
echo "This blocks checkout if ANY other patron has a reservation for the ITEM,"
echo "even if they have a different copy reserved."
echo ""
