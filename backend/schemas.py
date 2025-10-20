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


class MetricsResponse(BaseModel):
    """
    Response payload for the /metrics endpoint.

    Returns correlation matrix of daily log returns with metadata.

    Example:
        {
            "correlation": {
                "SPY": {"SPY": 1.0, "AGG": 0.23},
                "AGG": {"SPY": 0.23, "AGG": 1.0}
            },
            "date_range": {
                "start": "2019-01-02",
                "end": "2025-10-17"
            },
            "num_observations": 1667
        }
    """
    correlation: Dict[str, Dict[str, float]]  # Ticker correlation matrix
    date_range: Dict[str, str]  # Start and end dates of overlapping data
    num_observations: int  # Number of days in the overlapping period

    @staticmethod
    def empty() -> "MetricsResponse":
        """
        Create an empty response with default values.

        Useful for error cases or when no data is available.
        """
        return MetricsResponse(
            correlation={},
            date_range={"start": "", "end": ""},
            num_observations=0
        )