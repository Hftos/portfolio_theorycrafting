import numpy as np
import pandas as pd

def build_aligned_prices(prices_by_ticker: dict[str, pd.Series]) -> pd.DataFrame:
    if not prices_by_ticker:
        return pd.DataFrame()
    df = pd.concat(prices_by_ticker.values(), axis = 1)
    return df.dropna(how="all")


# Normalizes the weights to sum 1 and makes them a series
def portfolio_value(price_df: pd.DataFrame, weights: dict[str, float], initial: float = 1.0) -> pd.Series:
    w = pd.Series(weights, dtype="float64")
    if w.sum() == 0:
        w = w + 1e-9
    w = w / w.sum()
    rets = price_df.pct_change().dropna()
    port_rets = (rets * w.reindex(price_df.columns).fillna(0.0)).sum(axis=1)
    return (1 + port_rets).cumprod() * initial

def annualized_return(series: pd.Series, periods_per_year: int = 252) -> float:
    if series.empty or len(series) < 2:
        return float("nan")
    total_return = series.iloc[-1] / series.iloc[0] - 1.0
    years = len(series) / periods_per_year
    return (1 + total_return) ** (1 / years) - 1 if years > 0 else float("nan")

def annualized_volatility(price_df: pd.DataFrame, weights: dict[str, float], periods_per_year: int = 252) -> float:
    w = pd.Series(weights, dtype="float64")
    w = w / (w.sum() if w.sum() != 0 else 1.0)
    rets = price_df.pct_change().dropna()
    cov = rets.cov() * periods_per_year
    return float(np.sqrt(np.dot(w, np.dot(cov, w))))

def sharpe_ratio(annual_ret: float, annual_vol: float, rf: float = 0.0) -> float:
    if np.isnan(annual_ret) or np.isnan(annual_vol) or annual_vol == 0:
        return float("nan")
    return (annual_ret - rf) / annual_vol

def max_drawdown(series: pd.Series) -> float:
    if series.empty:
        return float("nan")
    cummax = series.cummax()
    dd = series / cummax - 1.0
    return float(dd.min())

def corr_matrix(price_df: pd.DataFrame) -> pd.DataFrame:
    return price_df.pct_change().dropna().corr().round(4)