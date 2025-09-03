#!/bin/bash

echo "Testing Firebase Function with updated URL..."
echo "URL: https://writestatetofirestorehttp-bqsgmkmlgq-uc.a.run.app"
echo "Payload:"
echo '{
    "collectionName": "test_collection",
    "state": {
      "message": "Test from curl",
      "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
    }
  }'

echo -e "\nSending request...\n"

curl -X POST \
  https://writestatetofirestorehttp-bqsgmkmlgq-uc.a.run.app \
  -H 'Content-Type: application/json' \
  -d '{
    "collectionName": "test_collection",
    "state": {
      "message": "Test from curl",
      "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
    }
  }'

echo -e "\n\nFinished test."
