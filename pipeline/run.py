"""Command-line entry point.

Examples (run from the project root):
    python -m pipeline.run SPY AGG       fetch specific tickers
    python -m pipeline.run --core        fetch everything in universe.py
    python -m pipeline.run --status      show what's in the database
"""

import argparse
import time

from .load import save_prices
from .schema import connect, create_tables
from .tiingo_client import TiingoError, fetch_name, fetch_prices
from .universe import CORE_TICKERS
from .validate import check_prices

SECONDS_BETWEEN_REQUESTS = 1


def fetch_and_store(tickers: list[str]) -> None:
    con = connect()
    create_tables(con)

    succeeded, failed = [], []
    for i, ticker in enumerate(tickers, start=1):
        print(f"[{i}/{len(tickers)}] {ticker} ... ", end="", flush=True)
        try:
            df = fetch_prices(ticker)
        except TiingoError as e:
            print(f"FAILED: {e}")
            failed.append(ticker)
            if "Rate limit" in str(e):
                print("Stopping early because of the rate limit.")
                break
            continue

        name = fetch_name(ticker)
        warnings = check_prices(df)
        save_prices(con, df, name)
        succeeded.append(ticker)
        print(f"ok, {len(df):,} days ({df['date'].min()} to {df['date'].max()}) {name or '(no name)'}")
        for w in warnings:
            print(f"    warning: {w}")

        if i < len(tickers):
            time.sleep(SECONDS_BETWEEN_REQUESTS)

    print(f"\nDone: {len(succeeded)} saved, {len(failed)} failed.")
    if failed:
        print("Failed:", ", ".join(failed))
    con.close()


def show_status() -> None:
    con = connect()
    create_tables(con)
    rows = con.execute(
        "SELECT ticker, first_date, last_date, num_rows, last_updated "
        "FROM securities ORDER BY ticker"
    ).fetchall()
    if not rows:
        print("Database is empty.")
    for t, first, last, n, updated in rows:
        print(f"{t:<7} {first} to {last}  {n:>6,} days  (updated {updated:%Y-%m-%d %H:%M})")
    con.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Load Tiingo prices into DuckDB.")
    parser.add_argument("tickers", nargs="*", help="Tickers to fetch, e.g. SPY AGG")
    parser.add_argument("--core", action="store_true", help="Fetch all tickers in universe.py")
    parser.add_argument("--status", action="store_true", help="Show what's in the database")
    args = parser.parse_args()

    if args.status:
        show_status()
    elif args.core or args.tickers:
        tickers = CORE_TICKERS if args.core else [t.upper() for t in args.tickers]
        fetch_and_store(tickers)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
