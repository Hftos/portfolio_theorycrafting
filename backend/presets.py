"""Built-in comparison portfolios.

Each preset is a well-known allocation, expressed with ETFs from pipeline/universe.py.
Weights are percentages. Add a preset by adding an entry; nothing else needs to change.
"""

PRESETS = [
    {
        "id": "sp500",
        "name": "S&P 500",
        "description": "100% US large-cap stocks. The benchmark most portfolios are measured against.",
        "holdings": {"SPY": 100},
    },
    {
        "id": "nasdaq100",
        "name": "Nasdaq 100",
        "description": "100% in the 100 largest non-financial Nasdaq companies, heavy in technology.",
        "holdings": {"QQQ": 100},
    },
    {
        "id": "sixty_forty",
        "name": "60/40",
        "description": "60% stocks, 40% bonds. The classic balanced portfolio.",
        "holdings": {"SPY": 60, "AGG": 40},
    },
    {
        "id": "three_fund",
        "name": "Three-fund",
        "description": "US stocks, international stocks and bonds, the Bogleheads favorite. Here 48/32/20.",
        "holdings": {"VTI": 48, "VXUS": 32, "BND": 20},
    },
    {
        "id": "all_weather",
        "name": "All-Weather",
        "description": (
            "Inspired by Ray Dalio: built to hold up in growth, recession, inflation and deflation. "
            "30% stocks, 55% Treasuries, 15% gold and commodities."
        ),
        "holdings": {"VTI": 30, "TLT": 40, "IEF": 15, "GLD": 7.5, "DBC": 7.5},
    },
    {
        "id": "permanent",
        "name": "Permanent Portfolio",
        "description": "Harry Browne's design: equal parts stocks, long Treasuries, short Treasuries (as cash) and gold.",
        "holdings": {"VTI": 25, "TLT": 25, "SHY": 25, "GLD": 25},
    },
]


def get_preset(preset_id: str) -> dict | None:
    return next((p for p in PRESETS if p["id"] == preset_id), None)