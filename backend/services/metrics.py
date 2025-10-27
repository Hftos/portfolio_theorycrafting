"""
PORTFOLIO METRICS CALCULATION MODULE
=====================================
This module takes aligned price data and computes portfolio statistics.
It's the SECOND/THIRD step in the data pipeline:
  1. Fetch raw price data (data.py) ✓
  2. Align and clean data (this module - build_aligned_prices)
  3. Calculate statistics (this module - all other functions)

Key Concepts:
- Returns: Daily percentage change in price (e.g., +2% or -1.5%)
- Annualized: Converting daily/monthly metrics to yearly equivalents
- Portfolio value: Weighted combination of multiple assets
"""

import numpy as np
import pandas as pd


def build_aligned_prices(prices_by_ticker: dict[str, pd.Series]) -> pd.DataFrame:
    """
    Combine individual stock price series into a single aligned DataFrame.
    
    Why needed: Different stocks may have data on different dates (holidays,
    IPOs, delistings). This function creates a unified timeline where each
    column is a stock and each row is a date.
    
    Example:
        Input:  {'SPY': [100, 101, 102], 'AGG': [50, 51, NaN]}
        Output: DataFrame with 2 columns and 3 rows, NaN where data is missing
    
    Args:
        prices_by_ticker: Dictionary mapping ticker symbols to price Series
    
    Returns:
        DataFrame where columns are tickers, index is dates, values are prices.
        Rows where ALL tickers are NaN are dropped (no trading that day).
    """
    if not prices_by_ticker:
        return pd.DataFrame()
    
    # pandas.concat automatically aligns by index (dates)
    df = pd.concat(prices_by_ticker.values(), axis=1)
    
    # Drop dates where no stocks have data (e.g., weekends)
    return df.dropna(how="all")


def portfolio_value(
    price_df: pd.DataFrame,
    weights: dict[str, float],
    initial: float = 1.0,
) -> pd.Series:
    """
    Calculate the growth of $1 invested in a weighted portfolio.
    
    This is the CORE calculation for portfolio analysis. It answers:
    "If I invested $100 with 60% in SPY and 40% in AGG, what would
    my balance be each day?"
    
    How it works:
    1. Calculate daily returns for each stock (% change from yesterday)
    2. Weight the returns (60% of SPY's return + 40% of AGG's return)
    3. Compound the returns day by day (like a growing savings account)
    
    Example:
        Day 1: SPY +1%, AGG +0.5% → Portfolio = 0.6*1% + 0.4*0.5% = 0.8%
        Day 2: SPY -0.5%, AGG +0.3% → Portfolio = 0.6*-0.5% + 0.4*0.3% = -0.18%
        Value curve: $1.00 → $1.008 → $1.00618...
    
    Args:
        price_df: DataFrame of daily prices (from build_aligned_prices)
        weights: Dict mapping ticker to weight (e.g., {'SPY': 0.6, 'AGG': 0.4})
        initial: Starting portfolio value (default $1)
    
    Returns:
        Series showing portfolio value over time
    """
    if price_df.empty:
        return pd.Series(dtype="float64", name="portfolio")
    
    # Normalize weights to sum to 1.0 (handle user error)
    w = pd.Series(weights, dtype="float64")
    if w.sum() == 0:
        w = w + 1e-12  # Avoid division by zero
    w = w / w.sum()
    
    # Calculate daily returns (percentage change from previous day)
    # pct_change() computes: (today - yesterday) / yesterday
    rets = price_df.sort_index().pct_change().dropna(how="all")
    
    # Align weights with columns (in case user provided extra/missing tickers)
    rets = rets.reindex(columns=price_df.columns)
    
    # Calculate weighted portfolio returns each day
    # (rets * w) multiplies each stock's return by its weight
    # .sum(axis=1) adds across stocks to get portfolio return
    port_rets = (rets * w.reindex(rets.columns).fillna(0.0)).sum(axis=1)
    
    # Compound returns into portfolio value
    # (1 + returns).cumprod() turns [0.01, -0.005] into [1.01, 1.00495]
    pv = (1.0 + port_rets.fillna(0.0)).cumprod() * float(initial)
    pv.name = "portfolio"
    return pv


