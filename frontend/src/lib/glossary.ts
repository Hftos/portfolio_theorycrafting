// Every explanation on the site, written once.
//
// Each entry has a title and a few short sentences: what the term means, how to read it,
// and anything worth watching for. Components show these through <InfoTip id="..." />,
// so changing the wording here changes it everywhere.

export interface GlossaryEntry {
  title: string
  body: string[] // one paragraph per string
}

export const GLOSSARY = {
  // ---------------------------------------------------------------------------
  // Returns
  // ---------------------------------------------------------------------------
  cagr: {
    title: 'Annual growth (CAGR)',
    body: [
      'Compound annual growth rate: the steady yearly return that would turn the starting amount into the ending amount over the same period.',
      'Real returns jump around from year to year; CAGR smooths them into one comparable number. It is the fairest single figure for comparing growth.',
    ],
  },
  total_return: {
    title: 'Total return',
    body: [
      'How much the investment grew over the whole period, start to finish, including dividends reinvested.',
      'Useful for the big picture, but hard to compare across periods of different lengths. Use CAGR for that.',
    ],
  },
  best_worst_year: {
    title: 'Best and worst year',
    body: [
      'The highest and lowest return in any full calendar year, January to December.',
      'Partial years, where the data starts or ends mid-year, are left out because they are not comparable. The worst year is a quick gut-check: could you hold through it?',
    ],
  },
  positive_months: {
    title: 'Months with a gain',
    body: [
      'The share of calendar months that ended higher than they started.',
      'A portfolio can grow strongly while still losing money in many months. This shows how often the ride feels bumpy.',
    ],
  },

  // ---------------------------------------------------------------------------
  // Risk
  // ---------------------------------------------------------------------------
  volatility: {
    title: 'Volatility',
    body: [
      'How much returns swing around their average, measured as the annualized standard deviation of daily returns.',
      'Higher volatility means a bumpier ride and a wider range of outcomes. It counts big gains and big losses alike as risk.',
    ],
  },
  max_drawdown: {
    title: 'Max drawdown',
    body: [
      'The largest fall from a previous high to a later low, before a new high was reached.',
      'This is the worst loss someone would have sat through if they bought at the worst possible moment. Many investors find it the most honest measure of risk.',
    ],
  },
  current_drawdown: {
    title: 'Below its high today',
    body: [
      'How far the portfolio sits below its highest value so far, as of the last date in the data.',
      'Zero means it is at a new high right now.',
    ],
  },
  longest_drawdown: {
    title: 'Longest time below a high',
    body: [
      'The longest stretch spent below a previous high, from the last day at that high until the first day back above it.',
      'Depth is only half of a loss; duration is the other half. A fall that takes years to recover from tests patience as much as nerve.',
    ],
  },
  beta: {
    title: 'Beta to the S&P 500',
    body: [
      'How much the portfolio tends to move when the S&P 500 moves 1%.',
      'A beta of 1 moves with the market, 0.5 about half as much, and near 0 largely independently. It describes sensitivity to the stock market, not total risk.',
    ],
  },

  // ---------------------------------------------------------------------------
  // Risk-adjusted
  // ---------------------------------------------------------------------------
  sharpe: {
    title: 'Sharpe ratio',
    body: [
      'Return earned above the risk-free rate, divided by volatility: how much reward each unit of risk bought.',
      'Higher is better. It is most useful for comparing portfolios with each other, since two portfolios with the same growth can carry very different risk.',
    ],
  },
  sortino: {
    title: 'Sortino ratio',
    body: [
      'Like the Sharpe ratio, but only counts downside swings as risk.',
      'Investors rarely mind surprise gains. A portfolio whose volatility comes mostly from upward jumps scores better here than on Sharpe.',
    ],
  },
  calmar: {
    title: 'Calmar ratio',
    body: [
      'Annual growth (CAGR) divided by the size of the max drawdown.',
      'It answers: how much growth did I get for the worst loss I had to endure? Higher is better.',
    ],
  },

  // ---------------------------------------------------------------------------
  // Settings
  // ---------------------------------------------------------------------------
  weights: {
    title: 'Weights',
    body: [
      'The share of the portfolio in each holding.',
      'They do not need to add up to exactly 100: they are scaled to 100% automatically, so 3 and 1 means 75% and 25%.',
    ],
  },
  rebalance: {
    title: 'Rebalancing',
    body: [
      'Selling some of what has grown and buying what has lagged, to bring every holding back to its target weight.',
      'Without it, winners slowly take over the portfolio and its risk drifts away from what you chose. Rebalancing keeps the risk you signed up for, often at the cost of some return in strong markets.',
    ],
  },
  risk_free_rate: {
    title: 'Risk-free rate',
    body: [
      'The return available with essentially no risk, such as short-term US Treasury bills.',
      'Used in the Sharpe and Sortino ratios: only return above this rate counts as a reward for taking risk.',
    ],
  },
  backtest_period: {
    title: 'Backtest period',
    body: [
      'A backtest can only start once every holding has price history, so it begins when the youngest fund launched.',
      'When comparing, every portfolio uses the same dates. Otherwise one might be measured through a crash and another not, and the numbers would mean nothing side by side.',
    ],
  },
  presets: {
    title: 'Comparison portfolios',
    body: [
      'Well-known allocations to measure your idea against, such as the S&P 500, 60/40 or the All-Weather portfolio.',
      'A portfolio only looks good or bad relative to something. Comparing against a simple benchmark shows whether the extra complexity is earning its keep.',
    ],
  },

  // ---------------------------------------------------------------------------
  // Charts
  // ---------------------------------------------------------------------------
  log_scale: {
    title: 'Log scale',
    body: [
      'Spaces the axis so that equal percentage changes look equally tall: $10K to $20K is the same height as $50K to $100K.',
      'On a normal scale, recent moves look huge just because the dollar amounts are bigger. Log scale is the honest way to compare decades.',
    ],
  },
  drawdown_chart: {
    title: 'Drawdowns',
    body: [
      'Each point shows how far below its previous high the portfolio was at that moment.',
      'Dips are losses still being recovered from; the width of each dip shows how long recovery took. 2008 and 2020 usually stand out.',
    ],
  },
  rolling_returns: {
    title: 'Rolling returns',
    body: [
      'Each point is the yearly return of someone who bought a set number of years earlier and held until that date.',
      'A single backtest depends heavily on its start date. Rolling returns show every possible starting point, so you can see the range of experiences, from the luckiest to the unluckiest investor.',
    ],
  },
  calendar_returns: {
    title: 'Calendar-year returns',
    body: [
      'The gain or loss in each year, January to December.',
      'Long-run averages hide how uneven the path is. This table shows the actual run of good and bad years an investor would have lived through.',
    ],
  },
  correlation: {
    title: 'Correlation',
    body: [
      'How closely two holdings move together, from +1 (always in step) through 0 (unrelated) to −1 (always opposite).',
      'Diversification comes from holdings with low or negative correlation: when one falls, another holds up or rises, cushioning the whole portfolio.',
    ],
  },

  // ---------------------------------------------------------------------------
  // Projections
  // ---------------------------------------------------------------------------
  monte_carlo: {
    title: 'Simulated futures',
    body: [
      'The projection generates thousands of possible futures from the portfolio’s own history (a Monte Carlo simulation) and summarizes the spread of outcomes.',
      'These are ranges of possibilities, not predictions. They assume the future behaves broadly like the past, which it may not.',
    ],
  },
  levels: {
    title: 'The five levels',
    body: [
      'Percentiles across all simulated futures. Poor is the 5th percentile: only 1 in 20 futures ended lower. Exceptional is the 95th: only 1 in 20 ended higher.',
      'Expected is the median, the middle outcome. Plan around the lower levels, not the higher ones.',
    ],
  },
  return_assumption: {
    title: 'Future returns',
    body: [
      'Adjusts every simulated year by a fixed amount compared with history.',
      'History is one sample, and the period the data covers may have been unusually strong. Testing a tougher assumption shows how much a plan depends on the good times repeating.',
    ],
  },
  contributions: {
    title: 'Monthly contribution',
    body: [
      'An amount added at the end of every simulated month. A negative number is a withdrawal.',
      'With withdrawals, the key figure becomes the chance of running out: the share of futures where the account is emptied before the end.',
    ],
  },
  same_futures: {
    title: 'Same futures for every portfolio',
    body: [
      'Every portfolio is run through exactly the same simulated futures, drawn from the same historical months.',
      'This way, differences between portfolios come from how they are built, not from one getting luckier random draws.',
    ],
  },
} as const satisfies Record<string, GlossaryEntry>

export type GlossaryId = keyof typeof GLOSSARY