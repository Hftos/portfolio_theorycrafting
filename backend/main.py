import math
import logging
import asyncio
import os
from typing import Dict, List
from concurrent.futures import ThreadPoolExecutor

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .schemas import MetricsRequest, MetricsResponse
from .services.data import get_price_history
from .services.metrics import (
    build_aligned_prices,
    portfolio_value,
    annualized_return,
    annualized_volatility,
    sharpe_ratio,
    max_drawdown,
    corr_matrix,
)

logger = logging.getLogger("uvicorn.error")

app = FastAPI(title="Portfolio Theorycrafter")

# Log startup configuration
USE_MOCK_DATA = os.getenv("USE_MOCK_DATA", "false").lower() in ("true", "1", "yes")
if USE_MOCK_DATA:
    logger.warning("=" * 60)
    logger.warning("MOCK DATA MODE ENABLED")
    logger.warning("Using synthetic data instead of Yahoo Finance API")
    logger.warning("Set USE_MOCK_DATA=false to use real data")
    logger.warning("=" * 60)
else:
    logger.info("Using Yahoo Finance for live market data")

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
            raise HTTPException(status_code=422, detail="Provide at least one ticker/weight.")

        logger.info(f"Fetching data for tickers: {tickers}")
        
        # Fetch all tickers with staggered delays to avoid rate limiting
        tasks = []
        for i, ticker in enumerate(tickers):
            # Stagger requests by 0.3 seconds each
            delay = i * 0.3
            tasks.append(fetch_ticker_data(ticker, req.start, req.end, delay))
        
        # Wait for all fetches to complete
        results = await asyncio.gather(*tasks)
        
        # Build dictionary of results
        prices_by_ticker = {ticker: series for ticker, series in results}
        
        # Check if we got any data at all
        empties = [t for t, s in prices_by_ticker.items() if s is None or s.empty]
        if len(empties) == len(tickers):
            raise HTTPException(
                status_code=400,
                detail=f"No price data available for any ticker in date range {req.start} to {req.end}. "
                       f"Please verify tickers are correct and try a different date range. "
                       f"Failed tickers: {', '.join(empties)}"
            )
        
        # Warn if some tickers failed
        if empties:
            logger.warning(f"Could not fetch data for: {', '.join(empties)}")
        
        # Build aligned price dataframe
        df = build_aligned_prices(prices_by_ticker)
        if df.empty or len(df.columns) == 0:
            raise HTTPException(
                status_code=400, 
                detail=f"No overlapping price data for date range {req.start} to {req.end}. "
                       f"Try a different date range or different tickers."
            )
        
        logger.info(f"Successfully aligned {len(df)} days of data for {len(df.columns)} tickers")

        # Compute metrics
        weight_map = {w.ticker: float(w.weight) for w in req.weights}
        
        # Only use tickers we actually got data for
        weight_map = {t: w for t, w in weight_map.items() if t in df.columns}
        
        if not weight_map:
            raise HTTPException(
                status_code=400,
                detail="No valid tickers with data found."
            )
        
        pv = portfolio_value(df, weight_map)
        ann_ret = safe_float(annualized_return(pv))
        ann_vol = safe_float(annualized_volatility(df, weight_map))
        shp = safe_float(
            sharpe_ratio(
                ann_ret if ann_ret is not None else float("nan"),
                ann_vol if ann_vol is not None else float("nan"),
                rf=0.0,
            )
        )
        mdd = safe_float(max_drawdown(pv))

        # Correlation matrix -> JSON safe
        corr_df = corr_matrix(df).replace([float("inf"), float("-inf")], float("nan")).fillna(0.0)
        corr_dict = {r: {c: safe_float(v) for c, v in corr_df.loc[r].items()} for r in corr_df.index}

        # Guard: if everything ended up None, tell the user
        if all(v is None or v == 0 for v in [ann_ret, ann_vol, shp, mdd]):
            raise HTTPException(
                status_code=400, 
                detail="Insufficient data to compute meaningful metrics. Try a longer date range."
            )

        logger.info(f"Successfully computed metrics: return={ann_ret}, vol={ann_vol}, sharpe={shp}")

        return MetricsResponse(
            annual_return=ann_ret if ann_ret is not None else 0.0,
            annual_vol=ann_vol if ann_vol is not None else 0.0,
            sharpe=shp if shp is not None else 0.0,
            max_drawdown=mdd if mdd is not None else 0.0,
            correlation=corr_dict,
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