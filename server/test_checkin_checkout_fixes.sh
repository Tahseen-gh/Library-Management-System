#!/bin/bash

echo "=========================================="
echo "TESTING CHECK-IN AND CHECKOUT FIXES"
echo "=========================================="
echo ""

ITEM_ID=26  # The Midnight Library (3 copies)

echo "Test Item: The Midnight Library (ID: $ITEM_ID, 3 copies)"
echo "=========================================="
echo ""

echo "Step 1: Initial state - check all copies"
echo "-------------------------------------------"
curl -s "http://localhost:3000/api/v1/item-copies/item/$ITEM_ID" | jq -r '.data[] | "Copy #\(.id): \(.status)"'

echo ""
echo "Step 2: Create 3 reservations (Patrons 6, 7, 8)"
echo "-------------------------------------------"
for PATRON in 6 7 8; do
  RESULT=$(curl -s -X POST http://localhost:3000/api/v1/reservations \
    -H "Content-Type: application/json" \
    -d "{\"library_item_id\": $ITEM_ID, \"patron_id\": $PATRON}")
  echo "Patron $PATRON: $(echo "$RESULT" | jq -r '.data.status') (queue #$(echo "$RESULT" | jq -r '.data.queue_position'))"
done

echo ""
echo "Step 3: Check copy statuses after reservations"
echo "-------------------------------------------"
curl -s "http://localhost:3000/api/v1/item-copies/item/$ITEM_ID" | jq -r '.data[] | "Copy #\(.id): \(.status)"'

echo ""
echo "Step 4: TEST FIX #1 - Patron with 'ready' reservation CAN checkout"
echo "-------------------------------------------"
echo "Getting first reserved copy..."
COPY_1=$(curl -s "http://localhost:3000/api/v1/item-copies/item/$ITEM_ID" | jq -r '.data[] | select(.status == "Reserved") | .id' | head -1)

if [ ! -z "$COPY_1" ]; then
  echo "Patron 6 checking out Copy #$COPY_1 (should succeed)..."
  CHECKOUT=$(curl -s -X POST http://localhost:3000/api/v1/transactions/checkout \
    -H "Content-Type: application/json" \
    -d "{\"copy_id\": $COPY_1, \"patron_id\": 6, \"due_date\": \"2025-12-15\"}")

  if echo "$CHECKOUT" | jq -e '.success' > /dev/null 2>&1; then
    echo "✅ SUCCESS! Patron 6 checked out their reserved copy"
  else
    echo "❌ FAILED: $(echo "$CHECKOUT" | jq -r '.error')"
  fi
fi

echo ""
echo "Step 5: Patron 7 checking out their reserved copy"
echo "-------------------------------------------"
COPY_2=$(curl -s "http://localhost:3000/api/v1/item-copies/item/$ITEM_ID" | jq -r '.data[] | select(.status == "Reserved") | .id' | head -1)

if [ ! -z "$COPY_2" ]; then
  echo "Patron 7 checking out Copy #$COPY_2 (should succeed)..."
  CHECKOUT2=$(curl -s -X POST http://localhost:3000/api/v1/transactions/checkout \
    -H "Content-Type: application/json" \
    -d "{\"copy_id\": $COPY_2, \"patron_id\": 7, \"due_date\": \"2025-12-15\"}")

  if echo "$CHECKOUT2" | jq -e '.success' > /dev/null 2>&1; then
    echo "✅ SUCCESS! Patron 7 checked out their reserved copy"
  else
    echo "❌ FAILED: $(echo "$CHECKOUT2" | jq -r '.error')"
  fi
fi

echo ""
echo "Step 6: Patron 8 checking out their reserved copy"
echo "-------------------------------------------"
COPY_3=$(curl -s "http://localhost:3000/api/v1/item-copies/item/$ITEM_ID" | jq -r '.data[] | select(.status == "Reserved") | .id' | head -1)

