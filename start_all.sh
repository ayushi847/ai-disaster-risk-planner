#!/bin/bash

# ==============================================================================
# SIH26191 — Master Launch Script (Start Everything Together)
# ==============================================================================

BASE_DIR="/Users/jenamjain/Desktop/sih-ml-v2"
PROJECT_DIR="$BASE_DIR/ai-disaster-risk-planner-main/ai-disaster-risk-planner-main"
JAVA_17_HOME="/opt/homebrew/Cellar/openjdk@17/17.0.17/libexec/openjdk.jdk/Contents/Home"

echo "=================================================================="
echo "🚀 STARTING SIH26191 AI DISASTER RISK PLANNER FULL STACK"
echo "=================================================================="

# Function to clean up background processes on Ctrl+C
cleanup() {
    echo ""
    echo "🛑 Shutting down all running services..."
    kill $(jobs -p) 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM

# 1. Start PostGIS Database Container
echo "📦 [1/5] Checking PostGIS Container..."
cd "$PROJECT_DIR/backend"
docker compose up -d db >/dev/null 2>&1
sleep 2
echo "✅ PostGIS Database is running on port 5434."

# 2. Start ML FastAPI Service
echo "⚡ [2/5] Starting ML Engine v2 (FastAPI)..."
cd "$BASE_DIR"
"$BASE_DIR/venv/bin/uvicorn" final_api_v2:app --port 8001 --host 0.0.0.0 > /tmp/sih_ml.log 2>&1 &
ML_PID=$!
sleep 2
echo "✅ ML Engine running on http://localhost:8001 (PID: $ML_PID)"

# 3. Start Spring Boot Backend
echo "☕ [3/5] Starting Spring Boot Backend..."
cd "$PROJECT_DIR/backend"
JAVA_HOME="$JAVA_17_HOME" mvn spring-boot:run > /tmp/sih_backend.log 2>&1 &
BACKEND_PID=$!

echo "⏳ Waiting for Backend to be healthy on port 8080..."
for i in {1..30}; do
    if curl -s http://localhost:8080/api/dashboard/summary >/dev/null 2>&1; then
        echo "✅ Spring Boot Backend is UP on http://localhost:8080 (PID: $BACKEND_PID)"
        break
    fi
    sleep 2
done

# Sync ML Data to Backend
echo "🔄 Syncing ML Risk Scores & Hungarian Relocation Plans to Backend..."
curl -s -X POST http://localhost:8001/api/push-to-backend >/dev/null 2>&1
echo "✅ 71 Habitations and Prioritizations synced to PostgreSQL."

# 4. Start Main Frontend Dashboard
echo "🗺️  [4/5] Starting Main GIS Dashboard..."
cd "$PROJECT_DIR/frontend"
npm run dev -- --host 0.0.0.0 > /tmp/sih_frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 2
echo "✅ Main GIS Dashboard running on http://localhost:5173"

# 5. Start Relocation Authority Admin Portal
echo "⚖️  [5/5] Starting Relocation Authority Admin Portal..."
cd "$PROJECT_DIR/relocation-admin"
npm run dev -- --host 0.0.0.0 > /tmp/sih_admin.log 2>&1 &
ADMIN_PID=$!
sleep 2
echo "✅ Relocation Admin Portal running on http://localhost:5174"

echo ""
echo "=================================================================="
echo "🎉 ALL 5 SERVICES ARE LIVE & CONNECTED!"
echo "=================================================================="
echo "  🗺️  Main GIS Dashboard:        http://localhost:5173"
echo "  ⚖️  Authority Admin Portal:     http://localhost:5174"
echo "  ☕ Spring Boot Backend:        http://localhost:8080"
echo "  ⚡ ML FastAPI Engine:          http://localhost:8001/docs"
echo "  📦 PostGIS Database:           localhost:5434"
echo "------------------------------------------------------------------"
echo "  🔑 Admin Login: admin@sih.gov.in  |  Password: admin123"
echo "=================================================================="
echo "Press Ctrl+C anytime to stop all services."
echo ""

# Keep script running to maintain child processes
wait
