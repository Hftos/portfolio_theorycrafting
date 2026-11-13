"""Write one ticker's price history into DuckDB, replacing whatever was there."""

import duckdb
import pandas as pd


def save_prices(con: duckdb.DuckDBPyConnection, df: pd.DataFrame, name: str | None = None) -> None:
    ticker = df["ticker"].iloc[0]

    # A transaction makes the delete + insert all-or-nothing:
    # if anything fails halfway, the old data is left untouched.
    con.execute("BEGIN TRANSACTION")
    try:
        con.execute("DELETE FROM prices WHERE ticker = ?", [ticker])
        con.register("new_prices", df)
        con.execute("INSERT INTO prices SELECT ticker, date, adj_close FROM new_prices")
        con.unregister("new_prices")
        # Keep a previously saved name if this run couldn't fetch one.
        old = con.execute("SELECT name FROM securities WHERE ticker = ?", [ticker]).fetchone()
        name = name or (old[0] if old else None)
        con.execute("""
            INSERT OR REPLACE INTO securities (ticker, name, first_date, last_date, num_rows, last_updated)
            SELECT ticker, ?, MIN(date), MAX(date), COUNT(*), now()
            FROM prices WHERE ticker = ?
            GROUP BY ticker
        """, [name, ticker])
        con.execute("COMMIT")
    except Exception:
        con.execute("ROLLBACK")
        raise
