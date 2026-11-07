import math
import pandas as pd
from fastapi import APIRouter, HTTPException

from ..db import DatabaseNotFound, load_prices
from ..engine.simulate import run_backtest
from ..schemas import BacktestRequest, BacktestResponse

router = APIRouter()

def _clean(x: float) -> float | None:
    """JSON has no NaN, so 'not computable' becomes null."""
    return None if x is None or (isinstance(x, float) and math.isnan(x)) else float(x)

def _points(series: pd.Series) -> list[dict]:
    return [{"date": d.date(), "value": float(v)} for d, v in series.items()]

@router.post("/backtest", response_model=BacktestResponse)
def backtest(req: BacktestRequest) -> dict:
    weights = {h.ticker: h.weight for h in req.holdings}
    start = req.start_date.isoformat() if req.start_date else None
    end = req.end_date.isoformat() if req.end_date else None

    try:
        prices = load_prices(list(weights), start=start, end=end)
        result = run_backtest(
            prices,
            weights,
            rebalance = req.rebalance,
            risk_free_rate=req.risk_free_rate,
            start_value=req.start_value,
        )
    except DatabaseNotFound as e:
        raise HTTPException(status_code=400, detail =str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail = str(e))

    corr = result["correlation"]

    return{
        "start_date": result["start_date"].date(),
        "end_date": result ["end_date"].date(),
        "weights": result["weights"],
        "rebalance": result["rebalance"],
        "metrics": {k: _clean(v) for k, v in  result["metrics"].items()},
        "growth": _points(result["growth"]),
        "drawdown": _points(result["drawdown"]),
        "correlation": {a:{b: _clean(corr.loc[a, b]) for b in corr.columns} for a in corr.index},
        "asset_metrics": {
            t: {k: _clean(v) for k, v in m.items()} for t,m in result["asset_metrics"].items()
        },
    }