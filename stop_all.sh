#!/bin/bash

echo "🛑 Stopping all SIH26191 processes..."

# Kill processes on ports 8001, 8080, 5173, 5174
for PORT in 8001 8080 5173 5174; do
    PID=$(lsof -ti :$PORT)
    if [ ! -z "$PID" ]; then
        echo "Killing process on port $PORT (PID: $PID)..."
        kill -9 $PID 2>/dev/null
    fi
done

echo "✅ All ports cleared (8001, 8080, 5173, 5174)."
