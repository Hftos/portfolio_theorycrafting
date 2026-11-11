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

      {result && <Dashboard result={result} isStale={isStale} />}

      <details className="panel">
        <summary>Request preview</summary>
        <pre>{JSON.stringify(request, null, 2)}</pre>
      </details>
    </main>
  )
}

export default App