def annualized_return(series: pd.Series, periods_per_year: int = 252) -> float:
    """
    Calculate the average yearly growth rate of an investment.
    
    Concept: If your portfolio grew from $100 to $150 over 3 years,
    what constant yearly rate would produce that growth?
    
    Formula: (final_value / initial_value)^(1 / years) - 1
    
    Example: $100 → $150 in 3 years
        (150/100)^(1/3) - 1 = 1.1447 - 1 = 14.47% per year
    
    Why 252? That's the typical number of trading days in a year
    (365 days - weekends - holidays ≈ 252)
    
    Args:
        series: Time series of portfolio values (from portfolio_value)
        periods_per_year: Trading days per year (252 for daily data)
    
    Returns:
        Annualized return as a decimal (0.10 = 10% per year)
    """
    if series is None or series.empty or len(series) < 2:
        return float("nan")
    
    # Total return over the period
    total_return = float(series.iloc[-1] / series.iloc[0] - 1.0)
    
    # Convert number of data points to years
    years = len(series) / float(periods_per_year)
    
    if years <= 0:
        return float("nan")
    
    # Apply compounding formula
    return (1.0 + total_return) ** (1.0 / years) - 1.0


def annualized_volatility(
    price_df: pd.DataFrame,
    weights: dict[str, float],
    periods_per_year: int = 252,
) -> float:
    """
    Calculate the yearly standard deviation of portfolio returns.
    
    Concept: Volatility measures how "jumpy" your portfolio is. Low volatility
    means steady growth. High volatility means big swings up and down.
    
    Think of it like:
    - Low volatility: Growing 0.5% most days (steady)
    - High volatility: Growing 5% one day, dropping 4% the next (chaotic)
    
    Formula: sqrt(weights^T × Covariance_Matrix × weights) × sqrt(252)
    
    Why this matters: Two portfolios might have the same return, but one
    is a smooth ride while the other is a roller coaster. Most investors
    prefer lower volatility for the same return.
    
    Args:
        price_df: DataFrame of daily prices
        weights: Portfolio weights
        periods_per_year: Trading days per year (for annualization)
    
    Returns:
        Annualized volatility as a decimal (0.15 = 15% volatility per year)
    """
    if price_df.empty:
        return float("nan")
    
    # Normalize weights
    w = pd.Series(weights, dtype="float64")
    s = float(w.sum()) if float(w.sum()) != 0.0 else 1.0
    w = w / s
    
    # Calculate daily returns
    rets = price_df.sort_index().pct_change().dropna(how="all")
    if rets.empty:
        return float("nan")
    
    # Calculate covariance matrix (how stocks move together)
    # Multiply by 252 to annualize
    cov = rets.cov() * float(periods_per_year)
    
    # Align weights with covariance matrix
    w = w.reindex(cov.columns).fillna(0.0)
    
    # Portfolio variance = w^T × Cov × w (matrix multiplication)
    # Portfolio volatility = sqrt(variance)
    return float(np.sqrt(np.dot(w, np.dot(cov.values, w))))


