#!/bin/bash

# ══════════════════════════════════════════
#   NEUROVAULT — Mac/Linux Startup Script
#   Starts all 3 servers concurrently
# ══════════════════════════════════════════

echo ""
echo "  ========================================"
echo "   NEUROVAULT AI Learning Platform"
echo "   Starting all services..."
echo "  ========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get script directory
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}[ERROR] Node.js not found. Please install from https://nodejs.org${NC}"
    exit 1
fi

# Check Python
PYTHON_CMD="python3"
if ! command -v python3 &> /dev/null; then
    PYTHON_CMD="python"
    if ! command -v python &> /dev/null; then
        echo -e "${RED}[ERROR] Python not found. Please install Python 3.10+${NC}"
        exit 1
    fi
fi

# Install dependencies if needed
if [ ! -d "$DIR/backend/server/node_modules" ]; then
    echo -e "${YELLOW}[SETUP] Installing backend dependencies...${NC}"
    (cd "$DIR/backend/server" && npm install)
fi

if [ ! -d "$DIR/frontend/node_modules" ]; then
    echo -e "${YELLOW}[SETUP] Installing frontend dependencies...${NC}"
    (cd "$DIR/frontend" && npm install)
fi

# Trap to kill all background processes on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Stopping all services...${NC}"
    kill $PID_BACKEND $PID_AI $PID_FRONTEND 2>/dev/null
    wait $PID_BACKEND $PID_AI $PID_FRONTEND 2>/dev/null
    echo -e "${GREEN}All services stopped.${NC}"
    exit 0
}
trap cleanup SIGINT SIGTERM

# Start services
echo -e "${GREEN}[1/3] Starting Backend (API Gateway) on port 5000...${NC}"
(cd "$DIR/backend/server" && npm run dev) &
PID_BACKEND=$!

echo -e "${GREEN}[2/3] Starting AI Core (Python FastAPI) on port 8000...${NC}"
(cd "$DIR/backend/ai_core" && $PYTHON_CMD api/ai_server.py) &
PID_AI=$!

echo -e "${GREEN}[3/3] Starting Frontend (Vite) on port 5173...${NC}"
(cd "$DIR/frontend" && npm run dev) &
PID_FRONTEND=$!

echo ""
echo "  ========================================"
echo "   All services started!"
echo ""
echo "   Frontend:  http://localhost:5173"
echo "   Backend:   http://localhost:5000"
echo "   AI Core:   http://localhost:8000"
echo "  ========================================"
echo ""
echo "  Press Ctrl+C to stop all services"
echo ""

# Wait for any process to exit
wait
