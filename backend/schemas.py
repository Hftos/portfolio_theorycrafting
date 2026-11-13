"""The shapes of data going in and out of the API.

FastAPI uses these to validate requests automatically: if the frontend sends a
negative weight or an unknown rebalance option, the request is rejected with a
clear error before any of our code runs.
"""

from datetime import date
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator


# ---------- Requests ----------

class Holding(BaseModel):
    ticker: str = Field(min_length=1, max_length=10, examples=["SPY"])
    weight: float = Field(gt=0, description="Any positive number; weights are normalized to sum to 100%")

    @field_validator("ticker")
    @classmethod
    def clean_ticker(cls, v: str) -> str:
        return v.strip().upper()


class BacktestRequest(BaseModel):
    holdings: list[Holding] = Field(min_length=1, max_length=20)
    start_date: date | None = Field(default=None, description="Leave empty for the earliest shared date")
    end_date: date | None = None
    rebalance: Literal["none", "monthly", "quarterly", "annual"] = "annual"
    risk_free_rate: float = Field(default=0.02, ge=0, le=0.20, description="Annual, as a decimal (0.02 = 2%)")
    start_value: float = Field(default=10_000, gt=0)

    @model_validator(mode="after")
    def check(self):
        tickers = [h.ticker for h in self.holdings]
        if len(tickers) != len(set(tickers)):
            raise ValueError("Each ticker can only appear once.")
        if self.start_date and self.end_date and self.start_date >= self.end_date:
            raise ValueError("start_date must be before end_date.")
        return self

    model_config = {
        "json_schema_extra": {
            "examples": [{
                "holdings": [{"ticker": "SPY", "weight": 60}, {"ticker": "AGG", "weight": 40}],
                "start_date": "2007-01-01",
                "rebalance": "annual",
                "risk_free_rate": 0.02,
            }]
        }
    }


# ---------- Responses ----------

class Metrics(BaseModel):
    # Any value can be None when it can't be computed (e.g. Sharpe with zero volatility).
    total_return: float
    cagr: float
    volatility: float
    sharpe_ratio: float | None
    sortino_ratio: float | None
    calmar_ratio: float | None
    max_drawdown: float
    current_drawdown: float
    longest_drawdown_days: int
    best_year: float | None = Field(description="Best full calendar year; None if no full year")
    worst_year: float | None
    positive_months: float
    beta: float | None = Field(description="Sensitivity to the S&P 500 (SPY); None if SPY isn't loaded")


class YearReturn(BaseModel):
    year: int
    value: float
    partial: bool = Field(description="True if the data doesn't cover the whole year")


class Point(BaseModel):
    date: date
    value: float


class BacktestResponse(BaseModel):
    start_date: date
    end_date: date
    weights: dict[str, float]
    rebalance: str
    metrics: Metrics
    annual_returns: list[YearReturn]
    growth: list[Point]
    drawdown: list[Point]
    correlation: dict[str, dict[str, float | None]]
    asset_metrics: dict[str, Metrics]


# ---------- Comparison ----------

class PortfolioIn(BaseModel):
    name: str = Field(min_length=1, max_length=40, examples=["My portfolio"])
    holdings: list[Holding] = Field(min_length=1, max_length=20)

    @model_validator(mode="after")
    def check(self):
        tickers = [h.ticker for h in self.holdings]
        if len(tickers) != len(set(tickers)):
            raise ValueError(f"{self.name}: each ticker can only appear once.")
        return self


class CompareRequest(BaseModel):
    portfolios: list[PortfolioIn] = Field(min_length=1, max_length=6)
    start_date: date | None = None
    end_date: date | None = None
    rebalance: Literal["none", "monthly", "quarterly", "annual"] = "annual"
    risk_free_rate: float = Field(default=0.02, ge=0, le=0.20)
    start_value: float = Field(default=10_000, gt=0)

    @model_validator(mode="after")
    def check(self):
        names = [p.name for p in self.portfolios]
        if len(names) != len(set(names)):
            raise ValueError("Each portfolio needs a different name.")
        if self.start_date and self.end_date and self.start_date >= self.end_date:
            raise ValueError("start_date must be before end_date.")
        return self

    model_config = {
        "json_schema_extra": {
            "examples": [{
                "portfolios": [
                    {"name": "My portfolio", "holdings": [{"ticker": "SPY", "weight": 70}, {"ticker": "TLT", "weight": 30}]},
                    {"name": "60/40", "holdings": [{"ticker": "SPY", "weight": 60}, {"ticker": "AGG", "weight": 40}]},
                ],
                "rebalance": "annual",
            }]
        }
    }


class PortfolioResult(BaseModel):
    name: str
    weights: dict[str, float]
    metrics: Metrics
    annual_returns: list[YearReturn]
    growth: list[Point]
    drawdown: list[Point]
    correlation: dict[str, dict[str, float | None]]
    asset_metrics: dict[str, Metrics]


class CompareResponse(BaseModel):
    start_date: date
    end_date: date
    limited_by: str = Field(description="The ticker with the shortest history, which sets the start date")
    rebalance: str
    portfolios: list[PortfolioResult]


# ---------- Projections ----------

class ProjectRequest(CompareRequest):
    """The same portfolios and settings as a comparison, plus how to project them forward."""
    model: Literal["bootstrap", "normal"] = Field(
        default="bootstrap",
        description="bootstrap replays real history in 12-month blocks; normal draws from a bell curve",
    )
    horizon_years: int = Field(default=20, ge=1, le=40)
    monthly_contribution: float = Field(
        default=0, ge=-1_000_000, le=1_000_000, description="Added each month; negative = withdrawal"
    )
    return_adjustment: float = Field(
        default=0, ge=-0.10, le=0.05, description="Added to every year's return; -0.02 = 2% a year less than history"
    )


class Band(BaseModel):
    month: int
    p5: float
    p25: float
    p50: float
    p75: float
    p95: float


class ProjectionSummary(BaseModel):
    median_final: float
    p5_final: float
    p95_final: float
    chance_of_loss: float | None = Field(description="Share of futures ending below the total invested")
    chance_of_doubling: float | None
    chance_of_running_out: float = Field(description="Share of futures where withdrawals empty the account")


class PortfolioProjection(BaseModel):
    name: str
    bands: list[Band]
    summary: ProjectionSummary


class ProjectResponse(BaseModel):
    model: str
    horizon_years: int
    paths: int
    history_start: date
    history_end: date
    months_of_history: int
    total_invested: float
    portfolios: list[PortfolioProjection]


class Preset(BaseModel):
    id: str
    name: str
    description: str
    holdings: list[Holding]
    available: bool = Field(description="False if any of its tickers aren't in the database yet")
    missing: list[str]
    first_date: date | None


class Security(BaseModel):
    ticker: str
    name: str | None = Field(description="Full name, e.g. 'SPDR S&P 500 ETF Trust'; None if not fetched yet")
    first_date: date
    last_date: date
    num_days: int