"""Database tables. Safe to run repeatedly: only creates tables that don't exist."""

import duckdb

from .config import DB_PATH


def connect() -> duckdb.DuckDBPyConnection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    return duckdb.connect(str(DB_PATH))


def create_tables(con: duckdb.DuckDBPyConnection) -> None:
    con.execute("""
        CREATE TABLE IF NOT EXISTS securities (
            ticker       VARCHAR PRIMARY KEY,
            name         VARCHAR,
            first_date   DATE,
            last_date    DATE,
            num_rows     INTEGER,
            last_updated TIMESTAMP
        )
    """)
    # Databases created before names were added: add the column in place.
    con.execute("ALTER TABLE securities ADD COLUMN IF NOT EXISTS name VARCHAR")

    con.execute("""
        CREATE TABLE IF NOT EXISTS prices (
            ticker    VARCHAR NOT NULL,
            date      DATE    NOT NULL,
            adj_close DOUBLE  NOT NULL,
            PRIMARY KEY (ticker, date)
        )
    """)
