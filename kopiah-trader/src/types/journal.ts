export type Direction = 'BUY' | 'SELL'
export type Result = 'WIN' | 'LOSS' | 'BE' | 'OPEN'
export interface Trade {
  id: string
  pair: string
  direction: Direction
  entry: number
  stopLoss: number
  takeProfit: number
  lot: number
  riskPercent: number
  result: Result
  profitLoss: number
  date: string // YYYY-MM-DD
  timeframe: string
  strategy: string
  emotion: string
  reason: string
  mistake: string
  notes: string
  beforeImage?: string
  afterImage?: string
}
