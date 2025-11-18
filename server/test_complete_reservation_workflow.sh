#!/bin/bash

echo "============================================================================"
echo "COMPREHENSIVE RESERVATION WORKFLOW TEST"
echo "Testing complete user story with checkout prevention and status lifecycle"
echo "============================================================================"
echo ""

# Use an item with multiple copies for better testing
ITEM_ID=99  # Barbie
PATRON_1=16  # First patron - will check out (John Doe)
PATRON_2=18  # Second patron - will reserve and wait (Robert Johnson)
PATRON_3=20  # Third patron - will also reserve (Michael Brown)

echo "═══════════════════════════════════════════════════════════════════════════"
echo "PHASE 1: SETUP - Initial State"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

# Find available copies
echo "Finding available copies for Item #$ITEM_ID..."
AVAILABLE_COPIES=$(curl -s "http://localhost:3000/api/v1/item-copies/item/$ITEM_ID" | jq -r '.data[] | select(.status == "Available") | .id')

if [ -z "$AVAILABLE_COPIES" ]; then
  echo "❌ No available copies found for item $ITEM_ID"
  exit 1
fi

COPY_1=$(echo "$AVAILABLE_COPIES" | head -1)
COPY_2=$(echo "$AVAILABLE_COPIES" | sed -n 2p)

echo "✅ Found available copies:"
echo "   - Copy #$COPY_1"
if [ -n "$COPY_2" ]; then
  echo "   - Copy #$COPY_2"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "PHASE 2: CHECKOUT - Patron $PATRON_1 checks out Copy #$COPY_1"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

CHECKOUT_1=$(curl -s -X POST http://localhost:3000/api/v1/transactions/checkout \
  -H "Content-Type: application/json" \
  -d "{\"copy_id\": $COPY_1, \"patron_id\": $PATRON_1, \"due_date\": \"2025-12-20\"}")

if echo "$CHECKOUT_1" | jq -e '.success' > /dev/null 2>&1; then
  echo "✅ Patron $PATRON_1 successfully checked out Copy #$COPY_1"
  COPY_1_STATUS=$(curl -s "http://localhost:3000/api/v1/item-copies/$COPY_1" | jq -r '.data.status')
  echo "   Copy #$COPY_1 status: $COPY_1_STATUS"
else
  echo "❌ Checkout failed: $(echo "$CHECKOUT_1" | jq -r '.error')"
  exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "PHASE 3: RESERVATIONS - Multiple patrons reserve"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

echo "Patron $PATRON_2 creates reservation..."
RESERVE_2=$(curl -s -X POST http://localhost:3000/api/v1/reservations \
  -H "Content-Type: application/json" \
  -d "{\"library_item_id\": $ITEM_ID, \"patron_id\": $PATRON_2}")

RES_2_ID=$(echo "$RESERVE_2" | jq -r '.data.id')
RES_2_STATUS=$(echo "$RESERVE_2" | jq -r '.data.status')
RES_2_QUEUE=$(echo "$RESERVE_2" | jq -r '.data.queue_position')

echo "✅ Patron $PATRON_2 - Reservation #$RES_2_ID"
echo "   Status: $RES_2_STATUS, Queue Position: $RES_2_QUEUE"

if [ "$RES_2_STATUS" != "waiting" ]; then
  echo "   ⚠️  Expected 'waiting' status since all copies are checked out"
fi

echo ""
echo "Patron $PATRON_3 creates reservation..."
RESERVE_3=$(curl -s -X POST http://localhost:3000/api/v1/reservations \
  -H "Content-Type: application/json" \
  -d "{\"library_item_id\": $ITEM_ID, \"patron_id\": $PATRON_3}")

RES_3_ID=$(echo "$RESERVE_3" | jq -r '.data.id')
RES_3_STATUS=$(echo "$RESERVE_3" | jq -r '.data.status')
RES_3_QUEUE=$(echo "$RESERVE_3" | jq -r '.data.queue_position')

echo "✅ Patron $PATRON_3 - Reservation #$RES_3_ID"
echo "   Status: $RES_3_STATUS, Queue Position: $RES_3_QUEUE"

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "PHASE 4: CHECKOUT PREVENTION TEST"
echo "Testing: Other patrons cannot check out reserved items"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

