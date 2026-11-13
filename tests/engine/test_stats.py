"""Tests for the extended statistics, on numbers you can check by hand."""

import numpy as np
import pandas as pd
import pytest

from backend.engine.metrics import beta, calmar_ratio, sortino_ratio, summary
from backend.engine.periods import (
    best_and_worst_year,
    calendar_year_returns,
    longest_drawdown_days,
    positive_months,
)


def series(values, start="2024-01-01"):
    return pd.Series(values, index=pd.bdate_range(start, periods=len(values)), dtype=float)


# ---------- Sortino & Calmar ----------

def test_sortino_ignores_upside_swings():
    # Same average, but B's extra swings are all upward. Sharpe would punish B; Sortino shouldn't.
    a = series([0.01, -0.01] * 50)
    b = series([0.03, -0.01, -0.01, -0.01] * 25)
    assert a.mean() == pytest.approx(b.mean())
    assert sortino_ratio(b) == pytest.approx(sortino_ratio(a))


def test_sortino_with_no_losses_is_not_computable():
    assert np.isnan(sortino_ratio(series([0.01] * 50)))


def test_calmar_is_cagr_over_worst_drawdown():
    rets = series([0.01] * 126 + [-0.20] + [0.01] * 125)
    m = summary(rets)
    assert calmar_ratio(rets) == pytest.approx(m["cagr"] / 0.20)


# ---------- Beta ----------

def test_beta_of_a_double_leveraged_copy_is_two():
    market = series(np.random.default_rng(0).normal(0, 0.01, 300))
    assert beta(2 * market, market) == pytest.approx(2.0)


def test_beta_of_the_market_against_itself_is_one():
    market = series(np.random.default_rng(1).normal(0, 0.01, 300))
    assert beta(market, market) == pytest.approx(1.0)


def test_beta_only_uses_shared_dates():
    market = series(np.random.default_rng(2).normal(0, 0.01, 300))
    late = market.iloc[100:] * 0.5   # starts 100 days later
    assert beta(late, market) == pytest.approx(0.5)


# ---------- Calendar years ----------

def test_calendar_year_returns_and_partial_flags():
    # Mar 2023 to Dec 2024: 2023 starts in March, so it's partial; 2024 is full.
    idx = pd.bdate_range("2023-03-01", "2024-12-31")
    rets = pd.Series(0.0, index=idx)
    rets[rets.index.year == 2024] = 0.0005
    years = calendar_year_returns(rets)
    assert [y["year"] for y in years] == [2023, 2024]
    assert years[0]["partial"] is True
    assert years[1]["partial"] is False
    n_2024 = (idx.year == 2024).sum()
    assert years[1]["value"] == pytest.approx(1.0005 ** n_2024 - 1)


def test_best_and_worst_skip_partial_years():
    idx = pd.bdate_range("2021-06-01", "2023-12-31")
    rets = pd.Series(0.0, index=idx)
    rets[rets.index.year == 2021] = 0.01    # huge, but partial: must be ignored
    rets[rets.index.year == 2022] = -0.001
    rets[rets.index.year == 2023] = 0.001
    best, worst = best_and_worst_year(rets)
    assert best == pytest.approx(1.001 ** (idx.year == 2023).sum() - 1)
    assert worst == pytest.approx(0.999 ** (idx.year == 2022).sum() - 1)


# ---------- Months & time underwater ----------

def test_positive_months():
    idx = pd.bdate_range("2024-01-01", "2024-04-30")
    rets = pd.Series(0.0, index=idx)
    rets[idx.month == 1] = 0.001     # up
    rets[idx.month == 2] = -0.001    # down
    rets[idx.month == 3] = 0.001     # up
    rets[idx.month == 4] = 0.001     # up
    assert positive_months(rets) == pytest.approx(0.75)


def test_longest_drawdown_days():
    # Up Mon Jan 1, down Tue Jan 2, back above the old high on Mon Jan 8.
    # Underwater from the Jan 1 high until Jan 8: 7 calendar days.
    rets = series([0.10, -0.10, 0.0, 0.0, 0.0, 0.20])
    assert longest_drawdown_days(rets) == 7


def test_longest_drawdown_still_underwater_counts_to_the_end():
    rets = series([0.10, -0.50, 0.01, 0.01])   # never recovers; Jan 1 to Jan 4
    assert longest_drawdown_days(rets) == 3
