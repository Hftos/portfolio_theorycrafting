import { useEffect, useState } from 'react'

import { getSecurities } from './api/client'
import { HoldingsList } from './components/builder/HoldingsList'
import { SettingsPanel } from './components/builder/SettingsPanel'
import { buildRequest } from './lib/buildRequest'
import type { Security } from './types/api'
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
  const [securities, setSecurities] = useState<Security[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [holdings, setHoldings] = useState<HoldingRow[]>(STARTING_HOLDINGS)
  const [settings, setSettings] = useState<Settings>(STARTING_SETTINGS)

  // Load the ticker list once, when the page first opens.
  useEffect(() => {
    getSecurities()
      .then(setSecurities)
      .catch((e: Error) => setLoadError(e.message))
  }, [])

  // Recomputed on every change, so the preview is always current.
  const { request, problems } = buildRequest(holdings, settings)

  return (
    <main>
      <h1>Portfolio Theorycrafter</h1>
      {loadError && <p className="error">{loadError}</p>}

      <div className="builder">
        <HoldingsList holdings={holdings} securities={securities} onChange={setHoldings} />
        <SettingsPanel settings={settings} onChange={setSettings} />
      </div>

      <section className="panel">
        <h2>Request preview</h2>
        {problems.length > 0 ? (
          <ul className="error">
            {problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        ) : (
          <p className="muted">Ready to send. (The Run button comes in the next step.)</p>
        )}
        <pre>{JSON.stringify(request, null, 2)}</pre>
      </section>
    </main>
  )
}

export default App