import { num, pct } from '../../lib/format'
import type { PortfolioResult } from '../../types/api'
import { Term } from '../common/InfoTip'

interface Props {
  portfolio: PortfolioResult
}

// Each holding on its own, next to the portfolio, over the same dates.
export function HoldingsTable({ portfolio }: Props) {
  const rows = [
    ...Object.entries(portfolio.asset_metrics).map(([ticker, m]) => ({
      name: ticker,
      weight: pct(portfolio.weights[ticker], 0),
      m,
      isPortfolio: false,
    })),
    { name: 'Your portfolio', weight: '100%', m: portfolio.metrics, isPortfolio: true },
  ]

  return (
    <section className="panel">
      <h2>Inside your portfolio</h2>
      <p className="muted">Each holding on its own over the same period, compared with the combined portfolio.</p>

      <table className="stats">
        <thead>
          <tr>
            <th>Holding</th>
            <th>
              <Term id="weights">Weight</Term>
            </th>
            <th>
              <Term id="cagr">CAGR</Term>
            </th>
            <th>
              <Term id="volatility">Volatility</Term>
            </th>
            <th>
              <Term id="sharpe">Sharpe</Term>
            </th>
            <th>
              <Term id="max_drawdown">Max drawdown</Term>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className={r.isPortfolio ? 'total-row' : ''}>
              <td>{r.name}</td>
              <td>{r.weight}</td>
              <td>{pct(r.m.cagr)}</td>
              <td>{pct(r.m.volatility)}</td>
              <td>{num(r.m.sharpe_ratio)}</td>
              <td>{pct(r.m.max_drawdown)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}