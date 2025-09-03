#!/bin/bash

# Check if certificates exist
if [ ! -f "localhost+2.pem" ] || [ ! -f "localhost+2-key.pem" ]; then
  echo "SSL certificates not found. Creating them now..."
  npm run setup-certs
fi

# Set up debug script
echo "Setting up debug script..."
node setup-debug.js

# Set environment variable for server to prefer IPv4
export NODE_OPTIONS=--dns-result-order=ipv4first

# Start the backend server (TypeScript)
echo "Starting backend server..."
npx ts-node src/server/server.ts &
BACKEND_PID=$!

# Wait a moment for the backend to start
sleep 2

# Start the frontend dev server
echo "Starting frontend dev server..."
npm run dev &
FRONTEND_PID=$!

# Get local IP address
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

# Function to handle script exit
cleanup() {
  echo "Shutting down servers..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  exit 0
}

# Register the cleanup function for script termination
trap cleanup SIGINT SIGTERM

# Keep the script running
echo "Both servers are running. Press Ctrl+C to stop."
echo "Frontend: https://localhost:3000"
echo "Backend: https://localhost:3001"
echo "Visit https://$LOCAL_IP:3000 on your phone to test"

# Wait for user to terminate
wait
