"""Command-line entry point.

Examples (run from the project root):
    python -m pipeline.run SPY AGG           fetch specific tickers (always refetched)
    python -m pipeline.run --catalog         fetch every catalog ticker not refreshed in the last 20 hours
    python -m pipeline.run --catalog --wait  same, but pause an hour at the rate limit and keep going
    python -m pipeline.run --catalog --force refetch every catalog ticker, even fresh ones
    python -m pipeline.run --status          show what's in the database
"""

import argparse
import time
from datetime import datetime, timedelta

from .load import save_prices
from .schema import connect, create_tables
from .tiingo_client import TiingoError, fetch_name, fetch_prices
from .universe import CORE_TICKERS
from .validate import check_prices

SECONDS_BETWEEN_REQUESTS = 1
RATE_LIMIT_WAIT_SECONDS = 61 * 60  # Tiingo's free limit resets hourly; wait just past it
FRESH_HOURS = 20  # a ticker refreshed more recently than this is skipped (unless forced)


# ---------------------------------------------------------------------------
# Which tickers still need fetching. Skipping recently refreshed ones is what makes
# a big load resumable: if it stops partway (rate limit, closed laptop), running it
# again only fetches what's left.
# ---------------------------------------------------------------------------
def stale_tickers(con, tickers: list[str], fresh_hours: float = FRESH_HOURS) -> list[str]:
    cutoff = datetime.now() - timedelta(hours=fresh_hours)
    fresh = {
        row[0]
        for row in con.execute("SELECT ticker FROM securities WHERE last_updated >= ?", [cutoff]).fetchall()
    }
    return [t for t in tickers if t not in fresh]


# ---------------------------------------------------------------------------
# Fetch, check and save each ticker in turn.
# One failed ticker doesn't stop the rest. Hitting the rate limit either stops the
# run (it can be resumed later) or, with wait=True, pauses until the limit resets.
# ---------------------------------------------------------------------------
def fetch_and_store(tickers: list[str], wait: bool = False) -> None:
    con = connect()
    create_tables(con)

    succeeded, failed = [], []
    i = 0
    while i < len(tickers):
        ticker = tickers[i]
        print(f"[{i + 1}/{len(tickers)}] {ticker} ... ", end="", flush=True)
        try:
            df = fetch_prices(ticker)
        except TiingoError as e:
            if "Rate limit" in str(e):
                if wait:
                    resume_at = datetime.now() + timedelta(seconds=RATE_LIMIT_WAIT_SECONDS)
                    print(f"rate limit reached. Waiting until {resume_at:%H:%M} to continue...")
                    time.sleep(RATE_LIMIT_WAIT_SECONDS)
                    continue  # retry the same ticker
                remaining = len(tickers) - i
                print("rate limit reached.")
                print(f"Stopped with {remaining} left. Run the same command again later to continue.")
                break
            print(f"FAILED: {e}")
            failed.append(ticker)
            i += 1
            continue

        name = fetch_name(ticker)
        warnings = check_prices(df)
        save_prices(con, df, name)
        succeeded.append(ticker)
        print(f"ok, {len(df):,} days ({df['date'].min()} to {df['date'].max()}) {name or '(no name)'}")
        for w in warnings:
            print(f"    warning: {w}")

        i += 1
        if i < len(tickers):
            time.sleep(SECONDS_BETWEEN_REQUESTS)

    print(f"\nDone: {len(succeeded)} saved, {len(failed)} failed.")
    if failed:
        print("Failed:", ", ".join(failed))
    con.close()


# ---------------------------------------------------------------------------
# A summary of everything in the database.
# ---------------------------------------------------------------------------
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
    missing = [t for t in CORE_TICKERS if t not in {r[0] for r in rows}]
    print(f"\n{len(rows)} tickers loaded. Catalog tickers not loaded yet: {len(missing)}")
    con.close()


# ---------------------------------------------------------------------------
# Read the command-line options and run.
# ---------------------------------------------------------------------------
def main() -> None:
    parser = argparse.ArgumentParser(description="Load Tiingo prices into DuckDB.")
    parser.add_argument("tickers", nargs="*", help="Tickers to fetch, e.g. SPY AGG")
    parser.add_argument("--catalog", "--core", action="store_true", help="Fetch the catalog tickers")
    parser.add_argument("--force", action="store_true", help="Refetch even recently refreshed tickers")
    parser.add_argument("--wait", action="store_true", help="At the rate limit, wait an hour and continue")
    parser.add_argument("--status", action="store_true", help="Show what's in the database")
    args = parser.parse_args()

    if args.status:
        show_status()
    elif args.tickers:
        # Tickers named on the command line are always fetched: you asked for them.
        fetch_and_store([t.upper() for t in args.tickers], wait=args.wait)
    elif args.catalog:
        tickers = CORE_TICKERS
        if not args.force:
            con = connect()
            create_tables(con)
            tickers = stale_tickers(con, CORE_TICKERS)
            con.close()
            skipped = len(CORE_TICKERS) - len(tickers)
            if skipped:
                print(f"Skipping {skipped} tickers refreshed in the last {FRESH_HOURS} hours.")
        if not tickers:
            print("Everything in the catalog is up to date.")
            return
        fetch_and_store(tickers, wait=args.wait)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()