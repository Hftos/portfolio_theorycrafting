# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Portfolio Theorycrafting is a full-stack web application for analyzing portfolio performance metrics. It consists of:
- **Backend**: Python FastAPI service that fetches stock data from Yahoo Finance and computes portfolio metrics
- **Frontend**: React + TypeScript (Vite) SPA that provides a user interface for portfolio analysis

## Commands

### Backend Development

The backend uses Python with a virtual environment located at `.venv/`.

**Activate virtual environment:**
```bash
source .venv/bin/activate
```

**Install dependencies:**
```bash
pip install -r requirements.txt
```

**Run backend server:**
```bash
# From repository root, with venv activated
uvicorn backend.main:app --reload --port 8000
```

**Run backend tests:**
Currently no test suite is present. When adding tests, use pytest.

### Frontend Development

The frontend uses Vite + React located in `frontend/`.

**Install dependencies:**
```bash
cd frontend && npm install
```

**Run development server:**
```bash
cd frontend && npm run dev
```
This starts the dev server at http://localhost:5173

**Build for production:**
```bash
cd frontend && npm run build
```

**Lint frontend code:**
```bash
cd frontend && npm run lint
```

## Architecture

### Backend Architecture (Python FastAPI)

**Data Flow:**
1. **Data Fetching** (`backend/services/data.py`): Retrieves historical price data from Yahoo Finance using yfinance
2. **Data Alignment** (`backend/services/metrics.py`): Aligns price series from different tickers to common dates
3. **Metrics Calculation** (`backend/services/metrics.py`): Computes portfolio statistics (returns, volatility, Sharpe ratio, etc.)

**Key Files:**
- `backend/main.py`: FastAPI application with two main endpoints:
  - `POST /metrics`: Computes portfolio metrics for given tickers/weights
  - `POST /prices`: Returns aligned price series for charting
  - Uses async/await with ThreadPoolExecutor for concurrent yfinance requests
  - Implements staggered delays (0.3s between requests) to avoid rate limiting

- `backend/schemas.py`: Pydantic models defining request/response structure
  - `MetricsRequest`: Portfolio weights and date range
  - `MetricsResponse`: Annual return, volatility, Sharpe ratio, max drawdown, correlation matrix

- `backend/services/data.py`: Yahoo Finance data fetching with extensive retry logic
  - **Important**: Implements 3 different fetch strategies with retries due to Yahoo Finance API flakiness
  - Always returns normalized pandas Series with date strings as index
  - Handles inclusive end dates (yfinance treats end as exclusive)

- `backend/services/metrics.py`: Portfolio mathematics
  - `build_aligned_prices()`: Combines ticker series into aligned DataFrame
  - `portfolio_value()`: Calculates weighted portfolio returns over time
  - `annualized_return()`, `annualized_volatility()`, `sharpe_ratio()`, `max_drawdown()`: Standard portfolio metrics
  - `corr_matrix()`: Correlation matrix of returns between tickers

**CORS Configuration**: Backend allows requests from localhost:5173 (Vite dev server)

### Frontend Architecture (React + TypeScript)

**Structure:**
- `frontend/src/App.tsx`: Main application component containing form, state management, and results display
- `frontend/src/lib/api.ts`: API client utility for making POST requests to backend
- `frontend/src/main.tsx`: Application entry point

**State Management**: Uses React useState hooks (no Redux/Zustand/etc.)

**API Integration**: The `postJSON()` helper handles requests to the FastAPI backend. Base URL is configurable via `VITE_API_BASE` environment variable (defaults to http://127.0.0.1:8000).

**User Flow:**
1. User enters comma-separated tickers and weights
2. User selects date range
3. Frontend validates input (matching counts)
4. POST request to `/metrics` endpoint
5. Display results or error message

## Important Implementation Notes

### Yahoo Finance Reliability Issues

The yfinance library is notoriously unreliable. The codebase implements extensive workarounds:
- Multiple fetch strategies (download(), Ticker.history(), period-based)
- Exponential backoff retry logic
- Custom User-Agent headers
- Staggered request delays (0.3s between tickers)

When debugging data fetch issues, check `backend/services/data.py` and its multi-strategy approach.

### Async Data Fetching

The backend uses `async/await` with `ThreadPoolExecutor` for concurrent data fetching:
- `fetch_ticker_data()` runs blocking yfinance calls in thread pool
- Multiple tickers are fetched concurrently using `asyncio.gather()`
- Each fetch is staggered by 0.3s to avoid rate limiting

### Metrics Calculation Details

- **Annualization**: Assumes 252 trading days per year
- **Weight Normalization**: Weights are automatically normalized to sum to 1.0
- **NaN Handling**: All metrics use `safe_float()` to convert NaN/Inf to None before JSON serialization
- **Alignment**: Only dates where at least one ticker has data are kept; tickers without data for certain dates get NaN

### Error Handling

The backend provides detailed error messages for common issues:
- No data available for any ticker
- Insufficient overlapping data
- Missing tickers vs weights mismatch
- Date range issues

Frontend extracts error details from HTTP response body and displays them to users.

## Development Workflow

1. Start backend: `source .venv/bin/activate && uvicorn backend.main:app --reload`
2. Start frontend in separate terminal: `cd frontend && npm run dev`
3. Frontend auto-proxies to backend at localhost:8000
4. Make changes to either backend or frontend - both support hot reload

## Dependencies

**Backend Python packages** (requirements.txt):
- fastapi: Web framework
- uvicorn: ASGI server
- pandas: Data manipulation
- numpy: Numerical computing
- yfinance: Yahoo Finance API wrapper
- pydantic: Data validation

**Frontend packages** (frontend/package.json):
- react/react-dom: UI framework
- vite: Build tool and dev server
- typescript: Type checking
- eslint: Linting
