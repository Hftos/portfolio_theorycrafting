from backend.db import load_prices
from backend.engine.simulate import run_backtest

PORTFOLIO = {"SPY": 60, "AGG": 40}
START = None

RISK_FREE_RATE = 0.02

prices = load_prices(list(PORTFOLIO), start=START)

for rebalance in ['none', 'annual']:
    result = run_backtest(prices, PORTFOLIO, rebalance=rebalance, risk_free_rate=RISK_FREE_RATE)
    m= result['metrics']
    print(f"\n{PORTFOLIO} rebalance={rebalance}")
    print(f"  Period:        {result['start_date']:%Y-%m-%d} to {result['end_date']:%Y-%m-%d}")
    print(f"  $10,000 became ${result['growth'].iloc[-1]:,.0f}")
    print(f"  CAGR:          {m['cagr']:.2%}")
    print(f"  Volatility:    {m['volatility']:.2%}")
    print(f"  Sharpe:        {m['sharpe_ratio']:.2f}")
    print(f"  Max drawdown:  {m['max_drawdown']:.2%}")

print("\nCorrelation of daily returns:")
print(result["correlation"].round(2))

print("\nEach holding on its own:")
for ticker, m in  result["asset_metrics"].items():
    print(f"  {ticker:<6} CAGR {m['cagr']:.2%}   vol {m['volatility']:.2%}  max DD {m['max_drawdown']:.2%}")