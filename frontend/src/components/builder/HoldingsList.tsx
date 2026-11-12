import { newRowId } from '../../lib/ids'
import type { Security } from '../../types/api'
import type { HoldingRow } from '../../types/portfolio'

interface Props {
  holdings: HoldingRow[]
  securities: Security[]
  onChange: (holdings: HoldingRow[]) => void
}


export function HoldingsList({ holdings, securities, onChange }: Props) {
  const total = holdings.reduce((sum, h) => sum + (Number(h.weight) || 0), 0)

  // Update one field of one row, leaving the others untouched.
  function updateRow(id: number, field: 'ticker' | 'weight', value: string) {
    onChange(holdings.map((h) => (h.id === id ? { ...h, [field]: value } : h)))
  }

  function removeRow(id: number) {
    onChange(holdings.filter((h) => h.id !== id))
  }

  function addRow() {
    onChange([...holdings, { id: newRowId(), ticker: '', weight: '' }])
  }

  // The backtest can only start once every holding has data:
  // the latest first_date among the chosen tickers.
  const chosen = securities.filter((s) => holdings.some((h) => h.ticker === s.ticker))
  const youngest = chosen.reduce<Security | null>(
    (latest, s) => (latest === null || s.first_date > latest.first_date ? s : latest),
    null,
  )

  return (
    // No panel or heading here: the parent decides how to frame the list,
    // so the same editor works for your portfolio and for custom comparisons.
    <>
      <table className="holdings">
        <thead>
          <tr>
            <th>Ticker</th>
            <th>Weight (%)</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((h) => (
            <tr key={h.id}>
              <td>
                <select value={h.ticker} onChange={(e) => updateRow(h.id, 'ticker', e.target.value)}>
                  <option value="">Choose…</option>
                  {securities.map((s) => (
                    <option key={s.ticker} value={s.ticker}>
                      {s.ticker}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={h.weight}
                  onChange={(e) => updateRow(h.id, 'weight', e.target.value)}
                />
              </td>
              <td>
                <button type="button" className="link" onClick={() => removeRow(h.id)} aria-label={`Remove ${h.ticker || 'row'}`}>
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button type="button" onClick={addRow}>
        + Add holding
      </button>

      <p className={total === 100 ? 'muted' : 'warning'}>
        Total: {total.toFixed(1)}%
        {total !== 100 && total > 0 && ' (weights will be scaled to add up to 100%)'}
      </p>

      {youngest && (
        <p className="muted">
          History available from {youngest.first_date}
          {chosen.length > 1 && ` (limited by ${youngest.ticker}, the youngest holding)`}
        </p>
      )}
    </>
  )
}