import numpy as np
import pandas as pd

def build_aligned_prices(prices_by_ticker: dict[str, pd.Series]) -> pd.DataFrame:
    """
    Combine individual price series into a single DataFrame with one column per ticker,
    aligned by date. Drops rows where *all* tickers are NaN.
    """
    if not prices_by_ticker:
        return pd.DataFrame()
    df = pd.concat(prices_by_ticker.values(), axis=1)
    return df.dropna(how="all")


def portfolio_value(
    price_df: pd.DataFrame,
    weights: dict[str, float],
    initial: float = 1.0,
) -> pd.Series:
    """
    Compute a portfolio growth curve from daily prices and weights.
    """
    if price_df.empty:
        return pd.Series(dtype="float64", name="portfolio")

    w = pd.Series(weights, dtype="float64")
    if w.sum() == 0:
        w = w + 1e-12
    w = w / w.sum()

    # daily returns
    rets = price_df.sort_index().pct_change().dropna(how="all")
    # align weights with columns
    rets = rets.reindex(columns=price_df.columns)
    port_rets = (rets * w.reindex(rets.columns).fillna(0.0)).sum(axis=1)

    pv = (1.0 + port_rets.fillna(0.0)).cumprod() * float(initial)
    pv.name = "portfolio"
    return pv


def annualized_return(series: pd.Series, periods_per_year: int = 252) -> float:
    """
    Annualized geometric return from a cumulative value series.
    """
    if series is None or series.empty or len(series) < 2:
        return float("nan")
    total_return = float(series.iloc[-1] / series.iloc[0] - 1.0)
    years = len(series) / float(periods_per_year)
    if years <= 0:
        return float("nan")
    return (1.0 + total_return) ** (1.0 / years) - 1.0


def annualized_volatility(
    price_df: pd.DataFrame,
    weights: dict[str, float],
    periods_per_year: int = 252,
) -> float:
    """
    Annualized portfolio volatility using the covariance of daily returns.
    """
    if price_df.empty:
        return float("nan")

    w = pd.Series(weights, dtype="float64")
    s = float(w.sum()) if float(w.sum()) != 0.0 else 1.0
    w = w / s

    rets = price_df.sort_index().pct_change().dropna(how="all")
    if rets.empty:
        return float("nan")

    cov = rets.cov() * float(periods_per_year)
    # Ensure proper alignment
    w = w.reindex(cov.columns).fillna(0.0)
    return float(np.sqrt(np.dot(w, np.dot(cov.values, w))))


def sharpe_ratio(annual_ret: float, annual_vol: float, rf: float = 0.0) -> float:
    """
    Classic Sharpe ratio using annualized inputs.
    """
    if annual_vol in (0.0, None) or np.isnan(annual_vol):
        return float("nan")
    if annual_ret is None or np.isnan(annual_ret):
        return float("nan")
    return float((annual_ret - rf) / annual_vol)


def max_drawdown(series: pd.Series) -> float:
    """
    Worst peak-to-trough drawdown from a value series.
    """
    if series is None or series.empty:
        return float("nan")
    roll_max = series.cummax()
    dd = series / roll_max - 1.0
    return float(dd.min())


def corr_matrix(price_df: pd.DataFrame) -> pd.DataFrame:
    """
    Correlation matrix of daily returns.
    """
    if price_df.empty:
        return pd.DataFrame()
    return price_df.sort_index().pct_change().dropna(how="all").corr().round(4)
