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


def corr_matrix(price_df: pd.DataFrame) -> pd.DataFrame:
    """
    Calculate correlation matrix of daily returns between stocks.
    
    Concept: Correlation measures how stocks move together.
        +1.0: Perfect positive correlation (both go up/down together)
         0.0: No correlation (independent movement)
        -1.0: Perfect negative correlation (one up, other down)
    
    Example: SPY vs AGG might have correlation of 0.3
        → They somewhat move together but are partly independent
        → Good for diversification! (reducing overall portfolio risk)
    
    Why it matters: Diversification works best when stocks are NOT perfectly
    correlated. If everything moves together, you're not diversified!
    
    Args:
        price_df: DataFrame of daily prices
    
    Returns:
        Correlation matrix (DataFrame where both rows and columns are tickers)
    """
    if price_df.empty:
        return pd.DataFrame()
    
    # Calculate daily returns then correlation
    return price_df.sort_index().pct_change().dropna(how="all").corr().round(4)