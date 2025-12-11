# Portfolio Theorycrafting

A full-stack web application for analyzing portfolio performance metrics using real market data from Yahoo Finance.

## What It Does

Portfolio Theorycrafting is an interactive tool that lets you:

- **Build portfolios** with multiple stocks/ETFs and custom allocations
- **Run simulations** with historical market data
- **Analyze performance** with 40+ metrics (returns, volatility, Sharpe ratio, max drawdown, etc.)
- **Compare against benchmarks** like the S&P 500 or custom portfolios
- **Visualize results** with interactive charts and correlation matrices
- **Test rebalancing strategies** (none, monthly, quarterly, annual)

**Tech Stack:** Python FastAPI backend + React TypeScript frontend

## Quick Start

### 1. Start the Backend

```bash
source .venv/bin/activate
uvicorn backend.main:app --reload --port 8000
```

### 2. Start the Frontend

```bash
cd frontend && npm run dev
```

### 3. Open Your Browser

Visit **http://localhost:5173**

## Using the Application

Once the app loads in your browser:

1. **Build Your Portfolio**
   - Use preset buttons (60/40, All-World, Income) or click "+ Add Holding"
   - Enter ticker symbols (e.g., SPY, AGG, VTI) and set weights
   - Weights automatically normalize to 100%

2. **Configure Settings**
   - Set date range (default: last 5 years)
   - Choose rebalancing frequency
   - Toggle dividends and inflation adjustment
   - Add benchmark comparisons (S&P 500, Three-Fund, or custom)

3. **Run Simulation**
   - Click "Run Simulation" button
   - Results appear in 2-5 seconds

4. **Analyze Results**
   - **Summary Tiles**: 12 key metrics at a glance
   - **Performance Chart**: Portfolio growth vs benchmarks (toggle log scale)
   - **Drawdown Chart**: Visualize underwater periods
   - **Correlation Matrix**: See asset relationships
   - **Risk Contribution**: Understand which assets drive volatility

## Project Structure

```
backend/
├── main.py                 # FastAPI app with /simulate endpoint
├── schemas.py              # Pydantic models for requests/responses
└── services/
    ├── simulation.py       # Portfolio simulation engine
    ├── metrics.py          # 40+ metric calculations
    ├── data.py             # Yahoo Finance data fetching
    └── csv_data.py         # CSV data loading

frontend/src/
├── App.tsx                 # Main application component
├── components/             # AllocControls, PerformanceChart, etc.
├── lib/api.ts             # API client
└── types/api.ts           # TypeScript types
```

## Features

- Multi-asset portfolio building with weight sliders
- Concurrent data fetching from Yahoo Finance
- Rebalancing simulation with fee and slippage modeling
- Dividend reinvestment and inflation adjustment
- Benchmark comparison (S&P 500, Three-Fund Portfolio, custom)
- 40+ performance metrics including CAGR, Sharpe ratio, VaR, CVaR, beta, alpha
- Interactive charts with Recharts
- Dark mode support
- Responsive design

## Troubleshooting

**Backend won't start?**
```bash
source .venv/bin/activate
pip install -r requirements.txt
uvicorn backend.main:app --reload --port 8000
```

**Frontend won't start?**
```bash
cd frontend
npm install
npm run dev
```

**No data showing?**
- Ensure backend is running on port 8000
- Check browser console (F12) for errors
- The app falls back to mock data for common tickers (SPY, AGG, QQQ, VTI, BND)

**CORS errors?**
- Backend is configured for localhost:5173
- If using a different port, update CORS settings in `backend/main.py`

## API Documentation

With the backend running, visit:
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

Main endpoint: `POST /simulate`

## Development

See `CLAUDE.md` for detailed architecture, development workflow, and implementation notes.

## Dependencies

**Backend:** fastapi, uvicorn, pandas, numpy, yfinance, pydantic

**Frontend:** react, typescript, vite, recharts
