#!/usr/bin/env .venv/bin/python3
"""
Simple test script to verify yfinance is working correctly.
Run this before starting the server to diagnose issues.
"""

import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta

def test_yfinance():
    print("=" * 60)
    print("Testing yfinance connectivity...")
    print("=" * 60)
    
    # Test 1: Basic ticker info
    print("\n1. Testing basic ticker info for SPY...")
    try:
        spy = yf.Ticker("SPY")
        info = spy.info
        if info and len(info) > 1:
            print(f"✓ SPY info retrieved: {info.get('longName', 'N/A')}")
        else:
            print("✗ SPY info is empty or invalid")
    except Exception as e:
        print(f"✗ Failed to get SPY info: {e}")
    
    # Test 2: Historical data with Ticker.history
    print("\n2. Testing historical data (Ticker.history)...")
    try:
        spy = yf.Ticker("SPY")
        end = datetime.now().date()
        start = (end - timedelta(days=365)).isoformat()
        end = end.isoformat()
        
        hist = spy.history(start=start, end=end)
        if not hist.empty:
            print(f"✓ Retrieved {len(hist)} days of data")
            print(f"  Date range: {hist.index[0]} to {hist.index[-1]}")
            print(f"  Columns: {list(hist.columns)}")
            print(f"  Sample data:\n{hist.head(3)}")
        else:
            print("✗ History data is empty")
    except Exception as e:
        print(f"✗ Failed to get history: {e}")
        import traceback
        traceback.print_exc()
    
    # Test 3: Download method
    print("\n3. Testing yf.download method...")
    try:
        end = datetime.now().date()
        start = (end - timedelta(days=365)).isoformat()
        end = end.isoformat()
        
        df = yf.download("SPY", start=start, end=end, progress=False)
        if not df.empty:
            print(f"✓ Downloaded {len(df)} days of data")
            print(f"  Columns: {list(df.columns)}")
        else:
            print("✗ Download returned empty dataframe")
    except Exception as e:
        print(f"✗ Download failed: {e}")
    
    # Test 4: Multiple tickers
    print("\n4. Testing multiple tickers...")
    try:
        end = datetime.now().date()
        start = (end - timedelta(days=365)).isoformat()
        end = end.isoformat()
        
        for ticker in ["SPY", "AGG", "VTI"]:
            t = yf.Ticker(ticker)
            hist = t.history(start=start, end=end)
            status = "✓" if not hist.empty else "✗"
            print(f"  {status} {ticker}: {len(hist) if not hist.empty else 0} days")
    except Exception as e:
        print(f"✗ Multiple ticker test failed: {e}")
    
    print("\n" + "=" * 60)
    print("Test complete!")
    print("=" * 60)

if __name__ == "__main__":
    test_yfinance()