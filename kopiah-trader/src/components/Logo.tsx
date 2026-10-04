// Logo resmi dipakai apa adanya (tidak digambar ulang / diubah proporsinya).
export default function Logo({ size = 64 }: { size?: number }) {
  return <img src="/logo.jpeg" alt="KOPIAH TRADER" width={size} height={size} style={{ width: size, height: size }} className="object-contain mix-blend-multiply" />
}
