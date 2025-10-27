# Portfolio Theorycrafting

A full-stack web application for analyzing portfolio performance metrics using real market data.

## Overview

Portfolio Theorycrafting helps users analyze investment portfolios by:
- Fetching historical stock price data from Yahoo Finance
- Computing key performance metrics (returns, volatility, Sharpe ratio, max drawdown)
- Generating correlation matrices between assets
- Providing aligned price series for visualization

**Stack**: Python FastAPI backend + React TypeScript frontend

## Quick Start

**Backend:**
```bash
source .venv/bin/activate
uvicorn backend.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend && npm run dev
```

Visit http://localhost:5173 to use the app.

## File Structure

### Backend (`backend/`)

- **`main.py`**: FastAPI application with two endpoints:
  - `POST /metrics`: Computes portfolio metrics (return, volatility, Sharpe ratio, drawdown, correlations)
  - `POST /prices`: Returns aligned price series for charting
  - Implements async data fetching with rate limiting to handle Yahoo Finance

- **`schemas.py`**: Pydantic models for request/response validation
  - `MetricsRequest`: Portfolio weights and date range input
  - `MetricsResponse`: Computed metrics output

- **`services/data.py`**: Yahoo Finance data fetching with extensive retry logic
  - Multiple fetch strategies to handle API flakiness
  - Returns normalized pandas Series with date strings as index

- **`services/metrics.py`**: Portfolio mathematics and calculations
  - `build_aligned_prices()`: Aligns ticker data to common dates
  - `portfolio_value()`: Calculates weighted portfolio returns
  - Metric functions: annualized return, volatility, Sharpe ratio, max drawdown
  - `corr_matrix()`: Correlation matrix computation

- **`services/csv_data.py`**: CSV data loading utilities (if needed)

- **`services/mock_data.py`**: Mock data for testing without API calls

### Frontend (`frontend/src/`)

- **`App.tsx`**: Main React component
  - Form for ticker/weight input and date selection
  - State management for results and errors
  - Results display logic

- **`lib/api.ts`**: API client utility
  - `postJSON()`: Helper for making POST requests to backend
  - Configurable base URL via `VITE_API_BASE` env var

- **`main.tsx`**: Application entry point

### Testing

- **`test_yfinance.py`**: Tests for Yahoo Finance data fetching
- **`test_yfinance_gentle.py`**: Gentler tests with rate limiting

## Key Features

- **Concurrent data fetching**: Uses asyncio to fetch multiple tickers in parallel
- **Rate limiting**: 0.3s stagger between requests to avoid Yahoo Finance throttling
- **Robust error handling**: Multiple retry strategies for unreliable Yahoo Finance API
- **Auto-normalization**: Weights automatically normalized to sum to 1.0
- **Real-time validation**: Frontend validates ticker/weight count matching

## Documentation

See `CLAUDE.md` for detailed architecture, development workflow, and implementation notes.
