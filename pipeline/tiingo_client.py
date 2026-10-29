import pandas as pd
import requests

from .config import TIINGO_API_TOKEN, DEFAULT_START_DATE

BASE_URL = "https://api.tiingo.com/tiingo/daily"

class TiingoError(Exception):
    """Something went wrong talking to Tiingo"""

def fetch_prices(ticker: str, start_date: str = DEFAULT_START_DATE) -> pd.DataFrame:
    if not TIINGO_API_TOKEN:
        raise TiingoError("TIINGO_API_TOKEN is missing")

    ticker = ticker.strip().upper()
    response =requests.get(
        f"{BASE_URL}/{ticker}/prices",
        headers = {"Authorization": f"Token {TIINGO_API_TOKEN}"},
        timeout = 30,
    )

    if response.status_code == 404:
        raise TiingoError(f"{ticker}: ticker not found on Tiingo.")
    if response.status_code == 429:
        raise TiingoError("Rate limit hit (free tier: 50 requests/hour). Wait and try again.")
    if response.status_code == 401:
        raise TiingoError("Tiingo rejected the API token. Check TIINGO_API_TOKEN in .env.")
    if response.status_code != 200:
        raise TiingoError(f"{ticker}: HTTP {response.status_code}: {response.text[:200]}")

    rows = response.json()
    if not rows:
        raise TiingoError(f"{ticker}: Tiingo returned no price data.")

    df = pd.DataFrame(rows)
    return pd.DataFrame({
        "ticker": ticker,
        "date": pd.to_datetime(df["date"].str[:10]).dt.date,
        "adj_close": df["adjClose"].astype(float),
    })