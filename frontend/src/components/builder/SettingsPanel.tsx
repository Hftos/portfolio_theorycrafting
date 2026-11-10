import type { Rebalance } from '../../types/api'
import type { Settings } from '../../types/portfolio'

interface Props {
  settings: Settings
  onChange: (settings: Settings) => void
}

const REBALANCE_OPTIONS: { value: Rebalance; label: string }[] = [
  { value: 'none', label: 'Never (let weights drift)' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annual', label: 'Annually' },
]

export function SettingsPanel({ settings, onChange }: Props) {
  // Copy the settings and change one field.
  function update<K extends keyof Settings>(field: K, value: Settings[K]) {
    onChange({ ...settings, [field]: value })
  }

  return (
    <section className="panel">
      <h2>Settings</h2>

      <label>
        Rebalance
        <select value={settings.rebalance} onChange={(e) => update('rebalance', e.target.value as Rebalance)}>
          {REBALANCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Start date <span className="muted">(blank = earliest)</span>
        <input type="date" value={settings.startDate} onChange={(e) => update('startDate', e.target.value)} />
      </label>

      <label>
        End date <span className="muted">(blank = latest)</span>
        <input type="date" value={settings.endDate} onChange={(e) => update('endDate', e.target.value)} />
      </label>

      <label>
        Risk-free rate (%)
        <input
          type="number"
          min="0"
          max="20"
          step="0.1"
          value={settings.riskFreeRate}
          onChange={(e) => update('riskFreeRate', e.target.value)}
        />
      </label>
    </section>
  )
}