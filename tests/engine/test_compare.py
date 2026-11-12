"""Comparison engine tests."""

import pandas as pd
import pytest

from backend.engine.compare import common_start, run_comparison


@pytest.fixture
def prices():
    # OLD has 6 days of prices; NEW only starts on day 3.
    idx = pd.bdate_range("2024-01-01", periods=6)
    return pd.DataFrame({
        "OLD": [100, 101, 102, 103, 104, 105],
        "BOND": [50, 50, 50, 50, 50, 50],
        "NEW": [None, None, 20, 21, 22, 23],
    }, index=idx, dtype=float)


def test_common_start_finds_the_youngest_ticker(prices):
    start, limiting = common_start(prices, ["OLD", "NEW"])
    assert start == prices.index[2]
    assert limiting == "NEW"


def test_every_portfolio_uses_the_same_dates(prices):
    # "Old only" could start on day 1, but is cut to day 3 so it matches "Has new".
    result = run_comparison(prices, [
        {"name": "Old only", "weights": {"OLD": 100}},
        {"name": "Has new", "weights": {"NEW": 50, "BOND": 50}},
    ])
    assert result["start_date"] == prices.index[2]
    assert result["limited_by"] == "NEW"
    a, b = result["portfolios"]
    assert a["name"] == "Old only" and b["name"] == "Has new"
    assert list(a["growth"].index) == list(b["growth"].index)


def test_identical_portfolios_get_identical_results(prices):
    result = run_comparison(prices, [
        {"name": "A", "weights": {"OLD": 60, "BOND": 40}},
        {"name": "B", "weights": {"OLD": 60, "BOND": 40}},
    ])
    a, b = result["portfolios"]
    assert a["metrics"]["cagr"] == pytest.approx(b["metrics"]["cagr"])


def test_missing_ticker_is_reported(prices):
    with pytest.raises(ValueError, match="No price data for: XYZ"):
        run_comparison(prices, [{"name": "A", "weights": {"XYZ": 100}}])