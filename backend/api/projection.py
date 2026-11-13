"""POST /api/project: simulate possible futures for one or more portfolios."""

import pandas as pd
from fastapi import APIRouter, HTTPException

from ..db import DatabaseNotFound, load_prices
from ..engine.compare import run_comparison
from ..engine.projection import monthly_returns, project
from ..schemas import ProjectRequest, ProjectResponse
from .portfolio import _check_tickers

router = APIRouter()


@router.post("/project", response_model=ProjectResponse)
def projection(req: ProjectRequest) -> dict:
    # --- Gather the portfolios, exactly as a comparison would ---
    portfolios = [
        {"name": p.name, "weights": {h.ticker: h.weight for h in p.holdings}} for p in req.portfolios
    ]
    tickers = sorted({t for p in portfolios for t in p["weights"]})
    start = req.start_date.isoformat() if req.start_date else None
    end = req.end_date.isoformat() if req.end_date else None

    try:
        # --- Backtest them over their shared dates ---
        # The projection learns from this history: each portfolio's real month-by-month
        # returns, with the same rebalancing the user chose.
        prices = load_prices(tickers, start=start, end=end)
        _check_tickers(tickers, prices)
        history = run_comparison(prices, portfolios, rebalance=req.rebalance, start_value=req.start_value)

        # --- Convert each portfolio's daily growth into monthly returns, side by side ---
        monthly = pd.DataFrame({
            p["name"]: monthly_returns(p["growth"], req.start_value) for p in history["portfolios"]
        })

        # --- Simulate the futures ---
        result = project(
            monthly,
            model=req.model,
            horizon_years=req.horizon_years,
            start_value=req.start_value,
            monthly_contribution=req.monthly_contribution,
            return_adjustment=req.return_adjustment,
        )
    except DatabaseNotFound as e:
        raise HTTPException(status_code=503, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {
        **result,
        "history_start": history["start_date"].date(),
        "history_end": history["end_date"].date(),
    }