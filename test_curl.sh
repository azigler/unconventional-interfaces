#!/bin/bash

curl -X POST \
  https://us-central1-codetv-andrew-billy.cloudfunctions.net/writeStateToFirestoreHttp \
  -H 'Content-Type: application/json' \
  -d '{
    "collectionName": "test_collection",
    "state": {
      "message": "Test from curl",
      "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
    }
  }'
