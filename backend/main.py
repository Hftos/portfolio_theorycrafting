import math
import logging
from typing import Dict, List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .schemas import MetricsRequest, MetricsResponse
from .services.data import get_price_history
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

app = FastAPI(title="Portfolio Theorycrafter")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
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


# to check the state of the api
@app.get("/health")
def health():
    return {"status": "ok"}


# Endpoint, sends json data throug here
@app.post("/metrics", response_model=MetricsResponse)
def metrics(req: MetricsRequest):
    try:
        tickers = [w.ticker for w in req.weights]
        if not tickers:
            raise HTTPException(status_code=422, detail="Provide at least one ticker/weight.")

        # Pull prices by ticker
        prices_by_ticker = {t: get_price_history(t, req.start, req.end) for t in tickers}

        # If *all* are empty, fail with a helpful message
        empties = [t for t, s in prices_by_ticker.items() if s is None or s.empty]
        if len(empties) == len(tickers):
            raise HTTPException(
                status_code=400,
                detail=f"No price data for given tickers/date range. Empty: {', '.join(empties)}"
            )
        df = build_aligned_prices(prices_by_ticker)
        if df.empty or len(df.columns) == 0:
            raise HTTPException(status_code=400, detail="No price data for given tickers/date range.")

        # Computations
        weight_map = {w.ticker: float(w.weight) for w in req.weights}
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

        # Another guard: if everything ended up None, tell the user
        if all(v is None for v in [ann_ret, ann_vol, shp, mdd]):
            raise HTTPException(status_code=400, detail="Insufficient data to compute metrics.")

        return MetricsResponse(
            # NOTE: field name must match the schema exactly -> 'annual_return', not 'annualized_return'
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
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/prices")
def prices(payload: Dict):
    tickers: List[str] = payload.get("tickers", [])
    start: str = payload.get("start")
    end: str = payload.get("end")

    if not tickers or not start or not end:
        return {"dates": [], "series": {}}

    prices_by_ticker = {t: get_price_history(t, start, end) for t in tickers}
    df = build_aligned_prices(prices_by_ticker).dropna(how="all")
    if df.empty:
        return {"dates": [], "series": {}}

    return {
        "dates": list(df.index),
        "series": {c: df[c].astype(float).tolist() for c in df.columns},
    }
