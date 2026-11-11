import type { BacktestResponse } from "../../types/api";
import { CorrelationTable } from './CorrelationTable';
import {DrawdownChart} from './DrawdownChart';
import { GrowthChart } from './GrowthChart'
import { HoldingsTable } from './HoldingsTable'
import { MetricTiles } from './MetricTiles'

const START_VALUE = 10_000

interface Props {
    result: BacktestResponse
    isStale: boolean
}

export function Dashboard({ result, isStale}: Props){
    return (
        <div className={isStale ? 'stale' : ''}>
            {isStale && <p className="warning">Inputs have changed. Run again to update.</p>}
            <MetricTiles result={result} startValue={START_VALUE}/>
            <GrowthChart data={result.growth} />
            <DrawdownChart data={result.drawdown}/>
            <HoldingsTable result={result} />
            <CorrelationTable correlation={result.correlation} />
        </div>
    )
}