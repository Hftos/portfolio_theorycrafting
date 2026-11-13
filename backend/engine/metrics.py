"""Portfolio statistics. Inputs are daily returns as decimals (0.01 = +1%)."""

import numpy as np
import pandas as pd

from .periods import best_and_worst_year, longest_drawdown_days, positive_months

TRADING_DAYS = 252


def cagr(returns: pd.Series) -> float:
    """Compound annual growth rate: the steady yearly return that produces the same end result."""
    growth = (1 + returns).prod()
    years = len(returns) / TRADING_DAYS
    return float(growth ** (1 / years) - 1)


def volatility(returns: pd.Series) -> float:
    """Annualized standard deviation of daily returns. Daily std scales by sqrt(252)."""
    return float(returns.std() * np.sqrt(TRADING_DAYS))


def sharpe_ratio(returns: pd.Series, risk_free_rate: float = 0.0) -> float:
    """Excess return per unit of risk: (annualized mean excess return) / (annualized volatility).

    risk_free_rate is annual (0.03 = 3%), converted to a daily rate before subtracting.
    """
    daily_rf = (1 + risk_free_rate) ** (1 / TRADING_DAYS) - 1
    excess = returns - daily_rf
    if excess.std() < 1e-12:
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


def sortino_ratio(returns: pd.Series, risk_free_rate: float = 0.0) -> float:
    """Like Sharpe, but only counts downside swings as risk.

    Investors don't mind volatility upward; Sortino divides excess return by the
    'downside deviation': the typical size of returns below the risk-free rate.
    """
    daily_rf = (1 + risk_free_rate) ** (1 / TRADING_DAYS) - 1
    excess = returns - daily_rf
    downside = np.sqrt((excess.clip(upper=0) ** 2).mean())
    if downside < 1e-12:
        return float("nan")
    return float(excess.mean() / downside * np.sqrt(TRADING_DAYS))


def calmar_ratio(returns: pd.Series) -> float:
    """CAGR divided by the size of the worst drawdown: growth earned per unit of worst-case pain."""
    mdd = max_drawdown(returns)
    if mdd > -1e-12:
        return float("nan")
    return float(cagr(returns) / abs(mdd))


def beta(returns: pd.Series, benchmark: pd.Series) -> float:
    """How much the portfolio tends to move when the benchmark moves 1%.

    1.0 moves with the market, 0.5 half as much, 0 unrelated. Computed on the dates both share.
    """
    both = pd.concat([returns, benchmark], axis=1, join="inner").dropna()
    if len(both) < 20 or both.iloc[:, 1].var() < 1e-18:
        return float("nan")
    return float(both.cov().iloc[0, 1] / both.iloc[:, 1].var())


def summary(returns: pd.Series, risk_free_rate: float = 0.0, benchmark: pd.Series | None = None) -> dict:
    """All headline metrics in one dict."""
    best, worst = best_and_worst_year(returns)
    return {
        "total_return": float((1 + returns).prod() - 1),
        "cagr": cagr(returns),
        "volatility": volatility(returns),
        "sharpe_ratio": sharpe_ratio(returns, risk_free_rate),
        "sortino_ratio": sortino_ratio(returns, risk_free_rate),
        "calmar_ratio": calmar_ratio(returns),
        "max_drawdown": max_drawdown(returns),
        "current_drawdown": float(drawdown_series(returns).iloc[-1]),
        "longest_drawdown_days": longest_drawdown_days(returns),
        "best_year": best,
        "worst_year": worst,
        "positive_months": positive_months(returns),
        "beta": beta(returns, benchmark) if benchmark is not None else float("nan"),
    }
