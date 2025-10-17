#!/usr/bin/env .venv/bin/python3
"""
Gentler yfinance test that respects rate limits.
This test adds delays between requests to avoid triggering Yahoo's rate limiter.
"""

import yfinance as yf
import time
from datetime import datetime, timedelta

def test_single_ticker_with_delay():
    print("=" * 60)
    print("Testing yfinance with rate-limit-friendly delays...")
    print("=" * 60)

    print("\nWaiting 3 seconds before first request...")
    time.sleep(3)

    print("\nTesting SPY with Ticker.history()...")
    try:
        spy = yf.Ticker("SPY")
        end = datetime.now().date()
        start = end - timedelta(days=30)  # Just 30 days for a lighter request

        hist = spy.history(start=start.isoformat(), end=end.isoformat())

        if not hist.empty:
            print(f"✓ SUCCESS: Retrieved {len(hist)} days of SPY data")
            print(f"  Date range: {hist.index[0]} to {hist.index[-1]}")
            print(f"  Latest close: ${hist['Close'].iloc[-1]:.2f}")
            return True
        else:
            print("✗ FAILED: History data is empty")
            print("  This usually means Yahoo Finance is rate-limiting you.")
            print("  Wait 10-15 minutes and try again.")
            return False
    except Exception as e:
        print(f"✗ FAILED: {e}")
        if "429" in str(e) or "Too Many Requests" in str(e):
            print("\n  You're being rate-limited by Yahoo Finance.")
            print("  Wait 10-15 minutes before trying again.")
        return False

if __name__ == "__main__":
    success = test_single_ticker_with_delay()
    print("\n" + "=" * 60)
    if success:
        print("yfinance is working correctly!")
    else:
        print("yfinance is installed, but Yahoo Finance is blocking requests.")
        print("Wait 10-15 minutes and try again.")
    print("=" * 60)