def sharpe_ratio(annual_ret: float, annual_vol: float, rf: float = 0.0) -> float:
    """
    Calculate risk-adjusted return (return per unit of risk).
    
    Concept: The Sharpe ratio answers "How much return am I getting for
    each unit of risk I'm taking?"
    
    Formula: (portfolio_return - risk_free_rate) / portfolio_volatility
    
    Example:
        Portfolio A: 10% return, 15% volatility → Sharpe = 10/15 = 0.67
        Portfolio B: 8% return, 10% volatility → Sharpe = 8/10 = 0.80
        → Portfolio B is better! Less return but much less risk.
    
    Rule of thumb:
        Sharpe < 1.0: Not great (barely beating risk-free rate per unit risk)
        Sharpe 1-2: Good
        Sharpe 2-3: Very good
        Sharpe > 3: Excellent (or suspicious - check your data!)
    
    Args:
        annual_ret: Annualized return (from annualized_return)
        annual_vol: Annualized volatility (from annualized_volatility)
        rf: Risk-free rate (e.g., Treasury bond yield, default 0)
    
    Returns:
        Sharpe ratio (unitless, higher is better)
    """
    if annual_vol in (0.0, None) or np.isnan(annual_vol):
        return float("nan")
    if annual_ret is None or np.isnan(annual_ret):
        return float("nan")
    
    return float((annual_ret - rf) / annual_vol)


def max_drawdown(series: pd.Series) -> float:
    """
    Calculate the largest peak-to-trough decline in portfolio value.
    
    Concept: Maximum drawdown answers "What's the worst loss I would have
    experienced if I bought at the top and held?"
    
    Example: Your portfolio goes $100 → $150 → $120 → $180
        Peak was $150, trough was $120
        Drawdown = (120 - 150) / 150 = -20%
        Max drawdown = -20% (this is the worst drop from a peak)
    
    Why it matters: This tells you how much pain you'd endure in the worst
    case. Many investors can't stomach 50% drawdowns even if the long-term
    return is great.
    
    Args:
        series: Time series of portfolio values
    
    Returns:
        Maximum drawdown as a decimal (e.g., -0.35 = -35% max drop)
    """
    if series is None or series.empty:
        return float("nan")
    
    # Calculate running maximum (highest point seen so far)
    roll_max = series.cummax()
    
    # Calculate drawdown at each point
    # (current_value / peak_value) - 1
    dd = series / roll_max - 1.0
    
    # Return the worst (most negative) drawdown
    return float(dd.min())


def optimize_equal_weight(tickers: list[str]) -> dict[str, float]:
    """
    Create equal-weight allocation for given tickers.

    Args:
        tickers: List of ticker symbols

    Returns:
        Dictionary mapping ticker to equal weight
    """
    n = len(tickers)
    if n == 0:
        return {}
    weight = 1.0 / n
    return {ticker: weight for ticker in tickers}


def portfolio_cumulative_returns(
    price_df: pd.DataFrame,
    weights: dict[str, float]
) -> tuple[pd.Series, dict[str, pd.Series]]:
    """
    Calculate cumulative returns for portfolio and individual tickers.

    Args:
        price_df: DataFrame of daily prices
        weights: Portfolio weights

    Returns:
        Tuple of (portfolio_series, individual_series_dict)
        All series are normalized to start at 1.0
    """
    if price_df.empty:
        return pd.Series(dtype="float64"), {}

    # Normalize weights
    w = pd.Series(weights, dtype="float64")
    if w.sum() == 0:
        w = w + 1e-12
    w = w / w.sum()

    # Calculate individual cumulative returns (normalize to 1.0 at start)
    individual_returns = {}
    for ticker in price_df.columns:
        prices = price_df[ticker].dropna()
        if len(prices) > 0:
            individual_returns[ticker] = prices / prices.iloc[0]

    # Calculate portfolio cumulative returns
    pv = portfolio_value(price_df, weights, initial=1.0)

    return pv, individual_returns


def portfolio_drawdown_series(series: pd.Series) -> pd.Series:
    """
    Calculate drawdown series (as percentages) from portfolio value series.

    Args:
        series: Time series of portfolio values

    Returns:
        Series of drawdown percentages (0 to -100)
    """
    if series is None or series.empty:
        return pd.Series(dtype="float64")

    # Calculate running maximum
    roll_max = series.cummax()

    # Calculate drawdown at each point (as percentage)
    dd = (series / roll_max - 1.0) * 100.0

    return dd


