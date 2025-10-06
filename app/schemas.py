from pydantic import BaseModel, Field
from typing import List, Dict

class PortfolioWeight(BaseModel):
    ticker: str
    weight: float = Field(..., ge=0)

class MetricsRequest(BaseModel):
    weights: List[PortfolioWeight]
    start: str  # "YYYY-MM-DD"
    end: str    # "YYYY-MM-DD"

class MetricsResponse(BaseModel):
    annual_return: float
    annual_vol: float
    sharpe: float
    max_drawdown: float
    correlation: Dict[str, Dict[str, float]]

    @staticmethod
    def empty() -> "MetricsResponse":
        return MetricsResponse(
            annual_return=float("nan"),
            annual_vol=float("nan"),
            sharpe=float("nan"),
            max_drawdown=float("nan"),
            correlation={}
        )