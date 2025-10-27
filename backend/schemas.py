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
from typing import List, Dict, Literal, Optional
from datetime import datetime


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


# ============================================================
# NEW SCHEMAS FOR PORTFOLIO SIMULATION
# ============================================================


class SeriesPoint(BaseModel):
    """A single data point in a time series."""
    date: str  # ISO format date string YYYY-MM-DD
    price: float
    total_return: Optional[float] = None  # Total return index including dividends
    dividend: Optional[float] = None  # Dividend paid on this date


class AssetSeries(BaseModel):
    """Complete time series data for a single asset."""
    ticker: str
    asset_class: Literal["EQUITY", "BOND", "ETF", "CASH"]
    series: List[SeriesPoint]


class PortfolioHolding(BaseModel):
    """A single holding in the portfolio with weight."""
    ticker: str
    asset_class: Literal["EQUITY", "BOND", "ETF", "CASH"]
    weight_pct: float = Field(..., ge=0, le=100)  # Weight as percentage (0-100)


class Assumptions(BaseModel):
    """Economic and tax assumptions for portfolio simulation."""
    expense_ratio_bps: int = Field(default=0, ge=0)  # Expense ratio in basis points
    slippage_bps: int = Field(default=0, ge=0)  # Slippage cost in basis points
    tax_mode: Literal["TAX_DEFERRED", "TAXABLE"] = "TAX_DEFERRED"
    short_term_rate: float = Field(default=0.0, ge=0, le=1)  # Short-term capital gains tax rate
    long_term_rate: float = Field(default=0.0, ge=0, le=1)  # Long-term capital gains tax rate
    rf_rate: float = Field(default=0.0, ge=0, le=1)  # Risk-free rate (for Sharpe/Sortino)


class SimRequest(BaseModel):
    """Request payload for portfolio simulation."""
    holdings: List[PortfolioHolding]
    rebalance: Literal["NONE", "ANNUAL", "QUARTERLY", "MONTHLY"] = "NONE"
    start: str  # ISO date string YYYY-MM-DD
    end: str  # ISO date string YYYY-MM-DD
    use_dividends: bool = True
    log_scale: bool = False  # Display preference (doesn't affect calculation)
    inflation_adjust: bool = False
    benchmarks: List[str] = Field(default_factory=list)  # List of benchmark tickers
    benchmark_ref: str = "SPY"  # Reference benchmark for beta/alpha calculation
    assumptions: Assumptions = Field(default_factory=Assumptions)
    objective: Literal["GROWTH", "BALANCED", "INCOME", "PRESERVATION"] = "BALANCED"
    risk_tolerance: int = Field(default=5, ge=1, le=10)  # Risk tolerance scale 1-10


class SimResponse(BaseModel):
    """Response payload for portfolio simulation."""
    portfolio: List[SeriesPoint]  # Portfolio value over time
    benchmarks: Dict[str, List[SeriesPoint]]  # Benchmark values over time
    summary: Dict  # Key metrics (CAGR, vol, Sharpe, etc.)
    diagnostics: Dict  # Detailed analytics (drawdown series, rolling metrics, etc.)