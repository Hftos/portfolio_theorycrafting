import math
import logging
import asyncio
import os
from typing import Dict, List
from concurrent.futures import ThreadPoolExecutor

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .schemas import MetricsRequest, MetricsResponse
from .services.csv_data import get_price_history
from .services.metrics import build_aligned_prices, corr_matrix

logger = logging.getLogger("uvicorn.error")

app = FastAPI(title="Portfolio Theorycrafter")

# Log startup configuration
logger.info("Using local CSV data files from data/ directory")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def safe_float(x) -> float | None:
    """Return a JSON-safe float (None if NaN/inf)."""
    try:
        fx = float(x)
    except Exception:
        return None
    return fx if math.isfinite(fx) else None


@app.get("/health")
def health():
    return {"status": "ok"}


async def fetch_ticker_data(ticker: str, start: str, end: str, delay_seconds: float = 0.3):
    """
    Fetch price data for a single ticker with delay.
    Runs in thread pool to avoid blocking.
    """
    # Add staggered delay to avoid hammering yfinance
    await asyncio.sleep(delay_seconds)
    
    # Run the blocking yfinance call in a thread pool
    loop = asyncio.get_event_loop()
    with ThreadPoolExecutor() as pool:
        result = await loop.run_in_executor(pool, get_price_history, ticker, start, end)
    
    return ticker, result


@app.post("/metrics", response_model=MetricsResponse)
async def metrics(req: MetricsRequest):
    try:
        tickers = [w.ticker for w in req.weights]
        if not tickers:
            raise HTTPException(status_code=422, detail="Provide at least one ticker.")

        logger.info(f"Loading data for tickers: {tickers}")

        # Fetch all tickers concurrently (no delays needed for CSV reads)
        tasks = []
        for ticker in tickers:
            tasks.append(fetch_ticker_data(ticker, req.start, req.end, delay_seconds=0))

        # Wait for all fetches to complete
        results = await asyncio.gather(*tasks)

        # Build dictionary of results
        prices_by_ticker = {ticker: series for ticker, series in results}

        # Check if we got any data at all
        empties = [t for t, s in prices_by_ticker.items() if s is None or s.empty]
        if len(empties) == len(tickers):
            raise HTTPException(
                status_code=400,
                detail=f"No price data available for any ticker. "
                       f"Please verify tickers exist in the data/ directory. "
                       f"Failed tickers: {', '.join(empties)}"
            )

        # Warn if some tickers failed
        if empties:
            logger.warning(f"Could not load data for: {', '.join(empties)}")

        # Build aligned price dataframe
        df = build_aligned_prices(prices_by_ticker)
        if df.empty or len(df.columns) == 0:
            raise HTTPException(
                status_code=400,
                detail=f"No overlapping price data found. "
                       f"Try different tickers or check date range."
            )

        logger.info(f"Successfully aligned {len(df)} days of data for {len(df.columns)} tickers")

        # Compute correlation matrix of log returns
        corr_df = corr_matrix(df).replace([float("inf"), float("-inf")], float("nan")).fillna(0.0)
        corr_dict = {r: {c: safe_float(v) for c, v in corr_df.loc[r].items()} for r in corr_df.index}

        # Get date range metadata
        dates = df.index.tolist()
        start_date = dates[0] if dates else ""
        end_date = dates[-1] if dates else ""
        num_days = len(dates)

        logger.info(f"Successfully computed correlation matrix for {len(df.columns)} tickers")
        logger.info(f"Date range: {start_date} to {end_date} ({num_days} days)")

        return MetricsResponse(
            correlation=corr_dict,
            date_range={"start": start_date, "end": end_date},
            num_observations=num_days
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Unhandled error in /metrics")
        raise HTTPException(
            status_code=500,
            detail=f"Server error: {str(e)}"
        )


@app.post("/prices")
async def prices(payload: Dict):
    tickers: List[str] = payload.get("tickers", [])
    start: str = payload.get("start")
    end: str = payload.get("end")

    if not tickers or not start or not end:
        return {"dates": [], "series": {}}

    try:
        # Fetch all tickers with staggered delays
        tasks = []
        for i, ticker in enumerate(tickers):
            delay = i * 0.3
            tasks.append(fetch_ticker_data(ticker, start, end, delay))
        
        results = await asyncio.gather(*tasks)
        prices_by_ticker = {ticker: series for ticker, series in results}
        
        df = build_aligned_prices(prices_by_ticker).dropna(how="all")
        if df.empty:
            return {"dates": [], "series": {}}

        return {
            "dates": list(df.index),
            "series": {c: df[c].astype(float).tolist() for c in df.columns},
        }
    except Exception as e:
        logger.exception("Error in /prices")
        return {"dates": [], "series": {}, "error": str(e)}