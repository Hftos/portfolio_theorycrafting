"""POST /api/backtest: run one portfolio.  POST /api/compare: run several over the same dates."""

from fastapi import APIRouter, HTTPException

from ..db import DatabaseNotFound, list_securities, load_prices
from ..engine.compare import run_comparison
from ..engine.simulate import run_backtest
from ..schemas import BacktestRequest, BacktestResponse, CompareRequest, CompareResponse
from . import serialize

router = APIRouter()


def _check_tickers(tickers: list[str], prices) -> None:
    """Explain missing data precisely: unknown ticker vs. no prices in the chosen dates."""
    known = {s["ticker"] for s in list_securities()}
    unknown = [t for t in tickers if t not in known]
    if unknown:
        raise ValueError(f"Not in the database: {', '.join(unknown)}")
    empty = [t for t in tickers if t not in prices.columns or prices[t].isna().all()]
    if empty:
        raise ValueError(f"No prices for {', '.join(empty)} in the chosen date range.")


@router.post("/backtest", response_model=BacktestResponse)
def backtest(req: BacktestRequest) -> dict:
    weights = {h.ticker: h.weight for h in req.holdings}
    start = req.start_date.isoformat() if req.start_date else None
    end = req.end_date.isoformat() if req.end_date else None

    try:
        prices = load_prices(list(weights), start=start, end=end)
        _check_tickers(list(weights), prices)
        result = run_backtest(
            prices,
            weights,
            rebalance=req.rebalance,
            risk_free_rate=req.risk_free_rate,
            start_value=req.start_value,
        )
    except DatabaseNotFound as e:
        raise HTTPException(status_code=503, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {
        "start_date": result["start_date"].date(),
        "end_date": result["end_date"].date(),
        "rebalance": result["rebalance"],
        **serialize.portfolio_result(result),
    }


@router.post("/compare", response_model=CompareResponse)
def compare(req: CompareRequest) -> dict:
    portfolios = [
        {"name": p.name, "weights": {h.ticker: h.weight for h in p.holdings}} for p in req.portfolios
    ]
    tickers = sorted({t for p in portfolios for t in p["weights"]})
    start = req.start_date.isoformat() if req.start_date else None
    end = req.end_date.isoformat() if req.end_date else None

    try:
        prices = load_prices(tickers, start=start, end=end)
        _check_tickers(tickers, prices)
        result = run_comparison(
            prices,
            portfolios,
            rebalance=req.rebalance,
            risk_free_rate=req.risk_free_rate,
            start_value=req.start_value,
        )
    except DatabaseNotFound as e:
        raise HTTPException(status_code=503, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {
        "start_date": result["start_date"].date(),
        "end_date": result["end_date"].date(),
        "limited_by": result["limited_by"],
        "rebalance": req.rebalance,
        "portfolios": [{"name": p["name"], **serialize.portfolio_result(p)} for p in result["portfolios"]],
    }