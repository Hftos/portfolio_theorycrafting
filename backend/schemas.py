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
    
    This is what the backend sends back to the frontend.
    All percentages are in decimal format (0.10 = 10%)
    
    Example:
        {
            "annual_return": 0.0853,      # 8.53% per year
            "annual_vol": 0.1245,         # 12.45% volatility
            "sharpe": 0.685,              # Risk-adjusted return
            "max_drawdown": -0.2341,      # -23.41% worst drop
            "correlation": {               # How stocks move together
                "SPY": {"SPY": 1.0, "AGG": 0.23},
                "AGG": {"SPY": 0.23, "AGG": 1.0}
            }
        }
    """
    annual_return: float  # Average yearly return (0.10 = 10% per year)
    annual_vol: float     # Yearly volatility (0.15 = 15% standard deviation)
    sharpe: float         # Sharpe ratio (return per unit of risk)
    max_drawdown: float   # Worst peak-to-trough decline (negative number)
    correlation: Dict[str, Dict[str, float]]  # Ticker correlation matrix

    @staticmethod
    def empty() -> "MetricsResponse":
        """
        Create an empty response with NaN values.
        
        Useful for error cases or when no data is available.
        """
        return MetricsResponse(
            annual_return=float("nan"),
            annual_vol=float("nan"),
            sharpe=float("nan"),
            max_drawdown=float("nan"),
            correlation={}
        )