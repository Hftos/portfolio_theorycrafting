from fastapi import FastAPI
from .schemas import MetricsRequest, MetricsResponse
from .services.data import get_price_history

# These are the functions that will turn the raw data into useful stuff
from .services.metrics import (
    build_aligned_prices,
    portfolio_value,
    annualized_return,
    annualized_volatility,
    sharpe_ratio,
    max_drawdown,
    corr_matrix,
)

app = FastAPI(title= "Portfolio Theorycrafter")

# to check the state of the api
@app.get("/health")
def health():
    return {"status": "ok"}

# Endpoint, sends json data throug here
@app.post("/metrics", response_model=MetricsResponse)
def metrics(req: MetricsRequest):
    tickers = [w.ticker for w in req.weights]
    # Pull prices by the tickers
    prices_by_ticker = {
        t: get_price_history(t, req.start, req.end) for t in tickers
    }

    df = build_aligned_prices(prices_by_ticker)
    if df.empty or len(df.columns) == 0:
        return MetricsResponse.empty()  
    
    # Computations
    weight_map = {w.ticker: float(w.weight) for w in req.weights}
    pv = portfolio_value(df, weight_map)
    ann_ret = annualized_return(pv)
    ann_vol = annualized_volatility(df, weight_map)
    sharpe = sharpe_ratio(ann_ret, ann_vol, rf=0.0)
    mdd = max_drawdown(pv)
    corr = corr_matrix(df)

    return MetricsResponse(
        annualized_return=float(ann_ret),
        annual_vol=float(ann_vol),
        sharpe=float(sharpe),
        max_drawdown = float(mdd),
        correlation = corr.to_dict()
    )