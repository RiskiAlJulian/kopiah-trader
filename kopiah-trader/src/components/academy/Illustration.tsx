type Kind = 'trend' | 'structure' | 'orderblock' | 'fvg' | 'liquidity' | 'supply-demand' | 'lot' | 'none'
const stroke = '#2B2B2B', accent = '#8B1A1A', soft = '#DAD4CC'

export default function Illustration({ kind }: { kind: Kind }) {
  if (kind === 'none') return null
  return (
    <div className="rounded-xl border border-softgray bg-white p-3">
      <svg viewBox="0 0 320 140" className="w-full">
        {kind === 'trend' && (
          <>
            <polyline points="10,120 70,90 90,100 150,50 170,60 230,20 250,30 310,10" fill="none" stroke={stroke} strokeWidth="3" />
            <text x="10" y="135" fontSize="10" fill={stroke}>Higher High / Higher Low</text>
          </>
        )}
        {kind === 'structure' && (
          <>
            <polyline points="10,110 60,60 100,80 150,30 190,55 240,15 300,40" fill="none" stroke={stroke} strokeWidth="3" />
            <circle cx="150" cy="30" r="4" fill={accent} /><text x="130" y="20" fontSize="10" fill={accent}>BOS</text>
            <circle cx="240" cy="15" r="4" fill={accent} />
          </>
        )}
        {kind === 'orderblock' && (
          <>
            <rect x="40" y="40" width="30" height="50" fill={soft} /><text x="30" y="100" fontSize="9" fill={stroke}>Order Block</text>
            <polyline points="70,65 120,60 160,20 260,10" fill="none" stroke={stroke} strokeWidth="3" />
          </>
        )}
        {kind === 'fvg' && (
          <>
            <rect x="60" y="30" width="20" height="30" fill={stroke} /><rect x="90" y="10" width="20" height="30" fill={accent} /><rect x="120" y="40" width="20" height="20" fill={stroke} />
            <rect x="80" y="35" width="10" height="25" fill={soft} /><text x="60" y="90" fontSize="9" fill={stroke}>Celah (Fair Value Gap)</text>
          </>
        )}
        {kind === 'liquidity' && (
          <>
            <line x1="20" y1="30" x2="300" y2="30" stroke={accent} strokeDasharray="4" />
            <polyline points="20,90 90,50 140,40 200,25 260,60 300,45" fill="none" stroke={stroke} strokeWidth="3" />
            <text x="20" y="20" fontSize="9" fill={accent}>Liquidity (swing high)</text>
          </>
        )}
        {kind === 'supply-demand' && (
          <>
            <rect x="20" y="20" width="280" height="18" fill="#F2D9D9" /><text x="24" y="15" fontSize="9" fill={accent}>Supply</text>
            <rect x="20" y="100" width="280" height="18" fill="#DCEEE0" /><text x="24" y="132" fontSize="9" fill="#2E7D4F">Demand</text>
            <polyline points="30,110 90,60 150,90 210,40 270,80" fill="none" stroke={stroke} strokeWidth="3" />
          </>
        )}
        {kind === 'lot' && (
          <>
            <rect x="20" y="50" width="60" height="40" fill={soft} /><text x="25" y="105" fontSize="9" fill={stroke}>0.01 Lot</text>
            <rect x="110" y="30" width="60" height="60" fill={soft} /><text x="115" y="105" fontSize="9" fill={stroke}>0.10 Lot</text>
            <rect x="200" y="10" width="60" height="80" fill={soft} /><text x="205" y="105" fontSize="9" fill={stroke}>1.00 Lot</text>
          </>
        )}
      </svg>
    </div>
  )
}
