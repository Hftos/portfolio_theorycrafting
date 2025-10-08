import pandas as pd
import yfinance as yf

def get_price_history(ticker: str, start: str, end: str) -> pd.Series:
    df = yf.download(
        ticker, start=start, end=end, progress=False, auto_adjust= True
    )
    if df.empty:
        return pd.Series(dtype= "float64", name=ticker)
    s = df(["Close"].rename(ticker).astype("float64"))
    # Converts index to string dates
    s.index = s.index.strftime("%Y-%m-%d")
    return s