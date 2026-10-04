import { useEffect, useState } from 'react'
// Penyimpanan lokal di browser. Untuk edukasi/journal pribadi tahap ini (belum ada backend Supabase).
export function useLocalState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : initial } catch { return initial }
  })
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* storage penuh/diblokir, abaikan */ } }, [key, value])
  return [value, setValue] as const
}
