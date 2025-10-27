#!/bin/bash
# Start the backend server on all interfaces

cd "$(dirname "$0")"

# Activate virtual environment
source .venv/bin/activate

# Start uvicorn on all interfaces (0.0.0.0) on port 8000
# Use --host 0.0.0.0 to accept connections from any IP
# Use a different port if 8000 is busy: --port 8001

echo "Starting Portfolio Theorycrafting Backend..."
echo "Backend will be available at:"
echo "  - http://localhost:8000"
echo "  - http://127.0.0.1:8000"
echo "  - http://[your-ip]:8000"
echo ""
echo "Press Ctrl+C to stop"
echo ""

uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
