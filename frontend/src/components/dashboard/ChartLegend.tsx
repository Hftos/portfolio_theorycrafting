import type { SeriesMeta } from '../../types/portfolio'

interface Props {
  series: SeriesMeta[]
}

// Names each line by its color. Text stays in ink; the short line beside it carries the color.
export function ChartLegend({ series }: Props) {
  if (series.length < 2) return null // one line needs no legend: the chart title names it
  return (
    <ul className="chart-legend">
      {series.map((s) => (
        <li key={s.name}>
          <span className="legend-line" style={{ background: s.color }} aria-hidden="true" />
          {s.name}
        </li>
      ))}
    </ul>
  )
}