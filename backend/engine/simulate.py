"""One full backtest: prices in, results out. Knows nothing about databases or websites."""

import pandas as pd

from .metrics import correlation_matrix, drawdown_series, summary
from .periods import calendar_year_returns
from .rebalance import portfolio_returns
from .returns import daily_returns, growth_of


def run_backtest(
    prices: pd.DataFrame,
    weights: dict[str, float],
    rebalance: str = "annual",
    risk_free_rate: float = 0.0,
    start_value: float = 10_000,
    benchmark_returns: pd.Series | None = None,
) -> dict:
    """Backtest a portfolio.

    prices:  daily prices, one column per ticker (from backend/db.py)
    weights: e.g. {"SPY": 60, "AGG": 40}; any positive numbers, normalized to sum to 1
    benchmark_returns: daily returns of a benchmark (the S&P 500), used for beta
    """
    missing = [t for t in weights if t not in prices.columns]
    if missing:
        raise ValueError(f"No price data for: {', '.join(missing)}")

    total = sum(weights.values())
    if total <= 0:
        raise ValueError("Weights must add up to more than zero.")
    weights = {t: w / total for t, w in weights.items()}

    # Only keep dates where every holding has a price: the backtest
    # starts when the youngest fund launched.
    aligned = prices[list(weights)].dropna()
    if len(aligned) < 2:
        raise ValueError("Not enough overlapping price history for these holdings.")

    asset_rets = daily_returns(aligned)
    port_rets = portfolio_returns(asset_rets, weights, rebalance)

    return {
        "start_date": aligned.index[0],
        "end_date": aligned.index[-1],
        "weights": weights,
        "rebalance": rebalance,
        "metrics": summary(port_rets, risk_free_rate, benchmark_returns),
        "annual_returns": calendar_year_returns(port_rets),
        "growth": growth_of(port_rets, start_value),
        "drawdown": drawdown_series(port_rets),
        "correlation": correlation_matrix(asset_rets),
        "asset_metrics": {t: summary(asset_rets[t], risk_free_rate, benchmark_returns) for t in weights},
    }
