#!/bin/bash

set -e

echo "🚀 Starting Bitshala Admin Development Environment..."

# Function to kill background processes on script exit
cleanup() {
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit
}
trap cleanup EXIT

# Start backend
echo "📊 Starting backend server..."
cd backend
cargo run &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID) on http://127.0.0.1:8081"

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "🎨 Starting frontend development server..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"

echo ""
echo "🎉 Development environment ready!"
echo "📊 Backend:  http://127.0.0.1:8081"
echo "🎨 Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user to stop
wait