#!/bin/bash

echo "========================================"
echo "SIMPLE CHECKOUT BLOCKING TEST"
echo "========================================"
echo ""

# Reset database
echo "Resetting database..."
node seed_database.js > /dev/null 2>&1
echo "✅ Database reset"
echo ""

# Find an item with 2 available copies
echo "Finding item with multiple copies..."
ITEM_DATA=$(curl -s "http://localhost:3000/api/v1/item-copies" | jq -r '.data[] | select(.title == "Barbie") | "\(.library_item_id):\(.id)"' | head -2)
ITEM_ID=$(echo "$ITEM_DATA" | head -1 | cut -d: -f1)
COPY_1=$(echo "$ITEM_DATA" | head -1 | cut -d: -f2)
COPY_2=$(echo "$ITEM_DATA" | tail -1 | cut -d: -f2)

echo "Using Item #$ITEM_ID, Copies #$COPY_1 and #$COPY_2"
echo ""

# Get patron IDs dynamically
PATRON_A=$(curl -s "http://localhost:3000/api/v1/patrons" | jq -r '.data[] | select(.balance == 0) | .id' | head -1)
PATRON_B=$(curl -s "http://localhost:3000/api/v1/patrons" | jq -r '.data[] | select(.balance == 0) | .id' | sed -n 2p)
PATRON_RANDOM=$(curl -s "http://localhost:3000/api/v1/patrons" | jq -r '.data[] | select(.balance == 0) | .id' | sed -n 3p)

echo "Using Patrons: A=$PATRON_A, B=$PATRON_B, Random=$PATRON_RANDOM"
echo ""

echo "Test 1: Trying to checkout an already checked-out item"
echo "--------------------------------------------------------"
echo "Step 1: Patron $PATRON_A checks out Copy #$COPY_1"
CHECKOUT_A=$(curl -s -X POST http://localhost:3000/api/v1/transactions/checkout \
  -H "Content-Type: application/json" \
  -d "{\"copy_id\": $COPY_1, \"patron_id\": $PATRON_A, \"due_date\": \"2025-12-20\"}")

if echo "$CHECKOUT_A" | jq -e '.success' > /dev/null 2>&1; then
  echo "✅ Patron $PATRON_A checked out Copy #$COPY_1"
  STATUS=$(curl -s "http://localhost:3000/api/v1/item-copies/$COPY_1" | jq -r '.data.status')
  echo "   Copy #$COPY_1 status: $STATUS"
else
  echo "❌ Checkout failed: $(echo "$CHECKOUT_A" | jq -r '.error')"
  exit 1
fi

echo ""
echo "Step 2: Patron $PATRON_B tries to checkout the SAME copy #$COPY_1"
CHECKOUT_B=$(curl -s -X POST http://localhost:3000/api/v1/transactions/checkout \
  -H "Content-Type: application/json" \
  -d "{\"copy_id\": $COPY_1, \"patron_id\": $PATRON_B, \"due_date\": \"2025-12-21\"}")

if echo "$CHECKOUT_B" | jq -e '.error' > /dev/null 2>&1; then
  echo "✅ CORRECT: Checkout blocked"
  echo "   Error: $(echo "$CHECKOUT_B" | jq -r '.error')"
else
  echo "❌ BUG: Checkout should have been blocked!"
  echo "   Response: $(echo "$CHECKOUT_B" | jq '.')"
fi

echo ""
echo "========================================"
echo "Test 2: Trying to checkout a Reserved item"
echo "========================================"
echo ""

echo "Step 1: Patron $PATRON_A checks out Copy #$COPY_2"
CHECKOUT_A2=$(curl -s -X POST http://localhost:3000/api/v1/transactions/checkout \
  -H "Content-Type: application/json" \
  -d "{\"copy_id\": $COPY_2, \"patron_id\": $PATRON_A, \"due_date\": \"2025-12-20\"}")

if echo "$CHECKOUT_A2" | jq -e '.success' > /dev/null 2>&1; then
  echo "✅ Patron $PATRON_A checked out Copy #$COPY_2"
