import math
import logging
from fastapi import FastAPI, HTTPException

from .schemas import MetricsRequest, MetricsResponse
from .services.data import get_price_history
from fastapi.middleware.cors import  CORSMiddleware
from typing import Dict, List
from .services.metrics import build_aligned_prices

# These are the functions that will turn the raw data into useful stuff
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
app = FastAPI(title= "Portfolio Theorycrafter")
app.add_middleware(
    CORSMiddleware,
    allow_origins = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ],
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"],
)
def safe_float(x) -> float | None:
    """Return a JSON-safe float (None if NaN/inf)."""
    try:
        fx = float(x)
    except Exception:
        return None
    return fx if math.isfinite(fx) else None
# to check the state of the api
@app.get("/health")
def health():
    return {"status": "ok"}

# Endpoint, sends json data throug here
@app.post("/metrics", response_model=MetricsResponse)
def metrics(req: MetricsRequest):
    tickers = [w.ticker for w in req.weights]
    # Pull prices by the tickers
    prices_by_ticker = {
        t: get_price_history(t, req.start, req.end) for t in tickers
    }

    df = build_aligned_prices(prices_by_ticker)
    if df.empty or len(df.columns) == 0:
        return MetricsResponse.empty()  
    
    # Computations
    weight_map = {w.ticker: float(w.weight) for w in req.weights}
    pv = portfolio_value(df, weight_map)
    ann_ret = annualized_return(pv)
    ann_vol = annualized_volatility(df, weight_map)
    sharpe = sharpe_ratio(ann_ret, ann_vol, rf=0.0)
    mdd = max_drawdown(pv)
    corr = corr_matrix(df)

    return MetricsResponse(
        annualized_return=float(ann_ret),
        annual_vol=float(ann_vol),
        sharpe=float(sharpe),
        max_drawdown = float(mdd),
        correlation = corr.to_dict()
    )

@app.post("/prices")
def prices(payload: Dict):
    tickers: List[str] = payload.get("tickers", [])
    start: str = payload.get("start")
    end: str= payload.get("end")

    if not tickers or not start or not end:
        return {"dates": [], "series": {}}
    
    prices_by_ticker = {t: get_price_history(t , start, end) for t in tickers}
    df = build_aligned_prices(prices_by_ticker).dropna(how="all")
    if df.empty:
        return {"dates": [], "series": {}}
    
    return {
        "dates": list(df.index),
        "series": {c: df[c].astype(float).tolist() for c  in df.columns}
    }