def corr_matrix(price_df: pd.DataFrame) -> pd.DataFrame:
    """
    Calculate correlation matrix of daily log returns between stocks.

    Concept: Correlation measures how stocks move together.
        +1.0: Perfect positive correlation (both go up/down together)
         0.0: No correlation (independent movement)
        -1.0: Perfect negative correlation (one up, other down)

    Log returns are used instead of simple returns because:
    - They are time-additive (can sum across periods)
    - More appropriate for statistical analysis
    - Better properties for correlation analysis

    Args:
        price_df: DataFrame of daily prices

    Returns:
        Correlation matrix (DataFrame where both rows and columns are tickers)
        Values are rounded to 2 decimal places
    """
    if price_df.empty:
        return pd.DataFrame()

    # Calculate daily log returns: ln(P_t / P_{t-1})
    log_returns = np.log(price_df.sort_index() / price_df.sort_index().shift(1))

    # Drop rows with all NaN and compute correlation
    return log_returns.dropna(how="all").corr().round(2)


# ============================================================
# NEW METRICS FUNCTIONS FOR PORTFOLIO SIMULATION
# ============================================================


def cagr(values: pd.Series, dates: pd.Index = None) -> float:
    """
    Calculate Compound Annual Growth Rate.

    This is an alias for annualized_return that works with values and dates.

    Args:
        values: Series of portfolio values
        dates: Optional date index (used to calculate exact years)

    Returns:
        CAGR as decimal (0.10 = 10% per year)
    """
    return annualized_return(values, periods_per_year=252)


def annual_vol(returns: pd.Series, periods_per_year: int = 252) -> float:
    """
    Calculate annualized volatility from returns series.

    Args:
        returns: Series of periodic returns (daily, monthly, etc.)
        periods_per_year: Number of periods per year (252 for daily, 12 for monthly)

    Returns:
        Annualized volatility as decimal (0.15 = 15% volatility)
    """
    if returns is None or returns.empty:
        return float("nan")

    return float(returns.std() * np.sqrt(periods_per_year))


def ulcer_index(values: pd.Series) -> float:
    """
    Calculate Ulcer Index - a measure of downside volatility.

    The Ulcer Index measures the depth and duration of drawdowns. Unlike standard
    deviation, it only penalizes downside volatility.

    Formula: sqrt(mean(drawdown^2))

    Args:
        values: Series of portfolio values

    Returns:
        Ulcer Index (higher = more downside pain)
    """
    if values is None or values.empty:
        return float("nan")

    # Calculate running maximum
    roll_max = values.cummax()

    # Calculate percentage drawdown at each point
    drawdowns = ((values - roll_max) / roll_max) * 100.0

    # Ulcer Index = sqrt(mean(drawdown^2))
    return float(np.sqrt(np.mean(drawdowns ** 2)))


def sortino(returns: pd.Series, rf: float = 0.0, periods_per_year: int = 252) -> float:
    """
    Calculate Sortino ratio - return per unit of downside risk.

    Like Sharpe ratio, but only penalizes downside volatility (not upside).

    Formula: (annual_return - rf) / downside_deviation

    Args:
        returns: Series of periodic returns
        rf: Risk-free rate (annualized)
        periods_per_year: Number of periods per year

    Returns:
        Sortino ratio (higher is better)
    """
    if returns is None or returns.empty:
        return float("nan")

    # Calculate annualized return
    total_return = (1 + returns).prod() - 1
    years = len(returns) / periods_per_year
    annual_return = (1 + total_return) ** (1 / years) - 1 if years > 0 else 0.0

    # Calculate downside deviation (only negative returns)
    downside_returns = returns[returns < 0]
    if downside_returns.empty:
        return float("inf")  # No downside = infinite Sortino

    downside_dev = downside_returns.std() * np.sqrt(periods_per_year)

    if downside_dev == 0:
        return float("inf")

    return float((annual_return - rf) / downside_dev)


