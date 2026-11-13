"""Statistics that depend on the calendar: yearly returns, months, and time spent in drawdown.

Inputs are daily returns as decimals (0.01 = +1%), indexed by date.
"""

import pandas as pd


def _is_full_year(dates: pd.DatetimeIndex) -> bool:
    """A year counts as full if its data runs from the first week of January to the last week of December."""
    first, last = dates[0], dates[-1]
    return first.month == 1 and first.day <= 7 and last.month == 12 and last.day >= 24


def calendar_year_returns(returns: pd.Series) -> list[dict]:
    """Return for each calendar year. Partial years (the first and last, usually) are flagged."""
    out = []
    for year, r in returns.groupby(returns.index.year):
        out.append({
            "year": int(year),
            "value": float((1 + r).prod() - 1),
            "partial": not _is_full_year(r.index),
        })
    return out


def best_and_worst_year(returns: pd.Series) -> tuple[float | None, float | None]:
    """Best and worst full calendar year. Partial years are left out, since they aren't comparable."""
    full = [y["value"] for y in calendar_year_returns(returns) if not y["partial"]]
    if not full:
        return None, None
    return max(full), min(full)


def positive_months(returns: pd.Series) -> float:
    """Share of calendar months with a gain (0.6 = 60% of months)."""
    monthly = (1 + returns).groupby(returns.index.to_period("M")).prod() - 1
    return float((monthly > 0).mean())


def longest_drawdown_days(returns: pd.Series) -> int:
    """The longest stretch, in calendar days, spent below a previous high.

    Measured from the last day at the old high to the first day back at it,
    or to the last date if it hasn't recovered yet.
    """
    wealth = (1 + returns).cumprod()
    # Include the starting value (1.0) so a loss on day one starts the clock.
    wealth = pd.concat([pd.Series([1.0], index=[returns.index[0] - pd.Timedelta(days=1)]), wealth])
    peak = wealth.cummax()
    underwater = wealth < peak * (1 - 1e-12)

    longest = 0
    peak_date = wealth.index[0]
    was_below = False
    for date, below in underwater.items():
        if below:
            longest = max(longest, (date - peak_date).days)  # still underwater: count to today
        else:
            if was_below:
                longest = max(longest, (date - peak_date).days)  # recovered: count to the recovery day
            peak_date = date
        was_below = below
    return longest
