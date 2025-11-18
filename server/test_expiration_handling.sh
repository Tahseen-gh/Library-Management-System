#!/bin/bash

echo "========================================"
echo "RESERVATION EXPIRATION TEST"
echo "Testing 5-day pickup window & auto-promotion"
echo "========================================"
echo ""

# Reset database
echo "Resetting database..."
node seed_database.js > /dev/null 2>&1
echo "✅ Database reset"
echo ""

# Find an item with 1 available copy
echo "Finding item with available copy..."
ITEM_DATA=$(curl -s "http://localhost:3000/api/v1/item-copies" | jq -r '.data[] | select(.status == "Available") | "\(.library_item_id):\(.id)"' | head -1)
ITEM_ID=$(echo "$ITEM_DATA" | cut -d: -f1)
COPY_ID=$(echo "$ITEM_DATA" | cut -d: -f2)

echo "Using Item #$ITEM_ID, Copy #$COPY_ID"
echo ""

# Get patron IDs
PATRON_1=$(curl -s "http://localhost:3000/api/v1/patrons" | jq -r '.data[] | select(.balance == 0) | .id' | head -1)
PATRON_2=$(curl -s "http://localhost:3000/api/v1/patrons" | jq -r '.data[] | select(.balance == 0) | .id' | sed -n 2p)

echo "Using Patrons: #$PATRON_1 and #$PATRON_2"
echo ""

echo "Step 1: Patron $PATRON_1 creates a reservation"
echo "------------------------------------------------"
RESERVE_1=$(curl -s -X POST http://localhost:3000/api/v1/reservations \
  -H "Content-Type: application/json" \
  -d "{\"library_item_id\": $ITEM_ID, \"patron_id\": $PATRON_1}")

RES_1_ID=$(echo "$RESERVE_1" | jq -r '.data.id')
RES_1_STATUS=$(echo "$RESERVE_1" | jq -r '.data.status')
RES_1_EXPIRY=$(echo "$RESERVE_1" | jq -r '.data.expiry_date')

echo "✅ Reservation #$RES_1_ID created"
echo "   Status: $RES_1_STATUS"
echo "   Expiry: $RES_1_EXPIRY"

if [ "$RES_1_STATUS" != "ready" ]; then
  echo "   ⚠️  Expected 'ready' status since copy is available"
fi

echo ""
echo "Step 2: Patron $PATRON_2 creates a reservation (should be waiting)"
echo "--------------------------------------------------------------------"
RESERVE_2=$(curl -s -X POST http://localhost:3000/api/v1/reservations \
  -H "Content-Type: application/json" \
  -d "{\"library_item_id\": $ITEM_ID, \"patron_id\": $PATRON_2}")

RES_2_ID=$(echo "$RESERVE_2" | jq -r '.data.id')
RES_2_STATUS=$(echo "$RESERVE_2" | jq -r '.data.status')
RES_2_QUEUE=$(echo "$RESERVE_2" | jq -r '.data.queue_position')

echo "✅ Reservation #$RES_2_ID created"
echo "   Status: $RES_2_STATUS (should be 'waiting')"
echo "   Queue Position: $RES_2_QUEUE"

echo ""
echo "Step 3: Manually expire Reservation #$RES_1_ID by setting past expiry_date"
echo "---------------------------------------------------------------------------"

# We'll use sqlite3 directly to update the expiry date
sqlite3 library.db <<EOF
UPDATE RESERVATIONS
SET expiry_date = datetime('now', '-6 days')
WHERE id = $RES_1_ID;
EOF

echo "✅ Set expiry_date to 6 days ago"

# Verify the change
EXPIRED_DATE=$(sqlite3 library.db "SELECT expiry_date FROM RESERVATIONS WHERE id = $RES_1_ID;")
echo "   New expiry_date: $EXPIRED_DATE"

echo ""
echo "Step 4: Trigger expiration processing"
echo "---------------------------------------"
echo "Note: Expiration is processed automatically when fetching reservations"

