export interface ChartImage { mimeType: 'image/jpeg'; data: string; preview: string }

const ALLOWED = /^image\/(jpeg|png|webp)$/
const MAX_FILE_BYTES = 15 * 1024 * 1024
const MAX_B64 = 1_200_000 // di bawah batas server (1.500.000)

const load = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Gambar tidak bisa dibuka.'))
    img.src = url
  })

/** Kecilkan gambar chart di perangkat sebelum dikirim: sisi terpanjang maks 1600 px, JPEG. */
export async function prepareChartImage(file: File): Promise<ChartImage> {
  if (!ALLOWED.test(file.type)) throw new Error('Format harus JPG, PNG, atau WebP.')
  if (file.size > MAX_FILE_BYTES) throw new Error('Ukuran gambar maksimal 15 MB.')
  const url = URL.createObjectURL(file)
  try {
    const img = await load(url)
    for (const [maxSide, quality] of [[1600, 0.85], [1280, 0.78], [1024, 0.7]] as const) {
      const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Browser tidak mendukung pemrosesan gambar.')
      ctx.fillStyle = '#ffffff' // PNG transparan jadi latar putih saat diubah ke JPEG
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const preview = canvas.toDataURL('image/jpeg', quality)
      const data = preview.slice(preview.indexOf(',') + 1)
      if (data.length <= MAX_B64) return { mimeType: 'image/jpeg', data, preview }
    }
    throw new Error('Gambar terlalu besar. Coba potong atau ambil screenshot yang lebih kecil.')
  } finally {
    URL.revokeObjectURL(url)
  }
}
