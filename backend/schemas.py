"""
DATA SCHEMAS (REQUEST/RESPONSE MODELS)
========================================
This file defines the structure of data sent between frontend and backend.

Using Pydantic for:
1. Type validation (ensures frontend sends correct data types)
2. Automatic documentation (FastAPI generates API docs from these)
3. Data conversion (e.g., string "60" → integer 60)
"""

from pydantic import BaseModel, Field
from typing import List, Dict


class PortfolioWeight(BaseModel):
    """
    Represents a single stock holding in the portfolio.
    
    Example: {"ticker": "SPY", "weight": 60}
    Meaning: 60% of portfolio in SPY (S&P 500 ETF)
    """
    ticker: str  # Stock symbol (e.g., "AAPL", "SPY")
    weight: float = Field(..., ge=0)  # Weight must be >= 0


class MetricsRequest(BaseModel):
    """
    Request payload for the /metrics endpoint.
    
    This is what the frontend sends to the backend.
    
    Example:
        {
            "weights": [
                {"ticker": "SPY", "weight": 60},
                {"ticker": "AGG", "weight": 40}
            ],
            "start": "2020-01-01",
            "end": "2024-12-31"
        }
    """
    weights: List[PortfolioWeight]  # List of stocks and their weights
    start: str  # Start date in format "YYYY-MM-DD"
    end: str    # End date in format "YYYY-MM-DD"


class AllocationItem(BaseModel):
    """Single allocation with ticker and weight."""
    ticker: str
    weight: float


class AllocationsResponse(BaseModel):
    """Response for /allocations endpoint."""
    allocations: List[AllocationItem]
    date_range: Dict[str, str]
    num_observations: int


class CorrelationResponse(BaseModel):
    """Response for /correlation endpoint."""
    correlation: Dict[str, Dict[str, float]]
    date_range: Dict[str, str]
    num_observations: int


class ReturnsResponse(BaseModel):
    """Response for /returns endpoint."""
    dates: List[str]
    portfolio_values: List[float]
    individual_values: Dict[str, List[float]]
    date_range: Dict[str, str]
    num_observations: int


class DrawdownResponse(BaseModel):
    """Response for /drawdown endpoint."""
    dates: List[str]
    drawdown_pct: List[float]
    max_drawdown: float
    date_range: Dict[str, str]
    num_observations: int