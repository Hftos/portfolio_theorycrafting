"""Engine tests on tiny, made-up numbers you can check by hand."""

import pandas as pd
import pytest

from backend.engine.metrics import cagr, max_drawdown, sharpe_ratio, volatility
from backend.engine.rebalance import portfolio_returns
from backend.engine.returns import daily_returns, growth_of, total_return
from backend.engine.simulate import run_backtest


def series(values, start="2024-01-01"):
    return pd.Series(values, index=pd.bdate_range(start, periods=len(values)), dtype=float)


# ---------- returns.py ----------

def test_daily_returns():
    # 100 -> 110 is +10%; 110 -> 99 is -10%
    prices = pd.DataFrame({"A": series([100, 110, 99])})
    assert daily_returns(prices)["A"].tolist() == pytest.approx([0.10, -0.10])


def test_growth_and_total_return():
    # +10% then -10% does NOT get you back to even: 1.1 * 0.9 = 0.99
    rets = series([0.10, -0.10])
    assert growth_of(rets, 10_000).tolist() == pytest.approx([11_000, 9_900])
    assert total_return(rets) == pytest.approx(-0.01)


# ---------- metrics.py ----------

def test_cagr_one_year_of_ten_percent():
    # 252 identical days that compound to exactly +10% over one year -> CAGR = 10%
    daily = 1.10 ** (1 / 252) - 1
    assert cagr(series([daily] * 252)) == pytest.approx(0.10)


def test_cagr_two_years_doubling():
    # Doubling over two years -> sqrt(2) - 1 = 41.4% a year, not 50%
    daily = 2 ** (1 / 504) - 1
    assert cagr(series([daily] * 504)) == pytest.approx(2 ** 0.5 - 1)


def test_volatility_of_constant_returns_is_zero():
    assert volatility(series([0.001] * 100)) == pytest.approx(0.0)


def test_volatility_scales_by_sqrt_252():
    rets = series([0.01, -0.01] * 50)
    assert volatility(rets) == pytest.approx(rets.std() * 252 ** 0.5)


def test_sharpe_is_zero_when_return_equals_risk_free():
    # Returns that exactly match a 3% risk-free rate, plus noise that averages to zero
    daily_rf = 1.03 ** (1 / 252) - 1
    rets = series([daily_rf + 0.01, daily_rf - 0.01] * 50)
    assert sharpe_ratio(rets, 0.03) == pytest.approx(0.0, abs=1e-12)


def test_max_drawdown():
    # 100 -> 120 -> 60 -> 90: the fall from 120 to 60 is -50%
    rets = daily_returns(pd.DataFrame({"A": series([100, 120, 60, 90])}))["A"]
    assert max_drawdown(rets) == pytest.approx(-0.50)


def test_max_drawdown_counts_a_first_day_loss():
    rets = series([-0.20, 0.10])   # 100 -> 80 -> 88; worst point is 20% below the start
    assert max_drawdown(rets) == pytest.approx(-0.20)


# ---------- rebalance.py ----------

def make_two_assets():
    # A doubles on day 1, then everything is flat; B never moves.
    # Day 3 is in a new year, so "annual" rebalances after day 2 (Dec 31).
    idx = pd.to_datetime(["2024-12-30", "2024-12-31", "2025-01-02", "2025-01-03"])
    return pd.DataFrame({"A": [1.0, 0.0, 0.0, -0.5], "B": [0.0, 0.0, 0.0, 0.0]}, index=idx)


def test_portfolio_return_on_day_one():
    # 50% in an asset that gains 100%, 50% in one that gains 0% -> portfolio +50%
    rets = portfolio_returns(make_two_assets(), {"A": 0.5, "B": 0.5})
    assert rets.iloc[0] == pytest.approx(0.50)


def test_no_rebalance_lets_weights_drift():
    # After A doubles: A = $1.00, B = $0.50 (total $1.50, A is now 2/3).
    # When A then falls 50%: A = $0.50, B = $0.50, total $1.00 -> portfolio -33.3%
    rets = portfolio_returns(make_two_assets(), {"A": 0.5, "B": 0.5}, "none")
    assert rets.iloc[3] == pytest.approx(-1 / 3)


def test_annual_rebalance_resets_weights():
    # Reset to 50/50 at year end ($0.75 each). A falls 50% -> $0.375 + $0.75 -> portfolio -25%
    rets = portfolio_returns(make_two_assets(), {"A": 0.5, "B": 0.5}, "annual")
    assert rets.iloc[3] == pytest.approx(-0.25)


# ---------- simulate.py ----------

def test_backtest_starts_when_youngest_fund_starts():
    idx = pd.bdate_range("2024-01-01", periods=5)
    prices = pd.DataFrame({
        "OLD": [100, 101, 102, 103, 104],
        "NEW": [None, None, 50, 51, 52],
    }, index=idx)
    result = run_backtest(prices, {"OLD": 50, "NEW": 50})
    assert result["start_date"] == idx[2]
    assert result["weights"] == {"OLD": 0.5, "NEW": 0.5}   # 50/50 normalized to 0.5/0.5


def test_backtest_rejects_unknown_ticker():
    prices = pd.DataFrame({"SPY": series([100, 101])})
    with pytest.raises(ValueError, match="No price data for: XYZ"):
        run_backtest(prices, {"SPY": 50, "XYZ": 50})