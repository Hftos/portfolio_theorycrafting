import numpy as np
import pandas as pd

TRADING_DAYS = 252

def cagr(returns: pd.Series) -> float:
    """Compound annual growth rate: the steady yearly reutnr that produces the same end result."""
    growth = (1+returns).prod()
    years = len(returns) / TRADING_DAYS
    return float(growth**(1/years)-1)

def volatility(returns:pd.Series) -> float:
    """Annualized standard deviation of daily returns. Daily std scales by sqrt(252)."""
    return float(returns.std() * np.sqrt(TRADING_DAYS))

def sharpe_ratio(returns: pd.Series, risk_free_rate: float = 0.0) -> float:
    """Excess return per unit of risk: (annualized mean excess return) / (annualized volatility).
    
    risk_free_rate is annual (0.03 = 3%), converted to a daily rate before subtracting."""

    daily_rf = (1 + risk_free_rate) ** ( 1/ TRADING_DAYS) - 1
    excess = returns - daily_rf
    if excess.std() == 0:
        return float("nan")
    return float(excess.mean() / excess.std() * np.sqrt(TRADING_DAYS))

def drawdown_series(returns: pd.Series) -> pd.Series:
    """Each day's distance below the highest value reached so far (-0.20 = 20% below the peak)."""
    wealth = (1 + returns).cumprod()
    # The starting value (1.0) counts as a peak, so a loss on day one shows as a drawdown.
    peak = wealth.cummax().clip(lower=1.0)
    return wealth / peak - 1
 
 
def max_drawdown(returns: pd.Series) -> float:
    """The worst peak-to-trough decline over the whole period."""
    return float(drawdown_series(returns).min())
 
 
def correlation_matrix(asset_returns: pd.DataFrame) -> pd.DataFrame:
    """Pairwise correlation of each asset's daily returns (-1 to +1)."""
    return asset_returns.corr()
 
 
def summary(returns: pd.Series, risk_free_rate: float = 0.0) -> dict:
    """All headline metrics in one dict."""
    return {
        "total_return": float((1 + returns).prod() - 1),
        "cagr": cagr(returns),
        "volatility": volatility(returns),
        "sharpe_ratio": sharpe_ratio(returns, risk_free_rate),
        "max_drawdown": max_drawdown(returns),
    }
