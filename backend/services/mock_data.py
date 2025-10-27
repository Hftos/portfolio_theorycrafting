"""
MOCK DATA SERVICE
=================
Provides realistic synthetic stock price data for development and testing.
This allows the application to run without depending on flaky external APIs.

Usage: Set USE_MOCK_DATA=true environment variable to use mock data instead of yfinance.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging
from typing import Literal

log = logging.getLogger("uvicorn.error")


def _generate_price_series(
    ticker: str,
    start: str,
    end: str,
    initial_price: float = 100.0,
    annual_return: float = 0.08,
    annual_volatility: float = 0.20,
    seed: int = None
) -> pd.Series:
    """
    Generate synthetic stock price data using geometric Brownian motion.

    This creates realistic-looking price movements that:
    - Trend upward with expected return
    - Have realistic volatility/noise
    - Never go negative
    - Are reproducible (same ticker = same data)

    Args:
        ticker: Stock symbol (used as part of random seed)
        start: Start date 'YYYY-MM-DD'
        end: End date 'YYYY-MM-DD'
        initial_price: Starting price
        annual_return: Expected annual return (default 8%)
        annual_volatility: Annual standard deviation (default 20%)
        seed: Random seed (if None, uses hash of ticker)

    Returns:
        Series of daily prices indexed by date strings
    """
    try:
        start_dt = datetime.fromisoformat(start)
        end_dt = datetime.fromisoformat(end)
    except Exception as e:
        log.error(f"Invalid date format: {e}")
        return pd.Series(dtype="float64", name=ticker)

    # Generate date range (business days only)
    dates = pd.bdate_range(start=start_dt, end=end_dt, freq='B')
    num_days = len(dates)

    if num_days == 0:
        return pd.Series(dtype="float64", name=ticker)

    # Use ticker as seed for reproducibility (same ticker = same data)
    if seed is None:
        seed = abs(hash(ticker)) % (2**31)
    np.random.seed(seed)

    # Convert annual parameters to daily
    # 252 trading days per year
    daily_return = annual_return / 252
    daily_volatility = annual_volatility / np.sqrt(252)

    # Generate random returns using geometric Brownian motion
    # Each day's return = drift + random shock
    random_shocks = np.random.normal(0, daily_volatility, num_days)
    daily_returns = daily_return + random_shocks

    # Convert returns to prices
    # price[t] = price[t-1] * (1 + return[t])
    price_ratios = 1 + daily_returns
    prices = initial_price * np.cumprod(price_ratios)

    # Create series with date strings as index
    series = pd.Series(prices, index=dates, name=ticker)
    series.index = series.index.date
    series.index = series.index.map(lambda d: d.isoformat())

    return series


# Predefined characteristics for common tickers
# This makes mock data more realistic and consistent
TICKER_CONFIGS = {
    "SPY": {"initial_price": 400.0, "annual_return": 0.10, "annual_volatility": 0.16},
    "QQQ": {"initial_price": 350.0, "annual_return": 0.12, "annual_volatility": 0.20},
    "IWM": {"initial_price": 180.0, "annual_return": 0.08, "annual_volatility": 0.22},
    "AGG": {"initial_price": 100.0, "annual_return": 0.03, "annual_volatility": 0.04},
    "TLT": {"initial_price": 95.0, "annual_return": 0.02, "annual_volatility": 0.12},
    "GLD": {"initial_price": 180.0, "annual_return": 0.05, "annual_volatility": 0.15},
    "VTI": {"initial_price": 220.0, "annual_return": 0.10, "annual_volatility": 0.16},
    "BND": {"initial_price": 78.0, "annual_return": 0.03, "annual_volatility": 0.05},
    "AAPL": {"initial_price": 170.0, "annual_return": 0.15, "annual_volatility": 0.28},
    "MSFT": {"initial_price": 350.0, "annual_return": 0.14, "annual_volatility": 0.25},
    "GOOGL": {"initial_price": 140.0, "annual_return": 0.13, "annual_volatility": 0.26},
    "AMZN": {"initial_price": 150.0, "annual_return": 0.16, "annual_volatility": 0.32},
    "TSLA": {"initial_price": 200.0, "annual_return": 0.20, "annual_volatility": 0.60},
    "BRK.B": {"initial_price": 350.0, "annual_return": 0.09, "annual_volatility": 0.18},
}


def get_mock_price_history(ticker: str, start: str, end: str) -> pd.Series:
    """
    Get mock price data for a ticker.

    This is a drop-in replacement for data.py::get_price_history().
    It generates realistic synthetic data instantly without any API calls.

    Args:
        ticker: Stock symbol
        start: Start date 'YYYY-MM-DD' (inclusive)
        end: End date 'YYYY-MM-DD' (inclusive)

    Returns:
        Series of daily prices indexed by date strings
    """
    t = (ticker or "").strip().upper()
    if not t:
        log.error("Empty ticker provided")
        return pd.Series(dtype="float64", name=t)

    log.info(f"[MOCK] Generating synthetic data for {t} from {start} to {end}")

    # Use predefined config if available, otherwise use defaults
    config = TICKER_CONFIGS.get(t, {
        "initial_price": 100.0,
        "annual_return": 0.08,
        "annual_volatility": 0.20
    })

    series = _generate_price_series(
        ticker=t,
        start=start,
        end=end,
        **config
    )

    if not series.empty:
        log.info(f"[MOCK] ✓ Generated {len(series)} days for {t}")
    else:
        log.warning(f"[MOCK] Failed to generate data for {t}")

    return series


def infer_asset_class_mock(ticker: str) -> Literal["EQUITY", "BOND", "ETF", "CASH"]:
    """
    Infer asset class from ticker symbol for mock data.

    Args:
        ticker: Stock symbol

    Returns:
        Asset class designation
    """
    t = ticker.upper()

    # Bond ETFs
    bond_keywords = ['AGG', 'BND', 'TLT', 'IEF', 'LQD', 'HYG', 'MUB', 'TIP']
    if any(keyword in t for keyword in bond_keywords):
        return "BOND"

    # Common ETFs
    etf_keywords = ['SPY', 'QQQ', 'IWM', 'VTI', 'VOO', 'GLD', 'DIA']
    if any(keyword in t for keyword in etf_keywords):
        return "ETF"

    # Default to equity
    return "EQUITY"


def load_asset_series_mock(ticker: str, start: str = "2000-01-01", end: str = "2024-12-31") -> dict:
    """
    Generate mock asset data for development and testing.

    This is a safe fallback when CSV files are missing. It generates realistic
    synthetic data for 2-3 common tickers.

    NOTE: This function is clearly documented to use MOCK DATA and should only be
    used for development/testing, not production.

    Args:
        ticker: Stock symbol
        start: Start date (default: 2000-01-01)
        end: End date (default: 2024-12-31)

    Returns:
        Dictionary matching AssetSeries schema with mock data
    """
    t = ticker.strip().upper()

    # Only provide mock data for a limited set of tickers
    supported_mocks = ['SPY', 'AGG', 'QQQ', 'VTI', 'BND', 'AAPL', 'MSFT']
    if t not in supported_mocks:
        log.warning(f"[MOCK] No mock data available for {t}. Supported: {', '.join(supported_mocks)}")
        return {
            "ticker": t,
            "asset_class": infer_asset_class_mock(t),
            "series": []
        }

    log.info(f"[MOCK] Generating synthetic data for {t}")

    # Generate price series
    prices = get_mock_price_history(t, start, end)

    if prices.empty:
        return {
            "ticker": t,
            "asset_class": infer_asset_class_mock(t),
            "series": []
        }

    # Generate mock dividend data (simple approximation)
    dividends = _generate_mock_dividends(t, prices.index)

    # Build series points
    series_points = []
    for date_str in prices.index:
        price = float(prices.loc[date_str])
        dividend = dividends.get(date_str, None)

        series_points.append({
            "date": date_str,
            "price": price,
            "total_return": None,  # Will be computed later
            "dividend": dividend
        })

    log.info(f"[MOCK] ✓ Generated {len(series_points)} data points for {t}")

    return {
        "ticker": t,
        "asset_class": infer_asset_class_mock(t),
        "series": series_points
    }


def _generate_mock_dividends(ticker: str, date_index: pd.Index) -> dict:
    """
    Generate realistic mock dividend payments.

    Assumes quarterly dividends for stocks/ETFs with typical yields.

    Args:
        ticker: Stock symbol
        date_index: Date index from price series

    Returns:
        Dictionary mapping date strings to dividend amounts
    """
    t = ticker.upper()

    # Define typical dividend yields
    dividend_yields = {
        'SPY': 0.015,  # ~1.5% yield
        'QQQ': 0.005,  # ~0.5% yield
        'VTI': 0.014,  # ~1.4% yield
        'AGG': 0.025,  # ~2.5% yield
        'BND': 0.024,  # ~2.4% yield
        'AAPL': 0.005,  # ~0.5% yield
        'MSFT': 0.008,  # ~0.8% yield
    }

    annual_yield = dividend_yields.get(t, 0.02)  # Default 2%
    quarterly_yield = annual_yield / 4

    # Pay dividends in Mar, Jun, Sep, Dec (end of quarter)
    dividend_months = [3, 6, 9, 12]
    dividends = {}

    for date_str in date_index:
        try:
            date = datetime.fromisoformat(date_str)
            # Check if this is close to end of dividend month
            if date.month in dividend_months and date.day >= 25:
                # Approximate dividend based on assumed price of 100
                dividend_amount = 100.0 * quarterly_yield
                dividends[date_str] = dividend_amount
        except:
            pass

    return dividends
