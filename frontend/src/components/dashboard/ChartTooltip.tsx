import {longDate} from '../../lib/format'

interface Props{
    active?: boolean
    payload?: {value: number; payload: {date:string}}[]
    format: (value: number)=> string
    valueLabel:string
}

export function ChartTooltip({ active, payload, format, valueLabel}: Props){
    if (!active || !payload || payload.length ===0) return null
    const point = payload[0]
    return (
        <div className="chart-tooltip">
            <div className="muted">{longDate(point.payload.date)}</div>
            <div>
                {valueLabel}: <strong>{format(point.value)}</strong>
            </div>
        </div>
    )
}