import { useEffect, useState } from 'react'

import { getSecurities, runBacktest } from './api/client'
import { HoldingsList } from './components/builder/HoldingsList'
import { SettingsPanel } from './components/builder/SettingsPanel'
import { ErrorMessage } from './components/common/ErrorMessage'
import { Dashboard } from './components/dashboard/Dashboard'
import { buildRequest } from './lib/buildRequest'
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
    <div className="page">
      <header className="masthead">
        <h1>Portfolio Theorycrafter</h1>
        <p>Build a portfolio and see how it would have fared through real market history.</p>
      </header>

      <div className="layout">
        {/* Left column: building the portfolio */}
        <aside className="builder-column">
          {loadError && <ErrorMessage message={loadError} />}
          <HoldingsList holdings={holdings} securities={securities} onChange={setHoldings} />
          <SettingsPanel settings={settings} onChange={setSettings} />

          <div className="run-bar">
            <button type="button" className="primary" onClick={handleRun} disabled={running || problems.length > 0}>
              {running ? 'Running…' : 'Run backtest'}
            </button>
            {problems.length > 0 && <p className="error">{problems[0]}</p>}
          </div>

          <details className="preview">
            <summary>Request preview</summary>
            <pre>{JSON.stringify(request, null, 2)}</pre>
          </details>
        </aside>

        {/* Right column: results */}
        <main className="results-column">
          {runError && <ErrorMessage message={runError} onDismiss={() => setRunError(null)} />}
          {result ? (
            <Dashboard result={result} isStale={isStale} />
          ) : (
            <div className="empty-state">
              <p>No backtest yet.</p>
              <p className="muted">
                Choose your holdings and weights, then run the backtest. Results appear here: growth, drawdowns, and
                how each holding contributed.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default App