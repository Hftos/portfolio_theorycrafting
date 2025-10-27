# How to Run Portfolio Theorycrafting

## Backend (FastAPI + Python)

1. **Activate virtual environment:**
   ```bash
   source .venv/bin/activate
   ```

2. **Start the backend server:**
   ```bash
   uvicorn backend.main:app --reload --port 8000
   ```

3. **Verify it's running:**
   - Visit http://localhost:8000/health (should show `{"status":"ok"}`)
   - Visit http://localhost:8000/docs for API documentation

## Frontend (React + Vite)

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Start the dev server:**
   ```bash
   npm run dev
   ```

3. **Open the app:**
   - Visit http://localhost:5173 in your browser

## Using the Application

1. **Set Portfolio Allocations:**
   - Use the left sidebar to add/remove holdings
   - Set ticker symbols and weights
   - Choose rebalancing frequency
   - Try preset portfolios (60/40, All-World, Income)

2. **Configure Date Range:**
   - Set start and end dates
   - Toggle dividends and inflation adjustment

3. **Run Simulation:**
   - Click "Run Simulation" button
   - Wait for results (usually 2-5 seconds)

4. **View Results:**
   - **Summary Tiles**: 12 key metrics (CAGR, Sharpe, VaR, etc.)
   - **Performance Chart**: Portfolio vs benchmarks
   - **Drawdown Chart**: Underwater visualization
   - **Correlation Matrix**: Asset correlations
   - **Risk Contribution**: Variance contribution by asset

## Available Data

The app uses CSV data from the `data/` directory:
- `data/stocks/` - Individual stock data
- `data/etfs/` - ETF data

If CSV data is missing, the app falls back to mock data for:
- SPY, AGG, QQQ, VTI, BND, AAPL, MSFT

## API Endpoint

The main simulation endpoint is:
```
POST http://localhost:8000/simulate
```

See `test_request.json` for an example request payload.

## Troubleshooting

**Backend won't start:**
- Make sure virtual environment is activated
- Run `pip install -r requirements.txt` to install dependencies

**Frontend won't start:**
- Run `npm install` in the frontend directory
- Check that port 5173 is not already in use

**No data showing:**
- Make sure backend is running on port 8000
- Check browser console for errors
- Verify CSV data exists in `data/` directory

**CORS errors:**
- Backend is configured for localhost:5173
- If using different port, update `backend/main.py` CORS settings