def hit_rate(returns: pd.Series) -> float:
    """
    Calculate hit rate - percentage of positive return periods.

    Args:
        returns: Series of periodic returns

    Returns:
        Hit rate as decimal (0.65 = 65% of periods were positive)
    """
    if returns is None or returns.empty:
        return float("nan")

    positive = (returns > 0).sum()
    total = len(returns)

    return float(positive / total) if total > 0 else float("nan")


def best_worst_year(values: pd.Series, dates: pd.Index) -> tuple[float, float]:
    """
    Find the best and worst calendar year returns.

    Args:
        values: Series of portfolio values
        dates: Date index

    Returns:
        Tuple of (best_year_return, worst_year_return) as decimals
    """
    if values is None or values.empty or dates is None:
        return (float("nan"), float("nan"))

    # Group by year
    df = pd.DataFrame({"value": values.values}, index=dates)
    yearly = df.groupby(df.index.year)["value"]

    # Calculate return for each year
    yearly_returns = []
    for year, group in yearly:
        if len(group) > 1:
            year_return = (group.iloc[-1] / group.iloc[0]) - 1
            yearly_returns.append(year_return)

    if not yearly_returns:
        return (float("nan"), float("nan"))

    return (float(max(yearly_returns)), float(min(yearly_returns)))


def var_cvar(returns: pd.Series, p: float = 0.05) -> tuple[float, float]:
    """
    Calculate Value at Risk (VaR) and Conditional Value at Risk (CVaR).

    VaR: The p-th percentile of returns (e.g., 5th percentile for 95% confidence)
    CVaR: The average return below the VaR threshold (expected shortfall)

    Args:
        returns: Series of periodic returns
        p: Percentile (default 0.05 for 5% VaR, meaning 95% confidence)

    Returns:
        Tuple of (VaR, CVaR) as decimals (negative values indicate losses)
    """
    if returns is None or returns.empty:
        return (float("nan"), float("nan"))

    # Calculate VaR at the p-th percentile
    var = float(returns.quantile(p))

    # Calculate CVaR (mean of returns below VaR)
    tail_returns = returns[returns <= var]
    cvar = float(tail_returns.mean()) if not tail_returns.empty else var

    return (var, cvar)


def beta_alpha(excess_port: pd.Series, excess_bench: pd.Series) -> tuple[float, float]:
    """
    Calculate beta and alpha using ordinary least squares (OLS) regression.

    Beta: Portfolio's sensitivity to benchmark movements
    Alpha: Portfolio's excess return not explained by benchmark (Jensen's alpha)

    Args:
        excess_port: Series of portfolio excess returns (portfolio - rf)
        excess_bench: Series of benchmark excess returns (benchmark - rf)

    Returns:
        Tuple of (beta, alpha) where alpha is annualized
    """
    if excess_port is None or excess_port.empty or excess_bench is None or excess_bench.empty:
        return (float("nan"), float("nan"))

    # Align series
    df = pd.DataFrame({"port": excess_port, "bench": excess_bench}).dropna()

    if df.empty or len(df) < 2:
        return (float("nan"), float("nan"))

    # Calculate beta using covariance formula
    covariance = df["port"].cov(df["bench"])
    variance = df["bench"].var()

    if variance == 0:
        return (float("nan"), float("nan"))

    beta = float(covariance / variance)

    # Calculate alpha (daily) and annualize
    alpha_daily = df["port"].mean() - beta * df["bench"].mean()
    alpha_annual = float(alpha_daily * 252)  # Annualize assuming 252 trading days

    return (beta, alpha_annual)


def rolling_stats(values_or_returns: pd.Series, window: int, fn: callable) -> pd.Series:
    """
    Calculate rolling statistic using a window.

    Args:
        values_or_returns: Series of values or returns
        window: Rolling window size (e.g., 252 for 1-year, 756 for 3-year)
        fn: Function to apply (e.g., lambda x: x.mean())

    Returns:
        Series of rolling statistics
    """
    if values_or_returns is None or values_or_returns.empty:
        return pd.Series(dtype="float64")

    return values_or_returns.rolling(window=window, min_periods=window).apply(fn, raw=False)


