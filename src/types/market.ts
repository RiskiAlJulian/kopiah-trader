export type Interval = '1M' | '5M' | '15M' | '30M' | '1H' | '4H' | '1D'
export const INTERVALS: Interval[] = ['1M', '5M', '15M', '30M', '1H', '4H', '1D']
export interface Quote {
  symbol: string; price: number; change: number; changePercent: number
  high: number; low: number; timestamp: number /* ms UTC */; isMarketOpen: boolean
}
export interface Candle { time: number /* detik UTC */; open: number; high: number; low: number; close: number }
export type DataStatus = 'real' | 'closed' | 'stale' | 'error' | 'loading' | 'nokey'
