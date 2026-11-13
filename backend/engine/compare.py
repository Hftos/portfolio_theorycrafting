"""Backtest several portfolios over the same dates, so the comparison is fair.

If your portfolio could start in 2003 but a comparison needs a fund that launched
in 2011, every portfolio starts in 2011. Otherwise one portfolio would be measured
through 2008 and another wouldn't, and the numbers would mean nothing side by side.
"""

import pandas as pd

from .simulate import run_backtest


def common_start(prices: pd.DataFrame, tickers: list[str]) -> tuple[pd.Timestamp, str]:
    """The first date every ticker has a price, and which ticker sets that date."""
    first_dates = {t: prices[t].first_valid_index() for t in tickers}
    limiting = max(first_dates, key=lambda t: first_dates[t])
    return first_dates[limiting], limiting


def run_comparison(
    prices: pd.DataFrame,
    portfolios: list[dict],
    rebalance: str = "annual",
    risk_free_rate: float = 0.0,
    start_value: float = 10_000,
    benchmark: str | None = None,
) -> dict:
    """Backtest each portfolio over the dates they all share.

    portfolios: [{"name": "Mine", "weights": {"SPY": 60, "AGG": 40}}, ...]
    benchmark:  ticker to measure beta against (e.g. "SPY"). It doesn't limit
                the shared dates unless a portfolio actually holds it.
    """
    all_tickers = sorted({t for p in portfolios for t in p["weights"]})
    missing = [t for t in all_tickers if t not in prices.columns or prices[t].isna().all()]
    if missing:
        raise ValueError(f"No price data for: {', '.join(missing)}")

    shared = prices[all_tickers].dropna()
    if len(shared) < 2:
        raise ValueError("These portfolios have no overlapping price history.")
    _, limiting = common_start(prices, all_tickers)

    bench_returns = None
    if benchmark and benchmark in prices.columns:
        bench_returns = prices[benchmark].pct_change().reindex(shared.index)

    results = []
    for p in portfolios:
        result = run_backtest(
            shared,
            p["weights"],
            rebalance=rebalance,
            risk_free_rate=risk_free_rate,
            start_value=start_value,
            benchmark_returns=bench_returns,
        )
        results.append({"name": p["name"], **result})

    return {
        "start_date": shared.index[0],
        "end_date": shared.index[-1],
        "limited_by": limiting,
        "portfolios": results,
    }
