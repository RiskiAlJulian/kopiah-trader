export type Impact = 'LOW' | 'MEDIUM' | 'HIGH'
export interface EconomicEvent {
  id: string
  timestamp: number // ms UTC
  country: string // kode negara dari provider, mis. "US"
  currency: string // mis. "USD"
  event: string
  impact: Impact
  previous: number | null
  forecast: number | null
  actual: number | null
}
