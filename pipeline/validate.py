import pandas as pd

MAX_DAILY_MOVE=0.5
MAX_GAP_DAYS=7

def check_prices(df: pd.DataFrame) -> list[str]:
    warnings = []
    ticker = df["ticker"].iloc[0]
    prices = df.set_index("date")["adj_close"].sort_index()

    if (prices <= 0).any():
        warnings.append(f"{ticker}: {(prices <= 0).sum()} prices are zero or negative")

    if prices.index.duplicated().any():
        warnings.append(f"{ticker}: duplicate dates found")

    moves = prices.pct_change().abs()
    for date, move in moves[moves > MAX_DAILY_MOVE].items():
        warnings.append(f"{ticker}: {move:.0%} move on {date}")

    gaps = pd.Series(pd.to_datetime(prices.index)).diff().dt.days
    for i in gaps[gaps > MAX_GAP_DAYS].index:
        warnings.append(f"{ticker}: {int(gaps[i])}- day gap ending {prices.index[i]}")

    return warnings