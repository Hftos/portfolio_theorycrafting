import { useEffect, useState } from 'react'

import { getSecurities, runBacktest } from './api/client'
import { HoldingsList } from './components/builder/HoldingsList'
import { SettingsPanel } from './components/builder/SettingsPanel'
import { ErrorMessage } from './components/common/ErrorMessage'
import { buildRequest } from './lib/buildRequest'
import { dollars, num, pct } from './lib/format'
import type { BacktestResponse, Security } from './types/api'
import type { HoldingRow, Settings } from './types/portfolio'

const STARTING_HOLDINGS: HoldingRow[] = [
  { id: 1, ticker: 'SPY', weight: '60' },
  { id: 2, ticker: 'AGG', weight: '40' },
]

const STARTING_SETTINGS: Settings = {
  rebalance: 'annual',
  startDate: '',
  endDate: '',
  riskFreeRate: '2',
}

function App() {
  // Ticker list from the backend
  const [securities, setSecurities] = useState<Security[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)

  // What the user is editing
  const [holdings, setHoldings] = useState<HoldingRow[]>(STARTING_HOLDINGS)
  const [settings, setSettings] = useState<Settings>(STARTING_SETTINGS)

  // The backtest run
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<BacktestResponse | null>(null)
  const [runError, setRunError] = useState<string | null>(null)
  const [lastRunRequest, setLastRunRequest] = useState<string | null>(null)

  useEffect(() => {
    getSecurities()
      .then(setSecurities)
      .catch((e: Error) => setLoadError(e.message))
  }, [])

  const { request, problems } = buildRequest(holdings, settings)

  // Have the inputs changed since the results on screen were calculated?
  const isStale = result !== null && JSON.stringify(request) !== lastRunRequest

  async function handleRun() {
    setRunning(true)
    setRunError(null)
    try {
      const response = await runBacktest(request)
      setResult(response)
      setLastRunRequest(JSON.stringify(request))
    } catch (e) {
      setRunError(e instanceof Error ? e.message : String(e))
    } finally {
      setRunning(false) // runs whether it succeeded or failed
    }
  }

  return (
    <main>
      <h1>Portfolio Theorycrafter</h1>
      {loadError && <ErrorMessage message={loadError} />}

      <div className="builder">
        <HoldingsList holdings={holdings} securities={securities} onChange={setHoldings} />
        <SettingsPanel settings={settings} onChange={setSettings} />
      </div>

      <div className="run-bar">
        <button type="button" className="primary" onClick={handleRun} disabled={running || problems.length > 0}>
          {running ? 'Running…' : 'Run backtest'}
        </button>
        {problems.length > 0 && <span className="error">{problems[0]}</span>}
      </div>

      {runError && <ErrorMessage message={runError} onDismiss={() => setRunError(null)} />}

      {result && (
        <section className={`panel ${isStale ? 'stale' : ''}`}>
          <h2>Results</h2>
          {isStale && <p className="warning">Inputs have changed. Run again to update.</p>}

          <p>
            {result.start_date} to {result.end_date} · {dollars(10_000)} became{' '}
            <strong>{dollars(result.growth[result.growth.length - 1].value)}</strong>
          </p>

          <table>
            <tbody>
              <tr><td>Total return</td><td>{pct(result.metrics.total_return)}</td></tr>
              <tr><td>CAGR</td><td>{pct(result.metrics.cagr)}</td></tr>
              <tr><td>Volatility</td><td>{pct(result.metrics.volatility)}</td></tr>
              <tr><td>Sharpe ratio</td><td>{num(result.metrics.sharpe_ratio)}</td></tr>
              <tr><td>Max drawdown</td><td>{pct(result.metrics.max_drawdown)}</td></tr>
            </tbody>
          </table>

          <p className="muted">
            {result.growth.length.toLocaleString()} daily data points received. Charts come in the next step.
          </p>
        </section>
      )}

      <details className="panel">
        <summary>Request preview</summary>
        <pre>{JSON.stringify(request, null, 2)}</pre>
      </details>
    </main>
  )
}

export default App