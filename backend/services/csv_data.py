"""
CSV DATA LOADING MODULE
========================
This module loads historical price data from local CSV files.
It replaces the Yahoo Finance API fetching with local data reads.

CSV Structure Expected:
- Files located in: data/stocks/{ticker}.csv or data/etfs/{ticker}.csv
- Columns: Date, Open, High, Low, Close, Adj Close, Volume
- Date format: YYYY-MM-DD
"""

import pandas as pd
import logging
from pathlib import Path

log = logging.getLogger("uvicorn.error")

# Base path for data files
DATA_DIR = Path(__file__).parent.parent.parent / "data"
STOCKS_DIR = DATA_DIR / "stocks"
ETFS_DIR = DATA_DIR / "etfs"


def find_ticker_file(ticker: str) -> Path | None:
    """
    Find the CSV file for a given ticker.
    Searches in both stocks/ and etfs/ directories.

    Args:
        ticker: Stock symbol (e.g., 'AAPL', 'SPY')

    Returns:
        Path to CSV file, or None if not found
    """
    ticker_lower = ticker.lower()

    # Check stocks directory
    stock_path = STOCKS_DIR / f"{ticker_lower}.csv"
    if stock_path.exists():
        return stock_path

    # Check ETFs directory
    etf_path = ETFS_DIR / f"{ticker_lower}.csv"
    if etf_path.exists():
        return etf_path

    return None


def get_price_history(ticker: str, start: str, end: str) -> pd.Series:
    """
    Load adjusted close prices for a ticker from CSV file.

    This is the main entry point for getting stock data from local CSVs.

    Args:
        ticker: Stock symbol (e.g., 'SPY', 'AAPL')
        start: Start date 'YYYY-MM-DD' (inclusive)
        end: End date 'YYYY-MM-DD' (inclusive)

    Returns:
        Series of daily prices indexed by date, or empty Series if file not found
    """
    t = (ticker or "").strip().upper()
    if not t:
        log.error("Empty ticker provided")
        return pd.Series(dtype="float64", name=t)

    # Find the CSV file
    csv_path = find_ticker_file(t)
    if csv_path is None:
        log.error(f"CSV file not found for ticker: {t}")
        log.error(f"Searched in: {STOCKS_DIR} and {ETFS_DIR}")
        return pd.Series(dtype="float64", name=t)

    try:
        # Read CSV file
        df = pd.read_csv(csv_path, parse_dates=["Date"])

        # Filter to date range (inclusive)
        df = df[(df["Date"] >= start) & (df["Date"] <= end)]

        if df.empty:
            log.warning(f"No data in date range {start} to {end} for {t}")
            return pd.Series(dtype="float64", name=t)

        # Extract Adj Close prices
        if "Adj Close" not in df.columns:
            log.error(f"'Adj Close' column not found in {csv_path}")
            return pd.Series(dtype="float64", name=t)

        # Create series with date index
        series = pd.Series(
            data=df["Adj Close"].values,
            index=df["Date"].dt.date.map(lambda d: d.isoformat()),
            name=t,
            dtype="float64"
        )

        log.info(f"✓ Loaded {len(series)} days for {t} from CSV ({start} to {end})")
        return series

    except Exception as e:
        log.error(f"Error reading CSV for {t}: {str(e)}")
        return pd.Series(dtype="float64", name=t)
