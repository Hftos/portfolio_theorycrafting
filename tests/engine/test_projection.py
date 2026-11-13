"""Projection tests: cases where the right answer can be worked out by hand."""

import numpy as np
import pandas as pd
import pytest

from backend.engine.projection import monthly_returns, project


# Helper: a table of monthly returns, one column per portfolio.
def monthly(**columns):
    n = len(next(iter(columns.values())))
    idx = pd.date_range("2000-01-31", periods=n, freq="ME")
    return pd.DataFrame(columns, index=idx, dtype=float)


# ---------- monthly_returns ----------

def test_monthly_returns_from_daily_growth():
    # $10,000 grows to $11,000 by the end of January, then to $12,100 by the end of February.
    idx = pd.to_datetime(["2024-01-15", "2024-01-31", "2024-02-15", "2024-02-29"])
    growth = pd.Series([10_500, 11_000, 11_500, 12_100], index=idx, dtype=float)
    assert monthly_returns(growth, 10_000).tolist() == pytest.approx([0.10, 0.10])


# ---------- No randomness: every month returns the same 1% ----------

@pytest.mark.parametrize("model", ["bootstrap", "normal"])
def test_constant_returns_give_one_certain_outcome(model):
    # If history is 1% every single month, every simulated future is identical,
    # so all five bands collapse onto 10,000 x 1.01^12 after one year.
    result = project(monthly(A=[0.01] * 36), model=model, horizon_years=1)
    last = result["portfolios"][0]["bands"][-1]
    expected = 10_000 * 1.01 ** 12
    for p in ["p5", "p25", "p50", "p75", "p95"]:
        assert last[p] == pytest.approx(expected, rel=1e-6)


def test_contributions_with_zero_returns():
    # No growth, $100 added every month for 2 years: 10,000 + 24 x 100.
    result = project(monthly(A=[0.0] * 36), horizon_years=2, monthly_contribution=100)
    assert result["portfolios"][0]["bands"][-1]["p50"] == pytest.approx(12_400)
    assert result["total_invested"] == pytest.approx(12_400)


def test_withdrawals_stop_at_zero():
    # Withdrawing $1,000 a month from $10,000 with no growth empties it in 10 months.
    result = project(monthly(A=[0.0] * 36), horizon_years=2, monthly_contribution=-1_000)
    p = result["portfolios"][0]
    assert p["bands"][10]["p50"] == pytest.approx(0)
    assert p["bands"][-1]["p50"] == 0          # never goes negative
    assert p["summary"]["chance_of_running_out"] == 1.0


def test_return_assumption_shaves_each_year():
    # History: 1% a month (12.68% a year). Assume 2% a year less:
    # each month becomes 1.01 x 0.98^(1/12), so one year gives 1.01^12 x 0.98.
    result = project(monthly(A=[0.01] * 36), horizon_years=1, return_adjustment=-0.02)
    assert result["portfolios"][0]["bands"][-1]["p50"] == pytest.approx(10_000 * 1.01 ** 12 * 0.98)


# ---------- Randomness behaves sensibly ----------

def test_bands_are_in_order():
    rng = np.random.default_rng(0)
    result = project(monthly(A=rng.normal(0.007, 0.04, 120)), horizon_years=10)
    for b in result["portfolios"][0]["bands"]:
        assert b["p5"] <= b["p25"] <= b["p50"] <= b["p75"] <= b["p95"]


def test_identical_portfolios_get_identical_bands():
    # Common random numbers: the same history must give the same bands, path for path.
    history = np.random.default_rng(1).normal(0.007, 0.04, 120)
    for model in ["bootstrap", "normal"]:
        result = project(monthly(A=history, B=history), model=model, horizon_years=5)
        a, b = result["portfolios"]
        assert a["bands"][-1] == pytest.approx({**b["bands"][-1]})


def test_same_inputs_same_answer():
    history = monthly(A=np.random.default_rng(2).normal(0.007, 0.04, 120))
    assert project(history, horizon_years=5) == project(history, horizon_years=5)


def test_bootstrap_only_replays_real_months():
    # History contains only +5% and -3% months. After one month, every simulated
    # future must be exactly 10,000 x 1.05 or 10,000 x 0.97, nothing in between.
    result = project(monthly(A=[0.05, -0.03] * 18), model="bootstrap", horizon_years=1)
    first_month = result["portfolios"][0]["bands"][1]
    for p in ["p5", "p25", "p50", "p75", "p95"]:
        assert first_month[p] in (pytest.approx(10_500), pytest.approx(9_700))


def test_normal_model_matches_the_historical_average():
    # With many paths, the median one-month outcome should sit near the historical mean.
    history = np.random.default_rng(3).normal(0.01, 0.03, 240)
    result = project(monthly(A=history), model="normal", horizon_years=1, paths=20_000)
    first_month_median = result["portfolios"][0]["bands"][1]["p50"]
    assert first_month_median == pytest.approx(10_000 * (1 + history.mean()), rel=0.002)


def test_bootstrap_has_fatter_tails_than_normal():
    # History with one crash cluster: mostly calm, plus a 12-month run of -6% months.
    # The bootstrap replays that whole crash year; the bell curve spreads it thin.
    calm = list(np.random.default_rng(4).normal(0.01, 0.02, 108))
    history = monthly(A=calm[:60] + [-0.06] * 12 + calm[60:])
    boot = project(history, model="bootstrap", horizon_years=5)["portfolios"][0]["summary"]
    norm = project(history, model="normal", horizon_years=5)["portfolios"][0]["summary"]
    assert boot["p5_final"] < norm["p5_final"]


def test_needs_enough_history():
    with pytest.raises(ValueError, match="at least 24 months"):
        project(monthly(A=[0.01] * 12))