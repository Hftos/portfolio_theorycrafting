from pathlib import Path

import duckdb
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DB_PATH = PROJECT_ROOT / "data" / "market.duckdb"

def load_prices(tickers:list[str], start:str | None = None, end: str | None = None) -> pd.DataFrame:
    """Prices as a table:"""
    tickers = [t.upper() for t in tickers]
    con = duckdb.connect(str(DB_PATH), read_only=True)
    try:
        df = con.execute(
            """
            SELECT date, ticker, adj_close FROM prices
            WHERE ticker IN (SELECT UNNEST(?))
                AND (? IS NULL OR date >= ?)
                AND (? IS NULL OR date <= ?)
            ORDER BY date
            """,
            [tickers, start, start, end, end],
        ).df()
    finally:
        con.close()

    wide = df.pivot(index="date", columns="ticker", values="adj_close")
    wide.index = pd.to_datetime(wide.index)
    return wide