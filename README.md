# Portfolio Theorycrafting: An Academic Walkthrough

## Overview

Portfolio Theorycrafting is a full-stack web application that demonstrates **Modern Portfolio Theory** (MPT) concepts through interactive analysis. This project combines financial mathematics, statistical analysis, and web development to create a tool for understanding portfolio risk and return.

## Table of Contents

1. [What This Application Does](#what-this-application-does)
2. [Academic Concepts Explained](#academic-concepts-explained)
3. [Technical Architecture](#technical-architecture)
4. [Key Improvements Made](#key-improvements-made)
5. [Getting Started](#getting-started)
6. [Understanding the Code](#understanding-the-code)

---

## What This Application Does

The application allows you to:

1. **Input a portfolio allocation** - Define stocks/ETFs and their weights (e.g., 60% SPY, 40% AGG)
2. **Select a time period** - Choose historical date ranges for analysis
3. **Compute portfolio metrics** - Calculate risk-adjusted performance statistics
4. **View correlation analysis** - Understand how assets move together

### Example Use Case

A student learning about portfolio theory might ask:

> "What if I invested 60% in the S&P 500 (SPY) and 40% in bonds (AGG)? How would that compare to 100% stocks?"

The app answers this by computing:
- **Annual Return**: Average yearly growth rate
- **Volatility**: How much the portfolio fluctuates
- **Sharpe Ratio**: Return per unit of risk
- **Max Drawdown**: Worst peak-to-trough decline
- **Correlation**: How the assets move together

---

## Academic Concepts Explained

### 1. Portfolio Returns and Compounding

**Concept**: When you hold multiple assets, your portfolio return is the weighted average of individual returns.

**Mathematical Formula**:
```
R_portfolio(t) = Σ w_i × R_i(t)
```
Where:
- `w_i` = weight of asset i (must sum to 1.0)
- `R_i(t)` = return of asset i on day t
- `Σ` = sum across all assets

**Why Compounding Matters**:

Simple returns: 10%, 10%, 10% → 30% total
**Wrong!** ❌

Compounded returns: (1.10 × 1.10 × 1.10) - 1 = 33.1% total
**Correct!** ✅

Our `portfolio_value()` function implements this using:
```python
portfolio_value = (1 + daily_returns).cumprod() * initial_investment
```

**Code Location**: `backend/services/metrics.py:49-104`

---

### 2. Annualized Return

**Concept**: Converting a return over any period to an equivalent yearly rate.

**Why We Need This**:
- Comparing "5% over 3 months" vs "20% over 2 years" is meaningless
- Annualizing makes everything comparable on a per-year basis

**Formula**:
```
Annualized Return = (Final Value / Initial Value)^(1 / Years) - 1
```

**Example**:
```
Investment: $100 → $150 over 3 years
Annualized = (150/100)^(1/3) - 1 = 14.47% per year
```

**Trading Days Convention**: We use 252 trading days per year (365 - weekends - holidays).

**Code Location**: `backend/services/metrics.py:107-142`

---

### 3. Volatility (Standard Deviation)

**Concept**: Volatility measures the "jumpiness" or unpredictability of returns.

**Academic Definition**: Standard deviation of returns, annualized.

**Intuition**:
- **Low volatility (5%)**: Returns cluster around the average - steady growth
- **High volatility (30%)**: Returns swing wildly - roller coaster ride

**Why It Matters**: Risk aversion. Most investors prefer smooth 8% returns over volatile 10% returns.

**Portfolio Volatility Formula**:
```
σ_p = √(w^T × Σ × w)
```
Where:
- `w` = weight vector
- `Σ` = covariance matrix of returns
- `^T` = transpose

**Key Insight**: Portfolio volatility is **not** just the weighted average of individual volatilities! The covariance structure matters.

**Example**:
```
Stock A: 20% volatility
Stock B: 20% volatility
50/50 Portfolio: Could be anywhere from 0% to 20% depending on correlation!
```

**Code Location**: `backend/services/metrics.py:145-196`

---

### 4. Sharpe Ratio (Risk-Adjusted Return)

**Concept**: The Sharpe ratio answers: "How much return am I getting **per unit of risk**?"

**Formula**:
```
Sharpe Ratio = (Portfolio Return - Risk-Free Rate) / Portfolio Volatility
```

**Example**:

| Portfolio | Return | Volatility | Sharpe Ratio | Winner? |
|-----------|--------|------------|--------------|---------|
| A         | 12%    | 18%        | 0.67         | ❌      |
| B         | 9%     | 10%        | 0.90         | ✅      |

Portfolio B is **superior** even though it has lower absolute return! It delivers better returns relative to the risk taken.

**Interpretation Guide**:
- `< 1.0`: Poor - barely compensated for risk
- `1.0 - 2.0`: Good - reasonable risk-adjusted returns
- `2.0 - 3.0`: Excellent - strong risk-adjusted performance
- `> 3.0`: Exceptional (or check your data for errors!)

**Historical Context**: Named after William F. Sharpe, who won the Nobel Prize in Economics (1990) for this and related work on capital asset pricing.

**Code Location**: `backend/services/metrics.py:199-232`

---

### 5. Maximum Drawdown

**Concept**: The largest peak-to-trough decline in portfolio value during the analyzed period.

**Formula**:
```
Drawdown(t) = (Portfolio Value(t) / Running Maximum(t)) - 1
Max Drawdown = min(Drawdown(t)) for all t
```

**Example Timeline**:
```
Value: $100 → $150 → $120 → $180 → $90
              ↑ Peak        ↓ Trough
Max Drawdown = ($90 - $150) / $150 = -40%
```

**Why This Matters**:

Many investors focus on average returns, but drawdowns reveal **behavioral risk**:
- Can you stomach a 50% decline?
- Will you panic-sell at the bottom?
- How long to recover to breakeven?

**Real-World Examples**:
- 2008 Financial Crisis: S&P 500 max drawdown ~-56%
- 2020 COVID Crash: S&P 500 max drawdown ~-34%
- 2022 Tech Selloff: NASDAQ max drawdown ~-36%

**Code Location**: `backend/services/metrics.py:235-268`

---

### 6. Correlation Matrix

**Concept**: Measures how asset returns move together.

**Scale**:
```
+1.0: Perfect positive correlation (move together)
 0.0: No correlation (independent)
-1.0: Perfect negative correlation (move oppositely)
```

**Diversification Insight**: The magic of portfolio theory is that combining low-correlated assets **reduces risk** without reducing return proportionally.

**Example**:
```
SPY (Stocks) vs AGG (Bonds): correlation ≈ 0.0 to 0.3
→ Good diversification benefit!

SPY vs QQQ (both stocks): correlation ≈ 0.9
→ Minimal diversification benefit
```

**Mathematical Foundation**: Pearson correlation coefficient of daily returns.

**Code Location**: `backend/services/metrics.py:271-297`

---

## Technical Architecture

### Data Pipeline

The application follows a clear 3-step data processing pipeline:

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Data Fetching (data.py)                             │
│ ─────────────────────────────────────────────────────────── │
│ • Fetch historical prices from Yahoo Finance (or mock data) │
│ • Handle API flakiness with retry logic                     │
│ • Return normalized pandas Series (dates → prices)          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Data Alignment (metrics.py - build_aligned_prices) │
│ ─────────────────────────────────────────────────────────── │
│ • Merge multiple ticker series on common dates             │
│ • Handle missing data (different trading calendars)        │
│ • Return aligned DataFrame (rows=dates, cols=tickers)      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Metrics Calculation (metrics.py)                   │
│ ─────────────────────────────────────────────────────────── │
│ • portfolio_value(): Compute daily portfolio value         │
│ • annualized_return(): Compound growth rate                │
│ • annualized_volatility(): Risk measure                    │
│ • sharpe_ratio(): Risk-adjusted return                     │
│ • max_drawdown(): Worst decline                            │
│ • corr_matrix(): Asset correlations                        │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Backend (Python)**:
- **FastAPI**: Modern async web framework
- **Pandas**: Time series data manipulation
- **NumPy**: Numerical computations (matrix operations)
- **yfinance**: Yahoo Finance API wrapper
- **Pydantic**: Data validation

**Frontend (TypeScript/React)**:
- **Vite**: Build tool and dev server
- **React**: UI framework
- **TypeScript**: Type safety

---

## Key Improvements Made

### 1. Mock Data System

**Problem**: Yahoo Finance API is unreliable (rate limiting, timeouts, random failures).

**Solution**: Implemented a mock data generator using **geometric Brownian motion** (the same stochastic process used in Black-Scholes option pricing).

**Mathematical Model**:
```
dS/S = μdt + σdW
```
Where:
- `S` = stock price
- `μ` = drift (expected return)
- `σ` = volatility
- `dW` = Wiener process (random walk)

**Discrete Implementation**:
```python
returns = daily_drift + daily_volatility × N(0,1)
prices = initial_price × cumprod(1 + returns)
```

**Benefits**:
- Instant response (no API calls)
- Reproducible (same ticker = same data)
- Realistic (follows actual market statistical properties)

**Code Location**: `backend/services/mock_data.py`

**Usage**: Set environment variable `USE_MOCK_DATA=true`

---

### 2. CORS Configuration Fix

**Problem**: Browser security prevents frontend (localhost:5173) from calling backend (127.0.0.1:8000) due to **Cross-Origin Resource Sharing** (CORS) restrictions.

**Why This Happens**:
- `localhost` and `127.0.0.1` are considered **different origins** by browsers
- Same-origin policy is a security feature to prevent malicious scripts

**Solution**:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Frontend via localhost
        "http://127.0.0.1:5173",   # Frontend via 127.0.0.1
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Educational Note**: CORS is a critical concept in web security. The browser makes "preflight" OPTIONS requests to verify the server allows cross-origin requests.

---

### 3. Network Binding Fix

**Problem**: Backend listening on `127.0.0.1` only, not accessible via `localhost`.

**Solution**: Changed uvicorn to bind to `0.0.0.0` (all interfaces):
```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

**Network Concepts**:
- `127.0.0.1`: IPv4 loopback address (localhost only)
- `0.0.0.0`: All IPv4 addresses on the local machine
- `localhost`: Hostname that resolves to `127.0.0.1` (usually)

---

### 4. Async Request Handling

**Problem**: Fetching multiple tickers sequentially is slow (each takes 2-5 seconds).

**Solution**: Async/await with concurrent fetching:

```python
async def fetch_ticker_data(ticker: str, start: str, end: str):
    # Run blocking yfinance call in thread pool
    loop = asyncio.get_event_loop()
    with ThreadPoolExecutor() as pool:
        result = await loop.run_in_executor(pool, get_price_history, ticker, start, end)
    return ticker, result

# Fetch all tickers concurrently
tasks = [fetch_ticker_data(t, start, end) for t in tickers]
results = await asyncio.gather(*tasks)
```

**Performance Impact**:
- Sequential: 5 tickers × 3 seconds = 15 seconds ❌
- Concurrent: max(5 tickers) ≈ 3 seconds ✅

**Staggered Delays**: To avoid rate limiting, we add 0.3s delays between requests:
```python
delay = ticker_index * 0.3
```

---

### 5. Retry Logic with Exponential Backoff

**Problem**: Network requests fail randomly.

**Solution**: Implemented retry logic with **exponential backoff**:

```python
for attempt in range(max_retries):
    try:
        return fetch_data()
    except Exception as e:
        if attempt < max_retries - 1:
            delay = min(2 ** attempt, 10)  # 1s, 2s, 4s, 8s, 10s (capped)
            time.sleep(delay)
        else:
            raise
```

**Why Exponential**:
- Gives temporary issues time to resolve
- Avoids hammering a struggling server
- Common pattern in distributed systems

---

## Getting Started

### Prerequisites

- Python 3.13+ with pip
- Node.js 18+ with npm
- Git

### Installation

```bash
# Clone repository
git clone <repository-url>
cd portfolio_theorycrafting

# Backend setup
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Frontend setup
cd frontend
npm install
cd ..
```

### Running the Application

**Option 1: Use the startup script (recommended)**
```bash
./start_dev.sh
```

**Option 2: Manual startup**
```bash
# Terminal 1 - Backend with mock data
source .venv/bin/activate
USE_MOCK_DATA=true uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Then open http://localhost:5173 in your browser.

### Using Real Market Data

To use actual Yahoo Finance data instead of mock data:

```bash
# Don't set USE_MOCK_DATA, or set it to false
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

**Warning**: Yahoo Finance may rate-limit you. Requests can take 10-30 seconds.

---

## Understanding the Code

### Key Files to Study

1. **`backend/services/metrics.py`** - Core portfolio mathematics
   - Every function has detailed docstrings explaining the theory
   - Great for learning Modern Portfolio Theory implementation

2. **`backend/services/data.py`** - Real-world API handling
   - Multiple retry strategies
   - Error handling patterns
   - Async/concurrency patterns

3. **`backend/services/mock_data.py`** - Financial simulation
   - Geometric Brownian motion implementation
   - Synthetic data generation techniques

4. **`backend/main.py`** - Web API design
   - FastAPI patterns
   - CORS configuration
   - Async endpoint handling

5. **`frontend/src/App.tsx`** - React state management
   - Form handling
   - API integration
   - Error handling in UI

### Learning Path

**For Finance Students**:
1. Start with `metrics.py` - read the docstrings and formulas
2. Run the app with different portfolios to see how metrics change
3. Experiment: What happens with negatively correlated assets?

**For CS Students**:
1. Study `main.py` - async/await patterns
2. Examine `data.py` - retry logic and error handling
3. Read `mock_data.py` - stochastic process simulation

**For Full-Stack Learners**:
1. Trace a request from frontend button click to backend response
2. Understand CORS and how frontend/backend communicate
3. Modify the UI to add new features (e.g., charting)

---

## Further Reading

### Academic Papers
- Markowitz, H. (1952). "Portfolio Selection" - Original MPT paper
- Sharpe, W. (1964). "Capital Asset Pricing Model" - CAPM foundations
- Black, F., & Scholes, M. (1973). "Pricing of Options and Corporate Liabilities"

### Books
- "A Random Walk Down Wall Street" by Burton Malkiel
- "Expected Returns" by Antti Ilmanen
- "Quantitative Portfolio Management" by Michael Isichenko

### Online Resources
- Investopedia - Financial concept definitions
- QuantConnect - Algorithmic trading tutorials
- Khan Academy - Portfolio Theory course

---

## License

This is an educational project for learning portfolio theory and full-stack development.

---

## Questions for Further Exploration

1. **How does rebalancing affect portfolio returns?** (Currently assumes buy-and-hold)
2. **What if we optimize weights to maximize Sharpe ratio?** (Mean-variance optimization)
3. **How do transaction costs impact real-world portfolios?**
4. **Can we add Monte Carlo simulation for future performance?**
5. **What about non-normal return distributions?** (Fat tails, skewness)

These questions can guide your next learning projects! 🎓
