import {num, pct} from '../../lib/format'
import type { BacktestResponse } from '../../types/api'

interface Props{
    result: BacktestResponse
}

export function HoldingsTable({result}: Props){
    const rows =[
        ...Object.entries(result.asset_metrics).map(([ticker,m]) =>({
            name: ticker,
            weight: pct(result.weights[ticker], 0),
            m,
            isPortfolio: false,
        })),
        {name: 'Portfolio', weight: '100%', m: result.metrics, isPortfolio: true},
    ]

    return (
        <section className="panel">
            <h2>Holdings vs. portfolio</h2>
            <p className="muted">Each holding on its own over the same period, compared with the combined portfolio.</p>

            <table className="stats">
                <thead>
                    <tr>
                        <th>Holding</th>
                        <th>Weight</th>
                        <th>CAGR</th>
                        <th>Volatility</th>
                        <th>Sharpe</th>
                        <th>Max drowdown</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r) =>(
                        <tr key={r.name} className={r.isPortfolio ? 'total-row': ''}>
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