import duckdb
import pandas as pd

def save_prices(con: duckdb.DuckDBPyConnection, df: pd.DataFrame) -> None:
    ticker = df["ticker"].iloc[0]

    con.execute("BEGIN TRANSACTION")
    try:
        con.execute("DELETE FROM prices WHERE ticker = ?", [ticker])
        con.register("new_prices", df)
        con.execute("INSERT INTO prices SELECT ticker, date, adj_close FROM new_prices")
        con.unregister("new_prices")
        con.execute("""
            INSERT OR REPLACE INTO securities
            SELECT ticker, MIN(date), MAX(date), COUNT(*), now()
            FROM prices WHERE ticker = ?
            GROUP BY ticker
        """, [ticker])
        con.execute("COMMIT")
    except Exception:
        con.execute("ROLLBACK")
        raise