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
from typing import Literal

log = logging.getLogger("uvicorn.error")

# Base path for data files
DATA_DIR = Path(__file__).parent.parent.parent / "data"
STOCKS_DIR = DATA_DIR / "stocks"
ETFS_DIR = DATA_DIR / "etfs"
DIVIDENDS_DIR = DATA_DIR / "dividends"
CPI_FILE = DATA_DIR / "cpi.csv"


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


def get_dividend_history(ticker: str, start: str, end: str) -> pd.Series:
    """
    Load dividend data for a ticker from CSV file.

    Expected format: CSV with columns [Date, Dividend]
    File location: data/dividends/{ticker}.csv

    Args:
        ticker: Stock symbol (e.g., 'SPY', 'AAPL')
        start: Start date 'YYYY-MM-DD' (inclusive)
        end: End date 'YYYY-MM-DD' (inclusive)

    Returns:
        Series of dividends indexed by date, or empty Series if file not found
    """
    t = (ticker or "").strip().upper()
    if not t:
        return pd.Series(dtype="float64", name=t)

    # Look for dividend file
    div_path = DIVIDENDS_DIR / f"{t.lower()}.csv"
    if not div_path.exists():
        # No dividend file is OK - not all assets pay dividends
        return pd.Series(dtype="float64", name=t)

    try:
        df = pd.read_csv(div_path, parse_dates=["Date"])
        df = df[(df["Date"] >= start) & (df["Date"] <= end)]

        if df.empty or "Dividend" not in df.columns:
            return pd.Series(dtype="float64", name=t)

        series = pd.Series(
            data=df["Dividend"].values,
            index=df["Date"].dt.date.map(lambda d: d.isoformat()),
            name=t,
            dtype="float64"
        )

        log.info(f"✓ Loaded {len(series)} dividend payments for {t}")
        return series

    except Exception as e:
        log.warning(f"Could not load dividends for {t}: {str(e)}")
        return pd.Series(dtype="float64", name=t)


def infer_asset_class(ticker: str) -> Literal["EQUITY", "BOND", "ETF", "CASH"]:
    """
    Infer asset class from ticker symbol and file location.

    Heuristics:
    - Files in etfs/ directory → ETF
    - Ticker contains 'AGG', 'BND', 'TLT', 'IEF' → BOND
    - Default → EQUITY

    Args:
        ticker: Stock symbol

    Returns:
        Asset class designation
    """
    t = ticker.upper()

    # Check if in ETFs directory
    if (ETFS_DIR / f"{t.lower()}.csv").exists():
        # Further classify ETF type
        bond_keywords = ['AGG', 'BND', 'TLT', 'IEF', 'LQD', 'HYG', 'MUB', 'TIP']
        if any(keyword in t for keyword in bond_keywords):
            return "BOND"
        return "ETF"

    # Check for bond-like tickers
    bond_keywords = ['AGG', 'BND', 'TLT', 'IEF', 'LQD', 'HYG', 'MUB', 'TIP']
    if any(keyword in t for keyword in bond_keywords):
        return "BOND"

    # Default to equity
    return "EQUITY"


def load_asset_series(ticker: str, start: str = "2000-01-01", end: str = "2024-12-31") -> dict:
    """
    Load complete asset data including prices and dividends.

    Returns a dictionary that matches the AssetSeries schema:
    {
        "ticker": str,
        "asset_class": "EQUITY" | "BOND" | "ETF" | "CASH",
        "series": [
            {"date": "YYYY-MM-DD", "price": float, "total_return": float, "dividend": float},
            ...
        ]
    }

    Args:
        ticker: Stock symbol
        start: Start date (default: 2000-01-01)
        end: End date (default: 2024-12-31)

    Returns:
        Dictionary matching AssetSeries schema
    """
    t = ticker.strip().upper()

    # Load price data
    prices = get_price_history(t, start, end)
    if prices.empty:
        log.warning(f"No price data available for {t}")
        return {
            "ticker": t,
            "asset_class": infer_asset_class(t),
            "series": []
        }

    # Load dividend data (if available)
    dividends = get_dividend_history(t, start, end)

    # Build series points
    series_points = []
    for date_str in prices.index:
        price = float(prices.loc[date_str])
        dividend = float(dividends.loc[date_str]) if date_str in dividends.index else None

        series_points.append({
            "date": date_str,
            "price": price,
            "total_return": None,  # Will be computed later in simulation
            "dividend": dividend
        })

    return {
        "ticker": t,
        "asset_class": infer_asset_class(t),
        "series": series_points
    }


def load_cpi_index() -> list[dict]:
    """
    Load CPI (Consumer Price Index) data for inflation adjustment.

    Expected format: CSV with columns [Date, CPI]
    File location: data/cpi.csv

    Returns list of SeriesPoint-like dictionaries:
    [
        {"date": "YYYY-MM-DD", "price": CPI_value, ...},
        ...
    ]

    If file not found, returns stub data with constant CPI (no inflation adjustment).
    """
    if not CPI_FILE.exists():
        log.warning(f"CPI file not found at {CPI_FILE}. Using stub data (no inflation).")
        # Return stub with flat CPI = 100 for a reasonable date range
        stub_dates = pd.date_range(start="2000-01-01", end="2030-12-31", freq="MS")
        return [
            {
                "date": date.strftime("%Y-%m-%d"),
                "price": 100.0,
                "total_return": None,
                "dividend": None
            }
            for date in stub_dates
        ]

    try:
        df = pd.read_csv(CPI_FILE, parse_dates=["Date"])
        if "CPI" not in df.columns:
            log.error(f"CPI column not found in {CPI_FILE}")
            return []

        series_points = []
        for _, row in df.iterrows():
            series_points.append({
                "date": row["Date"].strftime("%Y-%m-%d"),
                "price": float(row["CPI"]),
                "total_return": None,
                "dividend": None
            })

        log.info(f"✓ Loaded {len(series_points)} CPI data points")
        return series_points

    except Exception as e:
        log.error(f"Error loading CPI data: {str(e)}")
        return []
