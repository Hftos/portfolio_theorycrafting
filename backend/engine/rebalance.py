import numpy as np
import pandas as pd

FREQUENCIES = {"monthly": "M", "quarterly": "Q", "annual": "Y"}

def portfolio_returns(
        asset_returns: pd.DataFrame,
        weights: dict[str, float],
        rebalance: str = 'none',
) -> pd.Series:
    '''Daily returns of the whole portfolio.
    
    asset_returns: daily returns, one column per ticker (no missing values)
    weights:       target weights, must sum to 1
    rebalance:     "none", "monthly", "quarterly", or "annual"
    '''
    if rebalance != "none" and rebalance not in FREQUENCIES:
        raise ValueError(f"rebalance must be 'none' or one {list(FREQUENCIES)}")

    tickers = list(weights)
    target = np.array([weights[t] for t in tickers])
    rets = asset_returns[tickers].to_numpy()
    dates = asset_returns.index

    if rebalance == "none":
        rebalance_after = np.zeros(len(dates), dtype=bool)
    else:
        periods = pd.DatetimeIndex(dates).to_period(FREQUENCIES[rebalance])
        rebalance_after = np.append(periods[1:] != periods[:-1], False)

    holdings = target.copy()
    out = np.empty(len(dates))
    for i in range(len(dates)):
        before = holdings.sum()
        holdings = holdings * (1 + rets[i])
        after = holdings.sum()
        out[i] = after / before - 1
        if rebalance_after[i]:
            holdings = after + target

    return pd.Series(out, index=dates, name="portfolio")