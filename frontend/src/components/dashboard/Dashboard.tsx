import { longDate } from '../../lib/format'
import { mergeSeries } from '../../lib/series'
import type { CompareRequest, CompareResponse } from '../../types/api'
import type { SeriesMeta } from '../../types/portfolio'
import { ProjectionPanel } from '../projection/ProjectionPanel'
import { AnnualReturnsTable } from './AnnualReturnsTable'
import { CorrelationTable } from './CorrelationTable'
import { DrawdownChart } from './DrawdownChart'
import { GrowthChart } from './GrowthChart'
import { HoldingsTable } from './HoldingsTable'
import { MetricTiles } from './MetricTiles'
import { RollingReturnsChart } from './RollingReturnsChart'
import { StatsTable } from './StatsTable'

// The backend's default starting amount (start_value in schemas.py).
const START_VALUE = 10_000

interface Props {
  result: CompareResponse
  series: SeriesMeta[]
  isStale: boolean
  runRequest: CompareRequest // the request behind these results, reused for projections
}

// Groups every results view. App only needs to render <Dashboard />.
export function Dashboard({ result, series, isStale, runRequest }: Props) {
  const yours = result.portfolios[0]
  const comparing = result.portfolios.length > 1
  const growth = mergeSeries(result.portfolios, 'growth') // shared by the growth and rolling charts

  return (
    <div className={isStale ? 'stale' : ''}>
      {isStale && <p className="warning">Inputs have changed. Run again to update.</p>}

      {comparing && (
        <p className="period-note">
          All portfolios are measured from {longDate(result.start_date)}, when {result.limited_by}, the youngest
          holding across them, has data.
        </p>
      )}

      <MetricTiles
        portfolio={yours}
        startDate={result.start_date}
        endDate={result.end_date}
        startValue={START_VALUE}
      />
      <StatsTable portfolios={result.portfolios} series={series} />
      <GrowthChart rows={growth} series={series} />
      <DrawdownChart rows={mergeSeries(result.portfolios, 'drawdown')} series={series} />
      <ProjectionPanel baseRequest={runRequest} series={series} />
      <RollingReturnsChart growth={growth} series={series} />
      <AnnualReturnsTable portfolios={result.portfolios} series={series} />
      <HoldingsTable portfolio={yours} />
      <CorrelationTable correlation={yours.correlation} />
    </div>
  )
}