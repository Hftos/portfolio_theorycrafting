import math
import logging
import asyncio
import os
from typing import Dict, List
from concurrent.futures import ThreadPoolExecutor

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .schemas import (
    MetricsRequest,
    AllocationItem,
    AllocationsResponse,
    CorrelationResponse,
    ReturnsResponse,
    DrawdownResponse,
)
from .services.csv_data import get_price_history
from .services.metrics import (
    build_aligned_prices,
    corr_matrix,
    optimize_equal_weight,
    portfolio_cumulative_returns,
    portfolio_drawdown_series,
    max_drawdown,
)

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


async def load_and_align_data(req: MetricsRequest):
    """Helper function to load and align price data for all endpoints."""
    tickers = [w.ticker for w in req.weights]
    if not tickers:
        raise HTTPException(status_code=422, detail="Provide at least one ticker.")

    logger.info(f"Loading data for tickers: {tickers}")

    # Fetch all tickers concurrently
    tasks = []
    for ticker in tickers:
        tasks.append(fetch_ticker_data(ticker, req.start, req.end, delay_seconds=0))

    results = await asyncio.gather(*tasks)
    prices_by_ticker = {ticker: series for ticker, series in results}

    # Check if we got any data
    empties = [t for t, s in prices_by_ticker.items() if s is None or s.empty]
    if len(empties) == len(tickers):
        raise HTTPException(
            status_code=400,
            detail=f"No price data available for any ticker. "
                   f"Failed tickers: {', '.join(empties)}"
        )

    if empties:
        logger.warning(f"Could not load data for: {', '.join(empties)}")

    # Build aligned price dataframe
    df = build_aligned_prices(prices_by_ticker)
    if df.empty or len(df.columns) == 0:
        raise HTTPException(
            status_code=400,
            detail=f"No overlapping price data found."
        )

    logger.info(f"Successfully aligned {len(df)} days of data for {len(df.columns)} tickers")
    return df


@app.post("/allocations", response_model=AllocationsResponse)
async def allocations(req: MetricsRequest):
    """
    Compute equal-weight allocation for given tickers.
    """
    try:
        df = await load_and_align_data(req)
        tickers = list(df.columns)

        # Create equal weight allocation
        weights = optimize_equal_weight(tickers)

        # Build response
        allocations = [
            AllocationItem(ticker=ticker, weight=round(weight * 100, 2))
            for ticker, weight in weights.items()
        ]

        dates = df.index.tolist()
        return AllocationsResponse(
            allocations=allocations,
            date_range={"start": dates[0], "end": dates[-1]},
            num_observations=len(dates)
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error in /allocations")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


@app.post("/correlation", response_model=CorrelationResponse)
async def correlation(req: MetricsRequest):
    """
    Compute correlation matrix of daily log returns.
    """
    try:
        df = await load_and_align_data(req)

        # Compute correlation matrix
        corr_df = corr_matrix(df).replace([float("inf"), float("-inf")], float("nan")).fillna(0.0)
        corr_dict = {r: {c: safe_float(v) for c, v in corr_df.loc[r].items()} for r in corr_df.index}

        dates = df.index.tolist()
        return CorrelationResponse(
            correlation=corr_dict,
            date_range={"start": dates[0], "end": dates[-1]},
            num_observations=len(dates)
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error in /correlation")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


@app.post("/returns", response_model=ReturnsResponse)
async def returns(req: MetricsRequest):
    """
    Compute cumulative returns for portfolio and individual tickers.
    """
    try:
        df = await load_and_align_data(req)
        tickers = list(df.columns)

        # Get equal weights
        weights = optimize_equal_weight(tickers)

        # Calculate cumulative returns
        portfolio_series, individual_series = portfolio_cumulative_returns(df, weights)

        # Convert to lists
        dates = df.index.tolist()
        portfolio_values = [safe_float(v) for v in portfolio_series.values]
        individual_values = {
            ticker: [safe_float(v) for v in series.reindex(df.index).fillna(method='ffill').values]
            for ticker, series in individual_series.items()
        }

        return ReturnsResponse(
            dates=dates,
            portfolio_values=portfolio_values,
            individual_values=individual_values,
            date_range={"start": dates[0], "end": dates[-1]},
            num_observations=len(dates)
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error in /returns")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


@app.post("/drawdown", response_model=DrawdownResponse)
async def drawdown(req: MetricsRequest):
    """
    Compute drawdown series for equal-weight portfolio.
    """
    try:
        df = await load_and_align_data(req)
        tickers = list(df.columns)

        # Get equal weights
        weights = optimize_equal_weight(tickers)

        # Calculate portfolio cumulative returns
        portfolio_series, _ = portfolio_cumulative_returns(df, weights)

        # Calculate drawdown series
        dd_series = portfolio_drawdown_series(portfolio_series)
        mdd = max_drawdown(portfolio_series)

        # Convert to lists
        dates = df.index.tolist()
        drawdown_pct = [safe_float(v) for v in dd_series.values]

        return DrawdownResponse(
            dates=dates,
            drawdown_pct=drawdown_pct,
            max_drawdown=safe_float(mdd) or 0.0,
            date_range={"start": dates[0], "end": dates[-1]},
            num_observations=len(dates)
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error in /drawdown")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


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