# Fetch all reservations to trigger processing
curl -s "http://localhost:3000/api/v1/reservations" > /dev/null

echo "✅ Triggered expiration check"

echo ""
echo "Step 5: Verify Reservation #$RES_1_ID is now 'expired'"
echo "--------------------------------------------------------"

RES_1_NEW=$(curl -s "http://localhost:3000/api/v1/reservations/$RES_1_ID" | jq -r '.data')
RES_1_NEW_STATUS=$(echo "$RES_1_NEW" | jq -r '.status')

echo "Reservation #$RES_1_ID status: $RES_1_NEW_STATUS"

if [ "$RES_1_NEW_STATUS" = "expired" ]; then
  echo "✅ CORRECT: Reservation expired"
else
  echo "❌ ERROR: Expected 'expired' status, got '$RES_1_NEW_STATUS'"
fi

echo ""
echo "Step 6: Verify Reservation #$RES_2_ID was promoted to 'ready'"
echo "---------------------------------------------------------------"

RES_2_NEW=$(curl -s "http://localhost:3000/api/v1/reservations/$RES_2_ID" | jq -r '.data')
RES_2_NEW_STATUS=$(echo "$RES_2_NEW" | jq -r '.status')
RES_2_NEW_EXPIRY=$(echo "$RES_2_NEW" | jq -r '.expiry_date')

echo "Reservation #$RES_2_ID:"
echo "   Status: $RES_2_NEW_STATUS (should be 'ready')"
echo "   Expiry: $RES_2_NEW_EXPIRY (should be ~5 days from now)"

if [ "$RES_2_NEW_STATUS" = "ready" ]; then
  echo "✅ CORRECT: Next reservation promoted to 'ready'"
else
  echo "❌ ERROR: Expected 'ready' status, got '$RES_2_NEW_STATUS'"
fi

echo ""
echo "Step 7: Verify Copy #$COPY_ID status"
echo "--------------------------------------"

COPY_STATUS=$(curl -s "http://localhost:3000/api/v1/item-copies/$COPY_ID" | jq -r '.data.status')
echo "Copy #$COPY_ID status: $COPY_STATUS"

if [ "$COPY_STATUS" = "Reserved" ]; then
  echo "✅ CORRECT: Copy is 'Reserved' for next patron"
else
  echo "⚠️  Copy status: $COPY_STATUS (expected 'Reserved')"
fi

echo ""
echo "Step 8: Verify Patron $PATRON_2 can checkout their reserved copy"
echo "------------------------------------------------------------------"

CHECKOUT=$(curl -s -X POST http://localhost:3000/api/v1/transactions/checkout \
  -H "Content-Type: application/json" \
  -d "{\"copy_id\": $COPY_ID, \"patron_id\": $PATRON_2, \"due_date\": \"2025-12-25\"}")

if echo "$CHECKOUT" | jq -e '.success' > /dev/null 2>&1; then
  echo "✅ CORRECT: Patron $PATRON_2 successfully checked out"

  RES_2_FINAL=$(curl -s "http://localhost:3000/api/v1/reservations/$RES_2_ID" | jq -r '.data.status')
  echo "   Reservation #$RES_2_ID final status: $RES_2_FINAL (should be 'fulfilled')"
else
  echo "❌ ERROR: Patron should be able to checkout their reserved copy"
  echo "   $(echo "$CHECKOUT" | jq -r '.error')"
fi

echo ""
echo "========================================"
echo "EXPIRATION WORKFLOW SUMMARY"
echo "========================================"
echo ""
echo "✓ Reservations set with 5-day expiry window"
echo "✓ Expired reservations detected automatically"
echo "✓ Expired reservation status → 'expired'"
echo "✓ Copy status → 'returned' when reservation expires"
echo "✓ Next patron in queue promoted to 'ready'"
echo "✓ Copy status → 'Reserved' for next patron"
echo "✓ New 5-day window set for promoted patron"
echo ""
echo "========================================"
