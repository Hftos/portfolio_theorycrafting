import { useEffect, useState } from 'react'

import { getPresets, getSecurities, runCompare } from './api/client'
import { HoldingsList } from './components/builder/HoldingsList'
import { SettingsPanel } from './components/builder/SettingsPanel'
import { ErrorMessage } from './components/common/ErrorMessage'
import { ComparisonPanel } from './components/comparison/ComparisonPanel'
import { Dashboard } from './components/dashboard/Dashboard'
import { buildRequest, YOUR_PORTFOLIO } from './lib/buildRequest'
import { SERIES_COLORS } from './lib/chartTheme'
import type { CompareResponse, Preset, Security } from './types/api'
import type { Comparison, HoldingRow, SeriesMeta, Settings } from './types/portfolio'

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
  // Reference data from the backend
  const [securities, setSecurities] = useState<Security[]>([])
  const [presets, setPresets] = useState<Preset[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)

  // What the user is editing
  const [holdings, setHoldings] = useState<HoldingRow[]>(STARTING_HOLDINGS)
  const [comparisons, setComparisons] = useState<Comparison[]>([])
  const [settings, setSettings] = useState<Settings>(STARTING_SETTINGS)

  // The run
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<CompareResponse | null>(null)
  const [series, setSeries] = useState<SeriesMeta[]>([]) // names and colors, as of the last run
  const [runError, setRunError] = useState<string | null>(null)
  const [lastRunRequest, setLastRunRequest] = useState<string | null>(null)

  // Load tickers and presets once, when the page first opens.
  useEffect(() => {
    Promise.all([getSecurities(), getPresets()])
      .then(([s, p]) => {
        setSecurities(s)
        setPresets(p)
      })
      .catch((e: Error) => setLoadError(e.message))
  }, [])

  const { request, problems } = buildRequest(holdings, comparisons, settings)

  // Have the inputs changed since the results on screen were calculated?
  const isStale = result !== null && JSON.stringify(request) !== lastRunRequest

  async function handleRun() {
    setRunning(true)
    setRunError(null)
    try {
      const response = await runCompare(request)
      setResult(response)
      // Remember each portfolio's color as it was at run time, so editing
      // comparisons afterwards doesn't recolor the results on screen.
      setSeries([
        { name: YOUR_PORTFOLIO, color: SERIES_COLORS[0] },
        ...comparisons.map((c) => ({ name: c.name.trim(), color: SERIES_COLORS[c.colorSlot] })),
      ])
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

          <section className="panel">
            <h2>
              <span className="swatch" style={{ background: SERIES_COLORS[0] }} aria-hidden="true" /> Your portfolio
            </h2>
            <HoldingsList holdings={holdings} securities={securities} onChange={setHoldings} />
          </section>

          <ComparisonPanel
            comparisons={comparisons}
            presets={presets}
            securities={securities}
            onChange={setComparisons}
          />

          <SettingsPanel settings={settings} onChange={setSettings} />

          <div className="run-bar">
            <button type="button" className="primary" onClick={handleRun} disabled={running || problems.length > 0}>
              {running ? 'Running…' : comparisons.length > 0 ? 'Run comparison' : 'Run backtest'}
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
            <Dashboard result={result} series={series} isStale={isStale} />
          ) : (
            <div className="empty-state">
              <p>No backtest yet.</p>
              <p className="muted">
                Choose your holdings and weights, add any portfolios to compare against, then run it. Results appear
                here: growth, drawdowns, and how each holding contributed.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default App