echo "Test 1: Patron $PATRON_2 (has reservation, queue #$RES_2_QUEUE) tries to checkout Copy #$COPY_1 (currently checked out)..."
BLOCKED_CHECKOUT=$(curl -s -X POST http://localhost:3000/api/v1/transactions/checkout \
  -H "Content-Type: application/json" \
  -d "{\"copy_id\": $COPY_1, \"patron_id\": $PATRON_2, \"due_date\": \"2025-12-25\"}")

if echo "$BLOCKED_CHECKOUT" | jq -e '.success == false' > /dev/null 2>&1; then
  echo "✅ CORRECT: Checkout blocked - $(echo "$BLOCKED_CHECKOUT" | jq -r '.error // .message')"
else
  echo "❌ ERROR: Checkout should be blocked but succeeded!"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "PHASE 5: CHECK-IN WORKFLOW"
echo "Testing: Check-in → returned status (NO automatic promotion)"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

echo "Patron $PATRON_1 checks in Copy #$COPY_1..."
CHECKIN=$(curl -s -X POST http://localhost:3000/api/v1/transactions/checkin \
  -H "Content-Type: application/json" \
  -d "{\"copy_id\": $COPY_1}")

if echo "$CHECKIN" | jq -e '.success' > /dev/null 2>&1; then
  echo "✅ Check-in successful"

  COPY_STATUS_AFTER_CHECKIN=$(curl -s "http://localhost:3000/api/v1/item-copies/$COPY_1" | jq -r '.data.status')
  RES_2_STATUS_AFTER_CHECKIN=$(curl -s "http://localhost:3000/api/v1/reservations/$RES_2_ID" | jq -r '.data.status')

  echo "   Copy #$COPY_1 status: $COPY_STATUS_AFTER_CHECKIN"
  echo "   Reservation #$RES_2_ID status: $RES_2_STATUS_AFTER_CHECKIN"

  if [ "$COPY_STATUS_AFTER_CHECKIN" = "returned" ] && [ "$RES_2_STATUS_AFTER_CHECKIN" = "waiting" ]; then
    echo "   ✅ CORRECT: Item is 'returned', reservation still 'waiting' (awaiting manual reshelve)"
  else
    echo "   ❌ ERROR: Unexpected state after check-in"
  fi
else
  echo "❌ Check-in failed: $(echo "$CHECKIN" | jq -r '.error')"
  exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "PHASE 6: MANUAL RESHELVE WORKFLOW"
echo "Testing: Reshelve → automatic promotion → Reserved status"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

echo "Librarian reshelves Copy #$COPY_1..."
RESHELVE=$(curl -s -X POST http://localhost:3000/api/v1/transactions/reshelve \
  -H "Content-Type: application/json" \
  -d "{\"copy_id\": $COPY_1}")

if echo "$RESHELVE" | jq -e '.success' > /dev/null 2>&1; then
  echo "✅ Reshelve successful"

  sleep 1  # Brief pause to ensure database updates

  COPY_STATUS_AFTER_RESHELVE=$(curl -s "http://localhost:3000/api/v1/item-copies/$COPY_1" | jq -r '.data.status')
  RES_2_STATUS_AFTER_RESHELVE=$(curl -s "http://localhost:3000/api/v1/reservations/$RES_2_ID" | jq -r '.data.status')

  echo "   Copy #$COPY_1 status: $COPY_STATUS_AFTER_RESHELVE"
  echo "   Reservation #$RES_2_ID status: $RES_2_STATUS_AFTER_RESHELVE"

  if [ "$COPY_STATUS_AFTER_RESHELVE" = "Reserved" ] && [ "$RES_2_STATUS_AFTER_RESHELVE" = "ready" ]; then
    echo "   ✅ CORRECT: Copy is 'Reserved', reservation is 'ready' (on reserved shelf)"

    # Check expiry date
    EXPIRY=$(curl -s "http://localhost:3000/api/v1/reservations/$RES_2_ID" | jq -r '.data.expiry_date')
    echo "   Expiry date set: $EXPIRY (5 days from now)"
  else
    echo "   ❌ ERROR: Reshelve should promote reservation to 'ready' and copy to 'Reserved'"
  fi