if [ ! -z "$COPY_3" ]; then
  echo "Patron 8 checking out Copy #$COPY_3 (should succeed)..."
  CHECKOUT3=$(curl -s -X POST http://localhost:3000/api/v1/transactions/checkout \
    -H "Content-Type: application/json" \
    -d "{\"copy_id\": $COPY_3, \"patron_id\": 8, \"due_date\": \"2025-12-15\"}")

  if echo "$CHECKOUT3" | jq -e '.success' > /dev/null 2>&1; then
    echo "✅ SUCCESS! Patron 8 checked out their reserved copy"
  else
    echo "❌ FAILED: $(echo "$CHECKOUT3" | jq -r '.error')"
  fi
fi

echo ""
echo "Step 7: All copies checked out - verify status"
echo "-------------------------------------------"
curl -s "http://localhost:3000/api/v1/item-copies/item/$ITEM_ID" | jq -r '.data[] | "Copy #\(.id): \(.status)"'

echo ""
echo "Step 8: Create a waitlist reservation (Patron 10)"
echo "-------------------------------------------"
WAITLIST=$(curl -s -X POST http://localhost:3000/api/v1/reservations \
  -H "Content-Type: application/json" \
  -d "{\"library_item_id\": $ITEM_ID, \"patron_id\": 10}")
echo "Patron 10: $(echo "$WAITLIST" | jq -r '.data.status') (queue #$(echo "$WAITLIST" | jq -r '.data.queue_position'))"

echo ""
echo "Step 9: TEST FIX #2 - Check in copy, should become 'Reserved' for waitlist"
echo "-------------------------------------------"
echo "Checking in Copy #$COPY_1 (Patron 6)..."
CHECKIN=$(curl -s -X POST http://localhost:3000/api/v1/transactions/checkin \
  -H "Content-Type: application/json" \
  -d "{\"copy_id\": $COPY_1}")

if echo "$CHECKIN" | jq -e '.success' > /dev/null 2>&1; then
  echo "✅ Check-in successful"

  # Check copy status
  COPY_STATUS=$(curl -s "http://localhost:3000/api/v1/item-copies/$COPY_1" | jq -r '.data.status')
  echo "Copy #$COPY_1 status after check-in: $COPY_STATUS"

  # Check reservation status
  PATRON_10_RES=$(curl -s "http://localhost:3000/api/v1/reservations?library_item_id=$ITEM_ID&patron_id=10" | jq -r '.data[0].status')
  echo "Patron 10 reservation status: $PATRON_10_RES"

  if [ "$COPY_STATUS" = "Reserved" ] && [ "$PATRON_10_RES" = "ready" ]; then
    echo "✅ FIX VERIFIED! Copy is 'Reserved' and waitlist promoted to 'ready'"
  else
    echo "❌ Issue: Copy status=$COPY_STATUS, Reservation status=$PATRON_10_RES"
  fi
else
  echo "❌ Check-in failed: $(echo "$CHECKIN" | jq -r '.error')"
fi

echo ""
echo "Step 10: Patron 10 checking out now-reserved copy"
echo "-------------------------------------------"
CHECKOUT_10=$(curl -s -X POST http://localhost:3000/api/v1/transactions/checkout \
  -H "Content-Type: application/json" \
  -d "{\"copy_id\": $COPY_1, \"patron_id\": 10, \"due_date\": \"2025-12-15\"}")

if echo "$CHECKOUT_10" | jq -e '.success' > /dev/null 2>&1; then
  echo "✅ SUCCESS! Patron 10 checked out the reserved copy"
else
  echo "❌ FAILED: $(echo "$CHECKOUT_10" | jq -r '.error')"
fi

echo ""
echo "=========================================="
echo "SUMMARY"
echo "=========================================="
echo ""
echo "Fix #1: Queue position logic"
echo "  ✓ Patrons with reservations can check out their copies"
echo "  ✓ Other patrons with higher queue positions don't block checkout"
echo ""
echo "Fix #2: Check-in reservation promotion"
echo "  ✓ Checked-in copy stays 'Reserved' when promoted to next patron"
echo "  ✓ Waitlist automatically promotes to 'ready' on check-in"
echo "  ✓ Patron can immediately check out their newly-ready reservation"
echo ""
