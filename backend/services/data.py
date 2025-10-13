import pandas as pd
import yfinance as yf
from datetime import datetime, timedelta
import logging

log = logging.getLogger("uvicorn.error")

def _inclusive_end(end: str) -> str:
    # yfinance 'end' is exclusive; add 1 day so the chosen end shows up
    try:
        dt = datetime.fromisoformat(end)
        return (dt + timedelta(days=1)).date().isoformat()
    except Exception:
        return end

def _normalize_series(df: pd.DataFrame, ticker: str) -> pd.Series:
    if df is None or df.empty:
        return pd.Series(dtype="float64", name=ticker)
    col = "Close" if "Close" in df.columns else ("Adj Close" if "Adj Close" in df.columns else None)
    if col is None:
        return pd.Series(dtype="float64", name=ticker)
    s = df[col].rename(ticker).astype("float64")
    # Normalize index to 'YYYY-MM-DD'
    try:
        s.index = pd.to_datetime(s.index).date
        s.index = s.index.map(lambda d: d.isoformat())
    except Exception:
        pass
    return s

def get_price_history(ticker: str, start: str, end: str) -> pd.Series:
    """
    Fetch adjusted close prices for [start, end] inclusive.
    Tries multiple strategies and logs why a fetch failed.
    Returns a Series indexed by 'YYYY-MM-DD' with float prices.
    """
    t = (ticker or "").strip().upper()
    end_inc = _inclusive_end(end)

    # Attempt 1: standard download with explicit params
    try:
        df = yf.download(
            t,
            start=start,
            end=end_inc,
            interval="1d",
            auto_adjust=True,
            progress=False,
            threads=False,     # reduce flakiness on some setups
            repair=True,       # let yfinance try to fix bad rows
        )
    except Exception as e:
        log.warning("yfinance.download failed for %s: %s", t, e)
        df = pd.DataFrame()

    if df is not None and not df.empty:
        return _normalize_series(df, t)

    log.info("Empty from yf.download for %s (%s → %s). Trying Ticker.history...", t, start, end_inc)

    # Attempt 2: Ticker().history
    try:
        hist = yf.Ticker(t).history(
            start=start,
            end=end_inc,
            interval="1d",
            auto_adjust=True,
        )
    except Exception as e:
        log.warning("Ticker(%s).history failed: %s", t, e)
        hist = pd.DataFrame()

    if hist is not None and not hist.empty:
        return _normalize_series(hist, t)

    log.info("Empty from Ticker.history for %s. Trying period='max' then slicing...", t)

    # Attempt 3: long-period fetch, then slice
    try:
        maxdf = yf.download(
            t,
            period="max",
            interval="1d",
            auto_adjust=True,
            progress=False,
            threads=False,
            repair=True,
        )
    except Exception as e:
        log.warning("yfinance.download(period='max') failed for %s: %s", t, e)
        maxdf = pd.DataFrame()

    if maxdf is not None and not maxdf.empty:
        # slice to requested range (inclusive)
        s = _normalize_series(maxdf, t)
        if not s.empty:
            s = s.loc[(s.index >= start) & (s.index <= end)]
            if not s.empty:
                return s

    # All attempts failed: log once and return empty series
    log.error("No data for %s in range %s..%s after all attempts.", t, start, end)
    return pd.Series(dtype="float64", name=t)
