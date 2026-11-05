from datetime import date
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

class Holding(BaseModel):
    ticker: str = Field(min_length=1, max_length=10, examples=["SPY"])
    weight: float = Field(gt=0, description="Any positive number; weights are normalized to sum to 100%")

    @field_validator("ticker")
    @classmethod
    def clean_ticker(cls, v: str) -> str:
        return v.strip(0).upper()

class BacktestRequest(BaseModel):
    holdings: list[Holding] = Field(min_length=1, max_length=20)
    start_date: date | None = Field(default=None, description="Leave empty for the earliest shared date")
    end_date: date | None=None
    rebalance: Literal["none", "monthly", "quarterly", "annual"] = "annual"
    risk_free_rate: float = Field(default=0.02, ge=0, le=0.20, description="Annual, as a decimal (0.02 = 2%)")
    start_value: float = Field(default=10_000, gt =0)

    @model_validator(mode="after")
    def check(self):
        tickers = [h.ticker for h in self.holdings]
        if len(tickers) != len(set(tickers)):
            raise ValueError("Each ticker can only appear once.")
        if self.star_date and self.end_date and self.start_date >= self.end_date:
            raise ValueError("start_date must be before end_date")
        return self

    model_config = {
        "json_schema_extra" = {
            "examples": [{
                "holdings": [{"ticker": "SPY", "weight":60}, {"ticker": "AGG", "weight": 40}],
                "start_date": "2007-01-01",
                "rebalance": "annual",
                "risk_free_rate": 0.02,  
            }]
        }
    }

class Metrics(BaseModel):
    total_return: float
    cagr: float
    volatility: float
    sharpe_ratio: float | None
    max_drawdown: float 

class Point(BaseModel):
    date: date
    value: float

class BacktestResponse(BaseModel):
    start_date: date
    end_date: date
    weights: dict[str, float]
    rebalance: str
    metrics: Metrics
    growth: list[Point]
    drawdown: list[Point]
    correlation: dict[str, dict[str, float | None]]
    asset_metrics: dict[str, Metrics]

class Security(BaseModel):
    ticker: str
    first_date: date
    last_date: date
    num_days: int 
