export const fmtPrice = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const fmtSigned = (n: number) => (n >= 0 ? '+' : '') + fmtPrice(n)
const dateF = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', year: 'numeric' })
const timeF = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
const shortF = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false })
const dayF = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short' })
/** ms UTC -> "20 Sep 2026 01:32:10 WIB" (timestamp asli tetap UTC di data) */
export const fmtWIB = (ms: number) => `${dateF.format(ms)} ${timeF.format(ms)} WIB`
export const fmtWIBShort = (sec: number) => `${dateF.format(sec * 1000)} ${shortF.format(sec * 1000)} WIB`
export const tickWIB = (sec: number, isTime: boolean) => (isTime ? shortF : dayF).format(sec * 1000)
