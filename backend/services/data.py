"""
DATA FETCHING MODULE
====================
This module is responsible for retrieving historical stock price data from Yahoo Finance.
It's the FIRST step in the data pipeline:
  1. Fetch raw price data (this module)
  2. Align and clean data (metrics.py)
  3. Calculate statistics (metrics.py)

Key Challenge: Yahoo Finance can be flaky, so we implement multiple retry strategies

MOCK DATA MODE:
Set environment variable USE_MOCK_DATA=true to use synthetic data instead of Yahoo Finance.
This is useful for development/testing when Yahoo Finance is unreliable.
"""

import pandas as pd
import yfinance as yf
from datetime import datetime, timedelta
import logging
import time
import requests
import os

log = logging.getLogger("uvicorn.error")

# Check if we should use mock data
USE_MOCK_DATA = os.getenv("USE_MOCK_DATA", "false").lower() in ("true", "1", "yes")

# Workaround for Yahoo Finance API issues
# Setting user agent helps avoid rate limiting
yf.utils.get_user_agent = lambda: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"


def _inclusive_end(end: str) -> str:
    """
    Convert end date to be inclusive for yfinance.
    
    Why needed: yfinance treats 'end' as EXCLUSIVE (doesn't include that day),
    but users expect INCLUSIVE behavior. So if user wants data through 2024-12-31,
    we request data through 2025-01-01 to actually get 2024-12-31.
    
    Args:
        end: Date string in format 'YYYY-MM-DD'
    
    Returns:
        Date string one day later
    """
    try:
        dt = datetime.fromisoformat(end)
        return (dt + timedelta(days=1)).date().isoformat()
    except Exception:
        return end


def _normalize_series(df: pd.DataFrame, ticker: str) -> pd.Series:
    """
    Extract price column and standardize the index format.
    
    Purpose: Yahoo Finance returns DataFrames with various column names and
    index formats. This function standardizes everything to:
    - A pandas Series (1D array of prices)
    - Index as 'YYYY-MM-DD' strings (easier to work with than datetime objects)
    - Float64 data type (ensures proper math operations)
    
    Args:
        df: Raw DataFrame from yfinance
        ticker: Stock symbol (used for naming the series)
    
    Returns:
        Pandas Series with prices, or empty Series if data is invalid
    """
    if df is None or df.empty:
        return pd.Series(dtype="float64", name=ticker)
    
    # Try to find the price column (yfinance uses different names depending on query type)
    col = "Close" if "Close" in df.columns else ("Adj Close" if "Adj Close" in df.columns else None)
    if col is None:
        return pd.Series(dtype="float64", name=ticker)
    
    # Extract the series and convert to float
    s = df[col].rename(ticker).astype("float64")
    
    # Normalize index to simple 'YYYY-MM-DD' strings
    try:
        s.index = pd.to_datetime(s.index).date
        s.index = s.index.map(lambda d: d.isoformat())
    except Exception:
        pass
    
    return s


