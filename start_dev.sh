#!/bin/bash
# Development startup script - starts both backend and frontend with mock data

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Portfolio Theorycrafting - Dev Startup${NC}"
echo -e "${GREEN}========================================${NC}"

# Kill any existing processes
echo -e "\n${YELLOW}Stopping existing servers...${NC}"
pkill -f "uvicorn backend.main:app" 2>/dev/null
pkill -f "vite" 2>/dev/null
sleep 1

# Start backend with mock data
echo -e "\n${GREEN}Starting backend (mock data mode)...${NC}"
cd "$(dirname "$0")"
USE_MOCK_DATA=true .venv/bin/python3 -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait for backend to be ready
sleep 3
if curl -s http://localhost:8000/health > /dev/null; then
    echo -e "${GREEN}✓ Backend running at http://localhost:8000${NC}"
else
    echo -e "${YELLOW}⚠ Backend may not be ready yet${NC}"
fi

# Start frontend
echo -e "\n${GREEN}Starting frontend...${NC}"
cd frontend
npm run dev &
FRONTEND_PID=$!

# Wait for frontend to be ready
sleep 3
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Development servers started!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Backend:  http://localhost:8000"
echo -e "Frontend: http://localhost:5173"
echo -e "\n${YELLOW}Using MOCK DATA (no Yahoo Finance API calls)${NC}"
echo -e "\nPress Ctrl+C to stop all servers"
echo -e "${GREEN}========================================${NC}\n"

# Wait for user to kill processes
wait
