"""Converting engine results (pandas objects) into plain JSON-ready data."""

import math

import pandas as pd


def clean(x: float | None) -> float | None:
    """JSON has no NaN, so 'not computable' becomes null."""
    return None if x is None or (isinstance(x, float) and math.isnan(x)) else float(x)


def points(series: pd.Series) -> list[dict]:
    return [{"date": d.date(), "value": float(v)} for d, v in series.items()]


def weekly(growth: pd.Series, drawdown: pd.Series) -> tuple[pd.Series, pd.Series]:
    """Shrink daily chart data to one point per week, for charts only (metrics stay daily).

    Growth keeps each week's last value. Drawdown keeps each week's *lowest* value,
    so the bottom of a crash is never smoothed away. Both use the week's last trading
    day as the date, so the two charts line up.
    """
    week = growth.index.to_period("W")
    last_day = growth.groupby(week).apply(lambda s: s.index[-1])
    g = pd.Series(growth.groupby(week).last().to_numpy(), index=last_day.to_numpy())
    d = pd.Series(drawdown.groupby(week).min().to_numpy(), index=last_day.to_numpy())
    return g, d


def metrics(m: dict) -> dict:
    return {k: v if isinstance(v, int) else clean(v) for k, v in m.items()}


def correlation(corr: pd.DataFrame) -> dict:
    return {a: {b: clean(corr.loc[a, b]) for b in corr.columns} for a in corr.index}


def portfolio_result(result: dict) -> dict:
    """One portfolio's backtest, ready to send."""
    growth, drawdown = weekly(result["growth"], result["drawdown"])
    return {
        "weights": result["weights"],
        "metrics": metrics(result["metrics"]),
        "annual_returns": result["annual_returns"],
        "growth": points(growth),
        "drawdown": points(drawdown),
        "correlation": correlation(result["correlation"]),
        "asset_metrics": {t: metrics(m) for t, m in result["asset_metrics"].items()},
    }
