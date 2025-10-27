"""
PORTFOLIO SIMULATION ENGINE
============================
This module handles the complete portfolio simulation with:
- Data loading and alignment
- Total return calculation (with dividends)
- Rebalancing at specified frequency
- Fee and slippage application
- Inflation adjustment
- Comprehensive metrics calculation
"""

import pandas as pd
import numpy as np
import logging
from datetime import datetime
from typing import Dict, List

from ..schemas import SimRequest, SimResponse, SeriesPoint
from .csv_data import load_asset_series, load_cpi_index
from .mock_data import load_asset_series_mock
from .data import align_series
from .metrics import (
    cagr, annual_vol, max_drawdown, ulcer_index, sharpe_ratio,
    sortino, hit_rate, best_worst_year, var_cvar, beta_alpha,
    rolling_stats, correlation_matrix, contribution_to_risk, hhi,
    effective_duration_convexity, portfolio_drawdown_series
)

log = logging.getLogger("uvicorn.error")


def _safe_float(x) -> float | None:
    """Convert value to JSON-safe float."""
    try:
        fx = float(x)
        return fx if np.isfinite(fx) else None
    except:
        return None


def _load_asset_data(ticker: str, start: str, end: str, use_mock: bool = False) -> dict:
    """
    Load asset data, trying CSV first and falling back to mock if needed.

    Args:
        ticker: Asset ticker
        start: Start date
        end: End date
        use_mock: Force use of mock data

    Returns:
        AssetSeries dictionary
    """
    if use_mock:
        return load_asset_series_mock(ticker, start, end)

    try:
        asset = load_asset_series(ticker, start, end)
        if not asset["series"]:
            # No CSV data, try mock
            log.warning(f"No CSV data for {ticker}, falling back to mock")
            return load_asset_series_mock(ticker, start, end)
        return asset
    except Exception as e:
        log.error(f"Error loading {ticker}: {e}, trying mock")
        return load_asset_series_mock(ticker, start, end)


def _build_total_return_index(
    prices: pd.Series,
    dividends: pd.Series,
    use_dividends: bool
) -> pd.Series:
    """
    Build total return index from prices and dividends.

    Total return = price appreciation + reinvested dividends

    Args:
        prices: Series of prices
        dividends: Series of dividends
        use_dividends: Whether to include dividends

    Returns:
        Total return index (normalized to 1.0 at start)
    """
    if prices.empty:
        return pd.Series(dtype="float64")

    # Start with price returns
    price_rets = prices.pct_change().fillna(0.0)

    if use_dividends and not dividends.empty:
        # Add dividend yield to returns
        # dividend_yield = dividend / price (on ex-dividend date)
        div_yields = (dividends / prices).fillna(0.0)
        total_rets = price_rets + div_yields
    else:
        total_rets = price_rets

    # Build cumulative total return index
    total_return_index = (1 + total_rets).cumprod()

    return total_return_index


