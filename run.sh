#!/bin/bash

set -e

echo "Navigating to backend directory..."
if [ -d "./backend" ]; then
  cd ./backend
  echo "Successfully changed to backend directory: $(pwd)"
else
  echo "Error: './backend' directory not found. Please check the path."
  exit 1
fi

echo "Building backend with Cargo..."
cargo build

echo "Running backend migrations for LBTCL cohort..."
cargo run --bin migrate LBTCL

echo "Starting backend server with Cargo..."
cargo run &
BACKEND_PID=$!
echo "Backend server started with PID: $BACKEND_PID"

echo "Navigating back to the parent directory..."
cd ..
echo "Successfully changed to parent directory: $(pwd)"

echo "Navigating to frontend directory..."
if [ -d "./frontend" ]; then
  cd ./frontend
  echo "Successfully changed to frontend directory: $(pwd)"
else
  echo "Error: './frontend' directory not found. Please check the path."
  exit 1
fi

echo "Installing frontend dependencies with npm..."
npm install

echo "Starting frontend development server with npm..."
npm run dev

echo "Frontend development server started."
echo "Backend (PID: $BACKEND_PID) and Frontend are running."
echo "Press Ctrl+C to stop the frontend server (and potentially the script)."