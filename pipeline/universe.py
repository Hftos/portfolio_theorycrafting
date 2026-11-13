"""Tickers to pre-load. Each ticker costs 2 requests (prices + name), so keep a full load
under Tiingo's free tier of 50 requests/hour: 25 tickers at most."""

CORE_TICKERS = [
    # US stocks
    "SPY",   # S&P 500
    "VTI",   # Total US market
    "QQQ",   # Nasdaq 100
    "IWM",   # Small caps
    # International
    "VXUS",  # Total international
    "EFA",   # Developed markets
    "EEM",   # Emerging markets
    # Bonds
    "AGG",   # US aggregate bonds
    "BND",   # Total bond market
    "TLT",   # 20+ year Treasuries
    "IEF",   # 7-10 year Treasuries
    "SHY",   # 1-3 year Treasuries
    "TIP",   # Inflation-protected Treasuries
    # Real assets
    "GLD",   # Gold
    "VNQ",   # Real estate
    "DBC",   # Commodities (used by the All-Weather preset)
    # Mutual funds
    "VFIAX", # Vanguard 500 Index (Admiral)
    "FXAIX", # Fidelity 500 Index
]
