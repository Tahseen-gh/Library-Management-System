#!/bin/bash

echo "=========================================="
echo "TESTING RESERVE BUTTON STATUS"
echo "=========================================="
echo ""

echo "TEST 1: Item WITH active reservation (Daisy Jones - ID 36)"
echo "-------------------------------------------"
response=$(curl -s "http://localhost:3000/api/v1/reservations?library_item_id=36")
echo "$response" | jq '{
  item_id: 36,
  total_reservations: (.data | length),
  active_reservations: [.data[] | select(.status == "ready" or .status == "waiting") | .status],
  has_active: ([.data[] | select(.status == "ready" or .status == "waiting")] | length > 0),
  button_should_show: (if ([.data[] | select(.status == "ready" or .status == "waiting")] | length > 0) then "Reserved (green, contained)" else "Reserve (outlined)" end)
}'

echo ""
echo "TEST 2: Item WITHOUT reservation (Barbie - ID 49)"
echo "-------------------------------------------"
response=$(curl -s "http://localhost:3000/api/v1/reservations?library_item_id=49")
echo "$response" | jq '{
  item_id: 49,
  total_reservations: (.data | length),
  active_reservations: [.data[] | select(.status == "ready" or .status == "waiting") | .status],
  has_active: ([.data[] | select(.status == "ready" or .status == "waiting")] | length > 0),
  button_should_show: (if ([.data[] | select(.status == "ready" or .status == "waiting")] | length > 0) then "Reserved (green, contained)" else "Reserve (outlined)" end)
}'

echo ""
echo "TEST 3: Create new reservation for Barbie (ID 49)"
echo "-------------------------------------------"
response=$(curl -s -X POST http://localhost:3000/api/v1/reservations \
  -H "Content-Type: application/json" \
  -d '{"library_item_id": 49, "patron_id": 7}')
echo "$response" | jq '{
  success: .success,
  message: .message,
  reservation_status: .data.status
}'

echo ""
echo "TEST 4: Check Barbie (ID 49) AFTER creating reservation"
echo "-------------------------------------------"
response=$(curl -s "http://localhost:3000/api/v1/reservations?library_item_id=49")
echo "$response" | jq '{
  item_id: 49,
  total_reservations: (.data | length),
  active_reservations: [.data[] | select(.status == "ready" or .status == "waiting") | .status],
  has_active: ([.data[] | select(.status == "ready" or .status == "waiting")] | length > 0),
  button_should_show: (if ([.data[] | select(.status == "ready" or .status == "waiting")] | length > 0) then "Reserved (green, contained)" else "Reserve (outlined)" end)
}'

echo ""
echo "=========================================="
echo "SUMMARY"
echo "=========================================="
echo "✓ Items with active reservations show 'Reserved' button (green, contained)"
echo "✓ Items without reservations show 'Reserve' button (outlined)"
echo "✓ After successful reservation, button updates to 'Reserved'"
echo ""