def _apply_rebalancing(
    portfolio_df: pd.DataFrame,
    weights: dict[str, float],
    rebalance_freq: str,
    slippage_bps: int
) -> pd.Series:
    """
    Apply periodic rebalancing to portfolio.

    Args:
        portfolio_df: DataFrame with total return indices for each asset
        weights: Target weights (as decimals)
        rebalance_freq: "NONE", "ANNUAL", "QUARTERLY", "MONTHLY"
        slippage_bps: Slippage cost in basis points

    Returns:
        Series of portfolio values with rebalancing applied
    """
    if portfolio_df.empty or rebalance_freq == "NONE":
        # No rebalancing - simple weighted combination
        w = pd.Series(weights, dtype="float64")
        w = w / w.sum() if w.sum() > 0 else w
        return (portfolio_df * w).sum(axis=1)

    # Determine rebalancing dates
    dates = portfolio_df.index
    rebal_dates = []

    if rebalance_freq == "MONTHLY":
        # End of each month
        rebal_dates = pd.date_range(start=dates[0], end=dates[-1], freq="ME").tolist()
    elif rebalance_freq == "QUARTERLY":
        # End of each quarter
        rebal_dates = pd.date_range(start=dates[0], end=dates[-1], freq="QE").tolist()
    elif rebalance_freq == "ANNUAL":
        # End of each year
        rebal_dates = pd.date_range(start=dates[0], end=dates[-1], freq="YE").tolist()

    # Filter to dates that exist in our data
    rebal_dates = [d for d in rebal_dates if d in dates]

    # Simulate portfolio with rebalancing
    portfolio_value = pd.Series(index=dates, dtype="float64")
    portfolio_value.iloc[0] = 1.0

    # Track current weights (start at target)
    current_weights = pd.Series(weights, dtype="float64")
    current_weights = current_weights / current_weights.sum()

    slippage_factor = 1.0 - (slippage_bps / 10000.0)

    for i in range(1, len(dates)):
        date = dates[i]
        prev_date = dates[i-1]

        # Calculate returns for each asset
        returns = portfolio_df.loc[date] / portfolio_df.loc[prev_date] - 1

        # Update portfolio value
        portfolio_value.iloc[i] = portfolio_value.iloc[i-1] * (1 + (current_weights * returns).sum())

        # Check if rebalancing date
        if date in rebal_dates:
            # Apply slippage cost when rebalancing
            portfolio_value.iloc[i] *= slippage_factor
            # Reset to target weights
            current_weights = pd.Series(weights, dtype="float64")
            current_weights = current_weights / current_weights.sum()
        else:
            # Drift weights based on asset performance
            current_weights = current_weights * (1 + returns)
            current_weights = current_weights / current_weights.sum()

    return portfolio_value


