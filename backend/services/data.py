import pandas as pd
import yfinance as yf
from datetime import datetime, timedelta

def _inclusive_end(end: str) -> str:
    # yfinance 'end' is exclusive; add 1 day so the chosen end shows up
    try:
        dt = datetime.fromisoformat(end)
        return (dt + timedelta(days=1)).date().isoformat()
    except Exception:
        return end

def get_price_history(ticker: str, start: str, end: str) -> pd.Series:
    """
    Fetch adjusted close prices for [start, end] inclusive.
    Returns a Series indexed by 'YYYY-MM-DD' with float prices.
    """
    t = (ticker or "").strip().upper()
    end_inc = _inclusive_end(end)

    df = yf.download(t, start=start, end=end_inc, progress=False, auto_adjust=True)
    if df is None or df.empty:
        try:
            hist = yf.Ticker(t).history(start=start, end=end_inc, auto_adjust=True)
        except Exception:
            hist = pd.DataFrame()
        df = hist if hist is not None else pd.DataFrame()

    if df is None or df.empty:
        return pd.Series(dtype="float64", name=t)

    col = "Close" if "Close" in df.columns else ("Adj Close" if "Adj Close" in df.columns else None)
    if col is None:
        return pd.Series(dtype="float64", name=t)

    s = df[col].rename(t).astype("float64")
    s.index = pd.to_datetime(s.index).date
    s.index = s.index.map(lambda d: d.isoformat())
    return s