else
  echo "❌ Checkout failed"
  exit 1
fi

echo ""
echo "Step 2: Patron $PATRON_B creates a reservation for Item #$ITEM_ID"
RESERVE_B=$(curl -s -X POST http://localhost:3000/api/v1/reservations \
  -H "Content-Type: application/json" \
  -d "{\"library_item_id\": $ITEM_ID, \"patron_id\": $PATRON_B}")

RES_B_STATUS=$(echo "$RESERVE_B" | jq -r '.data.status')
echo "   Reservation status: $RES_B_STATUS (should be 'waiting' since both copies are checked out)"

echo ""
echo "Step 3: Patron $PATRON_A checks in Copy #$COPY_2"
CHECKIN=$(curl -s -X POST http://localhost:3000/api/v1/transactions/checkin \
  -H "Content-Type: application/json" \
  -d "{\"copy_id\": $COPY_2}")

if echo "$CHECKIN" | jq -e '.success' > /dev/null 2>&1; then
  STATUS=$(curl -s "http://localhost:3000/api/v1/item-copies/$COPY_2" | jq -r '.data.status')
  echo "✅ Check-in successful, Copy #$COPY_2 status: $STATUS (should be 'returned')"
fi

echo ""
echo "Step 4: Librarian reshelves Copy #$COPY_2"
RESHELVE=$(curl -s -X POST http://localhost:3000/api/v1/transactions/reshelve \
  -H "Content-Type: application/json" \
  -d "{\"copy_id\": $COPY_2}")

if echo "$RESHELVE" | jq -e '.success' > /dev/null 2>&1; then
  STATUS=$(curl -s "http://localhost:3000/api/v1/item-copies/$COPY_2" | jq -r '.data.status')
  RES_STATUS=$(curl -s "http://localhost:3000/api/v1/reservations" | jq -r --arg pid "$PATRON_B" '.data[] | select(.patron_id == ($pid | tonumber)) | .status' | head -1)
  echo "✅ Reshelve successful"
  echo "   Copy #$COPY_2 status: $STATUS (should be 'Reserved')"
  echo "   Patron $PATRON_B reservation status: $RES_STATUS (should be 'ready')"
fi

echo ""
echo "Step 5: Random patron ($PATRON_RANDOM) tries to checkout Reserved Copy #$COPY_2"
CHECKOUT_RANDOM=$(curl -s -X POST http://localhost:3000/api/v1/transactions/checkout \
  -H "Content-Type: application/json" \
  -d "{\"copy_id\": $COPY_2, \"patron_id\": $PATRON_RANDOM, \"due_date\": \"2025-12-22\"}")

if echo "$CHECKOUT_RANDOM" | jq -e '.error' > /dev/null 2>&1; then
  echo "✅ CORRECT: Checkout blocked for patron without reservation"
  echo "   Error: $(echo "$CHECKOUT_RANDOM" | jq -r '.error')"
else
  echo "❌ BUG: Random patron should not be able to checkout reserved item!"
  echo "   Response: $(echo "$CHECKOUT_RANDOM" | jq '.')"
fi

echo ""
echo "Step 6: Patron $PATRON_B (has reservation) tries to checkout Reserved Copy #$COPY_2"
CHECKOUT_B2=$(curl -s -X POST http://localhost:3000/api/v1/transactions/checkout \
  -H "Content-Type: application/json" \
  -d "{\"copy_id\": $COPY_2, \"patron_id\": $PATRON_B, \"due_date\": \"2025-12-22\"}")

if echo "$CHECKOUT_B2" | jq -e '.success' > /dev/null 2>&1; then
  echo "✅ CORRECT: Patron with reservation can checkout their reserved copy"
else
  echo "❌ BUG: Patron $PATRON_B should be able to checkout their reserved copy!"
  echo "   Error: $(echo "$CHECKOUT_B2" | jq -r '.error')"
fi

echo ""
echo "========================================"
echo "SUMMARY"
echo "========================================"
echo "Check the results above for any ❌ BUG markers"
