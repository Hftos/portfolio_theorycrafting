import { correlationColor, correlationTextColor } from '../../lib/chartTheme'
import { num } from '../../lib/format'
import type { BacktestResponse } from '../../types/api'

interface Props {
  correlation: BacktestResponse['correlation']
}

export function CorrelationTable({ correlation }: Props) {
  const tickers = Object.keys(correlation)
  if (tickers.length < 2) return null // nothing to compare with one holding

  return (
    <section className="panel">
      <h2>Correlation</h2>
      <p className="muted">
        How closely daily returns move together: +1 in lockstep, 0 unrelated, −1 opposite. The lower the
        correlation, the more each holding cushions the others.
      </p>

      <table className="correlation">
        <thead>
          <tr>
            <th></th>
            {tickers.map((t) => (
              <th key={t}>{t}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tickers.map((row) => (
            <tr key={row}>
              <th>{row}</th>
              {tickers.map((col) => {
                const value = correlation[row][col]
                return (
                  <td key={col} style={{ background: correlationColor(value), color: correlationTextColor(value) }} title={`${row} vs ${col}: ${num(value)}`}>
                    {num(value)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="scale-legend" aria-hidden="true">
        <span>−1</span>
        <span className="scale-bar" />
        <span>+1</span>
      </div>
    </section>
  )
}