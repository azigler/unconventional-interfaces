#!/bin/bash

echo "Testing Firebase Function with verbose output..."
echo "URL: https://us-central1-codetv-andrew-billy.cloudfunctions.net/writeStateToFirestoreHttp"
echo "Payload:"
echo '{
    "collectionName": "test_collection",
    "state": {
      "message": "Test from curl",
      "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
    }
  }'

echo -e "\nSending request...\n"

curl -v -X POST \
  https://us-central1-codetv-andrew-billy.cloudfunctions.net/writeStateToFirestoreHttp \
  -H 'Content-Type: application/json' \
  -d '{
    "collectionName": "test_collection",
    "state": {
      "message": "Test from curl",
      "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
    }
  }'

echo -e "\n\nFinished test."
