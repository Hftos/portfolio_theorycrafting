# Portfolio Theorycrafting - Quick Start Guide

## 🎉 Your Application is Ready!

The full-stack portfolio theorycrafting application has been built and is ready to run.

## ⚡ Quick Start (2 Terminals)

### Terminal 1: Start Backend
```bash
cd /Users/maco/dev/repositories/portfolio_theorycrafting
source .venv/bin/activate
uvicorn backend.main:app --reload --port 8000
```

Wait for: `Uvicorn running on http://127.0.0.1:8000`

### Terminal 2: Start Frontend
```bash
cd /Users/maco/dev/repositories/portfolio_theorycrafting/frontend
npm run dev
```

Wait for: `Local: http://localhost:5173`

### Open Your Browser
Visit: **http://localhost:5173**

## 🎯 What You Can Do

1. **Build a Portfolio**
   - Click preset buttons (60/40, All-World, Income)
   - OR add custom holdings with tickers
   - Set weights (they auto-normalize to 100%)

2. **Configure Settings**
   - Choose rebalancing frequency (None/Monthly/Quarterly/Annual)
   - Set date range (default: last 5 years)
   - Toggle dividends and inflation adjustment

3. **Run Simulation**
   - Click "Run Simulation" button
   - Wait 2-5 seconds
   - See comprehensive results!

4. **Analyze Results**
   - **12 Metric Tiles**: CAGR, Sharpe, VaR, Drawdown, etc.
   - **Performance Chart**: Portfolio vs benchmarks (toggle log scale)
   - **Drawdown Chart**: See underwater periods
   - **Correlation Matrix**: Asset relationships
   - **Risk Contribution**: Which assets drive volatility

## 📊 Example Portfolio

Try this to start:
- **SPY**: 60% (S&P 500)
- **AGG**: 40% (Bonds)
- **Rebalance**: Annual
- **Date Range**: 2020-01-01 to 2023-12-31

Expected Results:
- CAGR: ~8-12%
- Sharpe: 0.5-1.0
- Max Drawdown: -15% to -25%

## 🔧 Troubleshooting

**Backend won't start?**
```bash
source .venv/bin/activate
pip install -r requirements.txt
```

**Frontend won't start?**
```bash
cd frontend
npm install
```

**No data showing?**
- Backend must be running on port 8000
- Check browser console (F12) for errors
- Verify CSV data exists in `data/` folder

**"No CSV data" messages?**
- The app auto-falls back to mock data for SPY, AGG, QQQ, VTI, BND, AAPL, MSFT
- This is normal and intentional!

## 📁 What Was Built

### Backend (8 files modified/created)
- ✅ Complete simulation engine (350 lines)
- ✅ 20+ new metrics functions
- ✅ CSV + mock data loading
- ✅ POST /simulate API endpoint
- ✅ 40+ calculated metrics

### Frontend (11 files created)
- ✅ TypeScript API types
- ✅ API client
- ✅ State management
- ✅ 6 React components
- ✅ Complete App.tsx integration
- ✅ Recharts visualizations

## 🎨 Features

- ✅ Multi-asset portfolio building
- ✅ Rebalancing simulation
- ✅ Dividend reinvestment
- ✅ Fee & slippage modeling
- ✅ Inflation adjustment (CPI)
- ✅ Benchmark comparison
- ✅ 12 key metrics
- ✅ 4 interactive charts
- ✅ Preset portfolios
- ✅ Auto weight normalization
- ✅ Error handling
- ✅ Loading states

## 📚 Documentation

- **RUNNING.md** - Detailed running instructions
- **IMPLEMENTATION_SUMMARY.md** - Complete technical details
- **test_request.json** - Example API request

## 🧪 Test the API Directly

```bash
curl -X POST http://localhost:8000/simulate \
  -H "Content-Type: application/json" \
  -d @test_request.json | python3 -m json.tool
```

## 🚀 You're All Set!

Everything is built and tested. Just start the backend and frontend, then open your browser!

**Questions?**
- Check browser console for errors
- Check terminal output for backend errors
- View API docs at http://localhost:8000/docs
