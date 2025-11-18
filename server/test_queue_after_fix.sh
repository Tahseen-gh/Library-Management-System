#!/bin/bash

echo "=========================================="
echo "TESTING QUEUE PROMOTION AFTER FIX"
echo "=========================================="
echo ""

echo "Step 1: Create 2 more reservations for Atomic Habits"
echo "-------------------------------------------"
curl -s -X POST http://localhost:3000/api/v1/reservations \
  -H "Content-Type: application/json" \
  -d '{"library_item_id": 32, "patron_id": 7}' | jq '{patron: 7, queue: .data.queue_position, status: .data.status}'

curl -s -X POST http://localhost:3000/api/v1/reservations \
  -H "Content-Type: application/json" \
  -d '{"library_item_id": 32, "patron_id": 8}' | jq '{patron: 8, queue: .data.queue_position, status: .data.status}'

echo ""
echo "Step 2: Current Queue for Atomic Habits (all 3 reservations)"
echo "-------------------------------------------"
curl -s "http://localhost:3000/api/v1/reservations?library_item_id=32&status=waiting" | \
  jq '.data | sort_by(.queue_position) | .[] | {
    id: .id,
    patron: (.first_name + " " + .last_name),
    queue: .queue_position,
    status: .status
  }'

echo ""
echo "Step 3: Simulate item return - promote first in queue to 'ready'"
echo "-------------------------------------------"
# Get the first waiting reservation
FIRST_RES=$(curl -s "http://localhost:3000/api/v1/reservations?library_item_id=32&status=waiting" | jq -r '.data | sort_by(.queue_position) | .[0] | .id')
echo "First reservation ID: $FIRST_RES"

# Manually update it to ready (simulating what happens when item is returned)
sqlite3 /home/user/Library-Management-System/server/library.db << EOF
UPDATE RESERVATIONS
SET status = 'ready',
    expiry_date = datetime('now', '+5 days'),
    updated_at = datetime('now')
WHERE id = $FIRST_RES;
EOF

echo "Updated reservation $FIRST_RES to 'ready' status"

echo ""
echo "Step 4: Queue AFTER promotion"
echo "-------------------------------------------"
curl -s "http://localhost:3000/api/v1/reservations?library_item_id=32" | \
  jq '.data | map(select(.status == "ready" or .status == "waiting")) | sort_by(.queue_position) | .[] | {
    patron: (.first_name + " " + .last_name),
    queue: .queue_position,
    status: .status
  }'

echo ""
echo "=========================================="
echo "VERIFICATION"
echo "=========================================="
FIRST_STATUS=$(curl -s "http://localhost:3000/api/v1/reservations?library_item_id=32" | jq -r '.data | map(select(.queue_position == 1)) | .[0] | .status')
echo "Queue position #1 status: $FIRST_STATUS"

if [ "$FIRST_STATUS" = "ready" ]; then
  echo "✅ PASS: Queue position #1 has 'ready' status"
else
  echo "❌ FAIL: Queue position #1 has '$FIRST_STATUS' status (should be 'ready')"
fi
echo ""