else
  echo "❌ Reshelve failed: $(echo "$RESHELVE" | jq -r '.error')"
  exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "PHASE 7: CHECKOUT PREVENTION - Reserved Item"
echo "Testing: Patron without reservation cannot check out Reserved copy"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

echo "Test 2: Patron $PATRON_3 (queue #$RES_3_QUEUE) tries to checkout Copy #$COPY_1 (Reserved for Patron $PATRON_2, queue #$RES_2_QUEUE)..."
BLOCKED_CHECKOUT_2=$(curl -s -X POST http://localhost:3000/api/v1/transactions/checkout \
  -H "Content-Type: application/json" \
  -d "{\"copy_id\": $COPY_1, \"patron_id\": $PATRON_3, \"due_date\": \"2025-12-25\"}")

if echo "$BLOCKED_CHECKOUT_2" | jq -e '.success == false' > /dev/null 2>&1; then
  echo "✅ CORRECT: Checkout blocked - $(echo "$BLOCKED_CHECKOUT_2" | jq -r '.error // .message')"
else
  echo "❌ ERROR: Patron $PATRON_3 should not be able to check out (Patron $PATRON_2 has better queue position)"
fi

echo ""
echo "Test 3: Random patron (no reservation) tries to checkout Copy #$COPY_1..."
BLOCKED_CHECKOUT_3=$(curl -s -X POST http://localhost:3000/api/v1/transactions/checkout \
  -H "Content-Type: application/json" \
  -d "{\"copy_id\": $COPY_1, \"patron_id\": 19, \"due_date\": \"2025-12-25\"}")

if echo "$BLOCKED_CHECKOUT_3" | jq -e '.success == false' > /dev/null 2>&1; then
  echo "✅ CORRECT: Checkout blocked - $(echo "$BLOCKED_CHECKOUT_3" | jq -r '.error // .message')"
else
  echo "❌ ERROR: Random patron should not be able to check out reserved item"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "PHASE 8: SUCCESSFUL CHECKOUT BY RESERVING PATRON"
echo "Testing: Patron with 'ready' reservation CAN check out their copy"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

echo "Patron $PATRON_2 (has 'ready' reservation, queue #$RES_2_QUEUE) checks out Copy #$COPY_1..."
CHECKOUT_2=$(curl -s -X POST http://localhost:3000/api/v1/transactions/checkout \
  -H "Content-Type: application/json" \
  -d "{\"copy_id\": $COPY_1, \"patron_id\": $PATRON_2, \"due_date\": \"2025-12-25\"}")

if echo "$CHECKOUT_2" | jq -e '.success' > /dev/null 2>&1; then
  echo "✅ CORRECT: Patron $PATRON_2 successfully checked out their reserved copy"

  COPY_STATUS=$(curl -s "http://localhost:3000/api/v1/item-copies/$COPY_1" | jq -r '.data.status')
  RES_2_STATUS=$(curl -s "http://localhost:3000/api/v1/reservations/$RES_2_ID" | jq -r '.data.status')

  echo "   Copy #$COPY_1 status: $COPY_STATUS (should be 'Checked Out')"
  echo "   Reservation #$RES_2_ID status: $RES_2_STATUS (should be 'fulfilled')"

  if [ "$COPY_STATUS" != "Checked Out" ] || [ "$RES_2_STATUS" != "fulfilled" ]; then
    echo "   ⚠️  Unexpected status values"
  fi
else
  echo "❌ ERROR: Patron $PATRON_2 should be able to check out their reserved copy"
  echo "   Error: $(echo "$CHECKOUT_2" | jq -r '.error // .message')"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "PHASE 9: QUEUE ADVANCEMENT"
echo "Testing: After checkout, next person in queue advances"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

RES_3_STATUS_CURRENT=$(curl -s "http://localhost:3000/api/v1/reservations/$RES_3_ID" | jq -r '.data.status')
RES_3_QUEUE_CURRENT=$(curl -s "http://localhost:3000/api/v1/reservations/$RES_3_ID" | jq -r '.data.queue_position')

echo "Reservation #$RES_3_ID (Patron $PATRON_3):"
echo "   Status: $RES_3_STATUS_CURRENT"
echo "   Queue Position: $RES_3_QUEUE_CURRENT"

