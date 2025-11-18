#!/bin/bash

echo "=========================================="
echo "TESTING ACTUAL CHECK-IN RESERVATION FLOW"
echo "=========================================="
echo ""

# Use an item with available copies
ITEM_ID=27  # Where the Crawdads Sing

echo "Step 1: Find an available item and check it out"
echo "-------------------------------------------"
AVAILABLE_COPY=$(curl -s "http://localhost:3000/api/v1/item-copies/item/$ITEM_ID" | jq -r '.data[] | select(.status == "Available") | .id' | head -1)

if [ -z "$AVAILABLE_COPY" ]; then
  echo "No available copies found for item $ITEM_ID"
  exit 1
fi

echo "Found available Copy #$AVAILABLE_COPY"

echo ""
echo "Step 2: Patron 6 checks out Copy #$AVAILABLE_COPY"
echo "-------------------------------------------"
CHECKOUT=$(curl -s -X POST http://localhost:3000/api/v1/transactions/checkout \
  -H "Content-Type: application/json" \
  -d "{\"copy_id\": $AVAILABLE_COPY, \"patron_id\": 6, \"due_date\": \"2025-12-20\"}")

if echo "$CHECKOUT" | jq -e '.success' > /dev/null 2>&1; then
  echo "✅ Checkout successful"
  COPY_STATUS=$(curl -s "http://localhost:3000/api/v1/item-copies/$AVAILABLE_COPY" | jq -r '.data.status')
  echo "Copy status: $COPY_STATUS"
else
  echo "❌ Checkout failed: $(echo "$CHECKOUT" | jq -r '.error')"
  exit 1
fi

echo ""
echo "Step 3: Patron 7 creates a reservation (should be 'waiting')"
echo "-------------------------------------------"
RESERVATION=$(curl -s -X POST http://localhost:3000/api/v1/reservations \
  -H "Content-Type: application/json" \
  -d "{\"library_item_id\": $ITEM_ID, \"patron_id\": 7}")

echo "Reservation result:"
echo "$RESERVATION" | jq '{success: .success, status: .data.status, queue: .data.queue_position, message: .message}'

RESERVATION_ID=$(echo "$RESERVATION" | jq -r '.data.id')

echo ""
echo "Step 4: Verify reservation status is 'waiting'"
echo "-------------------------------------------"
RESERVATION_STATUS=$(curl -s "http://localhost:3000/api/v1/reservations/$RESERVATION_ID" | jq -r '.data.status')
echo "Reservation #$RESERVATION_ID status: $RESERVATION_STATUS"

if [ "$RESERVATION_STATUS" != "waiting" ]; then
  echo "❌ Expected 'waiting' status, got '$RESERVATION_STATUS'"
fi

echo ""
echo "Step 5: Patron 6 checks in Copy #$AVAILABLE_COPY"
echo "-------------------------------------------"
echo "THIS IS THE CRITICAL STEP - Does reservation get promoted?"

CHECKIN=$(curl -s -X POST http://localhost:3000/api/v1/transactions/checkin \
  -H "Content-Type: application/json" \
  -d "{\"copy_id\": $AVAILABLE_COPY}")

if echo "$CHECKIN" | jq -e '.success' > /dev/null 2>&1; then
  echo "✅ Check-in successful"
else
  echo "❌ Check-in failed: $(echo "$CHECKIN" | jq -r '.error')"
  echo "Full response:"
  echo "$CHECKIN" | jq '.'
  exit 1
fi

echo ""
echo "Step 6: Check copy status IMMEDIATELY after check-in"
echo "-------------------------------------------"
COPY_STATUS_AFTER=$(curl -s "http://localhost:3000/api/v1/item-copies/$AVAILABLE_COPY" | jq -r '.data.status')
echo "Copy #$AVAILABLE_COPY status: $COPY_STATUS_AFTER"

echo ""
echo "Step 7: Check reservation status IMMEDIATELY after check-in"
echo "-------------------------------------------"
RESERVATION_STATUS_AFTER=$(curl -s "http://localhost:3000/api/v1/reservations/$RESERVATION_ID" | jq -r '.data.status')
echo "Reservation #$RESERVATION_ID status: $RESERVATION_STATUS_AFTER"

echo ""
echo "=========================================="
echo "VERIFICATION"
echo "=========================================="
echo ""

if [ "$COPY_STATUS_AFTER" = "Reserved" ] && [ "$RESERVATION_STATUS_AFTER" = "ready" ]; then
  echo "✅ SUCCESS! Check-in correctly promoted reservation"
  echo "   - Copy status: Reserved ✓"
  echo "   - Reservation status: ready ✓"
  echo "   - Patron 7 can now check out the copy"
elif [ "$COPY_STATUS_AFTER" = "returned" ] && [ "$RESERVATION_STATUS_AFTER" = "waiting" ]; then
  echo "❌ BUG CONFIRMED! Reservation NOT promoted on check-in"
  echo "   - Copy status: returned (should be Reserved)"
  echo "   - Reservation status: waiting (should be ready)"
  echo "   - Requires manual reshelving to make available"
  echo ""
  echo "This means the check-in logic is NOT working correctly!"
else
  echo "⚠️  Unexpected state:"
  echo "   - Copy status: $COPY_STATUS_AFTER"
  echo "   - Reservation status: $RESERVATION_STATUS_AFTER"
fi

echo ""
echo "Step 8: Try to checkout the copy as Patron 7"
echo "-------------------------------------------"
CHECKOUT_7=$(curl -s -X POST http://localhost:3000/api/v1/transactions/checkout \
  -H "Content-Type: application/json" \
  -d "{\"copy_id\": $AVAILABLE_COPY, \"patron_id\": 7, \"due_date\": \"2025-12-25\"}")

if echo "$CHECKOUT_7" | jq -e '.success' > /dev/null 2>&1; then
  echo "✅ Patron 7 can check out the copy"
else
  echo "❌ Patron 7 CANNOT check out: $(echo "$CHECKOUT_7" | jq -r '.error')"
  echo "Message: $(echo "$CHECKOUT_7" | jq -r '.message // .error')"
fi

echo ""