def simulate_portfolio(req: SimRequest) -> SimResponse:
    """
    Main portfolio simulation function.

    Takes a SimRequest and returns comprehensive simulation results including:
    - Portfolio value series
    - Benchmark comparisons
    - Summary metrics
    - Detailed diagnostics

    Args:
        req: SimRequest with portfolio holdings, date range, and assumptions

    Returns:
        SimResponse with all results
    """
    log.info(f"Starting portfolio simulation: {len(req.holdings)} holdings, {req.start} to {req.end}")

    # 1. Load asset data
    assets = []
    for holding in req.holdings:
        asset = _load_asset_data(holding.ticker, req.start, req.end)
        if asset["series"]:
            assets.append(asset)
        else:
            log.warning(f"Skipping {holding.ticker} - no data available")

    if not assets:
        raise ValueError("No asset data available for any holding")

    # 2. Align series to common dates
    aligned = align_series(assets, req.start, req.end)
    if not aligned:
        raise ValueError("Failed to align asset series")

    # Convert to DataFrames for easier manipulation
    prices_df = pd.DataFrame()
    dividends_df = pd.DataFrame()

    for ticker, series_list in aligned.items():
        dates = [pd.to_datetime(s["date"]) for s in series_list]
        prices = [s["price"] for s in series_list]
        divs = [s["dividend"] if s["dividend"] is not None else 0.0 for s in series_list]

        prices_df[ticker] = pd.Series(prices, index=dates)
        dividends_df[ticker] = pd.Series(divs, index=dates)

    # 3. Build total return indices
    total_return_df = pd.DataFrame(index=prices_df.index)
    for ticker in prices_df.columns:
        total_return_df[ticker] = _build_total_return_index(
            prices_df[ticker],
            dividends_df[ticker],
            req.use_dividends
        )

    # 4. Apply rebalancing and fees
    weights = {h.ticker: h.weight_pct / 100.0 for h in req.holdings if h.ticker in total_return_df.columns}

    portfolio_series = _apply_rebalancing(
        total_return_df,
        weights,
        req.rebalance,
        req.assumptions.slippage_bps
    )

    # Apply annual expense ratio (pro-rated daily)
    if req.assumptions.expense_ratio_bps > 0:
        daily_expense = (req.assumptions.expense_ratio_bps / 10000.0) / 252
        expense_decay = (1 - daily_expense) ** np.arange(len(portfolio_series))
        portfolio_series = portfolio_series * expense_decay

    # 5. Apply inflation adjustment if requested
    if req.inflation_adjust:
        cpi_data = load_cpi_index()
        if cpi_data:
            cpi_df = pd.DataFrame(cpi_data)
            cpi_df["date"] = pd.to_datetime(cpi_df["date"])
            cpi_df = cpi_df.set_index("date")["price"]

            # Reindex to portfolio dates and forward-fill
            cpi_aligned = cpi_df.reindex(portfolio_series.index, method="ffill")

            # Deflate portfolio by CPI
            cpi_factor = cpi_aligned.iloc[0] / cpi_aligned
            portfolio_series = portfolio_series * cpi_factor

    # 6. Calculate periodic returns
    portfolio_returns = portfolio_series.pct_change().dropna()

    # 7. Load and process benchmarks
    benchmarks_data = {}
    benchmark_series = {}

    for bench_ticker in req.benchmarks:
        try:
            bench_asset = _load_asset_data(bench_ticker, req.start, req.end)
            if bench_asset["series"]:
                bench_df = pd.DataFrame(bench_asset["series"])
                bench_df["date"] = pd.to_datetime(bench_df["date"])
                bench_df = bench_df.set_index("date")

                # Build total return for benchmark
                bench_prices = bench_df["price"]
                bench_divs = bench_df["dividend"].fillna(0.0)
                bench_tr = _build_total_return_index(bench_prices, bench_divs, req.use_dividends)

                # Align to portfolio dates
                bench_tr = bench_tr.reindex(portfolio_series.index, method="ffill")
                benchmark_series[bench_ticker] = bench_tr

                # Convert to list of SeriesPoint
                bench_list = []
                for date, value in bench_tr.items():
                    bench_list.append({
                        "date": date.strftime("%Y-%m-%d"),
                        "price": _safe_float(value),
                        "total_return": _safe_float(value),
                        "dividend": None
                    })
                benchmarks_data[bench_ticker] = bench_list
        except Exception as e:
            log.warning(f"Could not load benchmark {bench_ticker}: {e}")

    # 8. Calculate summary metrics
    rf = req.assumptions.rf_rate

    # Basic metrics
    cagr_val = cagr(portfolio_series)
    vol_val = annual_vol(portfolio_returns)
    mdd_val = max_drawdown(portfolio_series)
    ulcer_val = ulcer_index(portfolio_series)
    sharpe_val = sharpe_ratio(cagr_val, vol_val, rf)
    sortino_val = sortino(portfolio_returns, rf)
    hit_val = hit_rate(portfolio_returns)

    # Best/worst year
    best_year, worst_year = best_worst_year(portfolio_series, portfolio_series.index)

    # VaR/CVaR
    var_5, cvar_5 = var_cvar(portfolio_returns, 0.05)
    var_1, cvar_1 = var_cvar(portfolio_returns, 0.01)

    # Beta/Alpha vs benchmark
    beta_val, alpha_val = float("nan"), float("nan")
    if req.benchmark_ref in benchmark_series:
        bench_returns = benchmark_series[req.benchmark_ref].pct_change().dropna()
        excess_port = portfolio_returns - rf / 252
        excess_bench = bench_returns - rf / 252
        beta_val, alpha_val = beta_alpha(excess_port, excess_bench)

    # Concentration
    hhi_val = hhi(weights)
    largest_weight = max(weights.values()) if weights else 0.0

    # Weighted expense ratio
    weighted_expense = req.assumptions.expense_ratio_bps

    # Current yield (stub - would need actual dividend data)
    current_yield = 0.0

    summary = {
        "cagr": _safe_float(cagr_val * 100),  # Convert to percentage
        "volatility": _safe_float(vol_val * 100),
        "max_drawdown": _safe_float(mdd_val * 100),
        "ulcer_index": _safe_float(ulcer_val),
        "sharpe_ratio": _safe_float(sharpe_val),
        "sortino_ratio": _safe_float(sortino_val),
        "hit_rate": _safe_float(hit_val * 100),
        "best_year": _safe_float(best_year * 100),
        "worst_year": _safe_float(worst_year * 100),
        "var_5pct": _safe_float(var_5 * 100),
        "cvar_5pct": _safe_float(cvar_5 * 100),
        "var_1pct": _safe_float(var_1 * 100),
        "cvar_1pct": _safe_float(cvar_1 * 100),
        "beta": _safe_float(beta_val),
        "alpha": _safe_float(alpha_val * 100),  # Percentage
        "weighted_expense_ratio": weighted_expense,
        "current_yield": current_yield,
        "hhi": _safe_float(hhi_val),
        "largest_weight": _safe_float(largest_weight * 100),
    }

    # 9. Calculate diagnostics

    # Drawdown series
    dd_series = portfolio_drawdown_series(portfolio_series)
    drawdown_list = [
        {"date": date.strftime("%Y-%m-%d"), "value": _safe_float(val)}
        for date, val in dd_series.items()
    ]

    # Rolling 36-month metrics
    window_36m = 756  # 3 years × 252 trading days

    def rolling_cagr(x):
        if len(x) < 2:
            return np.nan
        return (x.iloc[-1] / x.iloc[0]) ** (252 / len(x)) - 1

    rolling_return = rolling_stats(portfolio_series, window_36m, rolling_cagr)
    rolling_volatility = rolling_stats(portfolio_returns, window_36m, lambda x: x.std() * np.sqrt(252))
    rolling_sharpe = rolling_stats(portfolio_returns, window_36m, lambda x: (x.mean() * 252 - rf) / (x.std() * np.sqrt(252)))

    # Return histogram
    hist, bins = np.histogram(portfolio_returns.dropna(), bins=50)
    histogram_data = {
        "counts": hist.tolist(),
        "bins": bins.tolist()
    }

    # Correlation matrix
    returns_by_ticker = {ticker: total_return_df[ticker].pct_change().dropna() for ticker in total_return_df.columns}
    if req.benchmark_ref in benchmark_series:
        returns_by_ticker[req.benchmark_ref] = benchmark_series[req.benchmark_ref].pct_change().dropna()

    corr_matrix = correlation_matrix(returns_by_ticker)
    corr_dict = {}
    if not corr_matrix.empty:
        for row in corr_matrix.index:
            corr_dict[row] = {col: _safe_float(corr_matrix.loc[row, col]) for col in corr_matrix.columns}

    # Risk contribution
    returns_df = pd.DataFrame(returns_by_ticker).dropna()
    cov_matrix = returns_df.cov() * 252  # Annualized
    risk_contrib = contribution_to_risk(weights, cov_matrix)

    # Bond duration/convexity
    duration_convexity = {}
    for holding in req.holdings:
        if holding.asset_class == "BOND":
            dur, conv = effective_duration_convexity(holding.ticker)
            if dur is not None:
                duration_convexity[holding.ticker] = {"duration": dur, "convexity": conv}

    # Scenario analysis (stub - would need specific date ranges)
    scenarios = {
        "2008_crisis": {"return": None, "recovery_days": None},
        "march_2020": {"return": None, "recovery_days": None},
        "2022_rates": {"return": None, "recovery_days": None}
    }

    diagnostics = {
        "drawdown_series": drawdown_list,
        "rolling_36m_return": [{"date": d.strftime("%Y-%m-%d"), "value": _safe_float(v)} for d, v in rolling_return.items()],
        "rolling_36m_volatility": [{"date": d.strftime("%Y-%m-%d"), "value": _safe_float(v)} for d, v in rolling_volatility.items()],
        "rolling_36m_sharpe": [{"date": d.strftime("%Y-%m-%d"), "value": _safe_float(v)} for d, v in rolling_sharpe.items()],
        "return_histogram": histogram_data,
        "correlation_matrix": corr_dict,
        "risk_contribution": {k: _safe_float(v) for k, v in risk_contrib.items()},
        "variance_by_asset": {k: _safe_float(v) for k, v in risk_contrib.items()},
        "duration_convexity": duration_convexity,
        "scenarios": scenarios
    }

    # 10. Build portfolio series for response
    portfolio_list = []
    for date, value in portfolio_series.items():
        portfolio_list.append({
            "date": date.strftime("%Y-%m-%d"),
            "price": _safe_float(value),
            "total_return": _safe_float(value),
            "dividend": None
        })

    log.info(f"Simulation complete: CAGR={cagr_val*100:.2f}%, Vol={vol_val*100:.2f}%, Sharpe={sharpe_val:.2f}")

    return SimResponse(
        portfolio=portfolio_list,
        benchmarks=benchmarks_data,
        summary=summary,
        diagnostics=diagnostics
    )