def get_price_history(ticker: str, start: str, end: str, max_retries: int = 3) -> pd.Series:
    """
    Fetch adjusted close prices for a ticker with retry logic.

    This is the MAIN ENTRY POINT for getting stock data. It implements a fallback
    strategy to handle Yahoo Finance's unreliability:

    Strategy 1: Standard download with custom session
    Strategy 2: Ticker().history() with retry
    Strategy 3: Download with period parameter
    Strategy 4: Try with increased timeout and different parameters

    Why adjusted close? It accounts for stock splits and dividends, giving you
    the "true" price history for performance calculations.

    MOCK DATA: If USE_MOCK_DATA environment variable is set, this will use
    synthetic data instead of hitting Yahoo Finance API.

    Args:
        ticker: Stock symbol (e.g., 'SPY', 'AAPL')
        start: Start date 'YYYY-MM-DD' (inclusive)
        end: End date 'YYYY-MM-DD' (inclusive)
        max_retries: Number of retry attempts for each strategy

    Returns:
        Series of daily prices indexed by date, or empty Series if all attempts fail
    """
    # Use mock data if enabled
    if USE_MOCK_DATA:
        from backend.services.mock_data import get_mock_price_history
        return get_mock_price_history(ticker, start, end)

    t = (ticker or "").strip().upper()
    if not t:
        log.error("Empty ticker provided")
        return pd.Series(dtype="float64", name=t)
    
    end_inc = _inclusive_end(end)
    
    log.info(f"Fetching data for {t} from {start} to {end}")
    
    # Create a session with headers to avoid rate limiting
    session = requests.Session()
    session.headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    
    # ============================================================
    # STRATEGY 1: Standard yf.download with custom session
    # ============================================================
    for attempt in range(max_retries):
        try:
            if attempt > 0:
                delay = min(2 ** attempt, 10)  # Cap at 10 seconds
                log.info(f"Retry {attempt + 1}/{max_retries} after {delay}s delay")
                time.sleep(delay)
                
            df = yf.download(
                t,
                start=start,
                end=end_inc,
                interval="1d",
                auto_adjust=True,
                progress=False,
                threads=False,
                repair=True,
                timeout=30,  # Increased timeout
                session=session,
            )
            
            if df is not None and not df.empty:
                series = _normalize_series(df, t)
                if not series.empty:
                    log.info(f"✓ Successfully fetched {len(series)} days for {t} using download()")
                    return series
        except Exception as e:
            log.warning(f"download() attempt {attempt + 1}/{max_retries} failed for {t}: {str(e)[:100]}")
    
    log.info(f"Strategy 1 failed for {t}. Trying Ticker.history()...")
    
    # ============================================================
    # STRATEGY 2: Use Ticker().history() with longer timeout
    # ============================================================
    for attempt in range(max_retries):
        try:
            if attempt > 0:
                time.sleep(min(2 ** attempt, 10))
            
            ticker_obj = yf.Ticker(t, session=session)
            hist = ticker_obj.history(
                start=start,
                end=end_inc,
                interval="1d",
                auto_adjust=True,
                timeout=30,
            )
            
            if hist is not None and not hist.empty:
                series = _normalize_series(hist, t)
                if not series.empty:
                    log.info(f"✓ Successfully fetched {len(series)} days for {t} using Ticker.history()")
                    return series
        except Exception as e:
            log.warning(f"Ticker.history() attempt {attempt + 1}/{max_retries} failed for {t}: {str(e)[:100]}")
    
    log.info(f"Strategy 2 failed for {t}. Trying with period parameter...")
    
    # ============================================================
    # STRATEGY 3: Use period instead of dates (sometimes works better)
    # ============================================================
    # Calculate approximate period
    try:
        start_dt = datetime.fromisoformat(start)
        end_dt = datetime.fromisoformat(end)
        days = (end_dt - start_dt).days
        
        # Map days to period string
        if days <= 7:
            period = "5d"
        elif days <= 30:
            period = "1mo"
        elif days <= 90:
            period = "3mo"
        elif days <= 180:
            period = "6mo"
        elif days <= 365:
            period = "1y"
        elif days <= 730:
            period = "2y"
        elif days <= 1825:
            period = "5y"
        else:
            period = "max"
        
        for attempt in range(2):  # Only try twice for this strategy
            try:
                if attempt > 0:
                    time.sleep(5)
                    
                df = yf.download(
                    t,
                    period=period,
                    interval="1d",
                    auto_adjust=True,
                    progress=False,
                    threads=False,
                    session=session,
                    timeout=30,
                )
                
                if df is not None and not df.empty:
                    series = _normalize_series(df, t)
                    if not series.empty:
                        # Filter to requested date range
                        series = series.loc[(series.index >= start) & (series.index <= end)]
                        if not series.empty:
                            log.info(f"✓ Successfully fetched {len(series)} days for {t} using period='{period}'")
                            return series
            except Exception as e:
                log.warning(f"Period download attempt {attempt + 1} failed: {str(e)[:100]}")
    except Exception as e:
        log.warning(f"Could not calculate period: {e}")
    
    # ============================================================
    # ALL STRATEGIES FAILED
    # ============================================================
    log.error(f"❌ All fetch strategies failed for {t} in range {start} to {end}")
    log.error(f"This is likely a temporary Yahoo Finance API issue.")
    log.error(f"Suggestions:")
    log.error(f"  1. Wait 5-10 minutes and try again")
    log.error(f"  2. Check if ticker is correct at https://finance.yahoo.com/quote/{t}")
    log.error(f"  3. Try a different date range (e.g., 2023-01-01 to 2023-12-31)")
    return pd.Series(dtype="float64", name=t)


def align_series(assets: list[dict], start: str, end: str) -> dict[str, list[dict]]:
    """
    Align multiple asset series to common dates within a date range.

    Takes a list of AssetSeries dictionaries and ensures all have the same dates.
    Missing dates are filled with NaN or forward-filled from the last known value.

    Args:
        assets: List of AssetSeries dictionaries with structure:
                {
                    "ticker": str,
                    "asset_class": str,
                    "series": [{"date": str, "price": float, ...}, ...]
                }
        start: Start date 'YYYY-MM-DD' (inclusive)
        end: End date 'YYYY-MM-DD' (inclusive)

    Returns:
        Dictionary mapping ticker to list of SeriesPoint dictionaries (all with same dates)
        {
            "SPY": [{"date": "2020-01-01", "price": 100.0, ...}, ...],
            "AGG": [{"date": "2020-01-01", "price": 50.0, ...}, ...],
            ...
        }
    """
    if not assets:
        return {}

    # Convert each asset's series to a pandas DataFrame for easy alignment
    dfs = {}
    for asset in assets:
        ticker = asset["ticker"]
        series = asset["series"]

        if not series:
            continue

        # Convert to DataFrame
        df = pd.DataFrame(series)
        df["date"] = pd.to_datetime(df["date"])
        df = df.set_index("date")

        # Filter to date range
        df = df[(df.index >= start) & (df.index <= end)]

        if not df.empty:
            dfs[ticker] = df

    if not dfs:
        return {}

    # Find all unique dates across all assets
    all_dates = sorted(set().union(*[df.index for df in dfs.values()]))

    # Reindex each DataFrame to have all dates
    aligned = {}
    for ticker, df in dfs.items():
        # Reindex to all dates, forward-fill missing prices
        df_aligned = df.reindex(all_dates, method="ffill")

        # Convert back to list of dictionaries
        series_points = []
        for date in df_aligned.index:
            row = df_aligned.loc[date]
            series_points.append({
                "date": date.strftime("%Y-%m-%d"),
                "price": float(row["price"]) if pd.notna(row["price"]) else None,
                "total_return": float(row["total_return"]) if "total_return" in row and pd.notna(row["total_return"]) else None,
                "dividend": float(row["dividend"]) if "dividend" in row and pd.notna(row["dividend"]) else None,
            })

        aligned[ticker] = series_points

    log.info(f"Aligned {len(aligned)} assets to {len(all_dates)} common dates")
    return aligned