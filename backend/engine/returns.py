import pandas as pd

def daily_returns(prices:pd.DataFrame) -> pd.DataFrame:
    """Day-over-day % change. The first row is dropped (it has no previous day)."""
    return prices.pct_change().iloc[1:]


def growth_of(returns: pd.Series, start_value: float = 10_000) -> pd.Series:
    """What 'start-value' grows into, day by day, given a series of returns.
    
    Compounding: each day's value = previous value * (1 + that day's return).
    """
    return start_value * (1+ returns).cumprod()

def total_return(returns: pd.Series) -> float:
    """Cumulative return over the whole period (0.50 = +50%)."""
    return float((1 + returns).prod() - 1)
 