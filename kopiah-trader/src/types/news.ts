export type Impact = 'LOW' | 'MEDIUM' | 'HIGH'
export interface EconomicEvent {
  id: string
  timestamp: number // ms UTC
  country: string // kode negara dari provider, mis. "US"
  currency: string // mis. "USD"
  event: string
  impact: Impact
  previous: string | null // teks apa adanya dari provider, mis. "0.2%" atau "3.95M"
  forecast: string | null
  actual: string | null
}
