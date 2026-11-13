""" Monte carlo simulation, generating many random predictions off of 2 models, segregating 
into 5 bands of likelihood.
The two models are:
Bootstrap model: This model simply replays real historical returns in a random order, 12 months at a time.
Normal model: This model draws from a normal curve of historical returns and volatility.

Each portfolio will be simulated on the same DRAW of randomness, ensuring the differences come from portfolios and not
the models."""

import numpy as np
import pandas as pd

PERCENTILES = [5 ,25 ,50, 75, 95]
BLOCK_MONTHS = 12
DEFAULT_PATHS= 5_000
MIN_HISTORY_MONTHS=24

# Turning daily returns into monthly returns
def monthly_returns(growth: pd.Series, start_value: float) -> pd.Series:
    """Monthly % returns from a daily growth series that started at 'start_value'."""
    month_end_values = growth.resample("ME").last()
    previous = month_end_values.shift(1)
    previous.iloc[0] = start_value
    return month_end_values / previous - 1

# Bootstrap model
# For each future, it picks a random starting point in history and the subsequent 12 months
# until the chosen horizon is filled.

def _bootstrap_indexes(n_history: int, months: int, paths: int, rng: np.random.Generator) -> np.ndarray:
    """Returns an int array of shape (paths, months): the historical months each simulated month uses."""
    n_blocks = -(-months // BLOCK_MONTHS)
    starts = rng.integers(0,n_history, size=(paths, n_blocks))
    offsets = np.arange(BLOCK_MONTHS)
    indexes = (starts[:, :, None] + offsets[None, None, :]) % n_history
    return indexes.reshape(paths, n_blocks * BLOCK_MONTHS)[:, :months]

# Bell-curve model
# Fits the average monthly returns of each portfolio and how they move together
# The simulation then draws correlated random returns from that bell curve.

def _normal_parameters(history:np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """The mean monthly return of each portfolio, and a matrix that correlates random draws."""
    mean = history.mean(axis=0)
    cov = np.atleast_2d(np.cov(history, rowvar=False))

    # Turns independent random numers into correlated ones using the covariance's
    # eigen-decompositon
    eigenvalues, eigenvectors = np.linalg.eigh(cov)
    scale = eigenvectors * np.sqrt(np.clip(eigenvalues, 0, None))
    return mean, scale

# Running the simulation on every portfolio
def project(
    monthly: pd.DataFrame,
    model: str= "bootstrap",
    horizon_years: int = 20,
    start_value: float = 10_000,
    monthly_contribution: float=0.0,
    return_adjustment: float = 0.0,
    paths: int = DEFAULT_PATHS,
    seed: int = 42,
) -> dict:
    """
    monthly:              historical monthly returns, one column per portfolio, same months for all
    model:                "bootstrap" or "normal"
    horizon_years:        how far ahead to simulate
    monthly_contribution: added at the end of each month; negative values are withdrawals
    return_adjustment:    added to every year's return, e.g. -0.02 assumes 2% a year less than history
    seed:                 fixed so the same inputs always give the same bands
    """
    if model not in ("bootstrap", "normal"):
        raise ValueError("model must be 'bootstrap' or 'normal")
    history = monthly.dropna().to_numpy()
    if history.shape[0] < MIN_HISTORY_MONTHS:
        raise ValueError(
            f"Projections need at least {MIN_HISTORY_MONTHS} months of shared history; "
            f"these portfolios have {history.shape[0]}."
        )

    months = horizon_years * 12
    rng = np.random.default_rng(seed)

    if model == "bootstrap":
        indexes = _bootstrap_indexes(history.shape[0], months, paths, rng)
    else:
        mean, scale = _normal_parameters(history)

    # This will be the adjustment for the expected lesser returns of the stock market
    adjustment = (1 + return_adjustment) ** (1/12)

    n_portfolios = history.shape[1]
    values = np.full((paths, n_portfolios), float(start_value))
    bands = np.empty((len(PERCENTILES), months + 1, n_portfolios))
    bands[:, 0, :]= start_value
    for m in range(months):
        if model == "bootstrap":
            month_returns = history[indexes[:, m]]
        else:
            z= rng.standard_normal(size=(paths, n_portfolios))
            month_returns = np.maximum(mean + z @ scale.T, -0.99)
        month_returns = (1+month_returns) * adjustment -1
        values = np.maximum(values * (1 + month_returns) + monthly_contribution, 0.0)
        bands[:, m + 1, :]= np.percentile(values, PERCENTILES, axis=0)

    # summary numbers
    # invested accounts for the starting sum and everything contributed
    invested = start_value + monthly_contribution * months
    final = values
    results = []
    for j, name in enumerate(monthly.columns):
        results.append({
            "name": name,
            "bands":[
                {"month": m, **{f"p{p}": float(bands[k, m, j]) for k, p in enumerate(PERCENTILES)}}
                for m in range(months+1)
            ],
            "summary":{
                "median_final": float(np.median(final[:, j])),
                "p5_final": float(np.percentile(final[:, j], 5)),
                "p95_final": float(np.percentile(final[:, j], 95)),
                # Share of futures ending in a loss
                "chance_of_loss": float((final[:, j] < invested).mean()) if invested > 0 else None,
                "chance_of_doubling": float((final[:,j] >= 2 * invested).mean()) if invested > 0 else None,
                # Share of futures where withdrawals emptied the account before the end.
                "chance_of_running_out": float((final[:, j] <= 0).mean()),
            },
        })

    return {
        "model": model,
        "horizon_years": horizon_years,
        "paths": paths,
        "months_of_history": int(history.shape[0]),
        "total_invested": float(invested),
        "portfolios": results,
    }