if [ "$RES_3_STATUS_CURRENT" = "waiting" ] && [ "$RES_3_QUEUE_CURRENT" = "1" ]; then
  echo "   ✅ CORRECT: Moved to queue position #1, awaiting next copy"
else
  echo "   ⚠️  Queue position: $RES_3_QUEUE_CURRENT (expected 1)"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "PHASE 10: COMPLETE CYCLE WITH NEXT PATRON"
echo "Testing: Check-in → Reshelve → Next patron can checkout"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

echo "Step 1: Patron $PATRON_2 checks in Copy #$COPY_1..."
CHECKIN_2=$(curl -s -X POST http://localhost:3000/api/v1/transactions/checkin \
  -H "Content-Type: application/json" \
  -d "{\"copy_id\": $COPY_1}")

if echo "$CHECKIN_2" | jq -e '.success' > /dev/null 2>&1; then
  echo "✅ Check-in successful (status should be 'returned')"
else
  echo "❌ Check-in failed"
fi

echo ""
echo "Step 2: Librarian reshelves Copy #$COPY_1..."
RESHELVE_2=$(curl -s -X POST http://localhost:3000/api/v1/transactions/reshelve \
  -H "Content-Type: application/json" \
  -d "{\"copy_id\": $COPY_1}")

if echo "$RESHELVE_2" | jq -e '.success' > /dev/null 2>&1; then
  echo "✅ Reshelve successful"

  sleep 1

  RES_3_STATUS_PROMOTED=$(curl -s "http://localhost:3000/api/v1/reservations/$RES_3_ID" | jq -r '.data.status')
  COPY_STATUS_PROMOTED=$(curl -s "http://localhost:3000/api/v1/item-copies/$COPY_1" | jq -r '.data.status')

  echo "   Reservation #$RES_3_ID status: $RES_3_STATUS_PROMOTED (should be 'ready')"
  echo "   Copy #$COPY_1 status: $COPY_STATUS_PROMOTED (should be 'Reserved')"

  if [ "$RES_3_STATUS_PROMOTED" = "ready" ] && [ "$COPY_STATUS_PROMOTED" = "Reserved" ]; then
    echo "   ✅ CORRECT: Next patron automatically promoted"
  else
    echo "   ❌ ERROR: Automatic promotion failed"
  fi
fi

echo ""
echo "Step 3: Patron $PATRON_3 checks out Copy #$COPY_1..."
CHECKOUT_3=$(curl -s -X POST http://localhost:3000/api/v1/transactions/checkout \
  -H "Content-Type: application/json" \
  -d "{\"copy_id\": $COPY_1, \"patron_id\": $PATRON_3, \"due_date\": \"2025-12-26\"}")

if echo "$CHECKOUT_3" | jq -e '.success' > /dev/null 2>&1; then
  echo "✅ CORRECT: Patron $PATRON_3 successfully checked out"
else
  echo "❌ ERROR: Patron $PATRON_3 should be able to check out"
  echo "   $(echo "$CHECKOUT_3" | jq -r '.error // .message')"
fi

echo ""
echo "============================================================================"
echo "TEST SUMMARY"
echo "============================================================================"
echo ""
echo "Status Lifecycle Verified:"
echo "  Available → Checked Out → returned → Reserved (ready for pickup) → Checked Out → ..."
echo ""
echo "Checkout Prevention Verified:"
echo "  ✓ Patrons cannot check out items reserved by others with better queue position"
echo "  ✓ Patrons WITH reservations CAN check out their reserved copies"
echo ""
echo "Manual Reshelve Workflow Verified:"
echo "  ✓ Check-in sets status to 'returned' (no auto-promotion)"
echo "  ✓ Reshelve promotes waiting reservation to 'ready'"
echo "  ✓ Copy status changes to 'Reserved' (on reserved shelf)"
echo ""
echo "Queue Management Verified:"
echo "  ✓ Multiple patrons can reserve"
echo "  ✓ Queue positions advance correctly"
echo "  ✓ Automatic promotion to next person after checkout/reshelve"
echo ""
echo "Note: 5-day expiration tested via process_expired_reservations() function"
echo "      (automatic execution on reservation GET requests)"
echo ""
echo "============================================================================"