def correlation_matrix(returns_by_ticker: dict[str, pd.Series]) -> pd.DataFrame:
    """
    Calculate correlation matrix from return series.

    Args:
        returns_by_ticker: Dictionary mapping ticker to return series

    Returns:
        Correlation matrix DataFrame
    """
    if not returns_by_ticker:
        return pd.DataFrame()

    df = pd.DataFrame(returns_by_ticker).dropna()
    if df.empty:
        return pd.DataFrame()

    return df.corr().round(2)


def contribution_to_risk(weights: dict[str, float], cov: pd.DataFrame) -> dict[str, float]:
    """
    Calculate each asset's contribution to portfolio variance.

    This shows which assets contribute most to overall portfolio risk.

    Args:
        weights: Dictionary mapping ticker to weight
        cov: Covariance matrix of returns

    Returns:
        Dictionary mapping ticker to % contribution to variance
    """
    if not weights or cov.empty:
        return {}

    # Convert weights to Series aligned with covariance matrix
    w = pd.Series(weights, dtype="float64")
    w = w.reindex(cov.columns).fillna(0.0)

    # Normalize weights
    w = w / w.sum() if w.sum() > 0 else w

    # Portfolio variance = w^T × Cov × w
    portfolio_var = np.dot(w, np.dot(cov.values, w))

    if portfolio_var == 0:
        return {ticker: 0.0 for ticker in weights.keys()}

    # Marginal contribution to variance = Cov × w
    marginal_contrib = np.dot(cov.values, w)

    # Total contribution = weight × marginal contribution
    total_contrib = w * marginal_contrib

    # Percentage contribution
    pct_contrib = (total_contrib / portfolio_var * 100).to_dict()

    return {ticker: float(pct_contrib.get(ticker, 0.0)) for ticker in weights.keys()}


def hhi(weights: dict[str, float]) -> float:
    """
    Calculate Herfindahl-Hirschman Index (HHI) - a measure of concentration.

    HHI = sum(weight^2) × 10000

    Interpretation:
    - HHI < 1500: Low concentration (diversified)
    - 1500 < HHI < 2500: Moderate concentration
    - HHI > 2500: High concentration

    Args:
        weights: Dictionary mapping ticker to weight (as decimals, e.g., 0.6 for 60%)

    Returns:
        HHI score (0-10000)
    """
    if not weights:
        return 0.0

    # Normalize weights to sum to 1
    w = pd.Series(weights, dtype="float64")
    w = w / w.sum() if w.sum() > 0 else w

    # HHI = sum of squared weights × 10000
    return float(np.sum(w ** 2) * 10000)


def effective_duration_convexity(ticker: str) -> tuple[float | None, float | None]:
    """
    Calculate effective duration and convexity for bond instruments.

    This is a STUB implementation that returns None for non-bond assets.
    In a real implementation, this would fetch bond characteristics from a database
    or calculate them from cash flows.

    Args:
        ticker: Bond ticker symbol

    Returns:
        Tuple of (duration, convexity) or (None, None) if not a bond
    """
    # Stub implementation - would need bond-specific data
    # For now, return None unless we have hardcoded values

    # Example hardcoded values for common bond ETFs
    bond_characteristics = {
        "AGG": (6.5, 0.5),   # Aggregate bond index ~6.5yr duration
        "BND": (6.8, 0.6),   # Total bond market
        "TLT": (17.5, 3.2),  # 20+ year treasuries
        "IEF": (7.5, 0.8),   # 7-10 year treasuries
        "SHY": (1.9, 0.1),   # 1-3 year treasuries
        "LQD": (8.5, 1.0),   # Investment grade corporate
    }

    return bond_characteristics.get(ticker.upper(), (None, None))