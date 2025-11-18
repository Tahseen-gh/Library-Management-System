#!/bin/bash

echo "=========================================="
echo "TESTING COPY RESERVATION BEHAVIOR"
echo "=========================================="
echo ""

echo "Step 1: Find an item with 2+ available copies"
echo "-------------------------------------------"
ITEM_DATA=$(curl -s "http://localhost:3000/api/v1/library-items/49")
ITEM_TITLE=$(echo "$ITEM_DATA" | jq -r '.data.title')
echo "Item: $ITEM_TITLE (ID: 49)"

echo ""
echo "Step 2: Check all copies of this item BEFORE reservation"
echo "-------------------------------------------"
curl -s "http://localhost:3000/api/v1/item-copies/item/49" | jq '.data[] | {copy_id: .id, status: .status}'

echo ""
echo "Step 3: Check existing reservations for this item"
echo "-------------------------------------------"
EXISTING_RESERVATIONS=$(curl -s "http://localhost:3000/api/v1/reservations?library_item_id=49")
echo "$EXISTING_RESERVATIONS" | jq '{count: (.data | length), reservations: [.data[] | {patron_id: .patron_id, status: .status}]}'

echo ""
echo "Step 4: Make a NEW reservation (patron 10)"
echo "-------------------------------------------"
RESERVATION_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/reservations \
  -H "Content-Type: application/json" \
  -d '{"library_item_id": 49, "patron_id": 10}')

echo "$RESERVATION_RESPONSE" | jq '{success: .success, message: .message, status: .data.status, already_reserved: .already_reserved}'

echo ""
echo "Step 5: Check all copies AFTER reservation"
echo "-------------------------------------------"
curl -s "http://localhost:3000/api/v1/item-copies/item/49" | jq '.data[] | {copy_id: .id, status: .status}'

echo ""
echo "Step 6: Search for this item in search results"
echo "-------------------------------------------"
echo "When searching for 'Barbie', the UI will show:"
curl -s "http://localhost:3000/api/v1/item-copies/item/49" | jq -r '.data[] | "  Copy #\(.id): Status = \(.status)"'

echo ""
echo "Step 7: Check UI reservation status logic"
echo "-------------------------------------------"
HAS_RESERVATIONS=$(curl -s "http://localhost:3000/api/v1/reservations?library_item_id=49" | jq '[.data[] | select(.status == "ready" or .status == "waiting")] | length > 0')
echo "Item 49 has active reservations: $HAS_RESERVATIONS"
echo ""
if [ "$HAS_RESERVATIONS" = "true" ]; then
  echo "❌ PROBLEM: ALL copies will show 'Reserved' button"
  echo "   because we check at the ITEM level, not COPY level"
else
  echo "✓ No active reservations"
fi

echo ""
echo "=========================================="
echo "ISSUE IDENTIFIED"
echo "=========================================="
echo ""
echo "Current behavior:"
echo "  - Make reservation for item 49"
echo "  - Backend marks ONE copy as 'Reserved' ✓"
echo "  - UI shows 'Reserved' button for ALL copies ❌"
echo ""
echo "Expected behavior:"
echo "  - Copy with status 'Reserved' → show 'Reserved' button (disabled)"
echo "  - Copy with status 'Available' → show 'Reserve' button (enabled)"
echo ""
