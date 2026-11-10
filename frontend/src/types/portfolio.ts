import type {Rebalance} from './api'

export interface HoldingRow{
    id: number
    ticker: string
    weight: string
}

export interface Settings {
    rebalance: Rebalance
    startDate: string
    endDate: string
    riskFreeRate: string
}